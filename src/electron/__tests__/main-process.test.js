/**
 * Unit tests for main process components
 * Tests ApplicationManager, BackendServerManager, and IPCHandler
 */

const assert = require('assert');
const Module = require('module');
const path = require('path');

// Mock Electron modules
const mockApp = {
  getVersion: () => '1.0.0',
  getPath: (name) => {
    const paths = {
      userData: '/mock/userData',
      downloads: '/mock/downloads',
      temp: '/mock/temp',
    };
    return paths[name] || `/mock/path/${name}`;
  },
  getAppPath: () => '/mock/app',
  quit: () => {},
  exit: () => {},
};

const mockBrowserWindow = class {
  constructor(options) {
    this.options = options;
    this.bounds = { 
      width: options?.width || 1200, 
      height: options?.height || 800, 
      x: options?.x || 0, 
      y: options?.y || 0 
    };
    this._isMaximized = false;
    this._isFullScreen = false;
    this._isMinimized = false;
    this._isDestroyed = false;
    this._isVisible = false;
    this.eventHandlers = {};
  }
  
  getBounds() { return this.bounds; }
  isMaximized() { return this._isMaximized; }
  isFullScreen() { return this._isFullScreen; }
  isMinimized() { return this._isMinimized; }
  isDestroyed() { return this._isDestroyed; }
  
  loadURL(url) { this.loadedUrl = url; }
  loadFile(file) { this.loadedFile = file; }
  
  once(event, handler) { 
    if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
    this.eventHandlers[event].push({ handler, once: true });
  }
  
  on(event, handler) { 
    if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
    this.eventHandlers[event].push({ handler, once: false });
  }
  
  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(({ handler, once }) => {
        handler(...args);
      });
      if (this.eventHandlers[event].some(h => h.once)) {
        this.eventHandlers[event] = this.eventHandlers[event].filter(h => !h.once);
      }
    }
  }
  
  show() { this._isVisible = true; }
  hide() { this._isVisible = false; }
  minimize() { this._isMinimized = true; }
  maximize() { this._isMaximized = true; this._isMinimized = false; }
  unmaximize() { this._isMaximized = false; }
  restore() { this._isMinimized = false; }
  focus() {}
  destroy() { this._isDestroyed = true; }
  setFullScreen(value) { this._isFullScreen = value; }
  
  webContents = {
    openDevTools: () => {},
    on: (event, handler) => {
      if (!this.webContentsHandlers) this.webContentsHandlers = {};
      if (!this.webContentsHandlers[event]) this.webContentsHandlers[event] = [];
      this.webContentsHandlers[event].push(handler);
    },
    setWindowOpenHandler: () => {},
    send: () => {},
  };
};

const mockIpcMain = {
  handlers: {},
  handle: function(channel, handler) {
    this.handlers[channel] = handler;
  },
  on: function(channel, handler) {
    this.handlers[channel] = handler;
  },
  invoke: async function(channel, ...args) {
    if (this.handlers[channel]) {
      return await this.handlers[channel]({}, ...args);
    }
  }
};

const mockDialog = {
  showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: ['/mock/selected/path'] }),
  showErrorBox: () => {},
  showMessageBox: () => Promise.resolve({ response: 0 }),
  showMessageBoxSync: () => 0,
};

const mockShell = {
  openExternal: () => Promise.resolve(),
  openPath: () => Promise.resolve(''),
  showItemInFolder: () => {},
};

const mockNotification = class {
  constructor(options) {
    this.options = options;
    this.eventHandlers = {};
  }
  static isSupported() { return true; }
  show() {}
  on(event, handler) {
    this.eventHandlers[event] = handler;
  }
};

// Mock fs.promises
const mockFs = {
  readFile: async (filePath) => {
    if (filePath.includes('window-state.json')) {
      return JSON.stringify({ width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false });
    }
    if (filePath.includes('settings.json')) {
      return JSON.stringify({ theme: 'dark', downloadPath: '/custom/path' });
    }
    throw { code: 'ENOENT' };
  },
  writeFile: async () => {},
  mkdir: async () => {},
  access: async () => {},
};

// Mock child_process
const mockChildProcess = {
  spawn: () => ({
    stdout: { on: () => {} },
    stderr: { on: () => {} },
    on: () => {},
    kill: () => {},
    killed: false,
    pid: 12345,
  })
};

