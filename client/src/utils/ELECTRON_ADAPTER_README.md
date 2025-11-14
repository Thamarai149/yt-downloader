# Electron Adapter Documentation

## Overview

The Electron Adapter provides a clean abstraction layer for Electron-specific features, allowing the application to work seamlessly in both Electron and web environments.

## Architecture

### Files

- **`electron-adapter.ts`**: Main adapter class with all Electron API methods
- **`useElectron.ts`**: React hooks for easy integration in components
- **`ElectronExample.tsx`**: Example component demonstrating usage

### Key Features

1. **Environment Detection**: Automatically detects if running in Electron or web
2. **Fallback Behavior**: Provides sensible fallbacks for web environment
3. **Type Safety**: Full TypeScript support with proper type definitions
4. **React Integration**: Custom hooks for easy use in React components
5. **Singleton Pattern**: Single instance shared across the application

## Usage

### Basic Usage

```typescript
import electronAdapter from '../utils/electron-adapter';

// Check if running in Electron
if (electronAdapter.isElectron()) {
  // Electron-specific code
  const backendUrl = await electronAdapter.getBackendUrl();
}
```

### Using React Hooks

```typescript
import { useIsElectron, useBackendUrl, useSettings } from '../hooks/useElectron';

function MyComponent() {
  const isElectron = useIsElectron();
  const { backendUrl } = useBackendUrl();
  const { settings, saveSettings } = useSettings();

  // Component logic
}
```

## Available Methods

### Platform Detection

- `isElectron()`: Check if running in Electron
- `getPlatform()`: Get platform name (win32, darwin, linux, web)
- `isWindows()`: Check if running on Windows
- `isMacOS()`: Check if running on macOS
- `isLinux()`: Check if running on Linux

### App Information

- `getVersion()`: Get application version
- `getPaths()`: Get application paths (downloads, userData, etc.)
- `getPlatformInfo()`: Get detailed platform information

### Backend Management

- `getBackendUrl()`: Get backend server URL (dynamic in Electron)
- `getBackendStatus()`: Get backend server status
- `restartBackend()`: Restart backend server

### Settings Management

- `getSettings()`: Load user settings
- `saveSettings(settings)`: Save user settings
- `resetSettings()`: Reset settings to defaults

### Window Management

- `minimizeWindow()`: Minimize application window
- `maximizeWindow()`: Maximize/restore window
- `hideWindow()`: Hide window (to tray)
- `showWindow()`: Show window
- `restoreWindow()`: Restore window from tray
- `toggleFullscreen()`: Toggle fullscreen mode

### File Operations

- `selectDownloadFolder()`: Open folder picker dialog
- `openFolder(path)`: Open folder in file explorer
- `openFile(path)`: Open file in default application
- `showFileInFolder(path)`: Reveal file in file explorer
- `fileExists(path)`: Check if file exists
- `openDownloadsFolder()`: Open downloads folder

### Notifications

- `showNotification(options)`: Show desktop notification
- `showDownloadCompleteNotification(filename, path)`: Show download complete notification
- `showDownloadErrorNotification(filename, error)`: Show download error notification
- `requestNotificationPermission()`: Request notification permission (web)
- `onNotificationClicked(callback)`: Register notification click handler

### Dialogs

- `showErrorDialog(message, title, detail)`: Show error dialog
- `showInfoDialog(message, title, detail)`: Show info dialog
- `showConfirmDialog(message, title, detail, confirmLabel, cancelLabel)`: Show confirm dialog

### Updates

- `checkForUpdates()`: Check for application updates
- `downloadUpdate()`: Download available update
- `installUpdate()`: Install downloaded update
- `onUpdateProgress(callback)`: Register update progress handler

### Menu Events

- `onOpenSettings(callback)`: Register settings menu handler
- `onToggleTheme(callback)`: Register theme toggle handler
- `onShowAbout(callback)`: Register about dialog handler

### External Links

- `openExternal(url)`: Open URL in default browser

## React Hooks

### useIsElectron()

Returns boolean indicating if running in Electron.

```typescript
const isElectron = useIsElectron();
```

### usePlatform()

Returns platform information.

