/**
 * IPC Handler
 * Manages Inter-Process Communication between main and renderer processes
 */

const { ipcMain, dialog, shell, app, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class IPCHandler {
  constructor(backendManager, applicationManager = null) {
    this.backendManager = backendManager;
    this.applicationManager = applicationManager;
    this.userDataPath = app.getPath('userData');
    this.settingsPath = path.join(this.userDataPath, 'settings.json');
    this.defaultSettings = this.getDefaultSettings();
  }

  /**
   * Set application manager (called after initialization)
   */
  setApplicationManager(applicationManager) {
    this.applicationManager = applicationManager;
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
  }

  /**
   * Register settings management handlers
   */
  registerSettingsHandlers() {
    // Get settings
    ipcMain.handle('settings:get', async () => {
      try {
        return await this.loadSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        return this.defaultSettings;
      }
    });

    // Set settings
    ipcMain.handle('settings:set', async (event, settings) => {
      try {
        const currentSettings = await this.loadSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        await this.saveSettings(updatedSettings);
        
        // Apply settings to application manager
        this.applySettings(updatedSettings);
        
        return { success: true, settings: updatedSettings };
      } catch (error) {
        console.error('Failed to save settings:', error);
        return { success: false, error: error.message };
      }
    });

    // Reset settings
    ipcMain.handle('settings:reset', async () => {
      try {
        await this.saveSettings(this.defaultSettings);
        return { success: true, settings: this.defaultSettings };
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
   * Get default settings
   */
  getDefaultSettings() {
    return {
      // Download preferences
      downloadPath: path.join(app.getPath('downloads'), 'YT-Downloads'),
      defaultQuality: 'highest',
      defaultType: 'video',
      maxConcurrentDownloads: 3,

      // Application preferences
      theme: 'system',
      minimizeToTray: true,
      startOnBoot: false,
      closeToTray: true,

      // Update preferences
      autoCheckUpdates: true,
      autoDownloadUpdates: false,

      // Notification preferences
      showDesktopNotifications: true,
      notifyOnComplete: true,
      notifyOnError: true,

      // Advanced
      customYtdlpPath: null,
      customFfmpegPath: null,
      proxyUrl: null,
    };
  }

  /**
   * Load settings from file
   */
  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');
      const settings = JSON.parse(data);
      
      // Merge with defaults to ensure all keys exist
      return { ...this.defaultSettings, ...settings };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Settings file doesn't exist, create it with defaults
        await this.saveSettings(this.defaultSettings);
        return this.defaultSettings;
      }
      throw error;
    }
  }

  /**
   * Save settings to file
   */
  async saveSettings(settings) {
    try {
      // Ensure user data directory exists
      await fs.mkdir(this.userDataPath, { recursive: true });

      // Validate settings before saving
      const validatedSettings = this.validateSettings(settings);

      // Write settings to file
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(validatedSettings, null, 2),
        'utf8'
      );

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings
   */
  validateSettings(settings) {
    const validated = { ...settings };

    // Validate download path
    if (validated.downloadPath && typeof validated.downloadPath !== 'string') {
      validated.downloadPath = this.defaultSettings.downloadPath;
    }

    // Validate quality
    const validQualities = ['highest', 'high', 'medium', 'low'];
    if (!validQualities.includes(validated.defaultQuality)) {
      validated.defaultQuality = this.defaultSettings.defaultQuality;
    }

    // Validate type
    const validTypes = ['video', 'audio'];
    if (!validTypes.includes(validated.defaultType)) {
      validated.defaultType = this.defaultSettings.defaultType;
    }

    // Validate concurrent downloads
    if (typeof validated.maxConcurrentDownloads !== 'number' ||
        validated.maxConcurrentDownloads < 1 ||
        validated.maxConcurrentDownloads > 10) {
      validated.maxConcurrentDownloads = this.defaultSettings.maxConcurrentDownloads;
    }

    // Validate theme
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(validated.theme)) {
      validated.theme = this.defaultSettings.theme;
    }

    // Validate boolean settings
    const booleanSettings = [
      'minimizeToTray',
      'startOnBoot',
      'closeToTray',
      'autoCheckUpdates',
      'autoDownloadUpdates',
      'showDesktopNotifications',
      'notifyOnComplete',
      'notifyOnError',
    ];

    booleanSettings.forEach(key => {
      if (typeof validated[key] !== 'boolean') {
        validated[key] = this.defaultSettings[key];
      }
    });

    return validated;
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

  /**
   * Apply settings to application components
   */
  applySettings(settings) {
    if (!this.applicationManager) {
      return;
    }

    // Apply close to tray setting
    if (typeof settings.closeToTray === 'boolean') {
      this.applicationManager.setCloseToTray(settings.closeToTray);
    }

    // Apply minimize to tray setting
    if (typeof settings.minimizeToTray === 'boolean') {
      // This can be used for future enhancements
      // For now, closeToTray handles the main behavior
    }

    console.log('Settings applied to application manager');
  }
}

module.exports = IPCHandler;