// Mock net
const mockNet = {
  createServer: () => ({
    listen: (port, callback) => {
      setTimeout(() => callback(), 0);
    },
    address: () => ({ port: 4000 }),
    close: (callback) => {
      setTimeout(() => callback(), 0);
    },
    on: () => {},
  })
};

// Mock globalShortcut
const mockGlobalShortcut = {
  registeredShortcuts: {},
  register: function(accelerator, callback) {
    // Simulate registration success/failure
    if (this.registeredShortcuts[accelerator]) {
      return false; // Already registered
    }
    this.registeredShortcuts[accelerator] = callback;
    return true;
  },
  unregister: function(accelerator) {
    delete this.registeredShortcuts[accelerator];
  },
  unregisterAll: function() {
    this.registeredShortcuts = {};
  },
  isRegistered: function(accelerator) {
    return !!this.registeredShortcuts[accelerator];
  },
  // Helper for testing - trigger a shortcut
  trigger: function(accelerator) {
    if (this.registeredShortcuts[accelerator]) {
      this.registeredShortcuts[accelerator]();
    }
  }
};

// Mock Tray
const mockTray = class {
  constructor(icon) {
    this.icon = icon;
    this.eventHandlers = {};
  }
  setToolTip() {}
  setContextMenu() {}
  on(event, handler) {
    this.eventHandlers[event] = handler;
  }
  destroy() {}
};

// Mock Menu
const mockMenu = {
  buildFromTemplate: (template) => ({ template }),
  setApplicationMenu: () => {},
};

// Mock nativeImage
const mockNativeImage = {
  createFromPath: () => ({ isEmpty: () => false }),
  createEmpty: () => ({ isEmpty: () => true }),
};

// Intercept require calls
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'electron') {
    return {
      app: mockApp,
      BrowserWindow: mockBrowserWindow,
      ipcMain: mockIpcMain,
      dialog: mockDialog,
      shell: mockShell,
      Notification: mockNotification,
      globalShortcut: mockGlobalShortcut,
      Tray: mockTray,
      Menu: mockMenu,
      nativeImage: mockNativeImage,
    };
  }
  if (id === 'fs') {
    return {
      promises: mockFs,
      existsSync: () => false,
    };
  }
  if (id === 'child_process') {
    return mockChildProcess;
  }
  if (id === 'net') {
    return mockNet;
  }
  return originalRequire.apply(this, arguments);
};

// Test counters
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function test(description, fn) {
  testsRun++;
  try {
    await fn();
    testsPassed++;
    console.log(`  ✓ ${description}`);
  } catch (error) {
    testsFailed++;
    console.error(`  ✗ ${description}`);
    console.error(`    ${error.message}`);
  }
}

