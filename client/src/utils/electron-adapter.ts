/**
 * Electron Adapter
 * Provides abstraction layer for Electron-specific features
 * Allows the app to work both in Electron and web environments
 */

// Type definitions for Electron API
interface AppPaths {
  app: string;
  userData: string;
  downloads: string;
  temp: string;
  logs: string;
  resources: string;
}

interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
}

interface BackendStatus {
  running: boolean;
  port: number;
  host: string;
  pid: number | null;
  uptime: number;
  url: string;
}

interface UserSettings {
  downloadPath: string;
  defaultQuality: string;
  defaultType: 'video' | 'audio';
  maxConcurrentDownloads: number;
  theme: 'light' | 'dark' | 'system';
  minimizeToTray: boolean;
  startOnBoot: boolean;
  closeToTray: boolean;
  autoCheckUpdates: boolean;
  autoDownloadUpdates: boolean;
  showDesktopNotifications: boolean;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  customYtdlpPath: string | null;
  customFfmpegPath: string | null;
  proxyUrl: string | null;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  id?: string;
  type?: 'download-complete' | 'download-error' | string;
}

interface DialogOptions {
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface FileOperationResult {
  success: boolean;
  error?: string;
}

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
}

/**
 * ElectronAdapter class
 * Provides methods to interact with Electron APIs
 * Falls back to web behavior when not in Electron environment
 */
class ElectronAdapter {
  private static instance: ElectronAdapter;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ElectronAdapter {
    if (!ElectronAdapter.instance) {
      ElectronAdapter.instance = new ElectronAdapter();
    }
    return ElectronAdapter.instance;
  }

  /**
   * Check if running in Electron environment
   */
  isElectron(): boolean {
    return typeof window !== 'undefined' && window.electron !== undefined;
  }

  /**
   * Get platform information
   */
  getPlatform(): string {
    if (this.isElectron()) {
      return window.electron!.platform;
    }
    return 'web';
  }

  /**
   * Check if running on Windows
   */
  isWindows(): boolean {
    return this.getPlatform() === 'win32';
  }

  /**
   * Check if running on macOS
   */
  isMacOS(): boolean {
    return this.getPlatform() === 'darwin';
  }

  /**
   * Check if running on Linux
   */
  isLinux(): boolean {
    return this.getPlatform() === 'linux';
  }

  // ==================== App Information ====================

  /**
   * Get application version
   */
  async getVersion(): Promise<string> {
    if (this.isElectron()) {
      return await window.electron!.getVersion();
    }
    return '1.0.0'; // Default version for web
  }

  /**
   * Get application paths
   */
  async getPaths(): Promise<AppPaths | null> {
    if (this.isElectron()) {
      return await window.electron!.getPaths();
    }
    return null;
  }

  /**
   * Get platform information
   */
  async getPlatformInfo(): Promise<PlatformInfo | null> {
    if (this.isElectron()) {
      return await window.electron!.getPlatform();
    }
    return null;
  }

  // ==================== Backend Management ====================

