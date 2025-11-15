# Binary Configuration Quick Reference

## Overview
This document provides a quick reference for the binary packaging configuration in the Electron application.

## Configuration Files

### electron-builder.json
```json
{
  "extraResources": [
    {
      "from": "binaries",
      "to": "binaries",
      "filter": ["**/*", "!README.md", "!*.tmp", "!*.zip", "!*.tar.gz", "!*.tar.xz", "!temp_extract"]
    }
  ],
  "asar": true,
  "asarUnpack": ["backend/node_modules/**/*"]
}
```

## Directory Structure

### Development
```
project-root/
└── binaries/
    ├── yt-dlp.exe
    ├── ffmpeg.exe
    └── checksums.json
```

### Production (Packaged)
```
YouTube Downloader Pro/
├── YouTube Downloader Pro.exe
└── resources/
    ├── app.asar
    └── binaries/
        ├── yt-dlp.exe
        ├── ffmpeg.exe
        └── checksums.json
```

## Usage in Code

```javascript
import PathResolver from './backend/electron-paths.js';

// Get binary paths (works in both dev and production)
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
const ffmpegPath = PathResolver.getBinaryPath('ffmpeg');

// Check if binaries exist
const ytdlpExists = PathResolver.binaryExists('yt-dlp');
const ffmpegExists = PathResolver.binaryExists('ffmpeg');
```

## NPM Scripts

```bash
# Download binaries
npm run download:binaries

# Test binary configuration
npm run test:packaged-binaries

# Build application (includes binary download)
npm run electron:build

# Package for Windows
npm run package:win
```

## Testing

Run the comprehensive test suite:
```bash
npm run test:packaged-binaries
```

This verifies:
- ✅ Binary files exist
- ✅ Electron Builder configuration
- ✅ PathResolver works correctly
- ✅ Binaries are executable
- ✅ Package scripts are configured

## Troubleshooting

### Binaries not found after packaging
1. Check `extraResources` in `electron-builder.json`
2. Verify binaries exist in `/binaries` directory
3. Run `npm run download:binaries`

### Binary execution fails
1. Verify checksums: `npm run test:binary-verification`
2. Check antivirus software
3. Re-download: `npm run download:binaries`

## Requirements Satisfied

- **6.1:** Bundle yt-dlp executable ✅
- **6.2:** Include ffmpeg binaries ✅
- **6.3:** Use bundled versions ✅
- **6.4:** Verify integrity with checksums ✅

## Additional Documentation

- Full documentation: [BINARY_PACKAGING.md](../BINARY_PACKAGING.md)
- Binary download script: [scripts/download-binaries.js](../scripts/download-binaries.js)
- Path resolver: [backend/electron-paths.js](../backend/electron-paths.js)