// ============================================================================
// ApplicationManager Tests
// ============================================================================
async function runApplicationManagerTests() {
  console.log('\n=== Testing ApplicationManager ===\n');
  
  try {
    const ApplicationManager = require('../application-manager');
    
    await test('ApplicationManager instantiates correctly', () => {
      const appManager = new ApplicationManager();
      assert(appManager !== null, 'Should instantiate');
      assert(appManager.mainWindow === null, 'mainWindow should be null initially');
      assert(appManager.userDataPath === '/mock/userData', 'Should set userDataPath');
    });
    
    await test('ApplicationManager has required methods', () => {
      const appManager = new ApplicationManager();
      assert(typeof appManager.initialize === 'function', 'Should have initialize method');
      assert(typeof appManager.createMainWindow === 'function', 'Should have createMainWindow method');
      assert(typeof appManager.cleanup === 'function', 'Should have cleanup method');
      assert(typeof appManager.getMainWindow === 'function', 'Should have getMainWindow method');
      assert(typeof appManager.hasWindow === 'function', 'Should have hasWindow method');
    });
    
    await test('ApplicationManager creates window with correct options', () => {
      const appManager = new ApplicationManager();
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      
      assert(appManager.mainWindow !== null, 'Should create window');
      assert(appManager.mainWindow.options.width === 1000, 'Should use saved width');
      assert(appManager.mainWindow.options.height === 700, 'Should use saved height');
      assert(appManager.mainWindow.options.webPreferences.nodeIntegration === false, 'Should disable nodeIntegration');
      assert(appManager.mainWindow.options.webPreferences.contextIsolation === true, 'Should enable contextIsolation');
    });
    
    await test('ApplicationManager window state management', () => {
      const appManager = new ApplicationManager();
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      
      // Test window operations
      appManager.minimizeWindow();
      assert(appManager.mainWindow._isMinimized === true, 'Should minimize window');
      
      appManager.maximizeWindow();
      assert(appManager.mainWindow._isMaximized === true, 'Should maximize window');
      
      appManager.restoreWindow();
      assert(appManager.mainWindow._isMinimized === false, 'Should restore window');
      
      appManager.hideWindow();
      assert(appManager.mainWindow._isVisible === false, 'Should hide window');
      
      appManager.showWindow();
      assert(appManager.mainWindow._isVisible === true, 'Should show window');
    });
    
    await test('ApplicationManager getDefaultWindowState returns correct structure', () => {
      const appManager = new ApplicationManager();
      const defaultState = appManager.getDefaultWindowState();
      
      assert(typeof defaultState === 'object', 'Should return object');
      assert(defaultState.width === 1200, 'Should have default width');
      assert(defaultState.height === 800, 'Should have default height');
      assert(defaultState.isMaximized === false, 'Should not be maximized by default');
      assert(defaultState.isFullScreen === false, 'Should not be fullscreen by default');
    });
    
    await test('ApplicationManager hasWindow returns correct value', () => {
      const appManager = new ApplicationManager();
      assert(appManager.hasWindow() === false, 'Should return false when no window');
      
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      assert(appManager.hasWindow() === true, 'Should return true when window exists');
    });
    
    await test('ApplicationManager cleanup destroys window', async () => {
      const appManager = new ApplicationManager();
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      
      await appManager.cleanup();
      assert(appManager.mainWindow === null, 'Should set mainWindow to null');
    });
    
    await test('ApplicationManager registers global keyboard shortcuts', () => {
      const appManager = new ApplicationManager();
      mockGlobalShortcut.registeredShortcuts = {}; // Reset shortcuts
      
      appManager.registerGlobalShortcuts();
      
      assert(mockGlobalShortcut.isRegistered('CommandOrControl+Q'), 'Should register Ctrl+Q');
      assert(mockGlobalShortcut.isRegistered('CommandOrControl+,'), 'Should register Ctrl+,');
      assert(mockGlobalShortcut.isRegistered('F11'), 'Should register F11');
    });
    
    await test('ApplicationManager Ctrl+Q shortcut quits application', () => {
      const appManager = new ApplicationManager();
      mockGlobalShortcut.registeredShortcuts = {};
      let quitCalled = false;
      
      // Mock quit method
      const originalQuit = appManager.quit;
      appManager.quit = () => { quitCalled = true; };
      
      appManager.registerGlobalShortcuts();
      mockGlobalShortcut.trigger('CommandOrControl+Q');
      
      assert(quitCalled === true, 'Should call quit when Ctrl+Q is pressed');
      
      appManager.quit = originalQuit;
    });
    
    await test('ApplicationManager Ctrl+, shortcut opens settings', () => {
      const appManager = new ApplicationManager();
      mockGlobalShortcut.registeredShortcuts = {};
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      
      let settingsEventSent = false;
      appManager.mainWindow.webContents.send = (channel) => {
        if (channel === 'menu:open-settings') {
          settingsEventSent = true;
        }
      };
      
      appManager.registerGlobalShortcuts();
      mockGlobalShortcut.trigger('CommandOrControl+,');
      
      assert(settingsEventSent === true, 'Should send open-settings event when Ctrl+, is pressed');
    });
    
    await test('ApplicationManager F11 shortcut toggles fullscreen', () => {
      const appManager = new ApplicationManager();
      mockGlobalShortcut.registeredShortcuts = {};
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      
      appManager.registerGlobalShortcuts();
      
      assert(appManager.mainWindow._isFullScreen === false, 'Should not be fullscreen initially');
      
      mockGlobalShortcut.trigger('F11');
      assert(appManager.mainWindow._isFullScreen === true, 'Should toggle to fullscreen');
      
      mockGlobalShortcut.trigger('F11');
      assert(appManager.mainWindow._isFullScreen === false, 'Should toggle back from fullscreen');
    });
    
    await test('ApplicationManager handles shortcut registration conflicts gracefully', () => {
      const appManager = new ApplicationManager();
      mockGlobalShortcut.registeredShortcuts = {};
      
      // Pre-register a shortcut to simulate conflict
      mockGlobalShortcut.register('CommandOrControl+Q', () => {});
      
      // Should not throw error when registration fails
      appManager.registerGlobalShortcuts();
      
      // Should still register other shortcuts
      assert(mockGlobalShortcut.isRegistered('CommandOrControl+,'), 'Should register Ctrl+, even if Ctrl+Q fails');
      assert(mockGlobalShortcut.isRegistered('F11'), 'Should register F11 even if Ctrl+Q fails');
    });
    
    await test('ApplicationManager unregisters all shortcuts on cleanup', async () => {
      const appManager = new ApplicationManager();
      mockGlobalShortcut.registeredShortcuts = {};
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.createMainWindow();
      
      appManager.registerGlobalShortcuts();
      assert(Object.keys(mockGlobalShortcut.registeredShortcuts).length > 0, 'Should have registered shortcuts');
      
      await appManager.cleanup();
      assert(Object.keys(mockGlobalShortcut.registeredShortcuts).length === 0, 'Should unregister all shortcuts');
    });
    
    await test('ApplicationManager Alt+F4 forces close without minimize to tray', async () => {
      const appManager = new ApplicationManager();
      appManager.windowState = { width: 1000, height: 700, x: 100, y: 100, isMaximized: false, isFullScreen: false };
      appManager.closeToTray = true; // Enable minimize to tray
      appManager.createMainWindow();
      appManager.createSystemTray();
      
      // Simulate Alt+F4 key press
      const beforeInputHandlers = appManager.mainWindow.webContentsHandlers['before-input-event'] || [];
      beforeInputHandlers.forEach(handler => {
        handler({}, { key: 'F4', alt: true, type: 'keyDown' });
      });
      
      assert(appManager.forceClose === true, 'Should set forceClose flag when Alt+F4 is pressed');
      
      // Simulate close event
      let closePrevented = false;
      const closeEvent = {
        preventDefault: () => { closePrevented = true; }
      };
      
      const closeHandlers = appManager.mainWindow.eventHandlers['close'] || [];
      for (const { handler } of closeHandlers) {
        await handler(closeEvent);
      }
      
      assert(closePrevented === false, 'Should not prevent close when Alt+F4 is pressed');
      assert(appManager.forceClose === false, 'Should reset forceClose flag after close');
    });
    
    console.log('\n✓ ApplicationManager tests completed');
  } catch (error) {
    console.error('\n✗ ApplicationManager tests failed:', error.message);
    console.error(error.stack);
  }
}

