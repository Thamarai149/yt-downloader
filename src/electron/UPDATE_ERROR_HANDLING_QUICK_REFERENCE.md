# Update Error Handling - Quick Reference

## For Frontend Developers

### Check Error History
```typescript
const result = await window.electron.updates.getErrorHistory();
if (result.success) {
  result.history.forEach(error => {
    console.log(`${error.timestamp}: ${error.operation} - ${error.message}`);
  });
}
```

### Clear Error History
```typescript
await window.electron.updates.clearErrorHistory();
```

### Cancel Retry
```typescript
await window.electron.updates.cancelRetry();
```

### Listen for Events
```typescript
// Retry status
window.electron.updates.onStatus((status) => {
  if (status.status === 'retrying') {
    showRetryNotification(status.data);
  }
});

// Auto-check disabled
window.electron.updates.onAutoCheckDisabled((data) => {
  showWarning(`Auto-check disabled: ${data.reason}`);
});
```

## Error Categories

| Category | Retryable | User Action |
|----------|-----------|-------------|
| network | ✅ Yes | Check internet connection |
| timeout | ✅ Yes | Wait for stable connection |
| disk_space | ❌ No | Free up disk space |
| permission | ❌ No | Run as administrator |
| integrity | ❌ No | Clear cache, reinstall |
| unknown | ✅ Yes | Check logs |

## Retry Behavior

- **Attempt 1**: Wait 5 seconds
- **Attempt 2**: Wait 10 seconds  
- **Attempt 3**: Wait 20 seconds
- **After 3 failures**: Show error dialog

## File Locations

```
%APPDATA%/yt-downloader/
├── update-error-history.json    # Error history
├── update-backup.json           # Rollback info
├── logs/
│   └── main.log                 # Main process logs
├── update-cache/                # Update cache (cleaned on failure)
└── pending-update/              # Pending updates (cleaned on failure)
```

## Common Patterns

### Display Error History in UI
```typescript
function ErrorHistoryView() {
  const [errors, setErrors] = useState([]);
  
  useEffect(() => {
    loadErrors();
  }, []);
  
  async function loadErrors() {
    const result = await window.electron.updates.getErrorHistory();
    if (result.success) {
      setErrors(result.history);
    }
  }
  
  async function clearHistory() {
    await window.electron.updates.clearErrorHistory();
    setErrors([]);
  }
  
  return (
    <div>
      <h3>Update Error History</h3>
      {errors.map((error, i) => (
        <div key={i}>
          <strong>{error.operation}</strong>: {error.message}
          <small>{new Date(error.timestamp).toLocaleString()}</small>
        </div>
      ))}
      <button onClick={clearHistory}>Clear History</button>
    </div>
  );
}
```

### Show Retry Progress
```typescript
function UpdateStatus() {
  const [retryInfo, setRetryInfo] = useState(null);
  
  useEffect(() => {
    const handler = (status) => {
      if (status.status === 'retrying') {
        setRetryInfo(status.data);
      } else {
        setRetryInfo(null);
      }
    };
    
    window.electron.updates.onStatus(handler);
    
    return () => {
      window.electron.updates.removeStatusListener(handler);
    };
  }, []);
  
  if (!retryInfo) return null;
  
  return (
    <div className="retry-notification">
      <p>Retry {retryInfo.attempt}/{retryInfo.maxAttempts}</p>
      <p>Next attempt in {retryInfo.nextRetryIn / 1000}s</p>
      <button onClick={() => window.electron.updates.cancelRetry()}>
        Cancel
      </button>
    </div>
  );
}
```

### Handle Auto-Check Disabled
```typescript
function UpdateSettings() {
  const [autoCheckDisabled, setAutoCheckDisabled] = useState(false);
  
  useEffect(() => {
    const handler = (data) => {
      setAutoCheckDisabled(true);
      showNotification({
        title: 'Auto-Check Disabled',
        message: `${data.reason}. Will retry after ${data.retryAfter}.`,
      });
    };
    
    window.electron.updates.onAutoCheckDisabled(handler);
    
    return () => {
      window.electron.updates.removeAutoCheckDisabledListener(handler);
    };
  }, []);
  
  return (
    <div>
      {autoCheckDisabled && (
        <div className="warning">
          Auto-check temporarily disabled due to repeated failures.
          Manual checks still available.
        </div>
      )}
    </div>
  );
}
```

## Testing Checklist

- [ ] Network error during check
- [ ] Network error during download
- [ ] Timeout error
- [ ] Disk space error
- [ ] Permission error
- [ ] Retry logic (3 attempts)
- [ ] Retry cancellation
- [ ] Error history persistence
- [ ] Error history limit (10)
- [ ] Clear error history
- [ ] Rollback on install failure
- [ ] Failed update cleanup
- [ ] 5 consecutive failures → auto-disable
- [ ] Auto-enable after 24 hours
- [ ] View logs button
- [ ] Manual retry button
- [ ] Visit website button

## Troubleshooting

### Updates Always Fail
1. Check error history for patterns
2. View logs for details
3. Verify network connectivity
4. Check disk space (need 500MB+)
5. Try manual download

### Retry Not Working
1. Check if error is retryable
2. Verify retry count < 3
3. Check logs for retry attempts
4. Try manual retry

### Rollback Not Triggered
1. Verify backup file exists
2. Check logs for rollback errors
3. Installation errors should trigger rollback
4. Check/download errors don't trigger rollback

### Auto-Check Disabled
1. Check consecutive failure count
2. Wait 24 hours for auto-enable
3. Or clear error history and restart
4. Manual checks still work

## API Summary

### Methods
```typescript
window.electron.updates.getErrorHistory()      // Get error history
window.electron.updates.clearErrorHistory()    // Clear history
window.electron.updates.cancelRetry()          // Cancel retry
```

### Events
```typescript
window.electron.updates.onStatus(callback)              // Status updates
window.electron.updates.onAutoCheckDisabled(callback)   // Auto-check disabled
```

### Event Data Structures

**Retry Status:**
```typescript
{
  status: 'retrying',
  data: {
    attempt: number,
    maxAttempts: number,
    nextRetryIn: number,  // milliseconds
    operation: 'check' | 'download'
  }
}
```

**Auto-Check Disabled:**
```typescript
{
  reason: string,
  retryAfter: string  // e.g., "24 hours"
}
```

**Error Record:**
```typescript
{
  timestamp: string,
  operation: 'check' | 'download' | 'install' | 'rollback',
  message: string,
  name: string,
  stack: string,
  retryCount: number
}
```
