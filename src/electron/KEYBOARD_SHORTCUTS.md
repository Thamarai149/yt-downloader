# Keyboard Shortcuts Implementation

## Overview

This document describes the keyboard shortcuts implementation for the YouTube Downloader Pro desktop application.

## Implemented Shortcuts

### Global Shortcuts (Work even when app is not focused)

1. **Ctrl+Q** (Cmd+Q on macOS)
   - Action: Quit the application
   - Implementation: Registered via `globalShortcut.register()`
   - Behavior: Closes the application completely, bypassing minimize-to-tray

2. **Ctrl+,** (Cmd+, on macOS)
   - Action: Open settings
   - Implementation: Registered via `globalShortcut.register()`
   - Behavior: Sends `menu:open-settings` event to renderer process

3. **F11**
   - Action: Toggle fullscreen mode
   - Implementation: Registered via `globalShortcut.register()`
   - Behavior: Toggles the window between fullscreen and normal mode

### Window Shortcuts

4. **Alt+F4** (Windows)
   - Action: Close application completely
   - Implementation: Detected via `before-input-event` listener
   - Behavior: Forces close without minimizing to tray, even if close-to-tray is enabled

## Implementation Details

### Registration

Shortcuts are registered in the `ApplicationManager.registerGlobalShortcuts()` method during application initialization.

```javascript
registerGlobalShortcuts() {
  // Ctrl+Q - Quit application
  globalShortcut.register('CommandOrControl+Q', () => {
    this.quit();
  });

  // Ctrl+, - Open settings
  globalShortcut.register('CommandOrControl+,', () => {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('menu:open-settings');
    }
  });

  // F11 - Toggle fullscreen
  globalShortcut.register('F11', () => {
    this.toggleFullScreen();
  });
}
```

### Error Handling

Each shortcut registration checks for success and logs a warning if registration fails:

```javascript
const quitShortcut = globalShortcut.register('CommandOrControl+Q', () => {
  this.quit();
});

if (!quitShortcut) {
  console.warn('Failed to register Ctrl+Q shortcut (may be in use)');
}
```

This graceful handling ensures that:
- The application continues to work even if some shortcuts fail to register
- Users are informed via console logs if shortcuts are unavailable
- Other shortcuts continue to work independently

### Alt+F4 Detection

Alt+F4 is handled specially to ensure it always closes the application completely:

```javascript
// Track keyboard state for Alt+F4 detection
this.mainWindow.webContents.on('before-input-event', (event, input) => {
  if (input.key === 'F4' && input.alt && input.type === 'keyDown') {
    this.forceClose = true;
  }
});

// In close handler
this.mainWindow.on('close', async (event) => {
  if (this.isQuitting || this.forceClose) {
    this.forceClose = false; // Reset flag
    return; // Allow close
  }
  
  // Otherwise, check minimize-to-tray setting
  if (this.shouldMinimizeToTray()) {
    event.preventDefault();
    this.hideWindow();
  }
});
```

### Cleanup

All shortcuts are unregistered when the application closes:

```javascript
unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}
```

This is called in the `cleanup()` method to ensure proper resource cleanup.

## Testing

Comprehensive tests are included in `src/electron/__tests__/main-process.test.js`:

- ✅ Shortcut registration
- ✅ Ctrl+Q functionality (quits app)
- ✅ Ctrl+, functionality (opens settings)
- ✅ F11 functionality (toggles fullscreen)
- ✅ Conflict handling (graceful failure)
- ✅ Cleanup (unregister all shortcuts)
- ✅ Alt+F4 behavior (forces close)

All tests pass successfully.

## Requirements Compliance

This implementation satisfies the following requirements from the design document:

### Requirement 7.1
✅ THE Desktop Application SHALL support all existing web application keyboard shortcuts (Ctrl+K, Ctrl+D, Ctrl+H)
- Note: These shortcuts work in the renderer process (web app) and continue to function

### Requirement 7.2
✅ THE Desktop Application SHALL add Ctrl+Q shortcut to quit the application

### Requirement 7.3
✅ THE Desktop Application SHALL add Ctrl+, (comma) shortcut to open settings

### Requirement 7.4
✅ THE Desktop Application SHALL add F11 shortcut to toggle fullscreen mode

### Requirement 7.5
✅ WHEN the user presses Alt+F4, THE Desktop Application SHALL close the application completely (not minimize to tray)

## Usage

### For Users

The keyboard shortcuts work automatically once the application is running:

- Press **Ctrl+Q** to quit the application
- Press **Ctrl+,** to open settings
- Press **F11** to toggle fullscreen mode
- Press **Alt+F4** to close the application (Windows standard)

### For Developers

To modify or add shortcuts:

1. Edit `src/electron/application-manager.js`
2. Add registration in `registerGlobalShortcuts()` method
3. Add corresponding tests in `src/electron/__tests__/main-process.test.js`
4. Run tests: `node src/electron/__tests__/run-tests.js`

## Known Limitations

1. **Global shortcuts may conflict** with other applications or system shortcuts
   - The implementation handles this gracefully by logging warnings
   - Users can still use menu items or buttons as alternatives

2. **Platform differences**
   - `CommandOrControl` automatically maps to Cmd on macOS and Ctrl on Windows/Linux
   - Alt+F4 is Windows-specific; macOS uses Cmd+Q

3. **Shortcut availability**
   - Some shortcuts may be reserved by the operating system
   - The application continues to work even if shortcuts fail to register

## Future Enhancements

Potential improvements for future versions:

- [ ] User-configurable keyboard shortcuts
- [ ] Shortcut conflict detection and resolution
- [ ] Visual shortcut reference (Help menu)
- [ ] Additional shortcuts for common actions
- [ ] Shortcut customization UI in settings
