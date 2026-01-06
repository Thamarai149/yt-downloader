const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { io } = require('socket.io-client');

const store = new Store();
let mainWindow;
let backendProcess = null;
let downloadSocket = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    resizable: true,
    maximizable: true,
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
  
  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

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

// IPC handlers
ipcMain.handle('get-settings', () => {
  return {
    backendPath: store.get('backendPath', ''),
    autoStart: store.get('autoStart', false),
    serverPort: store.get('serverPort', 3000),
    telegramToken: store.get('telegramToken', ''),
    downloadPath: store.get('downloadPath', '')
  };
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

ipcMain.handle('get-backend-status', () => {
  return { running: backendProcess !== null };
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