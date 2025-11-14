# Preload Script Security Documentation

## Overview

The preload script (`preload.ts`) provides a secure bridge between the Electron renderer process (frontend) and the main process. It implements security best practices to prevent unauthorized access to Node.js APIs and system resources.

## Security Architecture

### Context Isolation

**Enabled in `application-manager.js`:**
```javascript
webPreferences: {
  contextIsolation: true,  // ✅ Isolates renderer from Node.js
  nodeIntegration: false,  // ✅ Disables Node.js in renderer
  preload: path.join(__dirname, 'preload.js')
}
```

### Security Principles

1. **No Direct Node.js Access**: The renderer process cannot directly access Node.js APIs
2. **Controlled API Surface**: Only explicitly exposed APIs are available to the frontend
3. **Type Safety**: Full TypeScript definitions ensure compile-time safety
4. **Input Validation**: All IPC calls are validated in the main process
5. **Minimal Exposure**: Only necessary functionality is exposed

## Exposed APIs

### Safe APIs (Read-Only)

These APIs provide information without modifying system state:

- `electron.platform` - Current OS platform (synchronous)
- `electron.getVersion()` - Application version
- `electron.getPaths()` - Application paths
- `electron.getPlatform()` - Platform information
- `electron.backend.getUrl()` - Backend server URL
- `electron.backend.getStatus()` - Backend server status
- `electron.settings.get()` - Current settings
- `electron.files.exists()` - Check file existence

### Controlled APIs (Validated)

These APIs modify state but are validated in the main process:

- `electron.settings.set()` - Update settings (validated)
- `electron.settings.reset()` - Reset to defaults
- `electron.backend.restart()` - Restart backend server
- `electron.window.*` - Window management operations
- `electron.files.selectFolder()` - Native folder picker
- `electron.files.openFolder()` - Open in file explorer
- `electron.files.openFile()` - Open with default app
- `electron.notifications.show()` - Show native notifications
- `electron.dialog.*` - Show native dialogs
- `electron.updates.*` - Update management

### Event Listeners

Safe event listeners for main-to-renderer communication:

- `electron.notifications.onClicked()` - Notification click events
- `electron.updates.onProgress()` - Update download progress
- `electron.menu.onOpenSettings()` - Menu action events
- `electron.menu.onToggleTheme()` - Theme toggle events
- `electron.menu.onShowAbout()` - About dialog events

## What is NOT Exposed

The following are intentionally NOT exposed to prevent security risks:

❌ **File System Access**: No direct `fs` module access
❌ **Child Process**: No ability to spawn processes
❌ **Native Modules**: No access to native Node.js modules
❌ **Shell Commands**: No direct shell execution
❌ **Network Requests**: No direct `http`/`https` module access
❌ **Environment Variables**: No direct `process.env` access
❌ **System Information**: Limited to safe, read-only data

## Type Definitions

### Location

Type definitions are provided in two locations:

1. **Frontend Types**: `client/src/vite-env.d.ts`
   - Used by React components
   - Provides `window.electron` interface
   - Includes JSDoc documentation

2. **Electron Types**: `src/electron/types.d.ts`
   - Shared type definitions
   - Used by main process and preload script

### Usage in Frontend

```typescript
// Check if running in Electron
if (window.electron) {
  // Get backend URL
  const backendUrl = await window.electron.backend.getUrl();
  
  // Get settings
  const settings = await window.electron.settings.get();
  
  // Show notification
  await window.electron.notifications.show({
    title: 'Download Complete',
    body: 'Your video has been downloaded'
  });
}
```

## Security Best Practices Implemented

### 1. Context Bridge

✅ Uses `contextBridge.exposeInMainWorld()` to safely expose APIs
✅ Creates isolated context between renderer and main process
✅ Prevents prototype pollution attacks

### 2. IPC Communication

✅ All communication uses `ipcRenderer.invoke()` (async, promise-based)
✅ No synchronous IPC calls (prevents blocking)
✅ All handlers registered in main process with validation

### 3. Input Validation

✅ All user inputs validated in main process (IPC handlers)
✅ Path traversal prevention for file operations
✅ Type checking with TypeScript

### 4. Minimal Privileges

