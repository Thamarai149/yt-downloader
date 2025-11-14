/**
 * Type definitions for Electron API exposed to renderer process
 */

export interface AppPaths {
  app: string;
  userData: string;
  downloads: string;
  temp: string;
  logs: string;
  resources: string;
}

export interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
}

export interface BackendStatus {
  running: boolean;
  port: number;
  host: string;
  pid: number | null;
  uptime: number;
  url: string;
}

export interface UserSettings {
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

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  onClick?: boolean;
  id?: string;
}

export interface DialogOptions {
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
}

export interface ElectronAPI {
  platform: NodeJS.Platform;
  
  getVersion(): Promise<string>;
  getPaths(): Promise<AppPaths>;
  getPlatform(): Promise<PlatformInfo>;
  
  backend: {
    getUrl(): Promise<string>;
    getStatus(): Promise<BackendStatus>;
    restart(): Promise<{ success: boolean; error?: string }>;
  };
  
  settings: {
    get(): Promise<UserSettings>;
    set(settings: Partial<UserSettings>): Promise<UserSettings>;
    reset(): Promise<UserSettings>;
  };
  
  files: {
    selectFolder(): Promise<string | null>;
    openFolder(path: string): Promise<FileOperationResult>;
    openFile(path: string): Promise<FileOperationResult>;
    showInFolder(path: string): Promise<FileOperationResult>;
    exists(path: string): Promise<boolean>;
  };
  
  notifications: {
    show(options: NotificationOptions): Promise<FileOperationResult>;
    onClicked(callback: (id: string) => void): void;
  };
  
  dialog: {
    showError(options: DialogOptions): Promise<number>;
    showInfo(options: DialogOptions): Promise<number>;
    showConfirm(options: DialogOptions): Promise<boolean>;
  };
  
  updates: {
    check(): Promise<UpdateInfo | null>;
    download(): Promise<void>;
    install(): void;
    onProgress(callback: (progress: number) => void): void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
