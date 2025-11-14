# Backend Electron Compatibility

This document describes the Electron compatibility features implemented in the backend server.

## Overview

The backend has been modified to work seamlessly in both standalone mode and when bundled with Electron. All changes are backward compatible and don't affect the web version functionality.

## Implemented Features

### 1. Path Resolution (electron-paths.js)

**File:** `backend/electron-paths.js`

The `PathResolver` utility provides Electron-aware path resolution:

#### Key Features:
- **Environment Detection**: Automatically detects if running in Electron
- **Development vs Production**: Handles different paths for dev and packaged builds
- **Platform Support**: Works on Windows, macOS, and Linux
- **Binary Path Resolution**: Locates bundled yt-dlp and ffmpeg binaries

#### Main Methods:
```javascript
PathResolver.isElectron()           // Detect Electron environment
PathResolver.isDevelopment()        // Check if in development mode
PathResolver.getResourcesPath()     // Get bundled resources directory
PathResolver.getUserDataPath()      // Get user data directory
PathResolver.getDownloadsPath()     // Get downloads directory
PathResolver.getBinaryPath(name)    // Get path to bundled binary
PathResolver.getAllPaths()          // Get all paths for debugging
```

#### Path Locations:

**Development Mode:**
- Resources: `{project}/binaries/`
- User Data: `%APPDATA%/yt-downloader/`
- Downloads: `{user}/Downloads/YT-Downloads/`

**Production Mode (Electron):**
- Resources: `{app}/resources/binaries/`
- User Data: `%APPDATA%/yt-downloader/`
- Downloads: `{user}/Downloads/YT-Downloads/`

### 2. Binary Management (binary-manager.js)

**File:** `backend/binary-manager.js`

The `BinaryManager` handles binary verification and fallback:

#### Key Features:
- **Binary Verification**: Checks if binaries exist and are executable
- **Bundled Binary Priority**: Uses bundled binaries first
- **System Fallback**: Falls back to system binaries if bundled ones fail
- **Startup Validation**: Verifies all binaries on server startup

#### Usage:
```javascript
const binaryManager = new BinaryManager();
const status = await binaryManager.initialize();

// Get binary paths
const ytdlpPath = binaryManager.getYtdlpPath();
const ffmpegPath = binaryManager.getFfmpegPath();

// Check if verified
if (binaryManager.isVerified()) {
  console.log('All binaries ready');
}
```

#### Binary Resolution Order:
1. Bundled binary (from resources directory)
2. System binary (from PATH)
3. Return null if not found

### 3. Server Startup Adaptations (server.js)

**File:** `backend/server.js`

The server has been adapted for Electron compatibility:

#### Key Features:

**Dynamic Port Configuration:**
```javascript
// Accepts port from environment variables
const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || '4000', 10);

// Finds available port if default is in use
const availablePort = await findAvailablePort(PORT);
```

**Startup Logging:**
```javascript
// Comprehensive startup logging for debugging
console.log('🚀 Starting Enhanced YT Downloader Server');
console.log(`🔌 Electron: ${PathResolver.isElectron() ? 'Yes' : 'No'}`);
console.log(`📁 Working Directory: ${process.cwd()}`);
```

**Graceful Shutdown:**
```javascript
// Handles process signals for clean shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Graceful shutdown closes:
// - HTTP server
// - WebSocket connections
// - Active downloads
```

**CORS Configuration:**
```javascript
// In Electron, allows all localhost origins with any port
function isOriginAllowed(origin) {
  if (PathResolver.isElectron() && origin.startsWith('http://localhost:')) {
    return true;
  }
  // ... other checks
}
```

**Port Communication:**
```javascript
// Writes port to file for Electron main process
if (PathResolver.isElectron()) {
  const portFile = path.join(PathResolver.getUserDataPath(), 'server-port.txt');
  fs.writeFileSync(portFile, availablePort.toString());
}
```

## Integration with Electron

### Environment Variables

The Electron main process should set these environment variables:

```javascript
// In Electron main process
const backendProcess = spawn('node', ['server.js'], {
  env: {
    ...process.env,
    PORT: '4000',                              // Preferred port
    IS_ELECTRON: 'true',                       // Electron flag
    ELECTRON_APP_PATH: app.getAppPath(),       // App path
    ELECTRON_USER_DATA: app.getPath('userData'), // User data path
    ELECTRON_DOWNLOADS_PATH: downloadsPath,    // Custom downloads path
    NODE_ENV: 'production'                     // Environment
  }
});
```

### Port Discovery

The Electron main process can discover the backend port:

```javascript
// Read port from file
const portFile = path.join(app.getPath('userData'), 'server-port.txt');
const port = fs.readFileSync(portFile, 'utf8');
const backendUrl = `http://localhost:${port}`;
```

## Testing

### Standalone Mode
```bash
cd backend
npm start
```

### Electron Mode (Simulated)
```bash
cd backend
set IS_ELECTRON=true
set PORT=4000
npm start
```

### Verify Paths
```bash
node -e "import('./backend/electron-paths.js').then(m => m.default.logPaths(true))"
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 6.1**: Path resolution for Electron environment ✅
- **Requirement 6.2**: Bundled binary usage with fallback ✅
- **Requirement 6.3**: Binary verification on startup ✅
- **Requirement 6.4**: Fallback to system binaries ✅
- **Requirement 1.4**: Backend server integration ✅
- **Requirement 5.1**: Error handling for server failures ✅

## Backward Compatibility

All changes are backward compatible:
- Works in standalone mode without Electron
- Falls back to system binaries if bundled ones are missing
- Uses standard paths when not in Electron
- No breaking changes to existing API

## Next Steps

For full Electron integration, implement:
1. Electron main process backend manager (Task 2.2)
2. IPC communication handlers (Task 2.3)
3. Binary bundling in build process (Task 9)
4. Settings management (Task 7)

## Troubleshooting

### Binaries Not Found
- Check `PathResolver.logPaths()` output
- Verify binaries exist in expected location
- Check file permissions (executable flag on Unix)

### Port Conflicts
- Server automatically finds available port
- Check `server-port.txt` for actual port used
- Ensure Electron main process reads the correct port

### CORS Issues
- Verify `isOriginAllowed()` function logic
- Check that origin starts with `http://localhost:`
- Ensure `PathResolver.isElectron()` returns true

## Files Modified

- ✅ `backend/electron-paths.js` - Created (Path resolution utility)
- ✅ `backend/binary-manager.js` - Created (Binary management utility)
- ✅ `backend/server.js` - Modified (Electron compatibility)
- ✅ `backend/ELECTRON_COMPATIBILITY.md` - Created (This documentation)
