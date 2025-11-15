# Electron Builder Configuration Guide

This document explains the Electron Builder configuration for YouTube Downloader Pro.

## Configuration File

The main configuration is in `electron-builder.json` at the root of the project.

## Key Configuration Sections

### Application Metadata

```json
{
  "appId": "com.ytdownloader.app",
  "productName": "YouTube Downloader Pro",
  "description": "A modern, feature-rich YouTube video downloader with beautiful UI",
  "copyright": "Copyright © 2024 YouTube Downloader Pro"
}
```

- **appId**: Unique identifier for the application (used in Windows registry, macOS bundle ID)
- **productName**: Display name shown to users
- **description**: Brief description of the application
- **copyright**: Copyright notice included in the application

### Directory Configuration

```json
{
  "directories": {
    "output": "dist-electron",
    "buildResources": "build-resources"
  }
}
```

- **output**: Where the built installers will be placed
- **buildResources**: Directory containing icons and other build assets

### File Inclusion/Exclusion Patterns

The configuration specifies which files to include in the packaged application:

**Included:**
- `client/dist/**/*` - Built frontend files
- `backend/**/*` - Backend server files
- `src/electron/**/*` - Electron main process files
- `package.json` - Package metadata
- `LICENSE` - License file

**Excluded:**
- `!backend/node_modules` - Backend dependencies (will be installed separately)
- `!backend/downloads` - User download directory
- `!backend/test-*.js` - Test files
- `!backend/__tests__` - Test directories
- `!src/electron/__tests__` - Electron test files
- `!**/*.md` - Documentation files

### Extra Resources

```json
{
  "extraResources": [
    {
      "from": "binaries",
      "to": "binaries",
      "filter": ["**/*", "!README.md", "!*.tmp", "!*.zip"]
    }
  ]
}
```

This bundles the `binaries` directory (containing yt-dlp.exe and ffmpeg.exe) into the application package. These files will be accessible at runtime via `process.resourcesPath`.

### ASAR Packaging

```json
{
  "asar": true,
  "asarUnpack": ["backend/node_modules/**/*"]
}
```

- **asar**: Packages application files into a single archive for faster loading
- **asarUnpack**: Keeps backend node_modules unpacked (required for native modules)

### Windows Configuration

```json
{
  "win": {
    "target": [{"target": "nsis", "arch": ["x64"]}],
    "artifactName": "${productName}-Setup-${version}.${ext}",
    "requestedExecutionLevel": "asInvoker",
    "publisherName": "YouTube Downloader Pro"
  }
}
```

- **target**: Creates NSIS installer for 64-bit Windows
- **artifactName**: Installer filename pattern (e.g., "YouTube Downloader Pro-Setup-1.0.0.exe")
- **requestedExecutionLevel**: "asInvoker" means no admin rights required
- **publisherName**: Publisher name shown in Windows

### NSIS Installer Configuration

```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,
    "createDesktopShortcut": "always",
    "createStartMenuShortcut": true,
    "shortcutName": "YouTube Downloader Pro",
    "license": "LICENSE",
    "perMachine": false,
    "runAfterFinish": true,
    "deleteAppDataOnUninstall": false
  }
}
```

**Key Options:**
- **oneClick: false** - Shows installation wizard (not one-click install)
- **allowToChangeInstallationDirectory: true** - User can choose install location
- **allowElevation: true** - Can request admin rights if needed
- **createDesktopShortcut: "always"** - Always creates desktop shortcut
- **createStartMenuShortcut: true** - Creates Start Menu entry
- **perMachine: false** - Installs per-user (no admin required)
- **runAfterFinish: true** - Launches app after installation
- **deleteAppDataOnUninstall: false** - Keeps user data when uninstalling

### Auto-Update Configuration

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "yourusername",
      "repo": "youtube-downloader-pro",
      "releaseType": "release",
      "publishAutoUpdate": true
    }
  ]
}
```

Configures automatic updates via GitHub Releases. Update the `owner` field with your GitHub username.

## Build Commands

### Development Build
```bash
npm run electron:dev
```
Runs the app in development mode with hot reload.

### Production Build
```bash
npm run electron:build
```
Builds the frontend, backend, and creates the Windows installer.

### Quick Package (Windows)
```bash
npm run package:win
```
Packages the application for Windows without rebuilding everything.

### Full Release
```bash
npm run release
```
Complete build and package process for release.

## Build Output

After running `npm run electron:build`, you'll find:

```
dist-electron/
├── YouTube Downloader Pro-Setup-1.0.0.exe  # Windows installer
├── win-unpacked/                            # Unpacked application files
├── builder-debug.yml                        # Build debug info
└── builder-effective-config.yaml            # Effective configuration used
```

## Requirements Met

This configuration satisfies all requirements from task 10.1:

✅ **Create electron-builder.json with Windows NSIS configuration**
- Complete NSIS configuration with all required options

✅ **Configure app metadata (name, version, description)**
- appId, productName, description, copyright all configured
- Version pulled from package.json automatically

✅ **Set up file inclusion/exclusion patterns**
- Includes: frontend dist, backend files, electron files, binaries
- Excludes: test files, documentation, temporary files, node_modules

✅ **Configure installer options (shortcuts, install directory)**
- Desktop shortcut: Always created
- Start Menu shortcut: Created
- Installation directory: User can choose
- Per-user installation: No admin required
- Run after finish: Enabled
- License agreement: Included

## Icon Files (Optional)

For production builds, you can add custom icons to `build-resources/`:

- `icon.ico` - Application icon (Windows)
- `installer-icon.ico` - Installer icon
- `uninstaller-icon.ico` - Uninstaller icon
- `installer-header.bmp` - NSIS header image (150x57)
- `installer-sidebar.bmp` - NSIS sidebar image (164x314)

See `build-resources/README.md` for details on creating these files.

## Code Signing (Optional)

For production releases, configure code signing in `.env.signing`:

```env
WIN_CSC_LINK=path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=your_password
```

See `CODE_SIGNING.md` for complete setup instructions.

## Troubleshooting

### Build Fails with "Cannot find module"
- Run `npm run build:all` first to build frontend and backend
- Ensure all dependencies are installed: `npm install`

### Installer Size Too Large
- Check that `node_modules` are properly excluded
- Verify `compression: "maximum"` is set
- Remove unnecessary files from backend

### Application Won't Start After Install
- Check that `extraMetadata.main` points to correct entry file
- Verify backend files are included in the package
- Check logs in `%APPDATA%/yt-downloader/logs/`

### Missing Binaries
- Run `npm run download:binaries` before building
- Verify binaries exist in `binaries/` directory
- Check `extraResources` configuration includes binaries

## Next Steps

After completing this task:

1. **Task 10.2**: Create build scripts for automated building
2. **Task 10.3**: Implement code signing setup
3. Test the installer on a clean Windows machine
4. Verify all shortcuts and registry entries are created correctly
5. Test the uninstaller to ensure clean removal

## References

- [Electron Builder Documentation](https://www.electron.build/)
- [NSIS Configuration Options](https://www.electron.build/configuration/nsis)
- [Windows Configuration](https://www.electron.build/configuration/win)
- Design Document: `.kiro/specs/desktop-exe-application/design.md`
- Requirements: `.kiro/specs/desktop-exe-application/requirements.md`