✅ Renderer process has minimal privileges
✅ All privileged operations handled in main process
✅ No direct access to system resources

### 5. Content Security Policy

The application should implement CSP headers (configured in main process):

```javascript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://i.ytimg.com",
        "connect-src 'self' http://localhost:* ws://localhost:*"
      ].join('; ')
    }
  });
});
```

## Validation Examples

### Settings Validation (in IPC Handler)

```javascript
async handleSettingsSet(settings) {
  // Validate download path
  if (settings.downloadPath) {
    const isValid = await this.validatePath(settings.downloadPath);
    if (!isValid) {
      return { success: false, error: 'Invalid download path' };
    }
  }
  
  // Validate quality setting
  if (settings.defaultQuality) {
    const validQualities = ['highest', 'high', 'medium', 'low'];
    if (!validQualities.includes(settings.defaultQuality)) {
      return { success: false, error: 'Invalid quality setting' };
    }
  }
  
  // Save validated settings
  return await this.saveSettings(settings);
}
```

### Path Validation

```javascript
validatePath(filePath) {
  // Prevent path traversal
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(filePath);
  
  // Check if path is within allowed directories
  const userDataPath = app.getPath('userData');
  const downloadsPath = app.getPath('downloads');
  
  return resolved.startsWith(userDataPath) || 
         resolved.startsWith(downloadsPath);
}
```

## Testing Security

### Manual Security Checks

1. **Verify Context Isolation**:
   ```javascript
   // In browser console (should be undefined)
   console.log(window.require); // undefined ✅
   console.log(window.process); // undefined ✅
   console.log(window.electron); // object ✅
   ```

2. **Test API Access**:
   ```javascript
   // Should work
   await window.electron.getVersion(); // ✅
   
   // Should not exist
   window.electron.require; // undefined ✅
   window.electron.process; // undefined ✅
   ```

3. **Verify IPC Validation**:
   ```javascript
   // Invalid input should be rejected
   await window.electron.settings.set({
     downloadPath: '../../../etc/passwd'
   }); // Should fail validation ✅
   ```

## Maintenance Guidelines

### Adding New APIs

When adding new APIs to the preload script:

1. **Assess Security Risk**: Is this API safe to expose?
2. **Add to Preload**: Expose via `contextBridge.exposeInMainWorld()`
3. **Add Type Definitions**: Update `client/src/vite-env.d.ts`
4. **Implement Handler**: Add IPC handler in `ipc-handler.js`
5. **Add Validation**: Validate all inputs in main process
6. **Document**: Update this file with new API details
7. **Test**: Verify security and functionality

### Security Review Checklist

Before exposing a new API:

- [ ] Does it require privileged access?
- [ ] Can it be abused to access unauthorized resources?
- [ ] Are all inputs validated?
- [ ] Is there a safer alternative?
- [ ] Is it necessary for the application?
- [ ] Are error messages safe (no sensitive info)?
- [ ] Is it documented with security considerations?

## Common Pitfalls to Avoid

### ❌ Don't Do This

```javascript
// DON'T expose entire modules
contextBridge.exposeInMainWorld('fs', require('fs'));

// DON'T expose process
contextBridge.exposeInMainWorld('process', process);

// DON'T expose shell
contextBridge.exposeInMainWorld('shell', require('child_process'));

// DON'T use synchronous IPC
ipcRenderer.sendSync('dangerous-operation');
```

### ✅ Do This Instead

```javascript
// DO expose specific, validated functions
contextBridge.exposeInMainWorld('electron', {
  readFile: (path) => ipcRenderer.invoke('file:read', path),
  // Handler validates path in main process
});

// DO use async IPC
ipcRenderer.invoke('safe-operation');

// DO validate in main process
ipcMain.handle('file:read', async (event, path) => {
  if (!isPathSafe(path)) {
    throw new Error('Invalid path');
  }
  return await fs.promises.readFile(path);
});
```

## References

- [Electron Security Documentation](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [IPC Security](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Compliance

This implementation follows:

- ✅ OWASP Electron Security Guidelines
- ✅ Electron Security Best Practices
- ✅ Requirements 1.2 and 1.4 from design document
- ✅ Zero Trust Architecture principles
