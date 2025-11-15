# Update Error Handling and Rollback

This document describes the comprehensive error handling and rollback mechanisms implemented for the auto-updater system.

## Overview

The auto-updater now includes robust error handling with retry logic, error categorization, rollback mechanisms, and detailed logging to ensure reliable updates and graceful failure recovery.

## Features

### 1. Error Tracking and History

**Error Recording**
- All update errors are recorded with detailed information:
  - Timestamp
  - Operation type (check, download, install)
  - Error message and stack trace
  - Retry count at time of error
- Error history is persisted to disk (`update-error-history.json`)
- Maximum of 10 most recent errors are kept
- Consecutive failure counter tracks reliability

**Error History API**
```javascript
// Get error history
const { history } = await window.electron.updates.getErrorHistory();

// Clear error history
await window.electron.updates.clearErrorHistory();
```

### 2. Intelligent Retry Logic

**Exponential Backoff**
- First retry: 5 seconds
- Second retry: 10 seconds
- Third retry: 20 seconds
- Maximum 3 retry attempts per operation

**Retryable Error Detection**
The system automatically determines if an error is retryable:

**Retryable Errors:**
- Network errors (ECONNREFUSED, ENOTFOUND, ETIMEDOUT)
- Timeout errors
- Temporary server errors (502, 503, 504)

**Non-Retryable Errors:**
- Disk space errors (ENOSPC)
- Permission errors (EACCES, EPERM)
- Integrity/checksum errors

**Retry Cancellation**
```javascript
// Cancel pending retry
await window.electron.updates.cancelRetry();
```

### 3. Error Categorization

Errors are categorized for better troubleshooting:

| Category | Description | Examples |
|----------|-------------|----------|
| `network` | Network connectivity issues | ECONNREFUSED, ENOTFOUND |
| `timeout` | Request timeout | ETIMEDOUT |
| `disk_space` | Insufficient disk space | ENOSPC |
| `permission` | Permission denied | EACCES, EPERM |
| `integrity` | File integrity issues | Checksum mismatch |
| `unknown` | Unclassified errors | Other errors |

### 4. User-Friendly Error Dialogs

When an error occurs after all retries are exhausted, users see a dialog with:
- Clear error message
- Category-specific troubleshooting steps
- Multiple action options:
  - **OK**: Dismiss the dialog
  - **View Logs**: Open log file for debugging
  - **Visit Website**: Download update manually
  - **Retry Now**: Attempt operation again immediately

**Troubleshooting Steps by Category:**

**Network Errors:**
- Check your internet connection
- Verify firewall settings
- Try again in a few minutes

**Timeout Errors:**
- Check your internet speed
- Try again when network is more stable
- Disable VPN if active

**Disk Space Errors:**
- Free up disk space on your system drive
- Remove temporary files
- Uninstall unused applications

**Permission Errors:**
- Run the application as administrator
- Check folder permissions
- Disable antivirus temporarily

**Integrity Errors:**
- Clear update cache
- Download update manually
- Reinstall the application

### 5. Rollback Mechanism

**Backup Creation**
Before installing an update, the system creates a backup file containing:
```json
{
  "previousVersion": "1.0.0",
  "targetVersion": "1.1.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "updateInfo": { /* full update info */ }
}
```

**Automatic Rollback**
If update installation fails:
1. System loads backup information
2. Notifies user about the failure
3. Cleans up failed update files
4. Removes pending update cache
5. Records rollback in error history
6. Application continues on previous version

**Rollback Notification**
Users see a dialog explaining:
- Update installation failed
- Application is running on previous version
- Options to try again later or download manually

### 6. Failed Update Cleanup

The system automatically cleans up after failed updates:
- Removes pending update files
- Clears update cache
- Frees up disk space
- Prevents corrupted update files from causing issues

### 7. Consecutive Failure Protection

**Temporary Auto-Check Disable**
If 5 consecutive update operations fail:
1. Automatic update checks are temporarily disabled
2. User is notified via event: `updater:auto-check-disabled`
3. Auto-checks are re-enabled after 24 hours
4. Manual checks still work

**Event Listener:**
```javascript
window.electron.updates.onAutoCheckDisabled((data) => {
  console.log('Auto-check disabled:', data.reason);
  console.log('Will retry after:', data.retryAfter);
});
```

### 8. Comprehensive Logging

**Log Levels**
- `info`: Normal operations (checks, downloads, installs)
- `warn`: Warnings (retries, temporary failures)
- `error`: Errors with full details

**Log Information**
Each log entry includes:
- Timestamp
- Operation type
- Current/target versions
- Retry attempt number
- Error details (message, stack, name)
- Consecutive failure count

**Log File Access**
Users can access logs via:
- Error dialog "View Logs" button
- Help menu → View Logs
- Direct file access: `%APPDATA%/yt-downloader/logs/`

### 9. Status Updates to Renderer

The main process sends detailed status updates to the renderer:

**Status Types:**
- `checking`: Update check in progress
- `available`: Update available
- `not-available`: No update available
- `downloading`: Download in progress (with progress data)
- `downloaded`: Download complete
- `error`: Error occurred
- `retrying`: Retry scheduled (with retry info)

