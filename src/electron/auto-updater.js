/**
 * Auto Updater
 * Manages automatic application updates using electron-updater
 */

const { autoUpdater } = require('electron-updater');
const { dialog, shell } = require('electron');
const log = require('electron-log');
const fs = require('fs');
const path = require('path');

class AutoUpdater {
  constructor() {
    this.updateCheckInterval = null;
    this.checkIntervalMs = 4 * 60 * 60 * 1000; // 4 hours
    this.isChecking = false;
    this.isDownloading = false;
    this.downloadProgress = 0;
    this.updateInfo = null;
    this.error = null;
    this.mainWindow = null;
    this.autoCheckEnabled = true;
    this.autoDownloadEnabled = false;
    
    // Retry configuration
    this.maxRetries = 3;
    this.retryCount = 0;
    this.retryDelay = 5000; // 5 seconds (exponential backoff)
    this.retryTimeout = null;
    this.currentOperation = null; // 'check' or 'download'
    
    // Error tracking
    this.errorHistory = [];
    this.maxErrorHistory = 10;
    this.consecutiveFailures = 0;
    this.lastSuccessfulCheck = null;
    
    // Rollback configuration
    this.currentVersion = null;
    this.updateBackupPath = null;
    this.isRollingBack = false;

    // Configure logger
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configure auto-updater
    this.configureAutoUpdater();
  }

  /**
   * Configure auto-updater settings
   */
  configureAutoUpdater() {
    // Don't auto-download updates by default
    autoUpdater.autoDownload = false;
    
    // Don't auto-install on app quit
    autoUpdater.autoInstallOnAppQuit = false;

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up auto-updater event listeners
   */
  setupEventListeners() {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.isChecking = true;
      this.error = null;
      this.sendStatusToRenderer('checking');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.isChecking = false;
      this.updateInfo = info;
      this.sendStatusToRenderer('available', info);
      
      // Notify user about available update
      this.notifyUpdateAvailable(info);
    });

    // Update not available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.isChecking = false;
      this.updateInfo = null;
      this.sendStatusToRenderer('not-available', info);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      this.downloadProgress = progressObj.percent;
      this.sendStatusToRenderer('downloading', {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.isDownloading = false;
      this.downloadProgress = 100;
      this.sendStatusToRenderer('downloaded', info);
      
      // Notify user that update is ready to install
      this.notifyUpdateDownloaded(info);
    });

    // Error occurred
    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      this.isChecking = false;
      this.isDownloading = false;
      this.error = error.message;
      this.sendStatusToRenderer('error', { error: error.message });
      
      // Log error for debugging
      this.logUpdateError(error);
      
