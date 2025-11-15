# Runtime Binary Verification

This document describes the runtime binary verification system implemented for the Electron desktop application.

## Overview

The runtime binary verification system ensures that required binaries (yt-dlp and ffmpeg) are present, valid, and secure before the application starts downloading videos. This system implements:

1. **Binary Existence Check** - Verifies binaries exist on startup
2. **Checksum Verification** - Validates binary integrity using SHA256 checksums
3. **Auto-Download** - Automatically downloads missing binaries when possible
4. **Error Dialogs** - Shows user-friendly error messages with manual instructions

## Requirements

This implementation satisfies the following requirements:
- **Requirement 6.4**: Binary verification and integrity checking
- **Requirement 5.2**: Error handling with user guidance

## Architecture

### Components

#### 1. BinaryManager (backend/binary-manager.js)

The core component that handles all binary verification logic:

```javascript
class BinaryManager {
  // Load checksums from checksums.json
  loadChecksums()
  
  // Calculate SHA256 checksum of a file
  calculateChecksum(filePath)
  
  // Verify binary checksum against expected value
  verifyChecksum(binaryPath, filename)
  
  // Check if binary exists and is executable
  verifyBinary(binaryPath, versionFlag)
  
  // Find yt-dlp binary (bundled or system)
  findYtdlp()
  
  // Find ffmpeg binary (bundled or system)
  findFfmpeg()
  
  // Download binary from URL
  downloadBinary(url, destinationPath)
  
  // Auto-download missing binaries
  autoDownloadBinaries()
  
  // Initialize and verify all binaries
  initialize(autoDownload = true)
}
```

#### 2. Main Process Integration (src/electron/main.js)

The Electron main process checks binary status after backend server starts:

```javascript
// Check binary status
const binaryStatus = await backendManager.checkBinaryStatus();

if (!binaryStatus.ready) {
  // Show error dialog with manual instructions
  showBinaryErrorDialog(missingBinaries, binaryStatus.status);
}
```

#### 3. IPC Handlers (src/electron/ipc-handler.js)

Exposes binary verification methods to the renderer process:

```javascript
// Get binary status
ipcMain.handle('backend:get-binary-status', async () => {
  return await backendManager.checkBinaryStatus();
});

// Trigger binary re-verification
ipcMain.handle('backend:verify-binaries', async () => {
  return await backendManager.checkBinaryStatus();
});
```

#### 4. Preload Script (src/electron/preload.ts)

Provides secure access to binary verification from frontend:

```typescript
backend: {
  getBinaryStatus: () => Promise<any>
  verifyBinaries: () => Promise<any>
}
```

## Verification Flow

### Startup Verification

```
1. Application starts
   ↓
2. Backend server starts
   ↓
3. BinaryManager.initialize() called
   ↓
4. Load checksums from checksums.json
   ↓
5. Find yt-dlp binary
   ├─ Check bundled location
   ├─ Verify checksum
   └─ Fallback to system binary
   ↓
6. Find ffmpeg binary
   ├─ Check bundled location
   ├─ Verify checksum
   └─ Fallback to system binary
   ↓
7. If binaries missing → Auto-download (if enabled)
   ↓
8. Return verification status
   ↓
9. Main process checks status
   ↓
10. If failed → Show error dialog
```

### Checksum Verification

Each binary is verified using SHA256 checksums stored in `binaries/checksums.json`:

```json
{
  "yt-dlp.exe": "9f8b03a37125854895a7eebf50a605e34e7ec3bd2444931eff377f3ccec50e96",
  "ffmpeg.exe": "7593a17862448093e3488f86b69a991c114af53b59366ff8e42c678e8275a459"
}
```

The verification process:
1. Calculate SHA256 hash of the binary file
2. Compare with expected checksum from checksums.json
3. If mismatch → Binary is considered invalid
4. If no checksum available → Skip verification (warning logged)

### Auto-Download

When binaries are missing, the system attempts to download them automatically:

**yt-dlp:**
- URL: `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe`
- Downloads directly to resources path
- Verifies after download

**ffmpeg:**
- Currently requires manual installation (zip extraction needed)
- Future enhancement: Implement zip extraction for auto-download

## Error Handling

### Error Dialog

When binaries are missing or invalid, a comprehensive error dialog is shown:

```
┌─────────────────────────────────────────┐
│  Missing Required Binaries              │
├─────────────────────────────────────────┤
│                                         │
│  The following binaries are missing:    │
│  • yt-dlp                               │
│  • ffmpeg                               │
│                                         │
│  Manual Installation Instructions:      │
│                                         │
│  yt-dlp:                                │
│  1. Download from: github.com/...       │
│  2. Get the file: yt-dlp.exe           │
│  3. Place it in the binaries folder    │
│                                         │
│  [Open Download Page]                   │
│  [View Documentation]                   │
│  [Continue Anyway]                      │
│  [Exit]                                 │
└─────────────────────────────────────────┘
```

