# Build Scripts Guide

This document describes the build scripts for the YouTube Downloader Pro desktop application.

## Overview

The build system consists of four main scripts that work together to prepare the application for packaging:

1. **download-binaries.js** - Downloads required external binaries
2. **build-frontend.js** - Builds the React frontend with Vite
3. **build-backend.js** - Prepares backend with production dependencies
4. **build-all.js** - Orchestrates the complete build process

## Scripts

### 1. download-binaries.js

**Purpose:** Downloads yt-dlp and ffmpeg binaries for the current platform.

**Features:**
- Platform-specific binary downloads (Windows, macOS, Linux)
- Checksum verification for integrity
- Progress indication during download
- Automatic extraction from archives
- Stores checksums for future verification
- Skips download if binaries already exist and are valid

**Usage:**
```bash
npm run download:binaries
```

**Requirements:** 6.1, 6.2, 6.4

**Output:**
- `binaries/yt-dlp.exe` (Windows) or `binaries/yt-dlp` (Unix)
- `binaries/ffmpeg.exe` (Windows) or `binaries/ffmpeg` (Unix)
- `binaries/checksums.json` (verification data)

---

### 2. build-frontend.js

**Purpose:** Builds the React frontend application using Vite.

**Features:**
- Checks for dependencies and installs if needed
- Runs TypeScript compilation
- Builds optimized production bundle with Vite
- Verifies build output
- Reports build size

**Usage:**
```bash
npm run build:frontend
```

**Requirements:** 1.1, 1.2

**Output:**
- `client/dist/` - Production-ready frontend files
- `client/dist/index.html` - Entry point
- `client/dist/assets/` - Optimized JS, CSS, and assets

**Environment:**
- Sets `NODE_ENV=production`
- Enables all Vite optimizations

---

### 3. build-backend.js

**Purpose:** Prepares the backend for packaging by installing production dependencies.

**Features:**
- Cleans existing dependencies
- Installs only production dependencies
- Excludes dev dependencies and optional packages
- Reports dependency count and size
- Optimizes for minimal bundle size

**Usage:**
```bash
npm run build:backend
```

**Requirements:** 1.1, 1.2

**Output:**
- `backend/node_modules/` - Production dependencies only
- Removes `package-lock.json` for clean install

**Flags:**
- `--production` - Only production dependencies
- `--no-optional` - Skip optional dependencies

---

### 4. build-all.js

**Purpose:** Orchestrates the complete build process in the correct order.

**Features:**
- Executes all build steps sequentially
- Validates each step before proceeding
- Provides detailed progress output
- Reports total build time
- Exits with error if any required step fails

**Usage:**
```bash
npm run build:all
```

**Requirements:** 1.1, 1.2

**Build Steps:**
1. Download binaries (yt-dlp, ffmpeg)
2. Build frontend (React + Vite)
3. Prepare backend (production dependencies)

**Output:**
- All outputs from individual scripts
- Build summary with timing
- Next steps instructions

---

## Additional Scripts

### pre-build.js

**Purpose:** Verifies all prerequisites before packaging with Electron Builder.

**Checks:**
- Frontend build exists (`client/dist/`)
- Backend dependencies installed (`backend/node_modules/`)
- Binaries downloaded (`binaries/`)
- Electron files present (`src/electron/`)
- Configuration files valid

**Usage:**
```bash
npm run pre-build
```

**Requirements:** 1.1, 1.2

---

## NPM Scripts

The following npm scripts are available in `package.json`:

### Build Scripts

```bash
# Build everything (recommended)
npm run build:all

# Build individual components
npm run build:frontend    # Build React frontend only
npm run build:backend     # Prepare backend only
npm run download:binaries # Download binaries only

# Pre-build verification
npm run pre-build         # Verify all prerequisites
```

### Package Scripts

```bash
# Package for specific platforms
npm run package:win       # Windows installer
npm run package:mac       # macOS DMG
npm run package:linux     # Linux AppImage/deb
npm run package:all       # All platforms

# Complete release build
npm run release           # Build + Package for Windows
```

### Development Scripts

```bash
# Development mode
npm run electron:dev      # Run in development mode

# Full Electron build
npm run electron:build    # Build + Package with Electron Builder
```

---

