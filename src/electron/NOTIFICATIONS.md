# Native Notifications Implementation

## Overview

The Electron application now supports native Windows notifications for download events. This provides a better user experience compared to browser notifications, with proper system integration and click-to-restore functionality.

## Features

### 1. Native Notification Support
- Uses Electron's `Notification` API for native Windows notifications
- Automatically detects if running in Electron environment
- Falls back to browser notifications when not in Electron

### 2. Notification Types
- **Download Complete**: Shown when a download finishes successfully
- **Download Error**: Shown when a download fails

### 3. User Settings
Users can control notifications through the Settings tab:
- **Desktop Notifications**: Master toggle for all notifications
- **Notify on Download Complete**: Toggle for completion notifications (Electron only)
- **Notify on Download Error**: Toggle for error notifications (Electron only)

### 4. Click-to-Restore
When a user clicks on a notification:
- The main window is automatically restored and focused
- The app navigates to the relevant tab (History for completed, Queue for errors)

## Implementation Details

### Backend (IPC Handler)

The notification system is implemented in `src/electron/ipc-handler.js`:

```javascript
// Main notification handler
ipcMain.handle('notification:show', async (event, options) => {
  // Check if notifications are supported
  // Load user settings
  // Check if notifications are enabled
  // Create and show notification
  // Handle notification click
});

// Convenience handlers
ipcMain.handle('notification:download-complete', ...);
ipcMain.handle('notification:download-error', ...);
```

### Frontend Integration

The frontend (`client/src/AppEnhanced.tsx`) integrates with Electron notifications:

```typescript
// Detect Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && window.electron !== undefined;
};

// Show notification (uses Electron if available)
const showDesktopNotification = async (title: string, body: string) => {
  if (isElectron() && window.electron?.notifications) {
    await window.electron.notifications.show({
      title,
      body,
      type: 'download-complete',
    });
  } else {
    // Fallback to browser notification
    new Notification(title, { body });
  }
};
```

### Settings Management

Notification settings are stored in the user's settings file:

```json
{
  "showDesktopNotifications": true,
  "notifyOnComplete": true,
  "notifyOnError": true
}
```

Settings are:
- Loaded on application startup
- Saved when changed through the UI
- Validated before being applied
- Synced between main and renderer processes

## API Reference

### IPC Channels

#### `notification:show`
Shows a native notification.

**Parameters:**
```typescript
{
  title: string;
  body: string;
  icon?: string;
  id?: string;
  type?: 'download-complete' | 'download-error';
}
```

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `notification:download-complete`
Convenience method for download completion notifications.

**Parameters:**
```typescript
{
  title?: string;
  filename: string;
  downloadPath?: string;
}
```

#### `notification:download-error`
Convenience method for download error notifications.

**Parameters:**
```typescript
{
  title?: string;
  filename: string;
  error: string;
}
```

### Frontend API

#### `window.electron.notifications.show(options)`
Shows a native notification.

#### `window.electron.notifications.onClicked(callback)`
Registers a callback for notification click events.

**Callback receives:**
```typescript
{
  id?: string;
  type?: string;
}
```

## Testing

Tests are located in `src/electron/__tests__/main-process.test.js`:

- ✓ Notification handlers are registered
- ✓ Settings are respected (global and type-specific)
- ✓ Notifications are created when enabled
- ✓ Window is restored on notification click
- ✓ Default settings include notification preferences

Run tests with:
```bash
node src/electron/__tests__/run-tests.js
```

## Usage Examples

### From Frontend

```typescript
// Show download complete notification
await window.electron.notifications.show({
  title: 'Download Complete',
  body: 'video.mp4 has been downloaded successfully',
  type: 'download-complete',
});

// Show error notification
await window.electron.notifications.show({
  title: 'Download Failed',
  body: 'Failed to download video.mp4: Network error',
  type: 'download-error',
});

// Listen for notification clicks
window.electron.notifications.onClicked((data) => {
  console.log('Notification clicked:', data);
  // Navigate to appropriate tab
  if (data.type === 'download-complete') {
    setActiveTab('history');
  }
});
```

### Settings Management

```typescript
// Load settings
const settings = await window.electron.settings.get();
console.log(settings.showDesktopNotifications); // true/false

// Update settings
await window.electron.settings.set({
  showDesktopNotifications: true,
  notifyOnComplete: true,
  notifyOnError: false,
});
```

## Requirements Met

This implementation satisfies all requirements from task 4.2:

✅ Create notification handler for download completion
✅ Add notification for download errors
✅ Implement notification click handlers to show app
✅ Add setting to enable/disable notifications

## Future Enhancements

Potential improvements for future versions:

1. **Custom notification sounds**: Allow users to choose notification sounds
2. **Notification actions**: Add action buttons to notifications (e.g., "Open File", "Open Folder")
3. **Notification history**: Keep a log of recent notifications
4. **Do Not Disturb mode**: Temporarily disable notifications
5. **Notification priority**: Different notification styles for different priority levels