### User Options

1. **Open Download Page** - Opens GitHub releases page in browser
2. **View Documentation** - Opens BINARY_BUNDLING.md documentation
3. **Continue Anyway** - Allows app to run with limited functionality
4. **Exit** - Closes the application

## API Reference

### Backend API

#### GET /api/binaries/status

Returns the current binary verification status:

```json
{
  "ready": true,
  "status": {
    "verified": true,
    "ytdlp": {
      "path": "C:\\app\\binaries\\yt-dlp.exe",
      "available": true,
      "bundled": true,
      "checksumVerified": true
    },
    "ffmpeg": {
      "path": "C:\\app\\binaries\\ffmpeg.exe",
      "available": true,
      "bundled": true,
      "checksumVerified": true
    },
    "autoDownload": {
      "ytdlp": { "attempted": false, "success": false },
      "ffmpeg": { "attempted": false, "success": false }
    }
  },
  "message": "All binaries are available and verified"
}
```

### Electron IPC API

#### backend:get-binary-status

Get current binary verification status from main process.

**Returns:**
```typescript
{
  ready: boolean;
  status: BinaryStatus;
  message: string;
}
```

#### backend:verify-binaries

Trigger binary re-verification.

**Returns:**
```typescript
{
  ready: boolean;
  status: BinaryStatus;
  message: string;
}
```

### Frontend API

From React components, use the Electron API:

```typescript
// Check binary status
const status = await window.electron?.backend.getBinaryStatus();

if (!status.ready) {
  console.error('Binaries not ready:', status.message);
}

// Trigger re-verification
const result = await window.electron?.backend.verifyBinaries();
```

## Testing

### Manual Testing

1. **Test with all binaries present:**
   ```bash
   npm run electron:dev
   ```
   Expected: App starts normally, no error dialogs

2. **Test with missing yt-dlp:**
   ```bash
   # Rename yt-dlp.exe temporarily
   ren binaries\yt-dlp.exe yt-dlp.exe.bak
   npm run electron:dev
   ```
   Expected: Error dialog shows, offers to download

3. **Test with corrupted binary:**
   ```bash
   # Modify yt-dlp.exe to corrupt it
   echo "corrupted" >> binaries\yt-dlp.exe
   npm run electron:dev
   ```
   Expected: Checksum verification fails, error dialog shows

### Automated Testing

Run the binary verification test suite:

```bash
node scripts/test-binary-verification.js
```

This tests:
- Checksum loading
- Binary existence
- Binary manager integration
- Path resolution

## Security Considerations

### Checksum Verification

- Uses SHA256 for cryptographic integrity verification
- Checksums stored in version-controlled checksums.json
- Prevents execution of tampered or corrupted binaries

### Download Security

- Downloads only from official GitHub releases
- HTTPS enforced for all downloads
- Checksums verified after download
- Failed downloads are cleaned up

### Fallback Behavior

- If bundled binaries fail verification, falls back to system binaries
- System binaries are also verified before use
- Application can run with limited functionality if binaries unavailable

## Troubleshooting

### Binary Not Found

**Symptom:** Error dialog shows "yt-dlp not found"

**Solutions:**
1. Run `npm run download:binaries` to download binaries
2. Manually download from GitHub and place in `binaries/` folder
3. Install system-wide and ensure it's in PATH

### Checksum Mismatch

**Symptom:** Error dialog shows "checksum verification failed"

**Solutions:**
1. Delete the binary and re-download
2. Run `npm run download:binaries` to get fresh copies
3. Update checksums.json if you intentionally updated binaries

### Auto-Download Fails

**Symptom:** Auto-download attempted but failed

**Solutions:**
1. Check internet connection
2. Verify GitHub is accessible
3. Download manually from error dialog link
4. Check firewall/antivirus settings

## Future Enhancements

1. **ffmpeg Auto-Download**
   - Implement zip extraction for automatic ffmpeg download
   - Currently requires manual installation

2. **Binary Updates**
   - Automatic binary updates when new versions available
   - Update notification system

3. **Retry Logic**
   - Automatic retry for failed downloads
   - Exponential backoff for network errors

4. **Progress Indication**
   - Show download progress in UI
   - Real-time status updates during verification

## Related Files

- `backend/binary-manager.js` - Core verification logic
- `binaries/checksums.json` - Binary checksums
- `scripts/test-binary-verification.js` - Test suite
- `src/electron/main.js` - Main process integration
- `src/electron/ipc-handler.js` - IPC handlers
- `src/electron/preload.ts` - Preload script
- `BINARY_BUNDLING.md` - Binary bundling documentation

## References

- Task 9.3: Implement runtime binary verification
- Requirements 6.4, 5.2
- Design Document: Error Handling section
