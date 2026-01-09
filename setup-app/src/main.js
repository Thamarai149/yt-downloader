const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { io } = require('socket.io-client');

const store = new Store();
let mainWindow;
let backendProcess = null;
let downloadSocket = null;

// Auto-updater configuration
if (app.isPackaged) {
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.autoDownload = false; // We'll handle download manually
  autoUpdater.autoInstallOnAppQuit = true;
} else {
  console.log('Development mode - auto-updater disabled');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    resizable: true,
    maximizable: true,
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#0F0F0F'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
  
  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
  
  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    
    // Check for updates after window is shown (only in production)
    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 3000);
    }
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'checking', 
      message: 'Checking for updates...' 
    });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available', 
      message: `Update available: v${info.version}`,
      version: info.version,
      releaseNotes: info.releaseNotes
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'not-available', 
      message: 'You have the latest version',
      version: info.version
    });
  }
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error', 
      message: 'Update check failed',
      error: err.message
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded', 
      message: 'Update downloaded. Restart to apply.',
      version: info.version
    });
  }
  
  // Show dialog to restart
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update has been downloaded. The application will restart to apply the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      // Clean up before restart
      cleanupResources();
      autoUpdater.quitAndInstall();
    }
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Clean up resources when app closes
  cleanupResources();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up function to properly handle resource cleanup
function cleanupResources() {
  // Clean up backend process
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.removeAllListeners();
      backendProcess.kill('SIGTERM');
      backendProcess = null;
    } catch (error) {
      console.error('Error cleaning up backend process:', error);
    }
  }
  
  // Clean up socket connection
  if (downloadSocket && downloadSocket.connected) {
    try {
      downloadSocket.removeAllListeners();
      downloadSocket.disconnect();
      downloadSocket = null;
    } catch (error) {
      console.error('Error cleaning up socket connection:', error);
    }
  }
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for auto-updater
ipcMain.handle('check-for-updates', async () => {
  try {
    // In development mode, return mock data
    if (!app.isPackaged) {
      console.log('Development mode - skipping real update check');
      return {
        hasUpdate: false,
        currentVersion: app.getVersion(),
        message: 'Update checking disabled in development mode'
      };
    }
    
    const result = await autoUpdater.checkForUpdates();
    return {
      hasUpdate: result && result.updateInfo,
      updateInfo: result ? result.updateInfo : null,
      currentVersion: app.getVersion()
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      hasUpdate: false,
      error: error.message,
      currentVersion: app.getVersion()
    };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    if (!app.isPackaged) {
      return { success: false, error: 'Updates not available in development mode' };
    }
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error downloading update:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  if (!app.isPackaged) {
    return { success: false, error: 'Updates not available in development mode' };
  }
  cleanupResources();
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-version-info', async () => {
  return {
    currentVersion: app.getVersion(),
    lastUpdateCheck: store.get('lastUpdateCheck', null),
    isPackaged: app.isPackaged
  };
});

ipcMain.handle('get-changelog', async (event, version) => {
  // Mock changelog for development
  return {
    version: version,
    releaseDate: new Date().toISOString().split('T')[0],
    features: [
      'Improved responsive layout for mobile devices',
      'Fixed missing SVG icons',
      'Enhanced download progress tracking'
    ],
    improvements: [
      'Better error handling',
      'Optimized performance'
    ],
    bugFixes: [
      'Fixed IPC handler conflicts',
      'Resolved icon loading issues'
    ]
  };
});

// IPC handlers for app functionality
ipcMain.handle('get-settings', () => {
  return {
    backendPath: store.get('backendPath', ''),
    autoStart: store.get('autoStart', false),
    serverPort: store.get('serverPort', 3000),
    telegramToken: store.get('telegramToken', ''),
    downloadPath: store.get('downloadPath', '')
  };
});

ipcMain.handle('get-backend-status', () => {
  return { running: backendProcess !== null && !backendProcess.killed };
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    const { shell } = require('electron');
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Error opening external URL:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-settings', (event, settings) => {
  try {
    console.log('Saving settings in main process:', settings);
    
    // Only save settings that are provided
    if (settings.backendPath !== undefined) {
      store.set('backendPath', settings.backendPath);
    }
    if (settings.autoStart !== undefined) {
      store.set('autoStart', settings.autoStart);
    }
    if (settings.serverPort !== undefined) {
      store.set('serverPort', settings.serverPort);
    }
    if (settings.telegramToken !== undefined) {
      store.set('telegramToken', settings.telegramToken);
    }
    if (settings.downloadPath !== undefined) {
      store.set('downloadPath', settings.downloadPath);
    }
    
    console.log('Settings saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('start-backend', async () => {
  const backendPath = store.get('backendPath');
  if (!backendPath || !fs.existsSync(backendPath)) {
    return { success: false, error: 'Backend path not found' };
  }

  try {
    // Stop existing process
    if (backendProcess && !backendProcess.killed) {
      try {
        backendProcess.removeAllListeners();
        backendProcess.kill('SIGTERM');
        backendProcess = null;
      } catch (error) {
        console.error('Error stopping existing backend process:', error);
      }
    }

    // Kill any processes using port 3000
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-log', 'Checking for port conflicts...\n');
    }
    
    try {
      // Kill processes on port 3000 using PowerShell
      await new Promise((resolve) => {
        const killProcess = exec('powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"', 
          { cwd: backendPath }, 
          (error) => {
            // Don't fail if no processes found
            resolve();
          }
        );
        setTimeout(resolve, 2000); // Timeout after 2 seconds
      });
      
      // Also kill any node processes
      exec('taskkill /f /im node.exe', { cwd: backendPath }, () => {});
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-log', 'Port cleanup completed.\n');
      }
    } catch (cleanupError) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-log', `Cleanup warning: ${cleanupError.message}\n`);
      }
    }

    // Start new process
    backendProcess = spawn('npm', ['start'], {
      cwd: backendPath,
      shell: true,
      stdio: 'pipe'
    });

    // Capture and send stdout
    backendProcess.stdout.on('data', (data) => {
      const logText = data.toString();
      console.log('Backend stdout:', logText);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-log', logText);
      }
    });

    // Capture and send stderr
    backendProcess.stderr.on('data', (data) => {
      const logText = data.toString();
      console.log('Backend stderr:', logText);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-log', logText);
      }
    });

    backendProcess.on('error', (error) => {
      console.log('Backend process error:', error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-status', { 
          running: false, 
          error: error.message 
        });
        mainWindow.webContents.send('backend-log', `Error: ${error.message}\n`);
      }
    });

    backendProcess.on('exit', (code) => {
      console.log('Backend process exited with code:', code);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-status', { 
          running: false, 
          exitCode: code 
        });
        mainWindow.webContents.send('backend-log', `Process exited with code: ${code}\n`);
      }
      backendProcess = null;
    });

    // Send initial status
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-status', { running: true });
      mainWindow.webContents.send('backend-log', 'Starting backend server...\n');
    }

    return { success: true };
  } catch (error) {
    console.log('Start backend error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-backend', () => {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.removeAllListeners();
      backendProcess.kill('SIGTERM');
      backendProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-status', { running: false });
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping backend process:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'No backend process running' };
});

