# Binary Packaging Configuration

This document explains how binaries (yt-dlp and ffmpeg) are packaged with the Electron application.

## Overview

The application bundles yt-dlp and ffmpeg binaries to ensure users don't need to install these tools separately. The binaries are included in the packaged application using Electron Builder's `extraResources` feature.

## Configuration

### Electron Builder Configuration

The `electron-builder.json` file contains the configuration for including binaries:

```json
{
  "extraResources": [
    {
      "from": "binaries",
      "to": "binaries",
      "filter": [
        "**/*",
        "!README.md",
        "!*.tmp",
        "!*.zip",
        "!*.tar.gz",
        "!*.tar.xz",
        "!temp_extract"
      ]
    }
  ]
}
```

**Key Points:**
- `from`: Source directory containing binaries (project root `/binaries`)
- `to`: Destination directory in packaged app (`resources/binaries`)
- `filter`: Include all files except temporary/archive files

### Directory Structure

**Development:**
```
project-root/
├── binaries/
│   ├── yt-dlp.exe
│   ├── ffmpeg.exe
│   └── checksums.json
```

**Production (Packaged):**
```
YouTube Downloader Pro/
├── YouTube Downloader Pro.exe
├── resources/
│   ├── app.asar              (application code)
│   └── binaries/             (extraResources)
│       ├── yt-dlp.exe
│       ├── ffmpeg.exe
│       └── checksums.json
```

## Path Resolution

The `backend/electron-paths.js` module handles path resolution for different environments:

### Development Mode
- Binaries located at: `project-root/binaries/`
- Direct access to source binaries

### Production Mode (Packaged)
- Binaries located at: `resources/binaries/`
- Accessed via `process.resourcesPath`

### Example Usage

```javascript
import PathResolver from './backend/electron-paths.js';

// Get binary path (works in both dev and production)
const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
const ffmpegPath = PathResolver.getBinaryPath('ffmpeg');

// Check if binaries exist
const ytdlpExists = PathResolver.binaryExists('yt-dlp');
const ffmpegExists = PathResolver.binaryExists('ffmpeg');
```

## Build Process

### 1. Download Binaries

Before building, download the latest binaries:

```bash
npm run download:binaries
```

This script:
- Downloads yt-dlp from GitHub releases
- Downloads ffmpeg from official sources
- Verifies checksums for integrity
- Stores binaries in `/binaries` directory

### 2. Build Application

Build the complete application:

```bash
npm run electron:build
```

This command:
1. Downloads binaries (if not present)
2. Builds frontend (Vite)
3. Prepares backend files
4. Packages with Electron Builder
5. Creates installer

### 3. Package for Windows

Create Windows installer only:

```bash
npm run package:win
```

## Testing

### Test Binary Configuration

Run comprehensive tests to verify binary packaging:

```bash
npm run test:packaged-binaries
```

This test verifies:
- ✅ Binary files exist in `/binaries`
- ✅ Electron Builder configuration is correct
- ✅ PathResolver works in dev and production
- ✅ Binaries are executable
- ✅ Package scripts are configured

### Test Binary Verification

Test binary integrity and checksums:

```bash
npm run test:binary-verification
```

### Test Binary Packaging

Test path resolution in different environments:

```bash
npm run test:binaries
```

## Troubleshooting

### Binaries Not Found in Packaged App

**Problem:** Application can't find yt-dlp or ffmpeg after packaging.

**Solutions:**
1. Verify `extraResources` in `electron-builder.json`
2. Check binaries exist in source `/binaries` directory
3. Ensure `PathResolver.getResourcesPath()` returns correct path
4. Check `process.resourcesPath` is set correctly

### Binary Execution Fails

**Problem:** Binaries exist but fail to execute.

**Solutions:**
1. Verify binary integrity with checksums
2. Check file permissions (Unix systems)
3. Ensure antivirus isn't blocking execution
4. Re-download binaries: `npm run download:binaries`

### Large Package Size

**Problem:** Installer is too large.

**Solutions:**
1. Binaries are compressed in installer (NSIS compression)
2. ffmpeg is ~70MB, yt-dlp is ~10MB (expected)
3. Use `asar` packaging to reduce file count
4. Consider platform-specific builds

### Path Resolution Issues

**Problem:** Different paths in development vs production.

**Solutions:**
1. Always use `PathResolver.getBinaryPath()` instead of hardcoded paths
2. Test in both environments
3. Check environment variables are set correctly
4. Use `PathResolver.logPaths()` for debugging

## Platform Support

### Windows
- ✅ Fully supported
- Binaries: `yt-dlp.exe`, `ffmpeg.exe`
- Installer: NSIS

### macOS
- 🚧 Planned
- Binaries: `yt-dlp`, `ffmpeg` (no extension)
- Installer: DMG

### Linux
- 🚧 Planned
- Binaries: `yt-dlp`, `ffmpeg` (no extension)
- Installer: AppImage, DEB

## Security Considerations

### Checksum Verification

All binaries are verified with SHA-256 checksums:

1. **Download:** Checksums fetched from official sources
2. **Storage:** Stored in `binaries/checksums.json`
3. **Verification:** Checked before packaging and at runtime

### Code Signing

For production releases:
1. Sign main executable with valid certificate
2. Sign installer with same certificate
3. Prevents Windows SmartScreen warnings
4. Required for auto-updates

### Binary Sources

- **yt-dlp:** https://github.com/yt-dlp/yt-dlp/releases
- **ffmpeg:** https://github.com/BtbN/FFmpeg-Builds/releases

Always download from official sources only.

## Best Practices

### 1. Pre-build Verification

Before building for release:
```bash
npm run download:binaries
npm run test:packaged-binaries
```

### 2. Version Control

- ✅ Commit `checksums.json` to track binary versions
- ❌ Don't commit actual binaries (too large)
- ✅ Use `.gitignore` to exclude `*.exe` files

### 3. Continuous Integration

In CI/CD pipeline:
```yaml
- name: Download binaries
  run: npm run download:binaries

- name: Test binary configuration
  run: npm run test:packaged-binaries

- name: Build application
  run: npm run electron:build
```

### 4. Update Strategy

When updating binaries:
1. Run `npm run download:binaries` to get latest versions
2. Test locally with new binaries
3. Verify checksums are updated
4. Test packaged application
5. Release new version

## Requirements Mapping

This configuration satisfies the following requirements:

- **6.1:** Bundle yt-dlp executable within application package ✅
- **6.2:** Include ffmpeg binaries for video/audio processing ✅
- **6.3:** Use bundled versions from application directory ✅
- **6.4:** Verify bundled tool integrity on startup using checksums ✅

## Additional Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Builder extraResources](https://www.electron.build/configuration/contents#extraresources)
- [yt-dlp Releases](https://github.com/yt-dlp/yt-dlp/releases)
- [FFmpeg Builds](https://github.com/BtbN/FFmpeg-Builds)

## Support

For issues related to binary packaging:
1. Check this documentation
2. Run diagnostic tests
3. Review Electron Builder logs
4. Check GitHub issues
