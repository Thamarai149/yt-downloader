/**
 * Settings Manager
 * Handles settings storage, validation, and migration
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class SettingsManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.settingsPath = path.join(this.userDataPath, 'settings.json');
    this.currentVersion = 1; // Settings schema version
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      version: this.currentVersion,
      
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
      
      // Check if migration is needed
      if (!settings.version || settings.version < this.currentVersion) {
        console.log(`Migrating settings from version ${settings.version || 0} to ${this.currentVersion}`);
        const migratedSettings = await this.migrateSettings(settings);
        await this.saveSettings(migratedSettings);
        return migratedSettings;
      }
      
      // Merge with defaults to ensure all keys exist
      return { ...this.getDefaultSettings(), ...settings };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Settings file doesn't exist, create it with defaults
        const defaults = this.getDefaultSettings();
        await this.saveSettings(defaults);
        return defaults;
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

      // Ensure version is set
      validatedSettings.version = this.currentVersion;

      // Write settings to file
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(validatedSettings, null, 2),
        'utf8'
      );

      console.log('Settings saved successfully');
      return validatedSettings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Update settings (partial update)
   */
  async updateSettings(partialSettings) {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, ...partialSettings };
      return await this.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    try {
      const defaults = this.getDefaultSettings();
      await this.saveSettings(defaults);
      return defaults;
    } catch (error) {
      console.error('Failed to reset settings:', error);
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
      validated.downloadPath = this.getDefaultSettings().downloadPath;
    }

    // Validate quality
    const validQualities = ['highest', 'high', 'medium', 'low', 'best', '4k', '2k', '1080', '720', '480', '360', '240'];
    if (!validQualities.includes(validated.defaultQuality)) {
      validated.defaultQuality = this.getDefaultSettings().defaultQuality;
    }

    // Validate type
    const validTypes = ['video', 'audio'];
    if (!validTypes.includes(validated.defaultType)) {
      validated.defaultType = this.getDefaultSettings().defaultType;
    }

    // Validate concurrent downloads
    if (typeof validated.maxConcurrentDownloads !== 'number' ||
        validated.maxConcurrentDownloads < 1 ||
        validated.maxConcurrentDownloads > 10) {
      validated.maxConcurrentDownloads = this.getDefaultSettings().maxConcurrentDownloads;
    }

    // Validate theme
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(validated.theme)) {
      validated.theme = this.getDefaultSettings().theme;
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
        validated[key] = this.getDefaultSettings()[key];
      }
    });

    // Validate custom paths (can be null or string)
    const pathSettings = ['customYtdlpPath', 'customFfmpegPath', 'proxyUrl'];
    pathSettings.forEach(key => {
      if (validated[key] !== null && typeof validated[key] !== 'string') {
        validated[key] = null;
      }
    });

    return validated;
  }

  /**
   * Migrate settings from older versions
   */
  async migrateSettings(oldSettings) {
    const defaults = this.getDefaultSettings();
    let migratedSettings = { ...defaults, ...oldSettings };

    // Version 0 to 1 migration
    if (!oldSettings.version || oldSettings.version < 1) {
      // Add any new settings that didn't exist in version 0
      // For now, just merge with defaults
      console.log('Migrating from version 0 to 1');
    }

    // Future migrations can be added here
    // if (oldSettings.version < 2) {
    //   // Version 1 to 2 migration
    // }

    migratedSettings.version = this.currentVersion;
    return migratedSettings;
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
   * Validate download path exists and is writable
   */
  async validateDownloadPath(downloadPath) {
    try {
      // Check if path exists
      const exists = await this.fileExists(downloadPath);
      
      if (!exists) {
        // Try to create the directory
        await fs.mkdir(downloadPath, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(downloadPath, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: `Cannot write to download path: ${error.message}` 
      };
    }
  }

  /**
   * Get settings file path
   */
  getSettingsPath() {
    return this.settingsPath;
  }

  /**
   * Export settings to JSON string
   */
  async exportSettings() {
    try {
      const settings = await this.loadSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON string
   */
  async importSettings(jsonString) {
    try {
      const settings = JSON.parse(jsonString);
      const validatedSettings = this.validateSettings(settings);
      await this.saveSettings(validatedSettings);
      return validatedSettings;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }
}

module.exports = SettingsManager;