ipcMain.handle('install-dependencies', async () => {
  const backendPath = store.get('backendPath');
  if (!backendPath || !fs.existsSync(backendPath)) {
    return { success: false, error: 'Backend path not found' };
  }

  return new Promise((resolve) => {
    const installProcess = spawn('npm', ['install'], {
      cwd: backendPath,
      shell: true,
      stdio: 'pipe'
    });

    let output = '';
    
    installProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('install-progress', data.toString());
      }
    });

    installProcess.stderr.on('data', (data) => {
      output += data.toString();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('install-progress', data.toString());
      }
    });

    installProcess.on('close', (code) => {
      resolve({ 
        success: code === 0, 
        output: output,
        exitCode: code 
      });
    });

    installProcess.on('error', (error) => {
      resolve({ 
        success: false, 
        error: error.message,
        output: output 
      });
    });
  });
});

// Socket.IO download progress handler
ipcMain.handle('setup-download-listener', async () => {
  try {
    const serverPort = store.get('serverPort', 3000);
    
    // Close existing connection if any
    if (downloadSocket && downloadSocket.connected) {
      try {
        downloadSocket.removeAllListeners();
        downloadSocket.disconnect();
        downloadSocket = null;
      } catch (error) {
        console.error('Error closing existing socket connection:', error);
      }
    }
    
    // Create new Socket.IO connection
    downloadSocket = io(`http://localhost:${serverPort}`, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });
    
    downloadSocket.on('connect', () => {
      console.log('Main process connected to backend Socket.IO');
    });
    
    downloadSocket.on('download:progress', (data) => {
      console.log('Main process received download progress:', data);
      // Forward to renderer process
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', data);
      }
    });
    
    downloadSocket.on('disconnect', () => {
      console.log('Main process disconnected from backend Socket.IO');
    });
    
    downloadSocket.on('connect_error', (error) => {
      console.error('Main process Socket.IO connection error:', error);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to setup download listener in main process:', error);
    return { success: false, error: error.message };
  }
});

// Clean up Socket.IO connection when app closes
app.on('before-quit', () => {
  cleanupResources();
});