/**
 * IPC Handler
 * Manages Inter-Process Communication between main and renderer processes
 */

const { ipcMain, dialog, shell, app, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const SettingsManager = require('./settings-manager');

class IPCHandler {
  constructor(backendManager, applicationManager = null) {
    this.backendManager = backendManager;
    this.applicationManager = applicationManager;
    this.settingsManager = new SettingsManager();
    this.settingsIntegration = null;
    this.autoUpdater = null;
  }

  /**
   * Set application manager (called after initialization)
   */
  setApplicationManager(applicationManager) {
    this.applicationManager = applicationManager;
  }

  /**
   * Set settings integration (called after initialization)
   */
  setSettingsIntegration(settingsIntegration) {
    this.settingsIntegration = settingsIntegration;
  }

  /**
   * Set auto-updater (called after initialization)
   */
  setAutoUpdater(autoUpdater) {
    this.autoUpdater = autoUpdater;
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers() {
    console.log('Registering IPC handlers...');

    // App information handlers
    this.registerAppHandlers();

    // Backend management handlers
    this.registerBackendHandlers();

    // Settings management handlers
    this.registerSettingsHandlers();

    // Window management handlers
    this.registerWindowHandlers();

    // File operation handlers
    this.registerFileHandlers();

    // Notification handlers
    this.registerNotificationHandlers();

    // Dialog handlers
    this.registerDialogHandlers();

    // Update handlers
    this.registerUpdateHandlers();

    console.log('IPC handlers registered successfully');
  }

  /**
   * Register app information handlers
   */
  registerAppHandlers() {
    // Get app version
    ipcMain.handle('app:get-version', () => {
      return app.getVersion();
    });

    // Get app paths
    ipcMain.handle('app:get-paths', () => {
      return {
        app: app.getAppPath(),
        userData: app.getPath('userData'),
        downloads: app.getPath('downloads'),
        temp: app.getPath('temp'),
        logs: path.join(app.getPath('userData'), 'logs'),
        resources: process.resourcesPath,
      };
    });

    // Get platform
    ipcMain.handle('app:get-platform', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
      };
    });
  }

  /**
   * Register backend management handlers
   */
  registerBackendHandlers() {
    // Get backend URL
    ipcMain.handle('backend:get-url', () => {
      return this.backendManager.getUrl();
    });

    // Get backend status
    ipcMain.handle('backend:get-status', () => {
      return this.backendManager.getStatus();
    });

    // Restart backend
    ipcMain.handle('backend:restart', async () => {
      try {
        await this.backendManager.restart();
        return { success: true };
      } catch (error) {
        console.error('Failed to restart backend:', error);
        return { success: false, error: error.message };
      }
    });

    // Get binary status
    ipcMain.handle('backend:get-binary-status', async () => {
      try {
        const status = await this.backendManager.checkBinaryStatus();
        return status;
      } catch (error) {
        console.error('Failed to get binary status:', error);
        return { success: false, error: error.message };
      }
    });

    // Trigger binary re-verification
    ipcMain.handle('backend:verify-binaries', async () => {
      try {
        const status = await this.backendManager.checkBinaryStatus();
        return status;
      } catch (error) {
        console.error('Failed to verify binaries:', error);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register settings management handlers
   */
  registerSettingsHandlers() {
    // Get settings
    ipcMain.handle('settings:get', async () => {
      try {
        return await this.settingsManager.loadSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        return this.settingsManager.getDefaultSettings();
      }
    });

    // Set settings
    ipcMain.handle('settings:set', async (event, settings) => {
      try {
        // Validate download path if it's being changed
        if (settings.downloadPath) {
          const validation = await this.settingsManager.validateDownloadPath(settings.downloadPath);
          if (!validation.valid) {
            return { success: false, error: validation.error };
          }
        }

        const updatedSettings = await this.settingsManager.updateSettings(settings);
        
        // Apply settings using settings integration
        if (this.settingsIntegration) {
          await this.settingsIntegration.applySettings(updatedSettings);
        }
        
        return { success: true, settings: updatedSettings };
      } catch (error) {
        console.error('Failed to save settings:', error);
        return { success: false, error: error.message };
      }
    });

    // Reset settings
    ipcMain.handle('settings:reset', async () => {
      try {
        const defaults = await this.settingsManager.resetSettings();
        
        // Apply settings using settings integration
        if (this.settingsIntegration) {
          await this.settingsIntegration.applySettings(defaults);
        }
        
        return { success: true, settings: defaults };
      } catch (error) {
        console.error('Failed to reset settings:', error);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register window management handlers
   */
  registerWindowHandlers() {
    // Minimize window
    ipcMain.handle('window:minimize', () => {
      if (this.applicationManager) {
        this.applicationManager.minimizeWindow();
        return { success: true };
      }
      return { success: false, error: 'Application manager not available' };
    });

    // Maximize/restore window
    ipcMain.handle('window:maximize', () => {
      if (this.applicationManager) {
        this.applicationManager.maximizeWindow();
        return { success: true };
      }
      return { success: false, error: 'Application manager not available' };
    });

    // Hide window
    ipcMain.handle('window:hide', () => {
      if (this.applicationManager) {
        this.applicationManager.hideWindow();
        return { success: true };
      }
      return { success: false, error: 'Application manager not available' };
    });

    // Show window
    ipcMain.handle('window:show', () => {
      if (this.applicationManager) {
        this.applicationManager.showWindow();
        return { success: true };
      }
      return { success: false, error: 'Application manager not available' };
    });

    // Restore window from tray
    ipcMain.handle('window:restore', () => {
      if (this.applicationManager) {
        this.applicationManager.restoreWindow();
        return { success: true };
      }
      return { success: false, error: 'Application manager not available' };
    });

    // Toggle fullscreen
    ipcMain.handle('window:toggle-fullscreen', () => {
      if (this.applicationManager) {
        this.applicationManager.toggleFullScreen();
        return { success: true };
      }
      return { success: false, error: 'Application manager not available' };
    });
  }

  /**
   * Register file operation handlers
   */
  registerFileHandlers() {
    // Select folder dialog
    ipcMain.handle('download:select-folder', async () => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory', 'createDirectory'],
          title: 'Select Download Folder',
          buttonLabel: 'Select Folder',
        });

        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }

        return result.filePaths[0];
      } catch (error) {
        console.error('Failed to show folder picker:', error);
        return null;
      }
    });

    // Open folder in file explorer
    ipcMain.handle('file:open-folder', async (event, folderPath) => {
      try {
        if (!folderPath) {
          return { success: false, error: 'No folder path provided' };
        }

        // Check if folder exists
        const exists = await this.fileExists(folderPath);
        if (!exists) {
          return { success: false, error: 'Folder does not exist' };
        }

        await shell.openPath(folderPath);
        return { success: true };
      } catch (error) {
        console.error('Failed to open folder:', error);
        return { success: false, error: error.message };
      }
    });

    // Open file in default application
    ipcMain.handle('file:open-file', async (event, filePath) => {
      try {
        if (!filePath) {
          return { success: false, error: 'No file path provided' };
        }

        // Check if file exists
        const exists = await this.fileExists(filePath);
        if (!exists) {
          return { success: false, error: 'File does not exist' };
        }

        const result = await shell.openPath(filePath);
        
        if (result) {
          // openPath returns an error string if it fails
          return { success: false, error: result };
        }

        return { success: true };
      } catch (error) {
        console.error('Failed to open file:', error);
        return { success: false, error: error.message };
      }
    });

    // Show file in folder (reveal in file explorer)
    ipcMain.handle('file:show-in-folder', async (event, filePath) => {
      try {
        if (!filePath) {
          return { success: false, error: 'No file path provided' };
        }

        // Check if file exists
        const exists = await this.fileExists(filePath);
        if (!exists) {
          return { success: false, error: 'File does not exist' };
        }

        shell.showItemInFolder(filePath);
        return { success: true };
      } catch (error) {
        console.error('Failed to show file in folder:', error);
        return { success: false, error: error.message };
      }
    });

    // Check if file exists
    ipcMain.handle('file:exists', async (event, filePath) => {
      try {
        return await this.fileExists(filePath);
      } catch (error) {
        console.error('Failed to check file existence:', error);
        return false;
      }
    });
  }

  /**
   * Handle notification show (internal method)
   */
  async handleNotificationShow(event, options) {
    try {
      const { title, body, icon, id, type } = options;

      // Check if notifications are supported
      if (!Notification.isSupported()) {
        console.warn('Notifications are not supported on this system');
        return { success: false, error: 'Notifications not supported' };
      }

      // Load settings to check if notifications are enabled
      const settings = await this.loadSettings();
      
      // Check if notifications are globally disabled
      if (!settings.showDesktopNotifications) {
        return { success: false, error: 'Notifications disabled in settings' };
      }

      // Check type-specific notification settings
      if (type === 'download-complete' && !settings.notifyOnComplete) {
        return { success: false, error: 'Download completion notifications disabled' };
      }
      
      if (type === 'download-error' && !settings.notifyOnError) {
        return { success: false, error: 'Error notifications disabled' };
      }

      // Create notification
      const notification = new Notification({
        title: title || 'YouTube Downloader Pro',
        body: body || '',
        icon: icon || undefined,
        silent: false,
      });

      // Handle notification click
      notification.on('click', () => {
        // Restore and focus the main window
        if (this.applicationManager) {
          this.applicationManager.restoreWindow();
        }

        // Send event to renderer
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('notification:clicked', { id, type });
        }
      });

      // Show notification
      notification.show();

      return { success: true };
    } catch (error) {
      console.error('Failed to show notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register notification handlers
   */
  registerNotificationHandlers() {
    // Show notification
    ipcMain.handle('notification:show', async (event, options) => {
      return await this.handleNotificationShow(event, options);
    });

    // Show download completion notification
    ipcMain.handle('notification:download-complete', async (event, options) => {
      const { title, filename } = options;
      
      // Call the main notification handler
      return await this.handleNotificationShow(event, {
        title: title || 'Download Complete',
        body: `${filename} has been downloaded successfully`,
        type: 'download-complete',
        id: `download-complete-${Date.now()}`,
      });
    });

    // Show download error notification
    ipcMain.handle('notification:download-error', async (event, options) => {
      const { title, filename, error } = options;
      
      // Call the main notification handler
      return await this.handleNotificationShow(event, {
        title: title || 'Download Failed',
        body: `Failed to download ${filename}: ${error}`,
        type: 'download-error',
        id: `download-error-${Date.now()}`,
      });
    });
  }

  /**
   * Register dialog handlers
   */
  registerDialogHandlers() {
    // Show error dialog
    ipcMain.handle('dialog:show-error', async (event, options) => {
      try {
        const { title, message, detail } = options;

        await dialog.showMessageBox({
          type: 'error',
          title: title || 'Error',
          message: message || 'An error occurred',
          detail: detail || undefined,
          buttons: ['OK'],
        });

        return { success: true };
      } catch (error) {
        console.error('Failed to show error dialog:', error);
        return { success: false, error: error.message };
      }
    });

    // Show info dialog
    ipcMain.handle('dialog:show-info', async (event, options) => {
      try {
        const { title, message, detail } = options;

        await dialog.showMessageBox({
          type: 'info',
          title: title || 'Information',
          message: message || '',
          detail: detail || undefined,
          buttons: ['OK'],
        });

        return { success: true };
      } catch (error) {
        console.error('Failed to show info dialog:', error);
        return { success: false, error: error.message };
      }
    });

    // Show confirm dialog
    ipcMain.handle('dialog:show-confirm', async (event, options) => {
      try {
        const { title, message, detail, confirmLabel, cancelLabel } = options;

        const result = await dialog.showMessageBox({
          type: 'question',
          title: title || 'Confirm',
          message: message || 'Are you sure?',
          detail: detail || undefined,
          buttons: [confirmLabel || 'Confirm', cancelLabel || 'Cancel'],
          defaultId: 0,
          cancelId: 1,
        });

        return { success: true, confirmed: result.response === 0 };
      } catch (error) {
        console.error('Failed to show confirm dialog:', error);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Load settings (delegated to SettingsManager)
   */
  async loadSettings() {
    return await this.settingsManager.loadSettings();
  }

  /**
   * Register update handlers
   */
  registerUpdateHandlers() {
    // Check for updates
    ipcMain.handle('updater:check-for-updates', async () => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        const updateInfo = await this.autoUpdater.checkForUpdates();
        return { success: true, updateInfo };
      } catch (error) {
        console.error('Failed to check for updates:', error);
        return { success: false, error: error.message };
      }
    });

    // Download update
    ipcMain.handle('updater:download-update', async () => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        await this.autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error('Failed to download update:', error);
        return { success: false, error: error.message };
      }
    });

    // Install update
    ipcMain.handle('updater:install-update', async () => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        this.autoUpdater.installUpdate();
        return { success: true };
      } catch (error) {
        console.error('Failed to install update:', error);
        return { success: false, error: error.message };
      }
    });

    // Get update status
    ipcMain.handle('updater:get-status', () => {
      if (!this.autoUpdater) {
        return {
          checking: false,
          available: false,
          downloading: false,
          progress: 0,
          error: 'Auto-updater not available',
        };
      }

      return this.autoUpdater.getStatus();
    });

    // Set auto-check enabled
    ipcMain.handle('updater:set-auto-check', (event, enabled) => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        this.autoUpdater.setAutoCheck(enabled);
        return { success: true };
      } catch (error) {
        console.error('Failed to set auto-check:', error);
        return { success: false, error: error.message };
      }
    });

    // Set auto-download enabled
    ipcMain.handle('updater:set-auto-download', (event, enabled) => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        this.autoUpdater.setAutoDownload(enabled);
        return { success: true };
      } catch (error) {
        console.error('Failed to set auto-download:', error);
        return { success: false, error: error.message };
      }
    });

    // Get error history
    ipcMain.handle('updater:get-error-history', () => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        const history = this.autoUpdater.getErrorHistory();
        return { success: true, history };
      } catch (error) {
        console.error('Failed to get error history:', error);
        return { success: false, error: error.message };
      }
    });

    // Clear error history
    ipcMain.handle('updater:clear-error-history', () => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        this.autoUpdater.clearErrorHistory();
        return { success: true };
      } catch (error) {
        console.error('Failed to clear error history:', error);
        return { success: false, error: error.message };
      }
    });

    // Cancel retry
    ipcMain.handle('updater:cancel-retry', () => {
      try {
        if (!this.autoUpdater) {
          return { success: false, error: 'Auto-updater not available' };
        }

        this.autoUpdater.cancelRetry();
        return { success: true };
      } catch (error) {
        console.error('Failed to cancel retry:', error);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Check if file or folder exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

}

module.exports = IPCHandler;
