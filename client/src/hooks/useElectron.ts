/**
 * React hooks for Electron features
 * Provides easy-to-use hooks for React components
 */

import { useState, useEffect, useCallback } from 'react';
import electronAdapter from '../utils/electron-adapter';

/**
 * Hook to check if running in Electron
 */
export function useIsElectron(): boolean {
  return electronAdapter.isElectron();
}

/**
 * Hook to get platform information
 */
export function usePlatform() {
  const [platform, setPlatform] = useState<string>('web');
  const [platformInfo, setPlatformInfo] = useState<any>(null);

  useEffect(() => {
    setPlatform(electronAdapter.getPlatform());
    
    if (electronAdapter.isElectron()) {
      electronAdapter.getPlatformInfo().then(info => {
        setPlatformInfo(info);
      });
    }
  }, []);

  return {
    platform,
    platformInfo,
    isElectron: electronAdapter.isElectron(),
    isWindows: electronAdapter.isWindows(),
    isMacOS: electronAdapter.isMacOS(),
    isLinux: electronAdapter.isLinux(),
  };
}

/**
 * Hook to get backend URL
 */
export function useBackendUrl() {
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:3000');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    electronAdapter.getBackendUrl().then(url => {
      setBackendUrl(url);
      setLoading(false);
    });
  }, []);

  return { backendUrl, loading };
}

/**
 * Hook to manage user settings
 */
export function useSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSettings = await electronAdapter.getSettings();
      setSettings(loadedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: any) => {
    try {
      setError(null);
      const success = await electronAdapter.saveSettings(newSettings);
      if (success) {
        setSettings({ ...settings, ...newSettings });
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      return false;
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      setError(null);
      const success = await electronAdapter.resetSettings();
      if (success) {
        await loadSettings();
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      return false;
    }
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    resetSettings,
    reloadSettings: loadSettings,
  };
}

/**
 * Hook for window management
 */
export function useWindowControls() {
  const minimize = useCallback(async () => {
    return await electronAdapter.minimizeWindow();
  }, []);

  const maximize = useCallback(async () => {
    return await electronAdapter.maximizeWindow();
  }, []);

  const hide = useCallback(async () => {
    return await electronAdapter.hideWindow();
  }, []);

  const show = useCallback(async () => {
    return await electronAdapter.showWindow();
  }, []);

  const restore = useCallback(async () => {
    return await electronAdapter.restoreWindow();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    return await electronAdapter.toggleFullscreen();
  }, []);

  return {
    minimize,
    maximize,
    hide,
    show,
    restore,
    toggleFullscreen,
  };
}

/**
 * Hook for file operations
 */
export function useFileOperations() {
  const selectFolder = useCallback(async () => {
    return await electronAdapter.selectDownloadFolder();
  }, []);

  const openFolder = useCallback(async (path: string) => {
    return await electronAdapter.openFolder(path);
  }, []);

  const openFile = useCallback(async (path: string) => {
    return await electronAdapter.openFile(path);
  }, []);

  const showInFolder = useCallback(async (path: string) => {
    return await electronAdapter.showFileInFolder(path);
  }, []);

  const fileExists = useCallback(async (path: string) => {
    return await electronAdapter.fileExists(path);
  }, []);

  const openDownloadsFolder = useCallback(async () => {
    return await electronAdapter.openDownloadsFolder();
  }, []);

  return {
    selectFolder,
    openFolder,
    openFile,
    showInFolder,
    fileExists,
    openDownloadsFolder,
  };
}

/**
 * Hook for notifications
 */
export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  useEffect(() => {
    // Request permission on mount (for web)
    electronAdapter.requestNotificationPermission().then(granted => {
      setPermissionGranted(granted);
    });
  }, []);

  const showNotification = useCallback(async (title: string, body: string, icon?: string) => {
    return await electronAdapter.showNotification({ title, body, icon });
  }, []);

  const showDownloadComplete = useCallback(async (filename: string, downloadPath?: string) => {
    return await electronAdapter.showDownloadCompleteNotification(filename, downloadPath);
  }, []);

  const showDownloadError = useCallback(async (filename: string, error: string) => {
    return await electronAdapter.showDownloadErrorNotification(filename, error);
  }, []);

  const onNotificationClicked = useCallback((callback: (data: any) => void) => {
    electronAdapter.onNotificationClicked(callback);
  }, []);

  return {
    permissionGranted,
    showNotification,
    showDownloadComplete,
    showDownloadError,
    onNotificationClicked,
  };
}

/**
 * Hook for dialogs
 */
export function useDialogs() {
  const showError = useCallback(async (message: string, title?: string, detail?: string) => {
    return await electronAdapter.showErrorDialog(message, title, detail);
  }, []);

  const showInfo = useCallback(async (message: string, title?: string, detail?: string) => {
    return await electronAdapter.showInfoDialog(message, title, detail);
  }, []);

  const showConfirm = useCallback(async (
    message: string,
    title?: string,
    detail?: string,
    confirmLabel?: string,
    cancelLabel?: string
  ) => {
    return await electronAdapter.showConfirmDialog(message, title, detail, confirmLabel, cancelLabel);
  }, []);

  return {
    showError,
    showInfo,
    showConfirm,
  };
}

/**
 * Hook for updates
 */
export function useUpdates() {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const checkForUpdates = useCallback(async () => {
    if (!electronAdapter.isElectron()) return null;
    
    try {
      setChecking(true);
      const info = await electronAdapter.checkForUpdates();
      setUpdateInfo(info);
      return info;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!electronAdapter.isElectron()) return false;
    
    try {
      setDownloading(true);
      const success = await electronAdapter.downloadUpdate();
      return success;
    } catch (error) {
      console.error('Failed to download update:', error);
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  const installUpdate = useCallback(() => {
    if (!electronAdapter.isElectron()) return;
    electronAdapter.installUpdate();
  }, []);

  useEffect(() => {
    if (!electronAdapter.isElectron()) return;
    
    // Register progress handler
    electronAdapter.onUpdateProgress((progress) => {
      setDownloadProgress(progress);
    });
  }, []);

  return {
    updateInfo,
    checking,
    downloading,
    downloadProgress,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
}

/**
 * Hook for menu events
 */
export function useMenuEvents(
  onOpenSettings?: () => void,
  onToggleTheme?: () => void,
  onShowAbout?: () => void
) {
  useEffect(() => {
    if (!electronAdapter.isElectron()) return;

    if (onOpenSettings) {
      electronAdapter.onOpenSettings(onOpenSettings);
    }

    if (onToggleTheme) {
      electronAdapter.onToggleTheme(onToggleTheme);
    }

    if (onShowAbout) {
      electronAdapter.onShowAbout(onShowAbout);
    }
  }, [onOpenSettings, onToggleTheme, onShowAbout]);
}

/**
 * Hook to get app version
 */
export function useAppVersion() {
  const [version, setVersion] = useState<string>('1.0.0');

  useEffect(() => {
    electronAdapter.getVersion().then(v => {
      setVersion(v);
    });
  }, []);

  return version;
}
