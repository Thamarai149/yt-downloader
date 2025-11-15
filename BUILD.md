# Build Guide

This document explains how to build the YouTube Downloader Pro desktop application.

## Prerequisites

- Node.js 18+ and npm 8+
- Git
- Windows (for Windows builds), macOS (for Mac builds), or Linux (for Linux builds)

## Quick Start

### Development Build

```bash
# Install all dependencies
npm run install:all

# Run in development mode
npm run electron:dev
```

### Production Build

```bash
# Complete build (downloads binaries, builds frontend & backend)
npm run build:all

# Create Windows installer
npm run package:win

# Or use the combined command
npm run release
```

## Build Scripts

### Individual Build Steps

#### 1. Download Binaries
```bash
npm run download:binaries
```
Downloads yt-dlp and ffmpeg binaries for the current platform.

#### 2. Build Frontend
```bash
npm run build:frontend
```
Builds the React frontend using Vite. Output: `client/dist/`

#### 3. Prepare Backend
```bash
npm run build:backend
```
Installs production dependencies for the backend. Output: `backend/node_modules/`

#### 4. Build All
```bash
npm run build:all
```
Runs all three steps above in sequence.

### Packaging

#### Pre-Build Verification
```bash
npm run pre-build
```
Verifies that all required files are present before packaging.

#### Platform-Specific Packaging

**Windows:**
```bash
npm run package:win
```
Creates Windows installer (.exe) in `dist-electron/`

**macOS:**
```bash
npm run package:mac
```
Creates macOS DMG in `dist-electron/`

**Linux:**
```bash
npm run package:linux
```
Creates Linux AppImage and DEB in `dist-electron/`

**All Platforms:**
```bash
npm run package:all
```
Creates installers for all platforms (requires appropriate OS or CI/CD).

### Complete Build & Package

```bash
npm run release
```
Runs the complete build process and creates Windows installer.

## Build Output

### Directory Structure

```
dist-electron/
├── YouTube Downloader Pro-Setup-1.0.0.exe  # Windows installer
├── win-unpacked/                            # Unpacked Windows build
├── builder-debug.yml                        # Build metadata
└── builder-effective-config.yaml            # Effective configuration
```

### Build Artifacts

- **Windows**: `YouTube Downloader Pro-Setup-{version}.exe` (~150MB)
- **macOS**: `YouTube Downloader Pro-{version}.dmg`
- **Linux**: `YouTube Downloader Pro-{version}.AppImage` and `.deb`

## Build Configuration

### electron-builder.json

Main configuration file for Electron Builder. Defines:
- App metadata (name, version, description)
- File inclusion/exclusion patterns
- Platform-specific settings
- Installer options
- Code signing configuration

### Key Configuration Options

**App Metadata:**
```json
{
  "appId": "com.ytdownloader.app",
  "productName": "YouTube Downloader Pro",
  "description": "A modern, feature-rich YouTube video downloader"
}
```

**File Patterns:**
- Includes: `client/dist`, `backend`, `src/electron`, binaries
- Excludes: `node_modules`, test files, downloads

**Windows NSIS Options:**
- Two-click installer (not one-click)
- Custom installation directory
- Desktop and Start Menu shortcuts
- License agreement screen

## Troubleshooting

### Build Fails: "Frontend not built"

**Solution:**
```bash
npm run build:frontend
```

### Build Fails: "Binaries not found"

**Solution:**
```bash
npm run download:binaries
```

### Build Fails: "Backend dependencies missing"

**Solution:**
```bash
npm run build:backend
```

### Installer Size Too Large

**Causes:**
- Dev dependencies included
- Unnecessary files in backend
- Large binaries

**Solutions:**
1. Ensure `build:backend` uses `--production` flag
2. Check `electron-builder.json` file exclusion patterns
3. Verify binaries are compressed

### Code Signing Errors

If you don't have a code signing certificate:
1. Set `win.verifyUpdateCodeSignature: false` in `electron-builder.json`
2. Users will see Windows SmartScreen warnings
3. For production, obtain a code signing certificate

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Build application
        run: npm run build:all
      
      - name: Package application
        run: npm run package:win
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: dist-electron/*.exe
```

## Build Optimization

### Reducing Build Time

1. **Use build cache:**
   - Cache `node_modules` in CI/CD
   - Cache downloaded binaries

2. **Parallel builds:**
   - Frontend and backend can be built in parallel
   - Use `concurrently` for parallel execution

3. **Incremental builds:**
   - Only rebuild changed components
   - Use `--skip-build` flag with electron-builder if code hasn't changed

### Reducing Bundle Size

1. **Frontend optimization:**
   - Enable code splitting in Vite
   - Remove unused dependencies
   - Compress assets

2. **Backend optimization:**
   - Use `--production` flag
   - Remove dev dependencies
   - Minimize node_modules

3. **Binary optimization:**
   - Use compressed binaries
   - Consider dynamic download for optional binaries

## Testing Builds

### Test Unpacked Build

```bash
# After building
cd dist-electron/win-unpacked
"YouTube Downloader Pro.exe"
```

### Test Installer

1. Run the installer: `YouTube Downloader Pro-Setup-1.0.0.exe`
2. Install to a test directory
3. Launch the application
4. Test all features
5. Uninstall and verify cleanup

### Automated Testing

```bash
# Test binary packaging
npm run test:binaries

# Test binary verification
npm run test:binary-verification

# Test packaged binaries
npm run test:packaged-binaries
```

## Release Checklist

Before releasing a new version:

- [ ] Update version in `package.json`
- [ ] Update version in `client/package.json`
- [ ] Update version in `backend/package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run full build: `npm run build:all`
- [ ] Test the application thoroughly
- [ ] Create installer: `npm run package:win`
- [ ] Test the installer
- [ ] Create GitHub release
- [ ] Upload installer to release
- [ ] Update documentation
- [ ] Announce release

## Advanced Topics

### Custom Build Scripts

You can create custom build scripts in the `scripts/` directory. See existing scripts for examples:
- `scripts/build-frontend.js`
- `scripts/build-backend.js`
- `scripts/build-all.js`
- `scripts/pre-build.js`

### Multi-Platform Builds

To build for multiple platforms, you need:
- **Windows builds**: Windows OS or Wine
- **macOS builds**: macOS with Xcode
- **Linux builds**: Linux OS

Or use CI/CD services that support multi-platform builds.

### Code Signing

For production releases, code signing is recommended:

**Windows:**
1. Obtain a code signing certificate
2. Configure in `electron-builder.json`:
```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  }
}
```

**macOS:**
1. Obtain Apple Developer certificate
2. Configure in `electron-builder.json`:
```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
}
```

## Support

For build issues:
1. Check this documentation
2. Review error messages carefully
3. Check `dist-electron/builder-debug.yml` for details
4. Open an issue on GitHub with build logs

## Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
