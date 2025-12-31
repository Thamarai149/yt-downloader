const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    resizable: false,
    maximizable: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Stop backend server when app closes
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

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
  store.set('backendPath', settings.backendPath);
  store.set('autoStart', settings.autoStart);
  store.set('serverPort', settings.serverPort);
  store.set('telegramToken', settings.telegramToken);
  store.set('downloadPath', settings.downloadPath);
  return true;
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
    if (backendProcess) {
      backendProcess.kill();
    }

    // Start new process
    backendProcess = spawn('npm', ['start'], {
      cwd: backendPath,
      shell: true,
      stdio: 'pipe'
    });

    backendProcess.on('error', (error) => {
      mainWindow.webContents.send('backend-status', { 
        running: false, 
        error: error.message 
      });
    });

    backendProcess.on('exit', (code) => {
      mainWindow.webContents.send('backend-status', { 
        running: false, 
        exitCode: code 
      });
      backendProcess = null;
    });

    // Send status updates
    setTimeout(() => {
      mainWindow.webContents.send('backend-status', { running: true });
    }, 2000);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-backend', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    mainWindow.webContents.send('backend-status', { running: false });
    return { success: true };
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
      mainWindow.webContents.send('install-progress', data.toString());
    });

    installProcess.stderr.on('data', (data) => {
      output += data.toString();
      mainWindow.webContents.send('install-progress', data.toString());
    });

    installProcess.on('close', (code) => {
      resolve({ 
        success: code === 0, 
        output: output,
        exitCode: code 
      });
    });
  });
});