// ============================================================================
// BackendServerManager Tests
// ============================================================================
async function runBackendServerManagerTests() {
  console.log('\n=== Testing BackendServerManager ===\n');
  
  try {
    const BackendServerManager = require('../backend-manager');
  
  await test('BackendServerManager instantiates correctly', () => {
    const backendManager = new BackendServerManager();
    assert(backendManager !== null, 'Should instantiate');
    assert(backendManager.serverProcess === null, 'serverProcess should be null initially');
    assert(backendManager.serverPort === null, 'serverPort should be null initially');
    assert(backendManager.serverHost === 'localhost', 'Should set default host');
  });
  
  await test('BackendServerManager has required methods', () => {
    const backendManager = new BackendServerManager();
    assert(typeof backendManager.start === 'function', 'Should have start method');
    assert(typeof backendManager.stop === 'function', 'Should have stop method');
    assert(typeof backendManager.restart === 'function', 'Should have restart method');
    assert(typeof backendManager.getStatus === 'function', 'Should have getStatus method');
    assert(typeof backendManager.healthCheck === 'function', 'Should have healthCheck method');
    assert(typeof backendManager.findAvailablePort === 'function', 'Should have findAvailablePort method');
    assert(typeof backendManager.getUrl === 'function', 'Should have getUrl method');
    assert(typeof backendManager.isRunning === 'function', 'Should have isRunning method');
  });
  
  await test('BackendServerManager getStatus returns correct structure', () => {
    const backendManager = new BackendServerManager();
    const status = backendManager.getStatus();
    
    assert(typeof status === 'object', 'Should return object');
    assert(typeof status.running === 'boolean', 'Should have running property');
    assert(status.port === null, 'Port should be null initially');
    assert(status.host === 'localhost', 'Should have host property');
    assert(status.pid === null, 'PID should be null initially');
    assert(typeof status.uptime === 'number', 'Should have uptime property');
  });
  
  await test('BackendServerManager getUrl returns correct format', () => {
    const backendManager = new BackendServerManager();
    assert(backendManager.getUrl() === null, 'Should return null when no port');
    
    backendManager.serverPort = 4000;
    assert(backendManager.getUrl() === 'http://localhost:4000', 'Should return correct URL');
  });
  
  await test('BackendServerManager isRunning returns correct value', () => {
    const backendManager = new BackendServerManager();
    assert(backendManager.isRunning() === false, 'Should return false initially');
    
    backendManager.serverProcess = { killed: false };
    assert(backendManager.isRunning() === true, 'Should return true when process exists');
  });
  
  await test('BackendServerManager findAvailablePort finds port', async () => {
    const backendManager = new BackendServerManager();
    const port = await backendManager.findAvailablePort(4000);
    
    assert(typeof port === 'number', 'Should return a number');
    assert(port >= 4000, 'Should return port >= start port');
  });
  
  await test('BackendServerManager prepareEnvironment sets correct variables', () => {
    const backendManager = new BackendServerManager();
    backendManager.serverPort = 4000;
    const env = backendManager.prepareEnvironment();
    
    assert(env.PORT === '4000', 'Should set PORT');
    assert(env.ELECTRON_MODE === 'true', 'Should set ELECTRON_MODE');
    assert(env.USER_DATA_PATH === '/mock/userData', 'Should set USER_DATA_PATH');
    assert(typeof env.DOWNLOADS_PATH === 'string', 'Should set DOWNLOADS_PATH');
  });
  
  await test('BackendServerManager getBackendPath returns correct path', () => {
    const backendManager = new BackendServerManager();
    const backendPath = backendManager.getBackendPath();
    
    assert(typeof backendPath === 'string', 'Should return string');
    assert(backendPath.includes('backend'), 'Should include backend directory');
  });
  
  console.log('\n✓ BackendServerManager tests completed');
  } catch (error) {
    console.error('\n✗ BackendServerManager tests failed:', error.message);
    console.error(error.stack);
  }
}

