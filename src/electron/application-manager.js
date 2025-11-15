/**
 * Application Manager
 * Manages application lifecycle, window creation, and state
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

class ApplicationManager {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.windowState = null;
    this.closeToTray = true; // Default to true
    this.isQuitting = false; // Track if app is quitting
    this.forceClose = false; // Track if close should bypass minimize to tray (Alt+F4)
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.appVersion = app.getVersion();
    this.userDataPath = app.getPath('userData');
    this.resourcesPath = process.resourcesPath;
    this.windowStatePath = path.join(this.userDataPath, 'window-state.json');
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Load saved window state
      await this.loadWindowState();
      
      // Create system tray
      this.createSystemTray();
      
      // Create application menu
      this.createApplicationMenu();
      
      // Register global keyboard shortcuts
      this.registerGlobalShortcuts();
      
      // Create main window
      this.createMainWindow();
      
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Load saved window state
   */
  async loadWindowState() {
    try {
      const data = await fs.readFile(this.windowStatePath, 'utf8');
      this.windowState = JSON.parse(data);
    } catch (error) {
      // Use default window state if file doesn't exist
      this.windowState = this.getDefaultWindowState();
    }
  }

  /**
   * Save window state
   */
  async saveWindowState() {
    if (!this.mainWindow) return;

    try {
      const bounds = this.mainWindow.getBounds();
      const state = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized: this.mainWindow.isMaximized(),
        isFullScreen: this.mainWindow.isFullScreen(),
      };

      await fs.writeFile(
        this.windowStatePath,
        JSON.stringify(state, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  }

  /**
   * Get default window state
   */
  getDefaultWindowState() {
    return {
      width: 1200,
      height: 800,
      x: undefined,
      y: undefined,
      isMaximized: false,
      isFullScreen: false,
    };
  }

  /**
   * Create the main application window
   */
  createMainWindow() {
    const iconPath = path.join(__dirname, '../../build-resources/icon.ico');
    
    const windowOptions = {
      width: this.windowState.width,
      height: this.windowState.height,
      x: this.windowState.x,
      y: this.windowState.y,
      minWidth: 800,
      minHeight: 600,
      show: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    };

    // Add icon if it exists
    try {
      if (require('fs').existsSync(iconPath)) {
        windowOptions.icon = iconPath;
      }
    } catch (error) {
      console.warn('Icon file not found, using default icon');
    }

    this.mainWindow = new BrowserWindow(windowOptions);

    // Restore window state
    if (this.windowState.isMaximized) {
      this.mainWindow.maximize();
    }

    if (this.windowState.isFullScreen) {
      this.mainWindow.setFullScreen(true);
    }

    // Load the application
    this.loadApplication();

    // Set up window event handlers
    this.setupWindowEventHandlers();

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });
  }

  /**
   * Load the application content
   */
  loadApplication() {
    if (this.isDevelopment) {
      // Load from Vite dev server
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      // Load from built files
      const indexPath = path.join(__dirname, '../../client/dist/index.html');
      this.mainWindow.loadFile(indexPath);
    }
  }

  /**
   * Set up window event handlers
   */
  setupWindowEventHandlers() {
    // Track keyboard state for Alt+F4 detection
    this.mainWindow.webContents.on('before-input-event', (event, input) => {
      // Detect Alt+F4 (close window shortcut on Windows)
      if (input.key === 'F4' && input.alt && input.type === 'keyDown') {
        console.log('Alt+F4 detected - forcing close');
        this.forceClose = true;
      }
    });

    // Save window state on resize and move
    this.mainWindow.on('resize', () => {
      this.saveWindowState();
    });

    this.mainWindow.on('move', () => {
      this.saveWindowState();
    });

    this.mainWindow.on('maximize', () => {
      this.saveWindowState();
    });

    this.mainWindow.on('unmaximize', () => {
      this.saveWindowState();
    });

    // Handle window close
    this.mainWindow.on('close', async (event) => {
      // Save state before closing
      await this.saveWindowState();
      
      // Check if this is a forced close (Alt+F4, Ctrl+Q, or quit from menu)
      // In that case, don't prevent the close
      if (this.isQuitting || this.forceClose) {
        this.forceClose = false; // Reset flag
        return;
      }
      
      // Check if we should minimize to tray instead of closing
      if (this.shouldMinimizeToTray()) {
        event.preventDefault();
        this.hideWindow();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle navigation
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      // Prevent navigation to external URLs
      if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
        event.preventDefault();
      }
    });

    // Handle new window requests
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Open external links in default browser
      const { shell } = require('electron');
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  /**
   * Create system tray
   */
  createSystemTray() {
    try {
      // Try to load icon from build-resources
      let trayIcon;
      const iconPath = path.join(__dirname, '../../build-resources/icon.ico');
      
      try {
        if (require('fs').existsSync(iconPath)) {
          trayIcon = nativeImage.createFromPath(iconPath);
        }
      } catch (error) {
        console.warn('Tray icon file not found, using default icon');
      }

      // Create tray with icon or empty image
      if (trayIcon && !trayIcon.isEmpty()) {
        this.tray = new Tray(trayIcon);
      } else {
        // Create a simple placeholder icon
        const placeholderIcon = nativeImage.createEmpty();
        this.tray = new Tray(placeholderIcon);
      }

      // Set tooltip
      this.tray.setToolTip('YouTube Downloader Pro');

      // Create context menu
      this.updateTrayMenu();

      // Handle tray icon click (left click)
      this.tray.on('click', () => {
        this.toggleWindowVisibility();
      });

      // Handle tray icon double click
      this.tray.on('double-click', () => {
        this.showWindow();
      });

      logger.info('System tray created successfully');
    } catch (error) {
      logger.error('Failed to create system tray:', error);
      // Don't throw error, tray is optional
    }
  }

  /**
   * Update tray context menu
   */
  updateTrayMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          this.showWindow();
        },
      },
      {
        label: 'Hide',
        click: () => {
          this.hideWindow();
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit',
        click: () => {
          this.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Create application menu bar
   */
  createApplicationMenu() {
    const { shell } = require('electron');
    
    const template = [
      // File Menu
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Downloads Folder',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              try {
                const downloadsPath = app.getPath('downloads');
                await shell.openPath(downloadsPath);
              } catch (error) {
                console.error('Failed to open downloads folder:', error);
              }
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              // Send event to renderer to open settings
              if (this.mainWindow && this.mainWindow.webContents) {
                this.mainWindow.webContents.send('menu:open-settings');
              }
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              this.quit();
            },
          },
        ],
      },
      // Edit Menu
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          },
          {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo',
          },
          {
            type: 'separator',
          },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll',
          },
        ],
      },
      // View Menu
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Theme',
            accelerator: 'CmdOrCtrl+T',
            click: () => {
              // Send event to renderer to toggle theme
              if (this.mainWindow && this.mainWindow.webContents) {
                this.mainWindow.webContents.send('menu:toggle-theme');
              }
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Toggle Fullscreen',
            accelerator: 'F11',
            click: () => {
              this.toggleFullScreen();
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.reload();
              }
            },
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'CmdOrCtrl+Shift+I',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.toggleDevTools();
              }
            },
          },
        ],
      },
      // Help Menu
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              // Send event to renderer to show about dialog
              if (this.mainWindow && this.mainWindow.webContents) {
                this.mainWindow.webContents.send('menu:show-about');
              }
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'View Logs',
            click: async () => {
              try {
                const logsPath = path.join(this.userDataPath, 'logs');
                await shell.openPath(logsPath);
              } catch (error) {
                console.error('Failed to open logs folder:', error);
              }
            },
          },
          {
            label: 'Documentation',
            click: async () => {
              await shell.openExternal('https://github.com/Thamarai149/yt-downloader#readme');
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Report Issue',
            click: async () => {
              await shell.openExternal('https://github.com/Thamarai149/yt-downloader/issues');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    logger.info('Application menu created successfully');
  }

  /**
   * Toggle window visibility
   */
  toggleWindowVisibility() {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.hideWindow();
      } else {
        this.showWindow();
      }
    }
  }

  /**
   * Check if window should minimize to tray on close
   */
  shouldMinimizeToTray() {
    // Check if tray exists
    if (!this.tray) {
      return false;
    }

    // Load settings to check closeToTray preference
    // For now, we'll use a default behavior
    // The IPC handler will manage the actual settings
    return this.closeToTray !== false; // Default to true
  }

  /**
   * Set close to tray behavior
   */
  setCloseToTray(enabled) {
    this.closeToTray = enabled;
  }

  /**
   * Get close to tray setting
   */
  getCloseToTray() {
    return this.closeToTray !== false;
  }

  /**
   * Minimize window
   */
  minimizeWindow() {
    if (this.mainWindow) {
      this.mainWindow.minimize();
    }
  }

  /**
   * Maximize window
   */
  maximizeWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  /**
   * Restore window
   */
  restoreWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Hide window
   */
  hideWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  /**
   * Show window
   */
  showWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Toggle fullscreen
   */
  toggleFullScreen() {
    if (this.mainWindow) {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
    }
  }

  /**
   * Get main window
   */
  getMainWindow() {
    return this.mainWindow;
  }

  /**
   * Check if window exists
   */
  hasWindow() {
    return this.mainWindow !== null;
  }

  /**
   * Register global keyboard shortcuts
   */
  registerGlobalShortcuts() {
    try {
      // Ctrl+Q - Quit application
      const quitShortcut = globalShortcut.register('CommandOrControl+Q', () => {
        logger.info('Global shortcut: Quit (Ctrl+Q)');
        this.quit();
      });

      if (!quitShortcut) {
        logger.warn('Failed to register Ctrl+Q shortcut (may be in use)');
      }

      // Ctrl+, - Open settings
      const settingsShortcut = globalShortcut.register('CommandOrControl+,', () => {
        logger.info('Global shortcut: Settings (Ctrl+,)');
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send('menu:open-settings');
        }
      });

      if (!settingsShortcut) {
        logger.warn('Failed to register Ctrl+, shortcut (may be in use)');
      }

      // F11 - Toggle fullscreen
      const fullscreenShortcut = globalShortcut.register('F11', () => {
        logger.info('Global shortcut: Toggle Fullscreen (F11)');
        this.toggleFullScreen();
      });

      if (!fullscreenShortcut) {
        logger.warn('Failed to register F11 shortcut (may be in use)');
      }

      logger.info('Global keyboard shortcuts registered');
    } catch (error) {
      logger.error('Failed to register global shortcuts:', error);
      // Don't throw error, shortcuts are optional
    }
  }

  /**
   * Unregister all global keyboard shortcuts
   */
  unregisterGlobalShortcuts() {
    try {
      globalShortcut.unregisterAll();
      logger.info('Global keyboard shortcuts unregistered');
    } catch (error) {
      logger.error('Failed to unregister global shortcuts:', error);
    }
  }

  /**
   * Cleanup and quit application
   */
  async cleanup() {
    try {
      // Save window state one last time
      await this.saveWindowState();
      
      // Unregister global shortcuts
      this.unregisterGlobalShortcuts();
      
      // Destroy system tray
      if (this.tray) {
        this.tray.destroy();
        this.tray = null;
      }
      
      // Close main window
      if (this.mainWindow) {
        this.mainWindow.destroy();
        this.mainWindow = null;
      }
      
      console.log('Application cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Quit application
   */
  quit() {
    this.isQuitting = true;
    app.quit();
  }
}

module.exports = ApplicationManager;
