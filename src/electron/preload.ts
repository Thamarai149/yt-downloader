/**
 * Electron Preload Script
 * Provides secure bridge between renderer and main process
 * 
 * Security Best Practices:
 * - contextIsolation: true (enabled in main.js)
 * - nodeIntegration: false (disabled in main.js)
 * - Only expose necessary APIs via contextBridge
 * - No direct access to Node.js APIs from renderer
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Type definitions for the exposed API
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

interface NotificationClickData {
  id?: string;
  type?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Platform information (synchronous, safe to expose)
  platform: process.platform,
  
  // App information
  getVersion: (): Promise<string> => 
    ipcRenderer.invoke('app:get-version'),
  
  getPaths: (): Promise<AppPaths> => 
    ipcRenderer.invoke('app:get-paths'),
  
  getPlatform: (): Promise<PlatformInfo> => 
    ipcRenderer.invoke('app:get-platform'),
  
  // Backend management
  backend: {
    getUrl: (): Promise<string> => 
      ipcRenderer.invoke('backend:get-url'),
    
    getStatus: (): Promise<BackendStatus> => 
      ipcRenderer.invoke('backend:get-status'),
    
    restart: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('backend:restart'),
  },
  
  // Settings management
  settings: {
    get: (): Promise<UserSettings> => 
      ipcRenderer.invoke('settings:get'),
    
    set: (settings: Partial<UserSettings>): Promise<{ success: boolean; settings?: UserSettings; error?: string }> => 
      ipcRenderer.invoke('settings:set', settings),
    
    reset: (): Promise<{ success: boolean; settings?: UserSettings; error?: string }> => 
      ipcRenderer.invoke('settings:reset'),
  },
  
  // Window management
  window: {
    minimize: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('window:minimize'),
    
    maximize: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('window:maximize'),
    
    hide: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('window:hide'),
    
    show: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('window:show'),
    
    restore: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('window:restore'),
    
    toggleFullscreen: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('window:toggle-fullscreen'),
  },
  
  // File operations
  files: {
    selectFolder: (): Promise<string | null> => 
      ipcRenderer.invoke('download:select-folder'),
    
    openFolder: (path: string): Promise<FileOperationResult> => 
      ipcRenderer.invoke('file:open-folder', path),
    
    openFile: (path: string): Promise<FileOperationResult> => 
      ipcRenderer.invoke('file:open-file', path),
    
    showInFolder: (path: string): Promise<FileOperationResult> => 
      ipcRenderer.invoke('file:show-in-folder', path),
    
    exists: (path: string): Promise<boolean> => 
      ipcRenderer.invoke('file:exists', path),
  },
  
  // Notifications
  notifications: {
    show: (options: NotificationOptions): Promise<FileOperationResult> => 
      ipcRenderer.invoke('notification:show', options),
    
    showDownloadComplete: (options: { title?: string; filename: string; downloadPath?: string }): Promise<FileOperationResult> => 
      ipcRenderer.invoke('notification:download-complete', options),
    
    showDownloadError: (options: { title?: string; filename: string; error: string }): Promise<FileOperationResult> => 
      ipcRenderer.invoke('notification:download-error', options),
    
    onClicked: (callback: (data: NotificationClickData) => void): void => {
      ipcRenderer.on('notification:clicked', (_event: IpcRendererEvent, data: NotificationClickData) => callback(data));
    },
  },
  
  // Dialog operations
  dialog: {
    showError: (options: DialogOptions): Promise<FileOperationResult> => 
      ipcRenderer.invoke('dialog:show-error', options),
    
    showInfo: (options: DialogOptions): Promise<FileOperationResult> => 
      ipcRenderer.invoke('dialog:show-info', options),
    
    showConfirm: (options: DialogOptions): Promise<{ success: boolean; confirmed?: boolean; error?: string }> => 
      ipcRenderer.invoke('dialog:show-confirm', options),
  },
  
  // Updates
  updates: {
    check: (): Promise<UpdateInfo | null> => 
      ipcRenderer.invoke('update:check'),
    
    download: (): Promise<void> => 
      ipcRenderer.invoke('update:download'),
    
    install: (): void => {
      ipcRenderer.invoke('update:install');
    },
    
    onProgress: (callback: (progress: number) => void): void => {
      ipcRenderer.on('update:progress', (_event: IpcRendererEvent, progress: number) => callback(progress));
    },
  },
  
  // Menu events
  menu: {
    onOpenSettings: (callback: () => void): void => {
      ipcRenderer.on('menu:open-settings', () => callback());
    },
    
    onToggleTheme: (callback: () => void): void => {
      ipcRenderer.on('menu:toggle-theme', () => callback());
    },
    
    onShowAbout: (callback: () => void): void => {
      ipcRenderer.on('menu:show-about', () => callback());
    },
  },
});