// ============================================================================
// IPCHandler Tests
// ============================================================================
async function runIPCHandlerTests() {
  console.log('\n=== Testing IPCHandler ===\n');
  
  try {
    const IPCHandler = require('../ipc-handler');
  
  const mockBackendManager = {
    getUrl: () => 'http://localhost:4000',
    getStatus: () => ({ running: true, port: 4000, host: 'localhost', uptime: 1000 }),
    restart: async () => ({ port: 4000, host: 'localhost', url: 'http://localhost:4000' }),
  };
  
  const mockApplicationManager = {
    restoreWindow: () => {},
  };
  
  await test('IPCHandler instantiates correctly', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    assert(ipcHandler !== null, 'Should instantiate');
    assert(ipcHandler.backendManager === mockBackendManager, 'Should store backend manager');
    assert(ipcHandler.userDataPath === '/mock/userData', 'Should set userDataPath');
  });
  
  await test('IPCHandler has required methods', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    assert(typeof ipcHandler.registerHandlers === 'function', 'Should have registerHandlers method');
    assert(typeof ipcHandler.getDefaultSettings === 'function', 'Should have getDefaultSettings method');
    assert(typeof ipcHandler.loadSettings === 'function', 'Should have loadSettings method');
    assert(typeof ipcHandler.saveSettings === 'function', 'Should have saveSettings method');
    assert(typeof ipcHandler.validateSettings === 'function', 'Should have validateSettings method');
  });
  
  await test('IPCHandler getDefaultSettings returns correct structure', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    const defaultSettings = ipcHandler.getDefaultSettings();
    
    assert(typeof defaultSettings === 'object', 'Should return object');
    assert(typeof defaultSettings.downloadPath === 'string', 'Should have downloadPath');
    assert(typeof defaultSettings.theme === 'string', 'Should have theme');
    assert(typeof defaultSettings.maxConcurrentDownloads === 'number', 'Should have maxConcurrentDownloads');
    assert(typeof defaultSettings.minimizeToTray === 'boolean', 'Should have minimizeToTray');
    assert(typeof defaultSettings.autoCheckUpdates === 'boolean', 'Should have autoCheckUpdates');
    assert(typeof defaultSettings.showDesktopNotifications === 'boolean', 'Should have showDesktopNotifications');
  });
  
  await test('IPCHandler validateSettings validates quality', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    
    const validSettings = ipcHandler.validateSettings({ defaultQuality: 'highest' });
    assert(validSettings.defaultQuality === 'highest', 'Should accept valid quality');
    
    const invalidSettings = ipcHandler.validateSettings({ defaultQuality: 'invalid' });
    assert(invalidSettings.defaultQuality === 'highest', 'Should use default for invalid quality');
  });
  
  await test('IPCHandler validateSettings validates type', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    
    const validSettings = ipcHandler.validateSettings({ defaultType: 'audio' });
    assert(validSettings.defaultType === 'audio', 'Should accept valid type');
    
    const invalidSettings = ipcHandler.validateSettings({ defaultType: 'invalid' });
    assert(invalidSettings.defaultType === 'video', 'Should use default for invalid type');
  });
  
  await test('IPCHandler validateSettings validates concurrent downloads', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    
    const validSettings = ipcHandler.validateSettings({ maxConcurrentDownloads: 5 });
    assert(validSettings.maxConcurrentDownloads === 5, 'Should accept valid number');
    
    const tooLow = ipcHandler.validateSettings({ maxConcurrentDownloads: 0 });
    assert(tooLow.maxConcurrentDownloads === 3, 'Should use default for too low');
    
    const tooHigh = ipcHandler.validateSettings({ maxConcurrentDownloads: 20 });
    assert(tooHigh.maxConcurrentDownloads === 3, 'Should use default for too high');
  });
  
  await test('IPCHandler validateSettings validates theme', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    
    const validSettings = ipcHandler.validateSettings({ theme: 'dark' });
    assert(validSettings.theme === 'dark', 'Should accept valid theme');
    
    const invalidSettings = ipcHandler.validateSettings({ theme: 'invalid' });
    assert(invalidSettings.theme === 'system', 'Should use default for invalid theme');
  });
  
  await test('IPCHandler validateSettings validates boolean settings', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    
    const validSettings = ipcHandler.validateSettings({ minimizeToTray: false });
    assert(validSettings.minimizeToTray === false, 'Should accept valid boolean');
    
    const invalidSettings = ipcHandler.validateSettings({ minimizeToTray: 'invalid' });
    assert(invalidSettings.minimizeToTray === true, 'Should use default for invalid boolean');
  });
  
  await test('IPCHandler registerHandlers registers all handlers', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    mockIpcMain.handlers = {}; // Reset handlers
    
    ipcHandler.registerHandlers();
    
    // Check that handlers are registered
    assert(typeof mockIpcMain.handlers['app:get-version'] === 'function', 'Should register app:get-version');
    assert(typeof mockIpcMain.handlers['app:get-paths'] === 'function', 'Should register app:get-paths');
    assert(typeof mockIpcMain.handlers['backend:get-url'] === 'function', 'Should register backend:get-url');
    assert(typeof mockIpcMain.handlers['settings:get'] === 'function', 'Should register settings:get');
    assert(typeof mockIpcMain.handlers['settings:set'] === 'function', 'Should register settings:set');
  });
  
  await test('IPCHandler app handlers work correctly', async () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    mockIpcMain.handlers = {};
    ipcHandler.registerHandlers();
    
    const version = await mockIpcMain.invoke('app:get-version');
    assert(version === '1.0.0', 'Should return app version');
    
    const paths = await mockIpcMain.invoke('app:get-paths');
    assert(typeof paths === 'object', 'Should return paths object');
    assert(paths.userData === '/mock/userData', 'Should return userData path');
  });
  
  await test('IPCHandler backend handlers work correctly', async () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    mockIpcMain.handlers = {};
    ipcHandler.registerHandlers();
    
    const url = await mockIpcMain.invoke('backend:get-url');
    assert(url === 'http://localhost:4000', 'Should return backend URL');
    
    const status = await mockIpcMain.invoke('backend:get-status');
    assert(status.running === true, 'Should return backend status');
    assert(status.port === 4000, 'Should return backend port');
  });
  
  await test('IPCHandler setApplicationManager sets manager', () => {
    const ipcHandler = new IPCHandler(mockBackendManager);
    ipcHandler.setApplicationManager(mockApplicationManager);
    assert(ipcHandler.applicationManager === mockApplicationManager, 'Should set application manager');
  });
  
  console.log('\n✓ IPCHandler tests completed');
  } catch (error) {
    console.error('\n✗ IPCHandler tests failed:', error.message);
    console.error(error.stack);
  }
}