## Build Workflow

### Complete Build Process

```
┌─────────────────────────────────────┐
│  1. Download Binaries               │
│     - yt-dlp.exe / yt-dlp           │
│     - ffmpeg.exe / ffmpeg           │
│     - Verify checksums              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Build Frontend                  │
│     - TypeScript compilation        │
│     - Vite production build         │
│     - Asset optimization            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Prepare Backend                 │
│     - Clean dependencies            │
│     - Install production deps       │
│     - Optimize bundle size          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Pre-Build Verification          │
│     - Check all files present       │
│     - Validate configuration        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Electron Builder                │
│     - Package application           │
│     - Create installer              │
│     - Sign binaries (if configured) │
└─────────────────────────────────────┘
```

### Quick Start

For a complete build and package:

```bash
# Option 1: Full automated build
npm run release

# Option 2: Step by step
npm run build:all
npm run package:win
```

---

## Build Output

### Directory Structure After Build

```
youtube-downloader-pro/
├── binaries/
│   ├── yt-dlp.exe
│   ├── ffmpeg.exe
│   └── checksums.json
├── client/
│   └── dist/
│       ├── index.html
│       └── assets/
│           ├── index-[hash].js
│           └── index-[hash].css
├── backend/
│   ├── server.js
│   └── node_modules/
│       └── [production dependencies]
└── dist-electron/
    └── YouTube Downloader Pro-Setup-1.0.0.exe
```

---

## Build Sizes

Typical build sizes:

- **Frontend:** ~2-5 MB (optimized)
- **Backend Dependencies:** ~50-80 MB
- **Binaries:** ~100-120 MB (yt-dlp + ffmpeg)
- **Total Installer:** ~150-200 MB

---

## Troubleshooting

### Frontend Build Fails

```bash
# Clean and rebuild
cd client
rm -rf node_modules dist
npm install
npm run build
```

### Backend Build Fails

```bash
# Clean and rebuild
cd backend
rm -rf node_modules package-lock.json
npm install --production
```

### Binary Download Fails

```bash
# Retry download
npm run download:binaries

# Manual download
# Download from:
# - yt-dlp: https://github.com/yt-dlp/yt-dlp/releases
# - ffmpeg: https://github.com/BtbN/FFmpeg-Builds/releases
# Place in binaries/ directory
```

### Build Verification Fails

```bash
# Run pre-build check
npm run pre-build

# This will show which files are missing
```

---

## Environment Variables

The build scripts respect the following environment variables:

- `NODE_ENV` - Set to `production` during builds
- `npm_config_platform` - Target platform (win32, darwin, linux)
- `npm_config_arch` - Target architecture (x64, arm64)

---

## CI/CD Integration

For automated builds in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm install

- name: Build application
  run: npm run build:all

- name: Package application
  run: npm run package:win

- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: installer
    path: dist-electron/*.exe
```

---

## Performance Tips

1. **Parallel Builds:** Frontend and backend can be built in parallel if needed
2. **Caching:** Cache `node_modules` and `binaries/` in CI/CD
3. **Incremental Builds:** Use `npm run build:frontend` for frontend-only changes
4. **Binary Reuse:** Binaries are cached and reused if checksums match

---

## Requirements Mapping

This implementation satisfies the following requirements:

- **1.1:** Windows installer creation
- **1.2:** Dependency bundling
- **6.1:** yt-dlp bundling
- **6.2:** ffmpeg bundling
- **6.4:** Binary verification

---

## Next Steps

After running the build scripts:

1. **Test the build:**
   ```bash
   npm run pre-build
   ```

2. **Create installer:**
   ```bash
   npm run package:win
   ```

3. **Test the installer:**
   - Install on a clean Windows machine
   - Verify all features work
   - Check binary execution

4. **Release:**
   - Upload to GitHub releases
   - Update documentation
   - Announce to users

---

## Support

For issues with build scripts:

1. Check the console output for specific errors
2. Verify all prerequisites are installed (Node.js 18+, npm 8+)
3. Ensure sufficient disk space (~500MB free)
4. Check internet connection for binary downloads
5. Review the troubleshooting section above

---

*Last updated: 2024*
*Requirements: 1.1, 1.2, 6.1, 6.2, 6.4*
