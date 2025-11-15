/**
 * Error Handler Module
 * Centralized error handling and recovery
 */

const { dialog, app } = require('electron');
const logger = require('./logger');

class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }

  /**
   * Set up global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.handleCriticalError(error, 'Uncaught Exception');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      this.handleCriticalError(reason, 'Unhandled Promise Rejection');
    });

    logger.info('Global error handlers initialized');
  }

  /**
   * Handle critical errors
   */
  handleCriticalError(error, title = 'Critical Error') {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    logger.error(`${title}:`, errorMessage);
    if (errorStack) {
      logger.error('Stack trace:', errorStack);
    }

    // Show error dialog to user
    dialog.showErrorBox(
      title,
      `An unexpected error occurred:\n\n${errorMessage}\n\nThe application will continue running, but some features may not work correctly.\n\nPlease check the logs for more details.`
    );
  }

  /**
   * Handle server startup errors
   */
  handleServerError(error, backendManager) {
    logger.error('Backend server error:', error);

    const errorMessage = error.message || 'Unknown error';
    let userMessage = 'Failed to start the backend server.\n\n';
    let buttons = ['Retry', 'View Logs', 'Exit'];

    // Provide specific guidance based on error type
    if (errorMessage.includes('EADDRINUSE')) {
      userMessage += 'The port is already in use. The application will try to use a different port.';
    } else if (errorMessage.includes('ENOENT')) {
      userMessage += 'Backend server files are missing. Please reinstall the application.';
    } else {
      userMessage += `Error: ${errorMessage}`;
    }

    const result = dialog.showMessageBoxSync({
      type: 'error',
      title: 'Backend Server Error',
      message: 'Server Startup Failed',
      detail: userMessage,
      buttons: buttons,
      defaultId: 0,
      cancelId: 2
    });

    if (result === 0) {
      // Retry
      logger.info('User chose to retry server startup');
      return 'retry';
    } else if (result === 1) {
      // View logs
      const { shell } = require('electron');
      const path = require('path');
      const logsPath = path.join(app.getPath('userData'), 'logs');
      shell.openPath(logsPath);
      return 'logs';
    } else {
      // Exit
      logger.info('User chose to exit after server error');
      return 'exit';
    }
  }

  /**
   * Handle binary errors with retry logic
   */
  async handleBinaryError(missingBinaries, binaryStatus, retryCallback) {
    logger.error('Binary verification failed:', missingBinaries);

    const { shell } = require('electron');
    const path = require('path');
    
    let message = 'The following required binaries are missing or invalid:\n\n';
    missingBinaries.forEach(binary => {
      message += `• ${binary}\n`;
    });
    
    // Add auto-download status
    if (binaryStatus && binaryStatus.autoDownload) {
      message += '\n';
      if (binaryStatus.autoDownload.ytdlp && binaryStatus.autoDownload.ytdlp.attempted) {
        message += `yt-dlp auto-download: ${binaryStatus.autoDownload.ytdlp.success ? '✓ Success' : '✗ Failed'}\n`;
        if (!binaryStatus.autoDownload.ytdlp.success && binaryStatus.autoDownload.ytdlp.error) {
          message += `  Error: ${binaryStatus.autoDownload.ytdlp.error}\n`;
        }
      }
      if (binaryStatus.autoDownload.ffmpeg && binaryStatus.autoDownload.ffmpeg.attempted) {
        message += `ffmpeg auto-download: ${binaryStatus.autoDownload.ffmpeg.success ? '✓ Success' : '✗ Failed'}\n`;
        if (!binaryStatus.autoDownload.ffmpeg.success && binaryStatus.autoDownload.ffmpeg.error) {
          message += `  Error: ${binaryStatus.autoDownload.ffmpeg.error}\n`;
        }
      }
    }
    
    message += '\nTroubleshooting Steps:\n\n';
    message += '1. Click "Retry" to attempt auto-download again\n';
    message += '2. Click "Manual Download" for installation instructions\n';
    message += '3. Click "Continue" to use the app with limited functionality\n';
    
    const result = dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Missing Required Binaries',
      message: 'Binary Verification Failed',
      detail: message,
      buttons: ['Retry', 'Manual Download', 'Continue', 'Exit'],
      defaultId: 0,
      cancelId: 3
    });
    
    if (result === 0) {
      // Retry auto-download
      logger.info('User chose to retry binary download');
      if (retryCallback) {
        await retryCallback();
      }
      return 'retry';
    } else if (result === 1) {
      // Manual download instructions
      this.showManualDownloadInstructions(missingBinaries);
      return 'manual';
    } else if (result === 2) {
      // Continue anyway
      logger.warn('User chose to continue without all binaries');
      return 'continue';
    } else {
      // Exit
      return 'exit';
    }
  }

  /**
   * Show manual download instructions
   */
  showManualDownloadInstructions(missingBinaries) {
    const { shell } = require('electron');
    
    let instructions = 'Manual Installation Instructions:\n\n';
    
    if (missingBinaries.includes('yt-dlp')) {
      instructions += 'yt-dlp:\n';
      instructions += '1. Visit: https://github.com/yt-dlp/yt-dlp/releases/latest\n';
      instructions += '2. Download: yt-dlp.exe\n';
      instructions += '3. Place in: [App Directory]/binaries/\n\n';
    }
    
    if (missingBinaries.includes('ffmpeg')) {
      instructions += 'ffmpeg:\n';
      instructions += '1. Visit: https://github.com/BtbN/FFmpeg-Builds/releases\n';
      instructions += '2. Download: ffmpeg-master-latest-win64-gpl.zip\n';
      instructions += '3. Extract ffmpeg.exe\n';
      instructions += '4. Place in: [App Directory]/binaries/\n\n';
    }
    
    instructions += 'After downloading, restart the application.';
    
    const result = dialog.showMessageBoxSync({
      type: 'info',
      title: 'Manual Download Instructions',
      message: 'How to Install Missing Binaries',
      detail: instructions,
      buttons: ['Open yt-dlp Page', 'Open ffmpeg Page', 'Close'],
      defaultId: 2
    });
    
    if (result === 0) {
      shell.openExternal('https://github.com/yt-dlp/yt-dlp/releases/latest');
    } else if (result === 1) {
      shell.openExternal('https://github.com/BtbN/FFmpeg-Builds/releases');
    }
  }

  /**
   * Handle download errors with retry
   */
  handleDownloadError(error, url, retryCount = 0, maxRetries = 3) {
    logger.error(`Download error (attempt ${retryCount + 1}/${maxRetries}):`, error);

    if (retryCount < maxRetries) {
      logger.info(`Retrying download in ${Math.pow(2, retryCount)} seconds...`);
      return {
        shouldRetry: true,
        delay: Math.pow(2, retryCount) * 1000 // Exponential backoff
      };
    }

    return {
      shouldRetry: false,
      delay: 0
    };
  }

  /**
   * Handle update errors
   */
  handleUpdateError(error) {
    logger.error('Update error:', error);

    const errorMessage = error.message || 'Unknown error';
    
    dialog.showMessageBox({
      type: 'warning',
      title: 'Update Failed',
      message: 'Failed to check for updates',
      detail: `Error: ${errorMessage}\n\nYou can check for updates manually later from the Help menu.`,
      buttons: ['OK']
    });
  }

  /**
   * Log and handle non-critical errors
   */
  logError(context, error, showDialog = false) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}]`, errorMessage);
    
    if (error instanceof Error && error.stack) {
      logger.error('Stack trace:', error.stack);
    }

    if (showDialog) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Error',
        message: context,
        detail: errorMessage,
        buttons: ['OK']
      });
    }
  }
}

// Export singleton instance
module.exports = new ErrorHandler();
