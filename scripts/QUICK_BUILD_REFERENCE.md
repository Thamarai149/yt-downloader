# Quick Build Reference

## One-Command Builds

```bash
# Complete build (recommended)
npm run build:all

# Build + Package for Windows
npm run release

# Package only (requires build:all first)
npm run package:win
```

## Individual Build Steps

```bash
# 1. Download binaries
npm run download:binaries

# 2. Build frontend
npm run build:frontend

# 3. Prepare backend
npm run build:backend

# 4. Verify everything
npm run pre-build
```

## What Each Script Does

| Script | Purpose | Output |
|--------|---------|--------|
| `download:binaries` | Downloads yt-dlp & ffmpeg | `binaries/` |
| `build:frontend` | Builds React app with Vite | `client/dist/` |
| `build:backend` | Installs production deps | `backend/node_modules/` |
| `build:all` | Runs all above in order | All outputs |
| `pre-build` | Verifies prerequisites | Validation report |
| `package:win` | Creates Windows installer | `dist-electron/*.exe` |

## Build Time Estimates

- Download binaries: 1-3 minutes (first time only)
- Build frontend: 30-60 seconds
- Build backend: 1-2 minutes
- Package installer: 2-5 minutes
- **Total:** ~5-10 minutes

## Common Issues

### "Frontend build failed"
```bash
cd client && npm install && npm run build
```

### "Backend dependencies missing"
```bash
cd backend && npm install --production
```

### "Binaries not found"
```bash
npm run download:binaries
```

### "Pre-build verification failed"
```bash
npm run build:all
```

## Requirements

- Node.js 18+
- npm 8+
- ~500MB free disk space
- Internet connection (for binary downloads)

## Platform Support

- ✅ Windows (primary target)
- ✅ macOS (supported)
- ✅ Linux (supported)

---

**Task 10.2 Implementation Complete** ✅

All build scripts are implemented and tested:
- ✅ Frontend build script (Vite)
- ✅ Backend preparation script
- ✅ Combined build orchestration
- ✅ Binary download automation
- ✅ Pre-build verification
