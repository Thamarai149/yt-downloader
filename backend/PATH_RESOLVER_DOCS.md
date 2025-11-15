# PathResolver Documentation

## Overview

The `PathResolver` utility provides intelligent path resolution for the YouTube Downloader backend, supporting both standalone and Electron environments with automatic detection and fallback mechanisms.

## Quick Start

```javascript
import PathResolver from './electron-paths.js';

// Check environment
const isElectron = PathResolver.isElectron();
const isDev = PathResolver.isDevelopment();

// Get paths
const userDataPath = PathResolver.getUserDataPath();
const downloadsPath = PathResolver.getDownloadsPath();
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');

// Initialize directories
PathResolver.initializeDirectories();

// Debug paths
PathResolver.logPaths(true);
```

## API Reference

### Environment Detection

#### `isElectron(): boolean`
Detects if running in Electron environment using multiple detection methods:
- Checks `process.versions.electron`
- Checks environment variables (`ELECTRON_RUN_AS_NODE`, `IS_ELECTRON`)
- Checks process type
- Checks for `app.asar` in module path

```javascript
if (PathResolver.isElectron()) {
  console.log('Running in Electron');
}
```

#### `isDevelopment(): boolean`
Checks if running in development mode:
- `NODE_ENV === 'development'`
- `ELECTRON_DEV === 'true'`
- Not packaged

```javascript
if (PathResolver.isDevelopment()) {
  console.log('Development mode');
}
```

#### `isPackaged(): boolean`
Checks if application is packaged (production build):
- In Electron: checks for `app.asar` in path
- Returns false in standalone mode

```javascript
if (PathResolver.isPackaged()) {
  console.log('Production build');
}
```

### Path Resolution

#### `getAppPath(): string`
Returns the application's root directory:
- **Electron Dev**: `process.cwd()`
- **Electron Prod**: `path.dirname(process.execPath)`
- **Standalone**: `process.cwd()`

#### `getResourcesPath(): string`
Returns the resources directory containing bundled files:
- **Electron Dev**: `{project}/binaries`
- **Electron Prod**: `{app}/resources`
- **Standalone**: `{project}/binaries`

#### `getUserDataPath(): string`
Returns platform-specific user data directory:
- **Windows**: `%APPDATA%\yt-downloader`
- **macOS**: `~/Library/Application Support/yt-downloader`
- **Linux**: `~/.config/yt-downloader`

Can be overridden with `ELECTRON_USER_DATA` environment variable.

#### `getDownloadsPath(): string`
Returns the downloads directory:
- Default: `{user}/Downloads/YT-Downloads`
- Can be overridden with `ELECTRON_DOWNLOADS_PATH` environment variable

#### `getBinaryPath(binaryName: string): string`
Returns path to bundled binary (yt-dlp or ffmpeg):
- Adds platform-specific extension (`.exe` on Windows)
- **Electron Dev**: `{project}/binaries/{binary}.exe`
- **Electron Prod**: `{app}/resources/binaries/{binary}.exe`
- **Standalone**: `{project}/binaries/{binary}.exe`

```javascript
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
const ffmpegPath = PathResolver.getBinaryPath('ffmpeg');
```

#### `getLogsPath(): string`
Returns logs directory: `{userData}/logs`

#### `getCachePath(): string`
Returns cache directory: `{userData}/cache`

#### `getTempPath(): string`
Returns system temporary directory: `os.tmpdir()`

### Utility Methods

#### `binaryExists(binaryName: string): boolean`
Checks if a binary exists at the expected path:

```javascript
if (PathResolver.binaryExists('yt-dlp')) {
  console.log('yt-dlp is available');
}
```

#### `ensureDirectory(dirPath: string): boolean`
Creates directory if it doesn't exist (recursive):

```javascript
const success = PathResolver.ensureDirectory('/path/to/dir');
```

#### `initializeDirectories(): object`
Creates all necessary application directories:

```javascript
const results = PathResolver.initializeDirectories();
// Returns: { userData: true, downloads: true, logs: true, cache: true }
```

#### `getAllPaths(): object`
Returns object with all paths and environment info:

```javascript
const paths = PathResolver.getAllPaths();
console.log(paths);
// {
//   isElectron: false,
//   isDevelopment: true,
//   isPackaged: false,
//   app: 'C:/project',
//   resources: 'C:/project/binaries',
//   userData: 'C:/Users/User/AppData/Roaming/yt-downloader',
//   downloads: 'C:/Users/User/Downloads/YT-Downloads',
//   temp: 'C:/Users/User/AppData/Local/Temp',
//   logs: 'C:/Users/User/AppData/Roaming/yt-downloader/logs',
//   cache: 'C:/Users/User/AppData/Roaming/yt-downloader/cache',
//   ytdlp: 'C:/project/binaries/yt-dlp.exe',
//   ffmpeg: 'C:/project/binaries/ffmpeg.exe',
//   ytdlpExists: false,
//   ffmpegExists: false
// }
```

#### `logPaths(verbose: boolean): void`
Logs all paths to console for debugging:

```javascript
PathResolver.logPaths(true); // Include process info
```

## Environment Variables

The PathResolver respects these environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `IS_ELECTRON` | Force Electron detection | `'true'` |
| `ELECTRON_RUN_AS_NODE` | Electron flag | `'1'` |
| `NODE_ENV` | Environment mode | `'development'` or `'production'` |
| `ELECTRON_DEV` | Development flag | `'true'` |
| `ELECTRON_APP_PATH` | Override app path | `'/path/to/app'` |
| `ELECTRON_USER_DATA` | Override user data path | `'/path/to/userdata'` |
| `ELECTRON_DOWNLOADS_PATH` | Override downloads path | `'/path/to/downloads'` |