```typescript
const { platform, isWindows, isMacOS, isLinux, platformInfo } = usePlatform();
```

### useBackendUrl()

Returns backend URL and loading state.

```typescript
const { backendUrl, loading } = useBackendUrl();
```

### useSettings()

Manages user settings with loading and error states.

```typescript
const { settings, loading, error, saveSettings, resetSettings, reloadSettings } = useSettings();
```

### useWindowControls()

Provides window control functions.

```typescript
const { minimize, maximize, hide, show, restore, toggleFullscreen } = useWindowControls();
```

### useFileOperations()

Provides file operation functions.

```typescript
const { selectFolder, openFolder, openFile, showInFolder, fileExists, openDownloadsFolder } = useFileOperations();
```

### useNotifications()

Manages notifications with permission state.

```typescript
const { permissionGranted, showNotification, showDownloadComplete, showDownloadError, onNotificationClicked } = useNotifications();
```

### useDialogs()

Provides dialog functions.

```typescript
const { showError, showInfo, showConfirm } = useDialogs();
```

### useUpdates()

Manages application updates.

```typescript
const { updateInfo, checking, downloading, downloadProgress, checkForUpdates, downloadUpdate, installUpdate } = useUpdates();
```

### useMenuEvents()

Registers menu event handlers.

```typescript
useMenuEvents(
  () => console.log('Settings opened'),
  () => console.log('Theme toggled'),
  () => console.log('About shown')
);
```

### useAppVersion()

Returns application version.

```typescript
const version = useAppVersion();
```

## Example: Download Complete Notification

```typescript
import { useNotifications } from '../hooks/useElectron';

function DownloadManager() {
  const { showDownloadComplete } = useNotifications();

  const handleDownloadComplete = async (filename: string, path: string) => {
    await showDownloadComplete(filename, path);
  };

  return (
    // Component JSX
  );
}
```

## Example: Settings Management

```typescript
import { useSettings } from '../hooks/useElectron';

function SettingsPage() {
  const { settings, loading, saveSettings } = useSettings();

  const handleSave = async () => {
    const success = await saveSettings({
      theme: 'dark',
      downloadPath: '/custom/path',
      showDesktopNotifications: true,
    });
    
    if (success) {
      console.log('Settings saved!');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Settings</h1>
      <p>Theme: {settings?.theme}</p>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

## Example: File Operations

```typescript
import { useFileOperations } from '../hooks/useElectron';

function DownloadPathSelector() {
  const { selectFolder } = useFileOperations();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    const folder = await selectFolder();
    if (folder) {
      setSelectedPath(folder);
    }
  };

  return (
    <div>
      <button onClick={handleSelectFolder}>Select Download Folder</button>
      {selectedPath && <p>Selected: {selectedPath}</p>}
    </div>
  );
}
```

## Best Practices

1. **Always check environment**: Use `isElectron()` before calling Electron-specific features
2. **Handle errors gracefully**: All methods return promises that may reject
3. **Use hooks in components**: Prefer React hooks over direct adapter calls in components
4. **Provide fallbacks**: Ensure web version has alternative behavior
5. **Type safety**: Use TypeScript types for better development experience

## Security Considerations

The Electron adapter follows security best practices:

- **Context Isolation**: Enabled in preload script
- **No Node Integration**: Disabled in renderer process
- **Limited API Surface**: Only necessary APIs exposed via contextBridge
- **Input Validation**: All inputs validated before passing to main process
- **No Direct File System Access**: All file operations go through IPC

## Troubleshooting

### Backend URL not loading

Ensure the backend server is started before the frontend tries to connect.

```typescript
const { backendUrl, loading } = useBackendUrl();

if (loading) {
  return <div>Connecting to backend...</div>;
}
```

### Notifications not showing

Check notification permissions:

```typescript
const { permissionGranted, showNotification } = useNotifications();

if (!permissionGranted) {
  // Request permission or show message
}
```

### Settings not persisting

Ensure settings are saved after changes:

```typescript
const { saveSettings } = useSettings();

await saveSettings(newSettings);
```

## Future Enhancements

- Auto-updater integration
- Deep link support
- Context menu integration
- Multiple window support
- Custom protocol handlers
