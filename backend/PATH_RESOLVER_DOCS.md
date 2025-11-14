# PathResolver Utility Documentation

## Overview

The `PathResolver` utility provides a centralized way to detect the Electron environment and resolve file system paths for both development and production builds. It handles platform-specific paths and ensures the application can locate bundled binaries, user data, and other resources correctly.

## Requirements Coverage

This implementation satisfies the following requirements:

- **Requirement 6.1**: Bundle yt-dlp executable within the application package
- **Requirement 6.2**: Include ffmpeg binaries for video/audio processing
- **Requirement 6.3**: Use bundled versions from the application directory

## Features

### Environment Detection

- **Electron Detection**: Multiple methods to reliably detect if running in Electron
- **Development Mode**: Distinguishes between development and production builds
- **Packaged Detection**: Identifies if the app is running from app.asar

### Path Resolution

#### Development vs Production

| Path Type | Development | Production (Electron) |
|-----------|-------------|----------------------|
| Resources | `{project}/binaries` | `{app}/resources/binaries` |
| User Data | `%APPDATA%/yt-downloader` | `%APPDATA%/yt-downloader` |
| Downloads | `~/Downloads/YT-Downloads` | `~/Downloads/YT-Downloads` |
| Binaries | `{project}/binaries/{name}.exe` | `{app}/resources/binaries/{name}.exe` |

#### Platform-Specific Paths

**Windows:**
- User Data: `%APPDATA%\yt-downloader`
- Downloads: `%USERPROFILE%\Downloads\YT-Downloads`

**macOS:**
- User Data: `~/Library/Application Support/yt-downloader`
- Downloads: `~/Downloads/YT-Downloads`

**Linux:**
- User Data: `~/.config/yt-downloader`
- Downloads: `~/Downloads/YT-Downloads`

## API Reference

### Static Methods

#### Environment Detection

##### `isElectron(): boolean`

Detects if the application is running in Electron environment.

**Detection Methods:**
1. Checks `process.versions.electron`
2. Checks environment variables (`ELECTRON_RUN_AS_NODE`, `IS_ELECTRON`)
3. Checks process type (`renderer`)
4. Checks if running from `app.asar`

**Returns:** `true` if running in Electron, `false` otherwise

**Example:**
```javascript
if (PathResolver.isElectron()) {
    console.log('Running in Electron');
}
```

##### `isDevelopment(): boolean`

Checks if the application is running in development mode.

**Returns:** `true` if in development mode

**Example:**
```javascript
if (PathResolver.isDevelopment()) {
    console.log('Development mode - using local binaries');
}
```

##### `isPackaged(): boolean`

Checks if the application is packaged (production build).

**Returns:** `true` if running from app.asar

#### Path Resolution

##### `getAppPath(): string`

Gets the application's root directory.

**Returns:** Application root path

##### `getResourcesPath(): string`

Gets the resources directory path where bundled files are located.

**Development:** `{project}/binaries`
**Production:** `{app}/resources` or `process.resourcesPath`

**Returns:** Resources directory path

##### `getUserDataPath(): string`

Gets the user data directory for storing application data, settings, and logs.

**Returns:** Platform-specific user data path

##### `getDownloadsPath(): string`

Gets the default downloads directory.

**Returns:** Downloads directory path

##### `getBinaryPath(binaryName: string): string`

Gets the full path to a bundled binary.

**Parameters:**
- `binaryName` - Name of the binary ('yt-dlp' or 'ffmpeg')

**Returns:** Full path to the binary with platform-specific extension

**Example:**
```javascript
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
// Windows: C:\app\resources\binaries\yt-dlp.exe
// Linux/Mac: /app/resources/binaries/yt-dlp
```

##### `getTempPath(): string`

Gets the system temporary directory.

**Returns:** Temp directory path

##### `getLogsPath(): string`

Gets the logs directory path.

**Returns:** Logs directory path (`{userData}/logs`)

##### `getCachePath(): string`