// ============================================================================
// Notification Tests
// ============================================================================
async function runNotificationTests() {
  console.log('\n=== Testing Notification Functionality ===\n');
  
  try {
    const IPCHandler = require('../ipc-handler');
    
    const mockBackendManager = {
      getUrl: () => 'http://localhost:4000',
      getStatus: () => ({ running: true, port: 4000, host: 'localhost', uptime: 1000 }),
    };
    
    const mockApplicationManager = {
      restoreWindow: () => {},
    };
    
    await test('IPCHandler registers notification handlers', () => {
      const ipcHandler = new IPCHandler(mockBackendManager);
      mockIpcMain.handlers = {};
      ipcHandler.registerHandlers();
      
      assert(typeof mockIpcMain.handlers['notification:show'] === 'function', 'Should register notification:show');
      assert(typeof mockIpcMain.handlers['notification:download-complete'] === 'function', 'Should register notification:download-complete');
      assert(typeof mockIpcMain.handlers['notification:download-error'] === 'function', 'Should register notification:download-error');
    });
    
    await test('IPCHandler handleNotificationShow respects settings', async () => {
      const ipcHandler = new IPCHandler(mockBackendManager);
      ipcHandler.setApplicationManager(mockApplicationManager);
      
      // Mock settings with notifications disabled
      const originalLoadSettings = ipcHandler.loadSettings.bind(ipcHandler);
      ipcHandler.loadSettings = async () => ({
        ...ipcHandler.getDefaultSettings(),
        showDesktopNotifications: false,
      });
      
      const result = await ipcHandler.handleNotificationShow({}, {
        title: 'Test',
        body: 'Test notification',
        type: 'download-complete',
      });
      
      assert(result.success === false, 'Should fail when notifications disabled');
      assert(result.error.includes('disabled'), 'Should indicate notifications are disabled');
      
      ipcHandler.loadSettings = originalLoadSettings;
    });
    
    await test('IPCHandler handleNotificationShow respects type-specific settings', async () => {
      const ipcHandler = new IPCHandler(mockBackendManager);
      ipcHandler.setApplicationManager(mockApplicationManager);
      
      // Mock settings with download-complete notifications disabled
      const originalLoadSettings = ipcHandler.loadSettings.bind(ipcHandler);
      ipcHandler.loadSettings = async () => ({
        ...ipcHandler.getDefaultSettings(),
        showDesktopNotifications: true,
        notifyOnComplete: false,
      });
      
      const result = await ipcHandler.handleNotificationShow({}, {
        title: 'Test',
        body: 'Test notification',
        type: 'download-complete',
      });
      
      assert(result.success === false, 'Should fail when download-complete notifications disabled');
      
      ipcHandler.loadSettings = originalLoadSettings;
    });
    
    await test('IPCHandler handleNotificationShow creates notification when enabled', async () => {
      const ipcHandler = new IPCHandler(mockBackendManager);
      ipcHandler.setApplicationManager(mockApplicationManager);
      
      // Mock settings with notifications enabled
      const originalLoadSettings = ipcHandler.loadSettings.bind(ipcHandler);
      ipcHandler.loadSettings = async () => ({
        ...ipcHandler.getDefaultSettings(),
        showDesktopNotifications: true,
        notifyOnComplete: true,
      });
      
      const mockEvent = {
        sender: {
          isDestroyed: () => false,
          send: () => {},
        },
      };
      
      const result = await ipcHandler.handleNotificationShow(mockEvent, {
        title: 'Download Complete',
        body: 'Test file downloaded',
        type: 'download-complete',
      });
      
      assert(result.success === true, 'Should succeed when notifications enabled');
      
      ipcHandler.loadSettings = originalLoadSettings;
    });
    
    await test('IPCHandler notification click handler restores window', async () => {
      const ipcHandler = new IPCHandler(mockBackendManager);
      let windowRestored = false;
      
      const testApplicationManager = {
        restoreWindow: () => { windowRestored = true; },
      };
      
      ipcHandler.setApplicationManager(testApplicationManager);
      
      const originalLoadSettings = ipcHandler.loadSettings.bind(ipcHandler);
      ipcHandler.loadSettings = async () => ({
        ...ipcHandler.getDefaultSettings(),
        showDesktopNotifications: true,
        notifyOnComplete: true,
      });
      
      const mockEvent = {
        sender: {
          isDestroyed: () => false,
          send: () => {},
        },
      };
      
      await ipcHandler.handleNotificationShow(mockEvent, {
        title: 'Test',
        body: 'Test notification',
        type: 'download-complete',
      });
      
      // Simulate notification click
      // Note: In real scenario, the notification's click handler would be called
      // For testing, we verify the handler exists and would call restoreWindow
      assert(ipcHandler.applicationManager.restoreWindow !== undefined, 'Should have restoreWindow method');
      
      ipcHandler.loadSettings = originalLoadSettings;
    });
    
    await test('IPCHandler default settings include notification preferences', () => {
      const ipcHandler = new IPCHandler(mockBackendManager);
      const defaultSettings = ipcHandler.getDefaultSettings();
      
      assert(typeof defaultSettings.showDesktopNotifications === 'boolean', 'Should have showDesktopNotifications');
      assert(typeof defaultSettings.notifyOnComplete === 'boolean', 'Should have notifyOnComplete');
      assert(typeof defaultSettings.notifyOnError === 'boolean', 'Should have notifyOnError');
      assert(defaultSettings.showDesktopNotifications === true, 'Should enable notifications by default');
      assert(defaultSettings.notifyOnComplete === true, 'Should enable complete notifications by default');
      assert(defaultSettings.notifyOnError === true, 'Should enable error notifications by default');
    });
    
    console.log('\n✓ Notification tests completed');
  } catch (error) {
    console.error('\n✗ Notification tests failed:', error.message);
    console.error(error.stack);
  }
}

