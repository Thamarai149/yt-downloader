# Build Resources

This directory contains resources needed for building the Electron application.

## Required Files

### Windows
- `icon.ico` - Application icon (256x256 or larger)
- `installer-icon.ico` - Installer icon (256x256)
- `uninstaller-icon.ico` - Uninstaller icon (256x256)
- `installer-header.bmp` - NSIS installer header (150x57)
- `installer-sidebar.bmp` - NSIS installer sidebar (164x314)

### macOS
- `icon.icns` - Application icon bundle

### Linux
- `icon.png` - Application icon (512x512 or larger)

## Creating Icons

You can use tools like:
- **Windows**: Use an online ICO converter or tools like GIMP
- **macOS**: Use `iconutil` or online ICNS converters
- **Linux**: Use any image editor to create PNG files

## Placeholder Icons

For development, you can use placeholder icons. The build will work without these files, but the application will use default Electron icons.