Gets the cache directory path.

**Returns:** Cache directory path (`{userData}/cache`)

#### Utility Methods

##### `binaryExists(binaryName: string): boolean`

Checks if a binary exists at the expected path.

**Parameters:**
- `binaryName` - Name of the binary to check

**Returns:** `true` if binary exists

**Example:**
```javascript
if (!PathResolver.binaryExists('yt-dlp')) {
    console.error('yt-dlp binary not found!');
}
```

##### `ensureDirectory(dirPath: string): boolean`

Ensures a directory exists, creates it if it doesn't.

**Parameters:**
- `dirPath` - Directory path to ensure

**Returns:** `true` if directory exists or was created successfully

##### `initializeDirectories(): object`

Creates all necessary application directories.

**Returns:** Object with creation status for each directory

**Example:**
```javascript
const results = PathResolver.initializeDirectories();
console.log('User Data:', results.userData ? '✓' : '✗');
console.log('Downloads:', results.downloads ? '✓' : '✗');
console.log('Logs:', results.logs ? '✓' : '✗');
console.log('Cache:', results.cache ? '✓' : '✗');
```

##### `getAllPaths(): object`

Gets all application paths in a single object.

**Returns:** Object containing all paths and environment info

**Example:**
```javascript
const paths = PathResolver.getAllPaths();
console.log(paths);
// {
//   isElectron: true,
//   isDevelopment: false,
//   isPackaged: true,
//   app: 'C:\\Program Files\\YT Downloader',
//   resources: 'C:\\Program Files\\YT Downloader\\resources',
//   userData: 'C:\\Users\\User\\AppData\\Roaming\\yt-downloader',
//   downloads: 'C:\\Users\\User\\Downloads\\YT-Downloads',
//   temp: 'C:\\Users\\User\\AppData\\Local\\Temp',
//   logs: 'C:\\Users\\User\\AppData\\Roaming\\yt-downloader\\logs',
//   cache: 'C:\\Users\\User\\AppData\\Roaming\\yt-downloader\\cache',
//   ytdlp: 'C:\\Program Files\\YT Downloader\\resources\\binaries\\yt-dlp.exe',
//   ffmpeg: 'C:\\Program Files\\YT Downloader\\resources\\binaries\\ffmpeg.exe',
//   ytdlpExists: true,
//   ffmpegExists: true
// }
```

##### `logPaths(verbose: boolean = false): void`

Logs all paths to console for debugging.

**Parameters:**
- `verbose` - Include additional process information

**Example:**
```javascript
PathResolver.logPaths(true);
```

## Usage Examples

### Basic Usage in Backend Server

```javascript
import PathResolver from './electron-paths.js';

// Initialize directories on startup
PathResolver.initializeDirectories();

// Get downloads path
const downloadsDir = PathResolver.getDownloadsPath();

// Get binary paths
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
const ffmpegPath = PathResolver.getBinaryPath('ffmpeg');

// Check if binaries exist
if (!PathResolver.binaryExists('yt-dlp')) {
    console.error('yt-dlp not found at:', ytdlpPath);
}

// Use in youtube-dl-exec
import youtubedl from 'youtube-dl-exec';

const yt = (url, options) => youtubedl(url, {
    ...options,
    youtubeDlPath: ytdlpPath
});
```

### Environment-Specific Configuration

```javascript
import PathResolver from './electron-paths.js';

if (PathResolver.isElectron()) {
    console.log('Running in Electron - using bundled binaries');
    
    if (PathResolver.isDevelopment()) {
        console.log('Development mode - hot reload enabled');
    } else {
        console.log('Production mode - using packaged resources');
    }
} else {
    console.log('Running as standalone Node.js app');
}
```

### Logging and Debugging