      // Attempt retry if applicable
      this.handleUpdateError(error);
    });
  }

  /**
   * Initialize auto-updater
   * @param {BrowserWindow} mainWindow - Main application window
   * @param {Object} settings - User settings
   */
  initialize(mainWindow, settings = {}) {
    this.mainWindow = mainWindow;
    
    // Store current version for rollback
    const { app } = require('electron');
    this.currentVersion = app.getVersion();
    
    // Apply settings
    this.autoCheckEnabled = settings.autoCheckUpdates !== false;
    this.autoDownloadEnabled = settings.autoDownloadUpdates === true;
    
    log.info('Auto-updater initialized', {
      currentVersion: this.currentVersion,
      autoCheck: this.autoCheckEnabled,
      autoDownload: this.autoDownloadEnabled,
    });

    // Load error history from disk
    this.loadErrorHistory();

    // Check for updates on startup if enabled
    if (this.autoCheckEnabled) {
      // Delay initial check by 10 seconds to allow app to fully load
      setTimeout(() => {
        this.checkForUpdates();
      }, 10000);
    }

    // Set up periodic update checks if enabled
    if (this.autoCheckEnabled) {
      this.startPeriodicChecks();
    }
  }

  /**
   * Check for updates manually
   * @param {boolean} isRetry - Whether this is a retry attempt
   * @returns {Promise<Object|null>} Update info if available, null otherwise
   */
  async checkForUpdates(isRetry = false) {
    try {
      if (this.isChecking && !isRetry) {
        log.info('Update check already in progress');
        return null;
      }

      log.info(`${isRetry ? 'Retrying' : 'Manually'} checking for updates...`);
      this.isChecking = true;
      this.currentOperation = 'check';
      
      const result = await autoUpdater.checkForUpdates();
      
      // Reset retry count and consecutive failures on success
      this.retryCount = 0;
      this.consecutiveFailures = 0;
      this.lastSuccessfulCheck = new Date();
      this.currentOperation = null;
      
      log.info('Update check successful', {
        hasUpdate: result && result.updateInfo ? true : false,
        version: result && result.updateInfo ? result.updateInfo.version : null,
      });
      
      if (result && result.updateInfo) {
        return result.updateInfo;
      }
      
      return null;
    } catch (error) {
      log.error('Failed to check for updates:', error);
      this.error = error.message;
      this.isChecking = false;
      this.consecutiveFailures++;
      
      // Record error
      this.recordError('check', error);
      
      // Don't retry if this was already a retry
      if (!isRetry) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * Download update
   * @param {boolean} isRetry - Whether this is a retry attempt
   * @returns {Promise<void>}
   */
  async downloadUpdate(isRetry = false) {
    try {
      if (this.isDownloading && !isRetry) {
        log.info('Update download already in progress');
        return;
      }

      if (!this.updateInfo) {
        const error = new Error('No update available to download');
        this.recordError('download', error);
        throw error;
      }

      log.info(`${isRetry ? 'Retrying' : 'Starting'} update download...`, {
        version: this.updateInfo.version,
        retryAttempt: isRetry ? this.retryCount : 0,
      });
      
      this.isDownloading = true;
      this.downloadProgress = 0;
      this.currentOperation = 'download';
      
      await autoUpdater.downloadUpdate();
      
      // Reset retry count and consecutive failures on success
      this.retryCount = 0;
      this.consecutiveFailures = 0;
      this.currentOperation = null;
      
      log.info('Update download completed successfully', {
        version: this.updateInfo.version,
      });
    } catch (error) {
      log.error('Failed to download update:', error);
      this.isDownloading = false;
      this.error = error.message;
      this.consecutiveFailures++;
      
      // Record error
      this.recordError('download', error);
      
      throw error;
    }
  }

  /**
   * Install update and restart application
   */
  installUpdate() {
    try {
      log.info('Installing update and restarting...', {
        currentVersion: this.currentVersion,
        targetVersion: this.updateInfo ? this.updateInfo.version : 'unknown',
      });
      
      // Create backup information for potential rollback
      this.createUpdateBackup();
      
      // Quit and install the update
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      log.error('Failed to install update:', error);
      this.error = error.message;
      this.recordError('install', error);
      
      // Attempt rollback if installation fails
      this.attemptRollback();
      
      throw error;
    }
  }

  /**
   * Start periodic update checks
   */
  startPeriodicChecks() {
    if (this.updateCheckInterval) {
      return; // Already running
    }

    log.info(`Starting periodic update checks (every ${this.checkIntervalMs / 1000 / 60} minutes)`);
    
    this.updateCheckInterval = setInterval(() => {
      if (this.autoCheckEnabled) {
        this.checkForUpdates();
      }
    }, this.checkIntervalMs);
  }

  /**
   * Stop periodic update checks
   */
  stopPeriodicChecks() {
    if (this.updateCheckInterval) {
      log.info('Stopping periodic update checks');
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Enable or disable automatic update checks
   * @param {boolean} enabled - Whether to enable auto-checks
   */
  setAutoCheck(enabled) {
    this.autoCheckEnabled = enabled;
    
    if (enabled) {
      this.startPeriodicChecks();
    } else {
      this.stopPeriodicChecks();
    }
    
    log.info(`Auto-check updates ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable automatic update downloads
   * @param {boolean} enabled - Whether to enable auto-downloads
   */
  setAutoDownload(enabled) {
    this.autoDownloadEnabled = enabled;
    autoUpdater.autoDownload = enabled;
    
    log.info(`Auto-download updates ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current update status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      checking: this.isChecking,
      available: this.updateInfo !== null,
      downloading: this.isDownloading,
      progress: this.downloadProgress,
      error: this.error,
      updateInfo: this.updateInfo,
      autoCheckEnabled: this.autoCheckEnabled,
      autoDownloadEnabled: this.autoDownloadEnabled,
    };
  }

  /**
   * Send status update to renderer process
   * @param {string} status - Status type
   * @param {Object} data - Additional data
   */
  sendStatusToRenderer(status, data = {}) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('updater:status', {
        status,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notify user about available update
   * @param {Object} info - Update info
   */
  notifyUpdateAvailable(info) {
    if (!this.mainWindow) return;

    const version = info.version;
    const releaseNotes = info.releaseNotes || 'No release notes available';
    
    // Send to renderer for UI notification
    if (this.mainWindow.webContents) {
      this.mainWindow.webContents.send('updater:update-available', {
        version,
        releaseNotes,
        releaseDate: info.releaseDate,
      });
    }

    // If auto-download is enabled, start downloading
    if (this.autoDownloadEnabled) {
      log.info('Auto-downloading update...');
      this.downloadUpdate().catch(error => {
        log.error('Auto-download failed:', error);
      });
    }
  }

  /**
   * Notify user that update is downloaded and ready
   * @param {Object} info - Update info
   */
  notifyUpdateDownloaded(info) {
    if (!this.mainWindow) return;

    const version = info.version;
    
    // Send to renderer for UI notification
    if (this.mainWindow.webContents) {
      this.mainWindow.webContents.send('updater:update-downloaded', {
        version,
        releaseNotes: info.releaseNotes,
      });
    }
  }

  /**
   * Handle update error with retry logic
   * @param {Error} error - Error object
   */
  handleUpdateError(error) {
    const operation = this.currentOperation || 'unknown';
    
    // Determine if error is retryable
    const isRetryable = this.isErrorRetryable(error);
    
    if (!isRetryable) {
      log.warn('Error is not retryable, skipping retry logic', {
        error: error.message,
        operation,
      });
      this.retryCount = 0;
      this.currentOperation = null;
      this.showUpdateErrorDialog(error);
      return;
    }
    
    // Check if we should retry
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
      
      log.info(`Scheduling retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`, {
        operation,
        error: error.message,
      });
      
      // Notify renderer about retry
      this.sendStatusToRenderer('retrying', {
        attempt: this.retryCount,
        maxAttempts: this.maxRetries,
        nextRetryIn: delay,
        operation,
      });
      
      // Clear any existing retry timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }
      
      // Schedule retry
      this.retryTimeout = setTimeout(() => {
        log.info(`Attempting retry ${this.retryCount}/${this.maxRetries}`, {
          operation,
        });
        
        if (operation === 'download') {
          // Retry download
          this.downloadUpdate(true).catch(err => {
            log.error('Retry download failed:', err);
          });
        } else if (operation === 'check') {
          // Retry check
          this.checkForUpdates(true).catch(err => {
            log.error('Retry check failed:', err);
          });
        }
      }, delay);
    } else {
      log.error(`Max retries (${this.maxRetries}) reached for ${operation}`, {
        consecutiveFailures: this.consecutiveFailures,
        errorHistory: this.errorHistory.length,
      });
      
      this.retryCount = 0;
      this.currentOperation = null;
      
      // Show error dialog to user
      this.showUpdateErrorDialog(error);
      
      // If too many consecutive failures, disable auto-check temporarily
      if (this.consecutiveFailures >= 5) {
        log.warn('Too many consecutive failures, temporarily disabling auto-check');
        this.temporarilyDisableAutoCheck();
      }
    }
  }

  /**
   * Show error dialog to user
   * @param {Error} error - Error object
   */
  showUpdateErrorDialog(error) {
    if (!this.mainWindow) return;
    
    const errorType = this.categorizeError(error);
    const troubleshootingSteps = this.getTroubleshootingSteps(errorType);
    
    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Update Failed',
      message: `Failed to ${this.currentOperation || 'update'} the application`,
      detail: `Error: ${error.message}\n\n${troubleshootingSteps}\n\nYou can try again later or download the update manually from the website.`,
      buttons: ['OK', 'View Logs', 'Visit Website', 'Retry Now'],
      defaultId: 0,
      cancelId: 0,
    }).then(result => {
      if (result.response === 1) {
        // View logs
        this.openLogFile();
      } else if (result.response === 2) {
        // Open website
        shell.openExternal('https://github.com/yourusername/yt-downloader/releases');
      } else if (result.response === 3) {
        // Retry now
        this.retryCount = 0;
        if (this.currentOperation === 'download') {
          this.downloadUpdate().catch(err => log.error('Manual retry failed:', err));
        } else {
          this.checkForUpdates().catch(err => log.error('Manual retry failed:', err));
        }
      }
    });
  }

  /**
   * Cancel any pending retry
   */
  cancelRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.retryCount = 0;
  }

  /**
   * Log update error for debugging
   * @param {Error} error - Error object
   */
  logUpdateError(error) {
    log.error('Update error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      operation: this.currentOperation,
      consecutiveFailures: this.consecutiveFailures,
    });
  }

  /**
   * Record error in history
   * @param {string} operation - Operation type (check, download, install)
   * @param {Error} error - Error object
   */
  recordError(operation, error) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      operation,
      message: error.message,
      name: error.name,
      stack: error.stack,
      retryCount: this.retryCount,
    };
    
    this.errorHistory.push(errorRecord);
    
    // Keep only last N errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
    
    // Save to disk
    this.saveErrorHistory();
    
    log.error('Error recorded:', errorRecord);
  }

  /**
   * Determine if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether error is retryable
   */
  isErrorRetryable(error) {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (message.includes('network') || 
        message.includes('timeout') || 
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('etimedout')) {
      return true;
    }
    
    // Temporary server errors are retryable
    if (message.includes('503') || 
        message.includes('502') || 
        message.includes('504')) {
      return true;
    }
    
    // Disk space errors are not retryable
    if (message.includes('enospc') || 
        message.includes('disk space')) {
      return false;
    }
    
    // Permission errors are not retryable
    if (message.includes('eacces') || 
        message.includes('eperm') || 
        message.includes('permission')) {
      return false;
    }
    
    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Categorize error type
   * @param {Error} error - Error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('etimedout')) {
      return 'timeout';
    }
    if (message.includes('enospc') || message.includes('disk space')) {
      return 'disk_space';
    }
    if (message.includes('eacces') || message.includes('eperm') || message.includes('permission')) {
      return 'permission';
    }
    if (message.includes('checksum') || message.includes('integrity')) {
      return 'integrity';
    }
    
    return 'unknown';
  }

  /**
   * Get troubleshooting steps for error type
   * @param {string} errorType - Error category
   * @returns {string} Troubleshooting steps
   */
  getTroubleshootingSteps(errorType) {
    const steps = {
      network: 'Troubleshooting:\n• Check your internet connection\n• Verify firewall settings\n• Try again in a few minutes',
      timeout: 'Troubleshooting:\n• Check your internet speed\n• Try again when network is more stable\n• Disable VPN if active',
      disk_space: 'Troubleshooting:\n• Free up disk space on your system drive\n• Remove temporary files\n• Uninstall unused applications',
      permission: 'Troubleshooting:\n• Run the application as administrator\n• Check folder permissions\n• Disable antivirus temporarily',
      integrity: 'Troubleshooting:\n• Clear update cache\n• Download update manually\n• Reinstall the application',
      unknown: 'Troubleshooting:\n• Check the log file for details\n• Try again later\n• Contact support if problem persists',
    };
    
    return steps[errorType] || steps.unknown;
  }

  /**
   * Create backup information for rollback
   */
  createUpdateBackup() {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const backupPath = path.join(userDataPath, 'update-backup.json');
      
      const backupInfo = {
        previousVersion: this.currentVersion,
        targetVersion: this.updateInfo ? this.updateInfo.version : null,
        timestamp: new Date().toISOString(),
        updateInfo: this.updateInfo,
      };
      
      fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2));
      this.updateBackupPath = backupPath;
      
      log.info('Update backup created', backupInfo);
    } catch (error) {
      log.error('Failed to create update backup:', error);
    }
  }

  /**
   * Attempt rollback to previous version
   */
  attemptRollback() {
    if (this.isRollingBack) {
      log.warn('Rollback already in progress');
      return;
    }
    
    this.isRollingBack = true;
    
    try {
      log.warn('Attempting rollback due to update failure');
      
      // Load backup information
      if (this.updateBackupPath && fs.existsSync(this.updateBackupPath)) {
        const backupInfo = JSON.parse(fs.readFileSync(this.updateBackupPath, 'utf8'));
        
        log.info('Rollback information loaded', {
          previousVersion: backupInfo.previousVersion,
          failedVersion: backupInfo.targetVersion,
        });
        
        // Notify user about rollback
        if (this.mainWindow) {
          dialog.showMessageBox(this.mainWindow, {
            type: 'warning',
            title: 'Update Failed - Rollback',
            message: 'The update installation failed',
            detail: `The application will continue running on version ${backupInfo.previousVersion}.\n\nYou can try updating again later or download the update manually.`,
            buttons: ['OK'],
          });
        }
        
        // Clean up failed update files
        this.cleanupFailedUpdate();
        
        // Record rollback in error history
        this.recordError('rollback', new Error(`Rolled back from ${backupInfo.targetVersion} to ${backupInfo.previousVersion}`));
      }
    } catch (error) {
      log.error('Rollback failed:', error);
    } finally {
      this.isRollingBack = false;
    }
  }

  /**
   * Clean up failed update files
   */
  cleanupFailedUpdate() {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      
      // Remove pending update files
      const pendingUpdatePath = path.join(userDataPath, 'pending-update');
      if (fs.existsSync(pendingUpdatePath)) {
        fs.rmSync(pendingUpdatePath, { recursive: true, force: true });
        log.info('Cleaned up pending update files');
      }
      
      // Clear update cache
      const updateCachePath = path.join(userDataPath, 'update-cache');
      if (fs.existsSync(updateCachePath)) {
        fs.rmSync(updateCachePath, { recursive: true, force: true });
        log.info('Cleared update cache');
      }
    } catch (error) {
      log.error('Failed to cleanup failed update:', error);
    }
  }

  /**
   * Temporarily disable auto-check after too many failures
   */
  temporarilyDisableAutoCheck() {
    this.stopPeriodicChecks();
    
    // Re-enable after 24 hours
    setTimeout(() => {
      log.info('Re-enabling auto-check after temporary disable');
      this.consecutiveFailures = 0;
      if (this.autoCheckEnabled) {
        this.startPeriodicChecks();
      }
    }, 24 * 60 * 60 * 1000);
    
    // Notify user
    if (this.mainWindow) {
      this.mainWindow.webContents.send('updater:auto-check-disabled', {
        reason: 'Too many consecutive failures',
        retryAfter: '24 hours',
      });
    }
  }

  /**
   * Open log file in default text editor
   */
  openLogFile() {
    try {
      const logPath = log.transports.file.getFile().path;
      shell.openPath(logPath);
      log.info('Opened log file:', logPath);
    } catch (error) {
      log.error('Failed to open log file:', error);
    }
  }

  /**
   * Load error history from disk
   */
  loadErrorHistory() {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const historyPath = path.join(userDataPath, 'update-error-history.json');
      
      if (fs.existsSync(historyPath)) {
        const data = fs.readFileSync(historyPath, 'utf8');
        this.errorHistory = JSON.parse(data);
        log.info(`Loaded ${this.errorHistory.length} error records from history`);
      }
    } catch (error) {
      log.error('Failed to load error history:', error);
      this.errorHistory = [];
    }
  }

  /**
   * Save error history to disk
   */
  saveErrorHistory() {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const historyPath = path.join(userDataPath, 'update-error-history.json');
      
      fs.writeFileSync(historyPath, JSON.stringify(this.errorHistory, null, 2));
    } catch (error) {
      log.error('Failed to save error history:', error);
    }
  }

  /**
   * Get error history
   * @returns {Array} Error history
   */
  getErrorHistory() {
    return this.errorHistory;
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.consecutiveFailures = 0;
    this.saveErrorHistory();
    log.info('Error history cleared');
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopPeriodicChecks();
    this.cancelRetry();
    this.saveErrorHistory();
    this.mainWindow = null;
    log.info('Auto-updater cleaned up');
  }
}

module.exports = AutoUpdater;
