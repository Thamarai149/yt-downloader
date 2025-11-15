# Binary Bundling Documentation

This document explains how external binaries (yt-dlp and ffmpeg) are bundled with the Electron application.

## Overview

The application bundles yt-dlp and ffmpeg binaries to provide a zero-configuration installation experience. Users don't need to install these tools separately.

## Binary Download Script

### Location
`scripts/download-binaries.js`

### Features
- Downloads yt-dlp and ffmpeg for the current platform
- Verifies downloads using SHA256 checksums
- Stores checksums for future verification
- Automatically extracts archives (zip, tar.xz)
- Provides progress indication
- Handles redirects and errors gracefully

### Usage

```bash
# Download binaries
npm run download:binaries

# Test binary access
npm run test:binaries
```

### Supported Platforms
- **Windows**: Downloads .exe files
- **macOS**: Downloads macOS binaries
- **Linux**: Downloads Linux binaries

## Electron Builder Configuration

### Location
`electron-builder.json`

### Configuration

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

This configuration:
- Copies binaries from `binaries/` directory
- Places them in `resources/binaries/` in the packaged app
- Excludes temporary files and archives
- Includes only the actual binary executables and checksums

## Path Resolution

### Location
`backend/electron-paths.js`

### How It Works

The `PathResolver` class detects the environment and resolves paths accordingly:

**Development Mode:**
- Binaries are in `<project-root>/binaries/`
- Direct access from source directory

**Production Mode:**
- Binaries are in `<app-resources>/binaries/`
- Accessed from the packaged application

### Environment Variables

The Electron main process sets these environment variables for the backend:

- `ELECTRON_MODE`: Set to 'true' when running in Electron
- `IS_ELECTRON`: Set to 'true' when running in Electron
- `ELECTRON_RESOURCES_PATH`: Path to the resources directory
- `ELECTRON_APP_PATH`: Path to the application
- `ELECTRON_USER_DATA`: Path to user data directory

## Binary Verification

### Runtime Verification

The `BinaryManager` class (in `backend/binary-manager.js`) verifies binaries at runtime:

1. **Checksum Loading**: Loads checksums from `checksums.json` on initialization
2. **Existence Check**: Verifies binary files exist at expected paths
3. **Execution Check**: Tests if binaries can be executed with version flags
4. **Checksum Verification**: Validates integrity using SHA256 checksums
5. **Fallback**: Falls back to system binaries if bundled ones fail or are invalid
6. **Error Guidance**: Provides detailed instructions if binaries are missing

#### Verification Flow

```
1. Load checksums.json
2. Check bundled binary exists
3. Verify binary is executable
4. Calculate and verify checksum
5. If valid → Use bundled binary
6. If invalid → Try system binary
7. If system binary found → Use it (with warning)
8. If no binary found → Show error guidance
```

### Checksum Storage

Checksums are stored in `binaries/checksums.json`:

```json
{
  "yt-dlp.exe": "9f8b03a37125854895a7eebf50a605e34e7ec3bd2444931eff377f3ccec50e96",
  "ffmpeg.exe": "7593a17862448093e3488f86b69a991c114af53b59366ff8e42c678e8275a459"
}
```

## Build Process

### Build Script Order

```bash
npm run electron:build
```

This runs:
1. `npm run download:binaries` - Downloads binaries if missing
2. `npm run build:frontend` - Builds React frontend
3. `npm run build:backend` - Prepares backend files
4. `electron-builder` - Packages the application

### What Gets Packaged

```
YouTube Downloader Pro/
├── YouTube Downloader Pro.exe
├── resources/
│   ├── app.asar                    # Application code
│   ├── binaries/                   # Bundled binaries
│   │   ├── yt-dlp.exe
│   │   ├── ffmpeg.exe
│   │   └── checksums.json
│   └── backend/                    # Backend server
└── ...
```

## Testing

### Test Binary Access

```bash
npm run test:binaries
```

This tests:
- Path resolution in development mode
- Path resolution in production mode
- Binary existence in both modes

### Test Binary Verification

```bash
npm run test:binary-verification
```

This comprehensive test verifies:
- Checksum file loading
- Binary existence and file sizes
- Binary Manager initialization
- Checksum verification
- Path resolution in different environments
- Fallback to system binaries

### Manual Testing

1. **Development Mode:**
   ```bash
   npm run electron:dev
   ```
   - Binaries should be loaded from `binaries/` directory
   - Check console for binary paths

2. **Production Build:**
   ```bash
   npm run electron:build
   npm run package:win
   ```
   - Install the generated .exe
   - Run the application
   - Verify downloads work correctly

## Troubleshooting

### Binaries Not Found

**Symptom:** Application can't find yt-dlp or ffmpeg

**Solutions:**
1. Run `npm run download:binaries` to download binaries
2. Check `binaries/` directory contains the executables
3. Verify `electron-builder.json` includes extraResources configuration
4. Check console logs for path resolution details

### Checksum Verification Failed

**Symptom:** Binary checksum doesn't match

**Solutions:**
1. Delete the binary file
2. Run `npm run download:binaries` again
3. If problem persists, delete `binaries/checksums.json` and re-download

### Extraction Failed

**Symptom:** ffmpeg download fails during extraction

**Solutions:**
1. Ensure PowerShell is available (Windows)
2. Check disk space
3. Verify write permissions in `binaries/` directory
4. Try manual download and extraction

## Binary Sources

### yt-dlp
- **Source:** https://github.com/yt-dlp/yt-dlp
- **Windows:** https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
- **Checksum:** Verified from SHA2-256SUMS file

### ffmpeg
- **Source:** https://github.com/BtbN/FFmpeg-Builds
- **Windows:** https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
- **Checksum:** Calculated and stored locally

## Security Considerations

1. **Checksum Verification:** All binaries are verified using SHA256 checksums
2. **HTTPS Downloads:** All downloads use HTTPS
3. **Official Sources:** Binaries are downloaded from official GitHub releases
4. **Integrity Checks:** Runtime verification ensures binaries haven't been tampered with

## Updating Binaries

To update to newer versions:

1. Delete existing binaries:
   ```bash
   del binaries\yt-dlp.exe
   del binaries\ffmpeg.exe
   del binaries\checksums.json
   ```

2. Download latest versions:
   ```bash
   npm run download:binaries
   ```

3. Test the new binaries:
   ```bash
   npm run test:binaries
   npm run electron:dev
   ```

4. Rebuild the application:
   ```bash
   npm run electron:build
   ```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **6.1:** Bundles yt-dlp executable within the application package
- **6.2:** Includes ffmpeg binaries for video/audio processing
- **6.3:** Uses bundled versions from the application directory
- **6.4:** Verifies bundled tool integrity on startup using checksums

## Future Enhancements

Potential improvements:

1. **Auto-Update Binaries:** Automatically check for and download binary updates
2. **Multi-Platform Support:** Extend to macOS and Linux
3. **Binary Compression:** Compress binaries to reduce package size
4. **Signature Verification:** Verify GPG signatures in addition to checksums
5. **Download Progress UI:** Show download progress in the application UI