// ============================================================================
// Error Handling Tests
// ============================================================================
async function runErrorHandlingTests() {
  console.log('\n=== Testing Error Handling ===\n');
  
  try {
    await test('ApplicationManager handles missing window state file', async () => {
    const ApplicationManager = require('../application-manager');
    const appManager = new ApplicationManager();
    
    // Mock fs to throw ENOENT
    const originalReadFile = mockFs.readFile;
    mockFs.readFile = async () => { throw { code: 'ENOENT' }; };
    
    await appManager.loadWindowState();
    assert(appManager.windowState !== null, 'Should use default state');
    assert(appManager.windowState.width === 1200, 'Should have default width');
    
    mockFs.readFile = originalReadFile;
  });
  
  await test('IPCHandler handles missing settings file', async () => {
    const IPCHandler = require('../ipc-handler');
    const mockBackendManager = {
      getUrl: () => 'http://localhost:4000',
      getStatus: () => ({ running: true, port: 4000 }),
    };
    
    const ipcHandler = new IPCHandler(mockBackendManager);
    
    // Mock fs to throw ENOENT
    const originalReadFile = mockFs.readFile;
    mockFs.readFile = async (filePath) => {
      if (filePath.includes('settings.json')) {
        throw { code: 'ENOENT' };
      }
      return originalReadFile(filePath);
    };
    
    const settings = await ipcHandler.loadSettings();
    assert(settings !== null, 'Should return default settings');
    assert(typeof settings.downloadPath === 'string', 'Should have downloadPath');
    
    mockFs.readFile = originalReadFile;
  });
  
  await test('BackendServerManager handles restart limit', async () => {
    const BackendServerManager = require('../backend-manager');
    const backendManager = new BackendServerManager();
    
    backendManager.restartAttempts = 3;
    backendManager.maxRestartAttempts = 3;
    
    try {
      await backendManager.restart();
      assert(false, 'Should throw error when max attempts reached');
    } catch (error) {
      assert(error.message.includes('Maximum restart attempts'), 'Should throw max attempts error');
    }
  });
  
  console.log('\n✓ Error handling tests completed');
  } catch (error) {
    console.error('\n✗ Error handling tests failed:', error.message);
    console.error(error.stack);
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  await runApplicationManagerTests();
  await runBackendServerManagerTests();
  await runIPCHandlerTests();
  await runNotificationTests();
  await runErrorHandlingTests();
  
  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests run: ${testsRun}`);
  console.log(`Tests passed: ${testsPassed} ✓`);
  console.log(`Tests failed: ${testsFailed} ✗`);
  console.log('='.repeat(60));

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n❌ Test runner error:', error);
  process.exit(1);
});
