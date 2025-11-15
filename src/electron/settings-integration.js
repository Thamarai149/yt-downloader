/**
 * Settings Integration
 * Applies settings to various application components
 */

const { app, nativeTheme } = require('electron');

class SettingsIntegration {
  constructor(applicationManager, backendManager, autoUpdater = null) {
    this.applicationManager = applicationManager;
    this.backendManager = backendManager;
    this.autoUpdater = autoUpdater;
    this.currentSettings = null;
  }

  /**
   * Apply all settings to the application
   * @param {Object} settings - User settings
   */
  async applySettings(settings) {
    this.currentSettings = settings;

    try {
      // Apply theme
      this.applyTheme(settings.theme);

      // Apply window behavior
      this.applyWindowBehavior(settings);

      // Apply start on boot
      await this.applyStartOnBoot(settings.startOnBoot);

      // Apply download path to backend
      if (settings.downloadPath && this.backendManager) {
        this.backendManager.updateDownloadPath(settings.downloadPath);
      }

      // Apply auto-update settings
      this.applyAutoUpdateSettings(settings);

      console.log('Settings applied successfully');
    } catch (error) {
      console.error('Error applying settings:', error);
    }
  }

  /**
   * Apply theme setting
   * @param {string} theme - Theme mode ('light', 'dark', 'system')
   */
  applyTheme(theme) {
    try {
      if (theme === 'system') {
        nativeTheme.themeSource = 'system';
      } else if (theme === 'dark') {
        nativeTheme.themeSource = 'dark';
      } else {
        nativeTheme.themeSource = 'light';
      }

      console.log(`Theme set to: ${theme}`);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }

  /**
   * Apply window behavior settings
   * @param {Object} settings - User settings
   */
  applyWindowBehavior(settings) {
    try {
      if (this.applicationManager) {
        // Apply close to tray setting
        if (typeof settings.closeToTray === 'boolean') {
          this.applicationManager.setCloseToTray(settings.closeToTray);
        }

        // Apply minimize to tray setting
        if (typeof settings.minimizeToTray === 'boolean') {
          // Can be used for future enhancements
        }
      }
    } catch (error) {
      console.error('Error applying window behavior:', error);
    }
  }

  /**
   * Apply start on boot setting
   * @param {boolean} enabled - Whether to start on boot
   */
  async applyStartOnBoot(enabled) {
    try {
      const loginSettings = {
        openAtLogin: enabled,
        openAsHidden: false,
      };

      app.setLoginItemSettings(loginSettings);

      console.log(`Start on boot: ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error setting start on boot:', error);
    }
  }

  /**
   * Get current theme from system
   * @returns {string} Current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  }

  /**
   * Apply auto-update settings
   * @param {Object} settings - User settings
   */
  applyAutoUpdateSettings(settings) {
    try {
      if (this.autoUpdater) {
        // Apply auto-check updates setting
        if (typeof settings.autoCheckUpdates === 'boolean') {
          this.autoUpdater.setAutoCheck(settings.autoCheckUpdates);
        }

        // Apply auto-download updates setting
        if (typeof settings.autoDownloadUpdates === 'boolean') {
          this.autoUpdater.setAutoDownload(settings.autoDownloadUpdates);
        }

        console.log('Auto-update settings applied');
      }
    } catch (error) {
      console.error('Error applying auto-update settings:', error);
    }
  }

  /**
   * Listen for system theme changes
   * @param {Function} callback - Callback function
   */
  onThemeChange(callback) {
    nativeTheme.on('updated', () => {
      callback(this.getCurrentTheme());
    });
  }
}

module.exports = SettingsIntegration;
