# Quick Build Guide

## Development Build

```bash
# Install dependencies (first time only)
npm run install:all

# Run in development mode
npm run electron:dev
```

## Production Build

```bash
# Complete build process
npm run build:all

# Create Windows installer
npm run package:win

# Or use the combined command
npm run release
```

## Build Output

Your installer will be in: `dist-electron/YouTube Downloader Pro-Setup-1.0.0.exe`

## Troubleshooting

If build fails, run verification:
```bash
npm run pre-build
```

## Code Signing (Optional)

For production releases with code signing:
```bash
# Setup code signing
npm run setup:signing

# Verify configuration
npm run verify:signing

# Build signed installer
npm run release
```

## More Information

- Complete build guide: `BUILD.md`
- Code signing guide: `CODE_SIGNING.md`
- Task implementation: `TASK_10_SUMMARY.md`