```javascript
import PathResolver from './electron-paths.js';

// Log all paths on startup
console.log('Application initialized');
PathResolver.logPaths(true);

// Check binary status
const paths = PathResolver.getAllPaths();
if (!paths.ytdlpExists || !paths.ffmpegExists) {
    console.error('Missing binaries!');
    console.error('yt-dlp:', paths.ytdlpExists ? '✓' : '✗');
    console.error('ffmpeg:', paths.ffmpegExists ? '✓' : '✗');
}
```

### Integration with Express Server

```javascript
import express from 'express';
import PathResolver from './electron-paths.js';

const app = express();

// Health check endpoint with path info
app.get('/api/health', (req, res) => {
    const paths = PathResolver.getAllPaths();
    res.json({
        status: 'ok',
        electron: paths.isElectron,
        development: paths.isDevelopment,
        binaries: {
            ytdlp: paths.ytdlpExists,
            ffmpeg: paths.ffmpegExists
        }
    });
});

// Get system paths endpoint
app.get('/api/paths', (req, res) => {
    res.json(PathResolver.getAllPaths());
});
```

## Environment Variables

The PathResolver respects the following environment variables when set by the Electron main process:

| Variable | Purpose | Example |
|----------|---------|---------|
| `IS_ELECTRON` | Force Electron detection | `true` |
| `ELECTRON_DEV` | Force development mode | `true` |
| `NODE_ENV` | Node environment | `development` or `production` |
| `ELECTRON_USER_DATA` | Override user data path | `C:\Users\User\AppData\Roaming\yt-downloader` |
| `ELECTRON_DOWNLOADS_PATH` | Override downloads path | `C:\Users\User\Downloads\YT-Downloads` |
| `ELECTRON_APP_PATH` | Override app path | `C:\Program Files\YT Downloader` |

## Testing

Run the test suite to verify PathResolver functionality:

```bash
node backend/test-path-resolver.js
```

The test suite covers:
1. Environment detection
2. Path resolution
3. Binary path resolution
4. Directory initialization
5. Complete path information
6. Simulated Electron environment

## Troubleshooting

### Binary Not Found

**Problem:** `binaryExists()` returns `false`

**Solutions:**
1. Check if binaries are in the correct location
2. Verify binary names match exactly ('yt-dlp', 'ffmpeg')
3. Ensure binaries have correct file extensions (.exe on Windows)
4. Run `PathResolver.logPaths(true)` to see expected paths

### Wrong Path in Production

**Problem:** Paths point to development locations in production

**Solutions:**
1. Ensure `process.resourcesPath` is set by Electron main process
2. Check if `isPackaged()` returns `true`
3. Verify app is running from app.asar
4. Set `NODE_ENV=production` environment variable

### Permission Errors

**Problem:** Cannot create directories

**Solutions:**
1. Check user has write permissions to user data directory
2. Run app with appropriate permissions
3. Use `ensureDirectory()` to create directories with error handling

## Best Practices

1. **Initialize Early**: Call `initializeDirectories()` on application startup
2. **Check Binary Existence**: Always verify binaries exist before use
3. **Log Paths**: Use `logPaths()` during development for debugging
4. **Handle Errors**: Check return values from `ensureDirectory()`
5. **Environment Variables**: Let Electron main process set environment variables
6. **Platform Awareness**: Use `getBinaryPath()` for platform-specific extensions

## Integration with Electron Main Process

The Electron main process should set environment variables before starting the backend:

```javascript
// In Electron main.ts
import { app } from 'electron';
import { spawn } from 'child_process';

const backendProcess = spawn('node', ['backend/server.js'], {
    env: {
        ...process.env,
        IS_ELECTRON: 'true',
        NODE_ENV: app.isPackaged ? 'production' : 'development',
        ELECTRON_USER_DATA: app.getPath('userData'),
        ELECTRON_DOWNLOADS_PATH: app.getPath('downloads'),
        ELECTRON_APP_PATH: app.getAppPath()
    }
});
```

## Version History

- **v1.0.0** - Initial implementation with basic path resolution
- **v2.0.0** - Enhanced with multiple detection methods, directory initialization, and comprehensive logging

## License

MIT