**Status Event Data:**
```javascript
{
  status: 'retrying',
  data: {
    attempt: 2,
    maxAttempts: 3,
    nextRetryIn: 10000, // milliseconds
    operation: 'download'
  },
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## API Reference

### Main Process (auto-updater.js)

```javascript
class AutoUpdater {
  // Error handling
  recordError(operation, error)
  isErrorRetryable(error)
  categorizeError(error)
  getTroubleshootingSteps(errorType)
  handleUpdateError(error)
  
  // Rollback
  createUpdateBackup()
  attemptRollback()
  cleanupFailedUpdate()
  
  // Error history
  getErrorHistory()
  clearErrorHistory()
  loadErrorHistory()
  saveErrorHistory()
  
  // Retry management
  cancelRetry()
  
  // Protection
  temporarilyDisableAutoCheck()
  
  // Utilities
  openLogFile()
  showUpdateErrorDialog(error)
}
```

### IPC Handlers

```javascript
// Get error history
ipcMain.handle('updater:get-error-history', ...)

// Clear error history
ipcMain.handle('updater:clear-error-history', ...)

// Cancel retry
ipcMain.handle('updater:cancel-retry', ...)
```

### Renderer API (via window.electron)

```javascript
// Error history
await window.electron.updates.getErrorHistory()
await window.electron.updates.clearErrorHistory()

// Retry management
await window.electron.updates.cancelRetry()

// Event listeners
window.electron.updates.onStatus(callback)
window.electron.updates.onAutoCheckDisabled(callback)
```

## File Locations

**Error History:**
- Windows: `%APPDATA%/yt-downloader/update-error-history.json`

**Update Backup:**
- Windows: `%APPDATA%/yt-downloader/update-backup.json`

**Logs:**
- Windows: `%APPDATA%/yt-downloader/logs/main.log`

**Update Cache:**
- Windows: `%APPDATA%/yt-downloader/update-cache/`

**Pending Updates:**
- Windows: `%APPDATA%/yt-downloader/pending-update/`

## Error Flow Diagram

```
Update Operation
       ↓
   Operation Fails
       ↓
   Record Error
       ↓
   Is Retryable? ──No──→ Show Error Dialog
       ↓ Yes                    ↓
   Retry Count < Max?      User Actions:
       ↓ Yes               - View Logs
   Schedule Retry          - Visit Website
   (Exponential Backoff)   - Retry Now
       ↓                   - Dismiss
   Wait & Retry
       ↓
   Success? ──Yes──→ Reset Counters
       ↓ No               Continue
   Max Retries Reached
       ↓
   Show Error Dialog
       ↓
   Consecutive Failures >= 5?
       ↓ Yes
   Temporarily Disable Auto-Check
   (Re-enable after 24 hours)
```

## Best Practices

### For Users

1. **Check Logs**: If updates fail repeatedly, check logs for details
2. **Network**: Ensure stable internet connection during updates
3. **Disk Space**: Keep sufficient free space (at least 500MB)
4. **Permissions**: Run as administrator if permission errors occur
5. **Manual Download**: Use manual download as fallback

### For Developers

1. **Test Error Scenarios**: Test with network failures, disk space issues
2. **Monitor Error History**: Check error patterns in production
3. **Update Troubleshooting**: Keep troubleshooting steps current
4. **Log Analysis**: Review logs for common failure patterns
5. **Rollback Testing**: Test rollback mechanism thoroughly

## Testing

### Manual Testing

1. **Network Errors**: Disconnect network during update
2. **Timeout Errors**: Use slow/unstable connection
3. **Disk Space**: Fill disk to trigger ENOSPC
4. **Permission Errors**: Remove write permissions
5. **Retry Logic**: Verify exponential backoff timing
6. **Rollback**: Force installation failure
7. **Error History**: Verify persistence across restarts
8. **Auto-Disable**: Trigger 5 consecutive failures

### Automated Testing

See `src/electron/__tests__/auto-updater.test.js` for unit tests covering:
- Error categorization
- Retry logic
- Rollback mechanism
- Error history management
- Cleanup operations

## Troubleshooting

### Updates Keep Failing

1. Check error history: `window.electron.updates.getErrorHistory()`
2. Review logs for patterns
3. Verify network connectivity
4. Check disk space
5. Try manual download

### Auto-Check Disabled

If auto-check is disabled due to failures:
1. Wait 24 hours for automatic re-enable
2. Or clear error history and restart app
3. Manual checks still work

### Rollback Not Working

1. Check if backup file exists
2. Review logs for rollback errors
3. Manually reinstall if needed

## Future Enhancements

- [ ] Configurable retry attempts and delays
- [ ] Email/webhook notifications for critical errors
- [ ] Automatic error reporting to server
- [ ] Update download resume capability
- [ ] Differential updates to reduce download size
- [ ] Multiple update channels (stable, beta, dev)
- [ ] Scheduled update windows
- [ ] Bandwidth throttling for downloads

## Related Files

- `src/electron/auto-updater.js` - Main implementation
- `src/electron/ipc-handler.js` - IPC handlers
- `src/electron/preload.ts` - Renderer API
- `client/src/vite-env.d.ts` - TypeScript definitions
- `client/src/components/UpdateNotification.tsx` - UI component
- `client/src/components/UpdateSettings.tsx` - Settings UI

## Requirements Satisfied

This implementation satisfies the following requirements:

- **4.1**: Update checks with error handling
- **4.2**: Update notifications with error details
- **5.3**: Comprehensive error logging and debugging
