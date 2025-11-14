# System Tray Integration

## Overview

The system tray integration allows the YouTube Downloader Pro application to run in the background and be accessed from the Windows system tray (notification area).

## Features

### 1. System Tray Icon
- The application creates a system tray icon when it starts
- The icon appears in the Windows notification area (bottom-right corner)
- Tooltip shows "YouTube Downloader Pro" when hovering over the icon

### 2. Context Menu
Right-clicking the tray icon shows a menu with the following options:
- **Show**: Displays the main window if it's hidden
- **Hide**: Hides the main window
- **Quit**: Closes the application completely

### 3. Click Handlers
- **Single Click**: Toggles window visibility (show/hide)
- **Double Click**: Always shows the window

### 4. Minimize to Tray
- When the user closes the main window, it minimizes to the tray instead of quitting
- This behavior can be controlled via the `closeToTray` setting
- Default behavior: enabled (window closes to tray)

## Settings

The system tray behavior is controlled by the following settings:

```javascript
{
  closeToTray: true,      // Close window to tray instead of quitting
  minimizeToTray: true    // Minimize window to tray
}
```

## Implementation Details

### ApplicationManager
The `ApplicationManager` class handles system tray creation and management:

- `createSystemTray()`: Creates the tray icon and menu
- `updateTrayMenu()`: Updates the context menu
- `toggleWindowVisibility()`: Toggles window show/hide
- `shouldMinimizeToTray()`: Checks if window should minimize to tray
- `setCloseToTray(enabled)`: Sets the close-to-tray behavior

### IPC Handlers
Window management is exposed to the renderer process via IPC:

- `window:minimize`: Minimize the window
- `window:maximize`: Maximize/restore the window
- `window:hide`: Hide the window
- `window:show`: Show the window
- `window:restore`: Restore window from tray
- `window:toggle-fullscreen`: Toggle fullscreen mode

### Preload Script
The preload script exposes window management APIs:

```javascript
window.electron.window.minimize()
window.electron.window.maximize()
window.electron.window.hide()
window.electron.window.show()
window.electron.window.restore()
window.electron.window.toggleFullscreen()
```

## Icon Requirements

The system tray uses the application icon from:
- `build-resources/icon.ico` (Windows)

If the icon file is not found, the application will use a default empty icon.

## User Experience

1. **First Launch**: Application starts with window visible and tray icon created
2. **Close Window**: Window hides to tray (if closeToTray is enabled)
3. **Click Tray Icon**: Window shows/hides
4. **Right-click Tray**: Shows context menu
5. **Quit from Tray**: Application closes completely

## Future Enhancements

Potential improvements for future versions:
- Custom tray icon for different states (idle, downloading, etc.)
- Notification badges on tray icon
- Quick actions in tray menu (start download, open settings)
- Tray icon animations during downloads
