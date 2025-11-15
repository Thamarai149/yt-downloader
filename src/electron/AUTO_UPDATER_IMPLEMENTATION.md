# Auto-Updater Implementation

## Overview

The auto-updater system provides automatic application updates using `electron-updater`. It includes:

- Automatic update checks on startup and periodically
- Background update downloads
- User notifications for available updates
- Retry logic for failed operations
- Error handling and recovery
- Settings to control update behavior

## Architecture

### Main Components

1. **AutoUpdater Class** (`src/electron/auto-updater.js`)
   - Manages update lifecycle
   - Handles update checks, downloads, and installation
   - Implements retry logic and error handling
   - Sends status updates to renderer process

2. **IPC Handlers** (`src/electron/ipc-handler.js`)
   - Exposes update APIs to renderer process
   - Handles update-related IPC calls

3. **Settings Integration** (`src/electron/settings-integration.js`)
   - Applies auto-update settings
   - Manages auto-check and auto-download preferences

4. **Frontend Components**
   - `UpdateNotification.tsx` - Shows update notifications
   - `UpdateSettings.tsx` - Update settings UI

## Features

### Automatic Update Checks

- Checks for updates on application startup (after 10-second delay)
- Periodic checks every 4 hours (configurable)
- Can be disabled in settings

### Update Download

- Downloads updates in the background
- Shows progress indicator
- Can be configured to download automatically when available

### Update Installation

- Prompts user to restart and install
- Quits and installs the update
- Preserves user data and settings

### Error Handling

- Automatic retry with exponential backoff (up to 3 attempts)
- Error logging for debugging
- User-friendly error messages
- Fallback to manual download

### Retry Logic

- **Max Retries**: 3 attempts
- **Retry Delay**: 5 seconds (exponential backoff)
- **Retry Scenarios**:
  - Failed update checks
  - Failed downloads
  - Network errors

## Configuration

### Electron Builder Configuration

```json
{
  "publish": {
    "provider": "github",
    "owner": "yourusername",
    "repo": "yt-downloader"
  }
}
```

### Auto-Updater Settings

```javascript
{
  autoCheckUpdates: true,      // Check for updates automatically
  autoDownloadUpdates: false   // Download updates automatically
}
```

## Usage

### Checking for Updates

```javascript
// From renderer process
const result = await window.electron.updates.checkForUpdates();
if (result.success && result.updateInfo) {
  console.log('Update available:', result.updateInfo.version);
}
```

### Downloading Updates

```javascript
// From renderer process
const result = await window.electron.updates.downloadUpdate();
if (result.success) {
  console.log('Download started');
}
```

### Installing Updates

```javascript
// From renderer process
await window.electron.updates.installUpdate();
// Application will restart and install the update
```

### Listening for Update Events

```javascript
// Listen for update available
window.electron.updates.onUpdateAvailable((data) => {
  console.log('Update available:', data.version);
  console.log('Release notes:', data.releaseNotes);
});

// Listen for update downloaded
window.electron.updates.onUpdateDownloaded((data) => {
  console.log('Update downloaded:', data.version);
  // Prompt user to restart
});

// Listen for update status
window.electron.updates.onStatus((statusData) => {
  console.log('Status:', statusData.status);
  if (statusData.status === 'downloading') {
    console.log('Progress:', statusData.data.percent);
  }
});
```

## Update Flow

### 1. Check for Updates

```
User/System → Check for Updates → electron-updater
                                        ↓
                                   GitHub Releases
                                        ↓
                                   Update Available?
                                   ↙           ↘
                                 Yes            No
                                  ↓              ↓
                          Notify User      No Action
```

### 2. Download Update

```
User Clicks Download → Download Update → electron-updater
                                              ↓
                                        Download File
                                              ↓
                                        Show Progress
                                              ↓
                                        Download Complete
                                              ↓
                                        Notify User
```

### 3. Install Update

```
User Clicks Install → Quit & Install → electron-updater
                                            ↓
                                       Close App
                                            ↓
                                       Install Update
                                            ↓
                                       Restart App
```

## Error Handling

### Network Errors

- Automatic retry with exponential backoff
- Max 3 retry attempts
- Shows error message after max retries

### Download Failures

- Retries download automatically
- Logs error details
- Provides manual download option

### Installation Failures

- Logs error for debugging
- Shows error dialog with instructions
- Preserves application state

## Logging

All update operations are logged using `electron-log`:

- **Location**: `%APPDATA%/yt-downloader/logs/`
- **Log Levels**: info, warn, error
- **Log Rotation**: Automatic

### Example Log Entries

```
[2024-01-15 10:30:00] [info] Checking for updates...
[2024-01-15 10:30:02] [info] Update available: 1.1.0
[2024-01-15 10:30:05] [info] Starting update download...
[2024-01-15 10:30:45] [info] Update download completed
[2024-01-15 10:31:00] [info] Installing update and restarting...
```

## Security

### Code Signing

- Updates must be signed with the same certificate as the application
- Signature verification is automatic
- Unsigned updates are rejected

### HTTPS

- All update checks use HTTPS
- Update downloads use HTTPS
- Prevents man-in-the-middle attacks

### Integrity Verification

- Checksums are verified automatically
- Corrupted downloads are rejected
- Ensures update integrity

## Testing

### Development Testing

```bash
# Test update check
npm run electron:dev
# Open DevTools and check console for update logs

# Test with local update server
# Set up local update server with test releases
```

### Production Testing

1. Create a test release on GitHub
2. Build and sign the application
3. Install the application
4. Trigger update check
5. Verify update download and installation

## Troubleshooting

### Updates Not Detected

- Check GitHub releases configuration
- Verify `publish` settings in `electron-builder.json`
- Check network connectivity
- Review logs for errors

### Download Failures

- Check network connectivity
- Verify GitHub releases are accessible
- Check available disk space
- Review retry logs

### Installation Failures

- Check application permissions
- Verify code signing certificate
- Check antivirus software
- Review error logs

## Best Practices

1. **Always test updates** before releasing to production
2. **Sign all releases** with a valid certificate
3. **Provide release notes** for each update
4. **Monitor update logs** for issues
5. **Test rollback scenarios** to ensure data safety
6. **Keep update server** (GitHub Releases) accessible
7. **Version updates properly** using semantic versioning

## Future Enhancements

- [ ] Delta updates (only download changed files)
- [ ] Staged rollouts (gradual release to users)
- [ ] Update channels (stable, beta, alpha)
- [ ] Automatic rollback on failure
- [ ] Update size optimization
- [ ] Offline update support
- [ ] Custom update server support

## References

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Electron Builder Documentation](https://www.electron.build/)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
