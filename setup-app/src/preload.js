const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  startBackend: () => ipcRenderer.invoke('start-backend'),
  stopBackend: () => ipcRenderer.invoke('stop-backend'),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  installDependencies: () => ipcRenderer.invoke('install-dependencies'),
  
  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getVersionInfo: () => ipcRenderer.invoke('get-version-info'),
  getChangelog: (version) => ipcRenderer.invoke('get-changelog', version),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Download progress handling
  setupDownloadListener: () => ipcRenderer.invoke('setup-download-listener'),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  
  // Auto-updater event listeners
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, data) => callback(data));
  },
  
  // Event listeners
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (event, data) => callback(data));
  },
  onBackendLog: (callback) => {
    ipcRenderer.on('backend-log', (event, data) => callback(data));
  },
  onInstallProgress: (callback) => {
    ipcRenderer.on('install-progress', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});