## Usage Examples

### Example 1: Basic Path Resolution

```javascript
import PathResolver from './electron-paths.js';

// Get user data directory
const userDataPath = PathResolver.getUserDataPath();
console.log('User data:', userDataPath);

// Get downloads directory
const downloadsPath = PathResolver.getDownloadsPath();
console.log('Downloads:', downloadsPath);

// Get binary paths
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
const ffmpegPath = PathResolver.getBinaryPath('ffmpeg');
console.log('yt-dlp:', ytdlpPath);
console.log('ffmpeg:', ffmpegPath);
```

### Example 2: Directory Initialization

```javascript
import PathResolver from './electron-paths.js';

// Initialize all directories
const results = PathResolver.initializeDirectories();

if (results.userData && results.downloads) {
  console.log('✅ All directories created');
} else {
  console.error('❌ Failed to create some directories');
}
```

### Example 3: Conditional Logic

```javascript
import PathResolver from './electron-paths.js';

if (PathResolver.isElectron()) {
  console.log('Running in Electron');
  
  if (PathResolver.isDevelopment()) {
    console.log('Development mode - using local binaries');
  } else {
    console.log('Production mode - using bundled binaries');
  }
} else {
  console.log('Running standalone');
}
```

### Example 4: Config File Storage

```javascript
import PathResolver from './electron-paths.js';
import fs from 'fs';
import path from 'path';

// Store config in user data directory
const configDir = PathResolver.getUserDataPath();
const configPath = path.join(configDir, 'config.json');

// Ensure directory exists
PathResolver.ensureDirectory(configDir);

// Save config
const config = { theme: 'dark', quality: '1080p' };
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

// Load config
const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
```

### Example 5: Binary Verification

```javascript
import PathResolver from './electron-paths.js';

// Check if binaries exist
const ytdlpExists = PathResolver.binaryExists('yt-dlp');
const ffmpegExists = PathResolver.binaryExists('ffmpeg');

if (ytdlpExists && ffmpegExists) {
  console.log('✅ All binaries available');
} else {
  console.warn('⚠️  Some binaries missing');
  if (!ytdlpExists) console.warn('  - yt-dlp not found');
  if (!ffmpegExists) console.warn('  - ffmpeg not found');
}
```

## Platform-Specific Behavior

### Windows
- User data: `%APPDATA%\yt-downloader`
- Downloads: `%USERPROFILE%\Downloads\YT-Downloads`
- Binary extension: `.exe`

### macOS
- User data: `~/Library/Application Support/yt-downloader`
- Downloads: `~/Downloads/YT-Downloads`
- Binary extension: none

### Linux
- User data: `~/.config/yt-downloader`
- Downloads: `~/Downloads/YT-Downloads`
- Binary extension: none

## Debugging

### Enable Verbose Logging

```javascript
PathResolver.logPaths(true);
```

Output:
```
📁 Application Paths:
  Environment:
    Electron: false
    Development: true
    Packaged: false
    Platform: win32
  Directories:
    App: C:\project
    Resources: C:\project\binaries
    User Data: C:\Users\User\AppData\Roaming\yt-downloader
    Downloads: C:\Users\User\Downloads\YT-Downloads
    Logs: C:\Users\User\AppData\Roaming\yt-downloader\logs
    Cache: C:\Users\User\AppData\Roaming\yt-downloader\cache
    Temp: C:\Users\User\AppData\Local\Temp
  Binaries:
    yt-dlp: C:\project\binaries\yt-dlp.exe ✗
    ffmpeg: C:\project\binaries\ffmpeg.exe ✗
  Process Info:
    CWD: C:\project
    Exec Path: C:\Program Files\nodejs\node.exe
    Node Version: v18.0.0
```

### Common Issues

**Issue: Binaries not found**
```javascript
// Check binary paths
console.log('yt-dlp path:', PathResolver.getBinaryPath('yt-dlp'));
console.log('yt-dlp exists:', PathResolver.binaryExists('yt-dlp'));

// Check resources path
console.log('Resources path:', PathResolver.getResourcesPath());
```

**Issue: Wrong user data directory**
```javascript
// Override with environment variable
process.env.ELECTRON_USER_DATA = '/custom/path';
console.log('User data:', PathResolver.getUserDataPath());
```

**Issue: Electron not detected**
```javascript
// Force Electron mode
process.env.IS_ELECTRON = 'true';
console.log('Is Electron:', PathResolver.isElectron());
```

## Testing

Run the test script to verify functionality:

```bash
node backend/test-electron-compatibility.js
```

## Integration with Electron

In your Electron main process:

```javascript
import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';

// Start backend server
const backendProcess = spawn('node', ['backend/server.js'], {
  env: {
    ...process.env,
    IS_ELECTRON: 'true',
    ELECTRON_APP_PATH: app.getAppPath(),
    ELECTRON_USER_DATA: app.getPath('userData'),
    ELECTRON_DOWNLOADS_PATH: path.join(app.getPath('downloads'), 'YT-Downloads'),
    PORT: '4000',
    NODE_ENV: 'production'
  }
});
```

## See Also

- [BinaryManager Documentation](./binary-manager.js)
- [Electron Compatibility Guide](./ELECTRON_COMPATIBILITY.md)
- [Server Configuration](./server.js)
