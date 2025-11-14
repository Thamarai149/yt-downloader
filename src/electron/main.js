/**
 * Electron Main Process
 * Manages application lifecycle, window creation, and backend server
 */

const { app } = require('electron');
const ApplicationManager = require('./application-manager');
const BackendServerManager = require('./backend-manager');
const IPCHandler = require('./ipc-handler');

// Application instances
let applicationManager = null;
let backendManager = null;
let ipcHandler = null;

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    console.log('Initializing application...');

    // Create backend server manager
    backendManager = new BackendServerManager();
    
    // Start backend server
    console.log('Starting backend server...');
    await backendManager.start();
    console.log(`Backend server started at ${backendManager.getUrl()}`);

    // Create IPC handler
    ipcHandler = new IPCHandler(backendManager);
    ipcHandler.registerHandlers();
    console.log('IPC handlers registered');

    // Create application manager
    applicationManager = new ApplicationManager();
    await applicationManager.initialize();
    console.log('Application manager initialized');

    // Set application manager in IPC handler (for window management)
    ipcHandler.setApplicationManager(applicationManager);

    // Load and apply initial settings
    try {
      const settings = await ipcHandler.loadSettings();
      ipcHandler.applySettings(settings);
      console.log('Initial settings applied');
    } catch (error) {
      console.error('Failed to load initial settings:', error);
    }

  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

/**
 * Cleanup before quit
 */
async function cleanup() {
  try {
    console.log('Cleaning up...');

    if (applicationManager) {
      await applicationManager.cleanup();
    }

    if (backendManager) {
      await backendManager.stop();
    }

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

/**
 * App lifecycle events
 */
app.whenReady().then(initializeApp);

app.on('activate', async () => {
  // On macOS, re-create window when dock icon is clicked
  if (!applicationManager || !applicationManager.hasWindow()) {
    await initializeApp();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  // Mark that we're quitting so window close doesn't minimize to tray
  if (applicationManager) {
    applicationManager.isQuitting = true;
  }
  
  event.preventDefault();
  await cleanup();
  app.exit(0);
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
