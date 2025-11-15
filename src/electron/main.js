/**
 * Electron Main Process
 * Manages application lifecycle, window creation, and backend server
 */

const { app } = require('electron');
const ApplicationManager = require('./application-manager');
const BackendServerManager = require('./backend-manager');
const IPCHandler = require('./ipc-handler');
const SettingsIntegration = require('./settings-integration');
const AutoUpdater = require('./auto-updater');
const logger = require('./logger');
const errorHandler = require('./error-handler');

// Application instances
let applicationManager = null;
let backendManager = null;
let ipcHandler = null;
let settingsIntegration = null;
let autoUpdater = null;

/**
 * Show binary error dialog with detailed instructions
 */
function showBinaryErrorDialog(missingBinaries, binaryStatus) {
  const { dialog, shell } = require('electron');
  const path = require('path');
  
  let message = 'The following required binaries are missing or invalid:\n\n';
  missingBinaries.forEach(binary => {
    message += `• ${binary}\n`;
  });
  
  // Add auto-download status if available
  if (binaryStatus && binaryStatus.autoDownload) {
    message += '\n';
    if (binaryStatus.autoDownload.ytdlp.attempted) {
      message += `yt-dlp auto-download: ${binaryStatus.autoDownload.ytdlp.success ? '✓ Success' : '✗ Failed'}\n`;
    }
    if (binaryStatus.autoDownload.ffmpeg.attempted) {
      message += `ffmpeg auto-download: ${binaryStatus.autoDownload.ffmpeg.success ? '✓ Success' : '✗ Failed'}\n`;
    }
  }
  
  message += '\nManual Installation Instructions:\n\n';
  
  if (missingBinaries.includes('yt-dlp')) {
    message += 'yt-dlp:\n';
    message += '1. Download from: https://github.com/yt-dlp/yt-dlp/releases/latest\n';
    message += '2. Get the file: yt-dlp.exe\n';
    message += '3. Place it in the binaries folder\n\n';
  }
  
  if (missingBinaries.includes('ffmpeg')) {
    message += 'ffmpeg:\n';
    message += '1. Download from: https://github.com/BtbN/FFmpeg-Builds/releases\n';
    message += '2. Extract ffmpeg.exe from the archive\n';
    message += '3. Place it in the binaries folder\n\n';
  }
  
  const result = dialog.showMessageBoxSync({
    type: 'warning',
    title: 'Missing Required Binaries',
    message: 'Binary Verification Failed',
    detail: message,
    buttons: ['Open Download Page', 'View Documentation', 'Continue Anyway', 'Exit'],
    defaultId: 0,
    cancelId: 3,
    noLink: true
  });
  
  if (result === 0) {
    // Open download page for first missing binary
    if (missingBinaries.includes('yt-dlp')) {
      shell.openExternal('https://github.com/yt-dlp/yt-dlp/releases/latest');
    } else if (missingBinaries.includes('ffmpeg')) {
      shell.openExternal('https://github.com/BtbN/FFmpeg-Builds/releases');
    }
  } else if (result === 1) {
    // Open documentation
    const docsPath = path.join(__dirname, '../../BINARY_BUNDLING.md');
    shell.openPath(docsPath).catch(() => {
      // If local docs don't exist, open online docs
      shell.openExternal('https://github.com/yt-dlp/yt-dlp#installation');
    });
  }
  
  return result;
}

/**
 * Initialize the application
 */
async function initializeApp() {
  const startTime = Date.now();
  
  try {
    logger.info('=== Application Starting ===');
    logger.info(`Version: ${app.getVersion()}`);
    logger.info(`Platform: ${process.platform}`);
    logger.info(`Node: ${process.version}`);
    logger.info(`Electron: ${process.versions.electron}`);

    // Clear old logs
    await logger.clearOldLogs();

    // Create backend server manager
    backendManager = new BackendServerManager();
    
    // Start backend server
    logger.info('Starting backend server...');
    await backendManager.start();
    logger.info(`Backend server started at ${backendManager.getUrl()}`);

    // Check binary status
    logger.info('Checking binary status...');
    const binaryStatus = await backendManager.checkBinaryStatus();
    
    if (binaryStatus && !binaryStatus.ready) {
      logger.warn('⚠️  Some binaries are missing or invalid');
      
      // Collect missing binaries
      const missingBinaries = [];
      if (binaryStatus.status) {
        if (!binaryStatus.status.ytdlp.available) {
          missingBinaries.push('yt-dlp');
        }
        if (!binaryStatus.status.ffmpeg.available) {
          missingBinaries.push('ffmpeg');
        }
      }
      
      // Show warning dialog (non-blocking)
      if (missingBinaries.length > 0) {
        setTimeout(async () => {
          const result = await errorHandler.handleBinaryError(
            missingBinaries,
            binaryStatus.status,
            async () => {
              // Retry callback
              logger.info('Retrying binary verification...');
              const newStatus = await backendManager.checkBinaryStatus();
              if (newStatus && newStatus.ready) {
                logger.info('✅ Binaries verified after retry');
              }
            }
          );
          
          if (result === 'exit') {
            app.quit();
          }
        }, 2000); // Delay to allow window to show first
      }
    } else if (binaryStatus && binaryStatus.ready) {
      logger.info('✅ All binaries verified and ready');
    }

    // Create IPC handler
    ipcHandler = new IPCHandler(backendManager);
    ipcHandler.registerHandlers();
    logger.info('IPC handlers registered');

    // Create application manager
    applicationManager = new ApplicationManager();
    await applicationManager.initialize();
    logger.info('Application manager initialized');

    // Set application manager in IPC handler (for window management)
    ipcHandler.setApplicationManager(applicationManager);

    // Defer auto-updater initialization (performance optimization)
    setTimeout(() => {
      try {
        autoUpdater = new AutoUpdater();
        logger.info('Auto-updater initialized (deferred)');
      } catch (error) {
        logger.error('Failed to initialize auto-updater:', error);
      }
    }, 3000);
    
    // Create settings integration
    settingsIntegration = new SettingsIntegration(applicationManager, backendManager, autoUpdater);
    ipcHandler.setSettingsIntegration(settingsIntegration);

    // Load and apply initial settings
    try {
      const settings = await ipcHandler.loadSettings();
      
      // Defer auto-updater settings application
      if (autoUpdater) {
        autoUpdater.initialize(applicationManager.getMainWindow(), settings);
      }
      
      // Apply all settings
      await settingsIntegration.applySettings(settings);
      logger.info('Initial settings applied');
      
      // Set auto-updater in IPC handler for update-related IPC calls
      if (autoUpdater) {
        ipcHandler.setAutoUpdater(autoUpdater);
      }
    } catch (error) {
      logger.error('Failed to load initial settings:', error);
    }

    const initTime = Date.now() - startTime;
    logger.info(`=== Application initialized in ${initTime}ms ===`);

  } catch (error) {
    logger.error('Failed to initialize application:', error);
    errorHandler.handleCriticalError(error, 'Application Initialization Failed');
    app.quit();
  }
}

/**
 * Cleanup before quit
 */
async function cleanup() {
  try {
    logger.info('Cleaning up...');

    if (autoUpdater) {
      autoUpdater.cleanup();
    }

    if (applicationManager) {
      await applicationManager.cleanup();
    }

    if (backendManager) {
      await backendManager.stop();
    }

    logger.info('Cleanup completed');
    logger.info('=== Application Shutdown ===');
  } catch (error) {
    logger.error('Error during cleanup:', error);
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

// Error handlers are set up in error-handler.js module
