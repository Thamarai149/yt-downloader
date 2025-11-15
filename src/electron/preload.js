"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electron', {
    // Platform information (synchronous, safe to expose)
    platform: process.platform,
    // App information
    getVersion: () => electron_1.ipcRenderer.invoke('app:get-version'),
    getPaths: () => electron_1.ipcRenderer.invoke('app:get-paths'),
    getPlatform: () => electron_1.ipcRenderer.invoke('app:get-platform'),
    // Backend management
    backend: {
        getUrl: () => electron_1.ipcRenderer.invoke('backend:get-url'),
        getStatus: () => electron_1.ipcRenderer.invoke('backend:get-status'),
        restart: () => electron_1.ipcRenderer.invoke('backend:restart'),
    },
    // Settings management
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        set: (settings) => electron_1.ipcRenderer.invoke('settings:set', settings),
        reset: () => electron_1.ipcRenderer.invoke('settings:reset'),
    },
    // Window management
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
        hide: () => electron_1.ipcRenderer.invoke('window:hide'),
        show: () => electron_1.ipcRenderer.invoke('window:show'),
        restore: () => electron_1.ipcRenderer.invoke('window:restore'),
        toggleFullscreen: () => electron_1.ipcRenderer.invoke('window:toggle-fullscreen'),
    },
    // File operations
    files: {
        selectFolder: () => electron_1.ipcRenderer.invoke('download:select-folder'),
        openFolder: (path) => electron_1.ipcRenderer.invoke('file:open-folder', path),
        openFile: (path) => electron_1.ipcRenderer.invoke('file:open-file', path),
        showInFolder: (path) => electron_1.ipcRenderer.invoke('file:show-in-folder', path),
        exists: (path) => electron_1.ipcRenderer.invoke('file:exists', path),
    },
    // Notifications
    notifications: {
        show: (options) => electron_1.ipcRenderer.invoke('notification:show', options),
        showDownloadComplete: (options) => electron_1.ipcRenderer.invoke('notification:download-complete', options),
        showDownloadError: (options) => electron_1.ipcRenderer.invoke('notification:download-error', options),
        onClicked: (callback) => {
            electron_1.ipcRenderer.on('notification:clicked', (_event, data) => callback(data));
        },
    },
    // Dialog operations
    dialog: {
        showError: (options) => electron_1.ipcRenderer.invoke('dialog:show-error', options),
        showInfo: (options) => electron_1.ipcRenderer.invoke('dialog:show-info', options),
        showConfirm: (options) => electron_1.ipcRenderer.invoke('dialog:show-confirm', options),
    },
    // Updates
    updates: {
        checkForUpdates: () => electron_1.ipcRenderer.invoke('updater:check-for-updates'),
        downloadUpdate: () => electron_1.ipcRenderer.invoke('updater:download-update'),
        installUpdate: () => electron_1.ipcRenderer.invoke('updater:install-update'),
        getStatus: () => electron_1.ipcRenderer.invoke('updater:get-status'),
        setAutoCheck: (enabled) => electron_1.ipcRenderer.invoke('updater:set-auto-check', enabled),
        setAutoDownload: (enabled) => electron_1.ipcRenderer.invoke('updater:set-auto-download', enabled),
        onStatus: (callback) => {
            electron_1.ipcRenderer.on('updater:status', (_event, data) => callback(data));
        },
        onUpdateAvailable: (callback) => {
            electron_1.ipcRenderer.on('updater:update-available', (_event, data) => callback(data));
        },
        onUpdateDownloaded: (callback) => {
            electron_1.ipcRenderer.on('updater:update-downloaded', (_event, data) => callback(data));
        },
        removeStatusListener: (callback) => {
            electron_1.ipcRenderer.removeListener('updater:status', callback);
        },
        removeUpdateAvailableListener: (callback) => {
            electron_1.ipcRenderer.removeListener('updater:update-available', callback);
        },
        removeUpdateDownloadedListener: (callback) => {
            electron_1.ipcRenderer.removeListener('updater:update-downloaded', callback);
        },
    },
    // Menu events
    menu: {
        onOpenSettings: (callback) => {
            electron_1.ipcRenderer.on('menu:open-settings', () => callback());
        },
        onToggleTheme: (callback) => {
            electron_1.ipcRenderer.on('menu:toggle-theme', () => callback());
        },
        onShowAbout: (callback) => {
            electron_1.ipcRenderer.on('menu:show-about', () => callback());
        },
    },
});
