/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API Types
// These types match the API exposed in src/electron/preload.ts

/**
 * Application paths provided by Electron
 */
interface AppPaths {
  app: string;           // Application installation directory
  userData: string;      // User data directory (settings, logs)
  downloads: string;     // Default downloads directory
  temp: string;          // Temporary files directory
  logs: string;          // Application logs directory
  resources: string;     // Bundled resources (binaries)
}

/**
 * Platform information
 */
interface PlatformInfo {
  platform: string;      // Operating system platform
  arch: string;          // CPU architecture
  version: string;       // OS version
}

/**
 * Backend server status
 */
interface BackendStatus {
  running: boolean;      // Whether server is running
  port: number;          // Server port number
  host: string;          // Server host
  pid: number | null;    // Process ID
  uptime: number;        // Server uptime in seconds
  url: string;           // Full server URL
}

/**
 * User settings/preferences
 */
interface UserSettings {
  // Download preferences
  downloadPath: string;
  defaultQuality: string;
  defaultType: 'video' | 'audio';
  maxConcurrentDownloads: number;
  
  // Application preferences
  theme: 'light' | 'dark' | 'system';
  minimizeToTray: boolean;
  startOnBoot: boolean;
  closeToTray: boolean;
  
  // Update preferences
  autoCheckUpdates: boolean;
  autoDownloadUpdates: boolean;
  
  // Notification preferences
  showDesktopNotifications: boolean;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  
  // Advanced settings
  customYtdlpPath: string | null;
  customFfmpegPath: string | null;
  proxyUrl: string | null;
}

/**
 * Notification options
 */
interface ElectronNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  id?: string;
  type?: 'download-complete' | 'download-error' | string;
}

/**
 * Notification click event data
 */
interface NotificationClickData {
  id?: string;
  type?: string;
}

/**
 * Dialog options
 */
interface DialogOptions {
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * File operation result
 */
interface FileOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Update information
 */
interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
}

/**
 * Electron API exposed to renderer process via contextBridge
 * This provides a secure bridge between the renderer and main process
 * 
 * Security features:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - Only safe, validated APIs are exposed
 */
interface ElectronAPI {
  /**
   * Current platform (win32, darwin, linux)
   */
  platform: string;
  
  /**
   * Get application version
   */
  getVersion: () => Promise<string>;
  
  /**
   * Get application paths
   */
  getPaths: () => Promise<AppPaths>;
  
  /**
   * Get platform information
   */
  getPlatform: () => Promise<PlatformInfo>;
  
  /**
   * Backend server management
   */
  backend: {
    /**
     * Get backend server URL
     */
    getUrl: () => Promise<string>;
    
    /**
     * Get backend server status
     */
    getStatus: () => Promise<BackendStatus>;
    
    /**
     * Restart backend server
     */
    restart: () => Promise<{ success: boolean; error?: string }>;
  };
  
  /**
   * Settings management
   */
  settings: {
    /**
     * Get current settings
     */
    get: () => Promise<UserSettings>;
    
    /**
     * Update settings (partial update supported)
     */
    set: (settings: Partial<UserSettings>) => Promise<{ success: boolean; settings?: UserSettings; error?: string }>;
    
    /**
     * Reset settings to defaults
     */
    reset: () => Promise<{ success: boolean; settings?: UserSettings; error?: string }>;
  };
  
  /**
   * Window management
   */
  window: {
    /**
     * Minimize window
     */
    minimize: () => Promise<{ success: boolean; error?: string }>;
    
    /**
     * Maximize/unmaximize window
     */
    maximize: () => Promise<{ success: boolean; error?: string }>;
    
    /**
     * Hide window
     */
    hide: () => Promise<{ success: boolean; error?: string }>;
    
    /**
     * Show window
     */
    show: () => Promise<{ success: boolean; error?: string }>;
    
    /**
     * Restore window from minimized state
     */
    restore: () => Promise<{ success: boolean; error?: string }>;
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen: () => Promise<{ success: boolean; error?: string }>;
  };
  
  /**
   * File system operations
   */
  files: {
    /**
     * Open native folder picker dialog
     * @returns Selected folder path or null if cancelled
     */
    selectFolder: () => Promise<string | null>;
    
    /**
     * Open folder in system file explorer
     */
    openFolder: (path: string) => Promise<FileOperationResult>;
    
    /**
     * Open file with default application
     */
    openFile: (path: string) => Promise<FileOperationResult>;
    
    /**
     * Show file in folder (reveal in file explorer)
     */
    showInFolder: (path: string) => Promise<FileOperationResult>;
    
    /**
     * Check if file or folder exists
     */
    exists: (path: string) => Promise<boolean>;
  };
  
  /**
   * Native notifications
   */
  notifications: {
    /**
     * Show a native notification
     */
    show: (options: ElectronNotificationOptions) => Promise<FileOperationResult>;
    
    /**
     * Show download complete notification
     */
    showDownloadComplete: (options: { 
      title?: string; 
      filename: string; 
      downloadPath?: string 
    }) => Promise<FileOperationResult>;
    
    /**
     * Show download error notification
     */
    showDownloadError: (options: { 
      title?: string; 
      filename: string; 
      error: string 
    }) => Promise<FileOperationResult>;
    
    /**
     * Register callback for notification clicks
     */
    onClicked: (callback: (data: NotificationClickData) => void) => void;
  };
  
  /**
   * Native dialogs
   */
  dialog: {
    /**
     * Show error dialog
     */
    showError: (options: DialogOptions) => Promise<FileOperationResult>;
    
    /**
     * Show info dialog
     */
    showInfo: (options: DialogOptions) => Promise<FileOperationResult>;
    
    /**
     * Show confirmation dialog
     * @returns Object with confirmed boolean indicating user choice
     */
    showConfirm: (options: DialogOptions) => Promise<{ 
      success: boolean; 
      confirmed?: boolean; 
      error?: string 
    }>;
  };
  
  /**
   * Application updates
   */
  updates: {
    /**
     * Check for available updates
     * @returns Update info if available, null otherwise
     */
    check: () => Promise<UpdateInfo | null>;
    
    /**
     * Download available update
     */
    download: () => Promise<void>;
    
    /**
     * Install downloaded update and restart application
     */
    install: () => void;
    
    /**
     * Register callback for update download progress
     * @param callback Function receiving progress percentage (0-100)
     */
    onProgress: (callback: (progress: number) => void) => void;
  };
  
  /**
   * Application menu events
   */
  menu: {
    /**
     * Register callback for "Open Settings" menu action
     */
    onOpenSettings: (callback: () => void) => void;
    
    /**
     * Register callback for "Toggle Theme" menu action
     */
    onToggleTheme: (callback: () => void) => void;
    
    /**
     * Register callback for "Show About" menu action
     */
    onShowAbout: (callback: () => void) => void;
  };
}

/**
 * Extend Window interface to include Electron API
 * The API is optional as it's only available in Electron environment
 */
interface Window {
  electron?: ElectronAPI;
}