  /**
   * Get backend URL
   * Returns dynamic URL in Electron, environment variable in web
   */
  async getBackendUrl(): Promise<string> {
    if (this.isElectron()) {
      try {
        return await window.electron!.backend.getUrl();
      } catch (error) {
        console.error('Failed to get backend URL from Electron:', error);
        return 'http://localhost:3000'; // Fallback
      }
    }
    // Use environment variable for web version
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  /**
   * Get backend status
   */
  async getBackendStatus(): Promise<BackendStatus | null> {
    if (this.isElectron()) {
      try {
        return await window.electron!.backend.getStatus();
      } catch (error) {
        console.error('Failed to get backend status:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Restart backend server
   */
  async restartBackend(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.backend.restart();
        return result.success;
      } catch (error) {
        console.error('Failed to restart backend:', error);
        return false;
      }
    }
    return false;
  }

  // ==================== Settings Management ====================

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings | null> {
    if (this.isElectron()) {
      try {
        return await window.electron!.settings.get();
      } catch (error) {
        console.error('Failed to get settings:', error);
        return null;
      }
    }
    // For web, use localStorage
    try {
      const settings = localStorage.getItem('userSettings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Failed to get settings from localStorage:', error);
      return null;
    }
  }

  /**
   * Save user settings
   */
  async saveSettings(settings: Partial<UserSettings>): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.settings.set(settings);
        return result.success;
      } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
      }
    }
    // For web, use localStorage
    try {
      const currentSettings = await this.getSettings() || {};
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      return false;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.settings.reset();
        return result.success;
      } catch (error) {
        console.error('Failed to reset settings:', error);
        return false;
      }
    }
    // For web, clear localStorage
    try {
      localStorage.removeItem('userSettings');
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    }
  }

  // ==================== Window Management ====================

  /**
   * Minimize window
   */
  async minimizeWindow(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.window.minimize();
        return result.success;
      } catch (error) {
        console.error('Failed to minimize window:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Maximize/restore window
   */
  async maximizeWindow(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.window.maximize();
        return result.success;
      } catch (error) {
        console.error('Failed to maximize window:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Hide window
   */
  async hideWindow(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.window.hide();
        return result.success;
      } catch (error) {
        console.error('Failed to hide window:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Show window
   */
  async showWindow(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.window.show();
        return result.success;
      } catch (error) {
        console.error('Failed to show window:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Restore window from tray
   */
  async restoreWindow(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.window.restore();
        return result.success;
      } catch (error) {
        console.error('Failed to restore window:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Toggle fullscreen
   */
  async toggleFullscreen(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.window.toggleFullscreen();
        return result.success;
      } catch (error) {
        console.error('Failed to toggle fullscreen:', error);
        return false;
      }
    }
    // For web, use Fullscreen API
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      return false;
    }
  }

  // ==================== File Operations ====================

  /**
   * Select download folder
   */
  async selectDownloadFolder(): Promise<string | null> {
    if (this.isElectron()) {
      try {
        return await window.electron!.files.selectFolder();
      } catch (error) {
        console.error('Failed to select folder:', error);
        return null;
      }
    }
    // Web version doesn't support folder selection
    console.warn('Folder selection not supported in web version');
    return null;
  }

  /**
   * Open folder in file explorer
   */
  async openFolder(path: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.files.openFolder(path);
        return result.success;
      } catch (error) {
        console.error('Failed to open folder:', error);
        return false;
      }
    }
    console.warn('Opening folders not supported in web version');
    return false;
  }

  /**
   * Open file in default application
   */
  async openFile(path: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.files.openFile(path);
        return result.success;
      } catch (error) {
        console.error('Failed to open file:', error);
        return false;
      }
    }
    console.warn('Opening files not supported in web version');
    return false;
  }

  /**
   * Show file in folder (reveal in file explorer)
   */
  async showFileInFolder(path: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.files.showInFolder(path);
        return result.success;
      } catch (error) {
        console.error('Failed to show file in folder:', error);
        return false;
      }
    }
    console.warn('Showing files in folder not supported in web version');
    return false;
  }

  /**
   * Check if file exists
   */
  async fileExists(path: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        return await window.electron!.files.exists(path);
      } catch (error) {
        console.error('Failed to check file existence:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Open downloads folder
   */
  async openDownloadsFolder(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const paths = await this.getPaths();
        if (paths) {
          return await this.openFolder(paths.downloads);
        }
      } catch (error) {
        console.error('Failed to open downloads folder:', error);
      }
    }
    return false;
  }

  // ==================== Notifications ====================

  /**
   * Show desktop notification
   */
  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.notifications.show(options);
        return result.success;
      } catch (error) {
        console.error('Failed to show notification:', error);
        return false;
      }
    }
    // For web, use Web Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
        });
        return true;
      } catch (error) {
        console.error('Failed to show web notification:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Show download complete notification
   */
  async showDownloadCompleteNotification(filename: string, downloadPath?: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.notifications.showDownloadComplete({
          filename,
          downloadPath,
        });
        return result.success;
      } catch (error) {
        console.error('Failed to show download complete notification:', error);
        return false;
      }
    }
    // Fallback to generic notification
    return await this.showNotification({
      title: 'Download Complete',
      body: `${filename} has been downloaded successfully`,
    });
  }

  /**
   * Show download error notification
   */
  async showDownloadErrorNotification(filename: string, error: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.notifications.showDownloadError({
          filename,
          error,
        });
        return result.success;
      } catch (error) {
        console.error('Failed to show download error notification:', error);
        return false;
      }
    }
    // Fallback to generic notification
    return await this.showNotification({
      title: 'Download Failed',
      body: `Failed to download ${filename}: ${error}`,
    });
  }

  /**
   * Request notification permission (for web)
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isElectron() && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        return false;
      }
    }
    return true; // Electron doesn't need permission
  }

  /**
   * Register notification click handler
   */
  onNotificationClicked(callback: (data: { id?: string; type?: string }) => void): void {
    if (this.isElectron()) {
      window.electron!.notifications.onClicked(callback);
    }
  }

  // ==================== Dialogs ====================

  /**
   * Show error dialog
   */
  async showErrorDialog(message: string, title?: string, detail?: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.dialog.showError({
          title,
          message,
          detail,
        });
        return result.success;
      } catch (error) {
        console.error('Failed to show error dialog:', error);
        return false;
      }
    }
    // Fallback to browser alert
    alert(`${title || 'Error'}\n\n${message}${detail ? '\n\n' + detail : ''}`);
    return true;
  }

  /**
   * Show info dialog
   */
  async showInfoDialog(message: string, title?: string, detail?: string): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.dialog.showInfo({
          title,
          message,
          detail,
        });
        return result.success;
      } catch (error) {
        console.error('Failed to show info dialog:', error);
        return false;
      }
    }
    // Fallback to browser alert
    alert(`${title || 'Information'}\n\n${message}${detail ? '\n\n' + detail : ''}`);
    return true;
  }

  /**
   * Show confirm dialog
   */
  async showConfirmDialog(
    message: string,
    title?: string,
    detail?: string,
    confirmLabel?: string,
    cancelLabel?: string
  ): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.dialog.showConfirm({
          title,
          message,
          detail,
          confirmLabel,
          cancelLabel,
        });
        return result.confirmed || false;
      } catch (error) {
        console.error('Failed to show confirm dialog:', error);
        return false;
      }
    }
    // Fallback to browser confirm
    return confirm(`${title || 'Confirm'}\n\n${message}${detail ? '\n\n' + detail : ''}`);
  }

  // ==================== Updates ====================

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.updates.checkForUpdates();
        return result.updateInfo || null;
      } catch (error) {
        console.error('Failed to check for updates:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Download update
   */
  async downloadUpdate(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.updates.downloadUpdate();
        return result.success;
      } catch (error) {
        console.error('Failed to download update:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Install update
   */
  async installUpdate(): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const result = await window.electron!.updates.installUpdate();
        return result.success;
      } catch (error) {
        console.error('Failed to install update:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Register update progress handler
   */
  onUpdateProgress(callback: (progress: number) => void): void {
    if (this.isElectron()) {
      window.electron!.updates.onStatus((data: any) => {
        if (data.progress !== undefined) {
          callback(data.progress);
        }
      });
    }
  }

  // ==================== Menu Events ====================

  /**
   * Register settings menu handler
   */
  onOpenSettings(callback: () => void): void {
    if (this.isElectron()) {
      window.electron!.menu.onOpenSettings(callback);
    }
  }

  /**
   * Register theme toggle handler
   */
  onToggleTheme(callback: () => void): void {
    if (this.isElectron()) {
      window.electron!.menu.onToggleTheme(callback);
    }
  }

  /**
   * Register about dialog handler
   */
  onShowAbout(callback: () => void): void {
    if (this.isElectron()) {
      window.electron!.menu.onShowAbout(callback);
    }
  }

  // ==================== External Links ====================

  /**
   * Open external URL
   * In Electron, opens in default browser
   * In web, opens in new tab
   */
  openExternal(url: string): void {
    if (this.isElectron()) {
      // Electron will handle this via shell.openExternal in the main process
      // For now, we'll use window.open which will be intercepted
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

// Export singleton instance
export default ElectronAdapter.getInstance();
