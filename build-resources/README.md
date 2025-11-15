# Build Resources

This directory contains resources needed for building the Electron application.

## Required Files

### Windows (Required for Task 10.1)
- `icon.ico` - Application icon (256x256 or larger, multi-resolution recommended)
- `installer-icon.ico` - Installer icon (256x256)
- `uninstaller-icon.ico` - Uninstaller icon (256x256)
- `installer-header.bmp` - NSIS installer header (150x57 pixels)
- `installer-sidebar.bmp` - NSIS installer sidebar (164x314 pixels)

### macOS (Optional - for future cross-platform support)
- `icon.icns` - Application icon bundle
- `entitlements.mac.plist` - macOS entitlements for hardened runtime

### Linux (Optional - for future cross-platform support)
- `icon.png` - Application icon (512x512 or larger)

## Creating Icons

### Windows Icons (.ico)
You can use tools like:
- **Online converters**: convertio.co, cloudconvert.com
- **Desktop tools**: GIMP, IcoFX, Greenfish Icon Editor Pro
- **Command line**: ImageMagick

Example with ImageMagick:
```bash
magick convert source.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### NSIS Installer Images (.bmp)
- Must be 24-bit BMP format (no alpha channel)
- Header: 150x57 pixels
- Sidebar: 164x314 pixels
- Use solid colors or simple gradients for best results

### macOS Icons (.icns)
Use `iconutil` (built into macOS):
```bash
iconutil -c icns icon.iconset
```

### Linux Icons (.png)
Use any image editor to create PNG files at 512x512 or larger.

## Placeholder Icons

For development and testing, the build will work without these files, but the application will use default Electron icons. For production releases, custom icons are strongly recommended for professional appearance.

## Current Status

- ✅ `tray-icon.png` - System tray icon (present)
- ⚠️ Windows icons - Need to be created for production build
- ⚠️ macOS icons - Optional, for future cross-platform support
- ⚠️ Linux icons - Optional, for future cross-platform support

## Notes

- Icon files are referenced in `electron-builder.json`
- Missing icon files will cause build warnings but not failures
- The electron-builder will use default icons if custom ones are not provided
- For production releases, all platform-specific icons should be created
