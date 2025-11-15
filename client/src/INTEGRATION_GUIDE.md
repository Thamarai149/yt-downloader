# Frontend Integration Guide for Tasks 11, 12, 14

## New Components Created

### 1. ErrorBoundary Component
**Location:** `client/src/components/ErrorBoundary.tsx`

**Purpose:** Catches React errors and displays a user-friendly error screen

**Integration:**
```tsx
import ErrorBoundary from './components/ErrorBoundary';

// Wrap your entire App component
function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
```

### 2. OfflineBanner Component
**Location:** `client/src/components/OfflineBanner.tsx`

**Purpose:** Displays a banner when the user is offline

**Integration:**
```tsx
import OfflineBanner from './components/OfflineBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';

function App() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      <OfflineBanner isOnline={isOnline} />
      {/* Rest of your app */}
    </div>
  );
}
```

### 3. SplashScreen Component
**Location:** `client/src/components/SplashScreen.tsx`

**Purpose:** Shows a loading screen during app initialization

**Integration:**
```tsx
import SplashScreen from './components/SplashScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initialization
    setTimeout(() => setIsLoading(false), 2000);
  }, []);
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return <div>{/* Your app */}</div>;
}
```

### 4. useOnlineStatus Hook
**Location:** `client/src/hooks/useOnlineStatus.ts`

**Purpose:** Detects online/offline status

**Usage:**
```tsx
import { useOnlineStatus } from './hooks/useOnlineStatus';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {isOnline ? (
        <button onClick={handleDownload}>Download</button>
      ) : (
        <button disabled>Download (Offline)</button>
      )}
    </div>
  );
}
```

## Complete Integration Example

Here's how to integrate all components into your App.tsx:

```tsx
import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import SplashScreen from './components/SplashScreen';
import { useOnlineStatus } from './hooks/useOnlineStatus';

function AppContent() {
  const isOnline = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    const init = async () => {
      try {
        // Your initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="app-container">
      <OfflineBanner isOnline={isOnline} />
      
      {/* Your existing app content */}
      <div className="main-content">
        {/* Disable download features when offline */}
        <button 
          onClick={handleDownload}
          disabled={!isOnline}
        >
          {isOnline ? 'Download' : 'Download (Offline)'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
```

## Offline Behavior Guidelines

### Features to Disable When Offline
- Download buttons
- Search functionality
- Playlist fetching
- Video info fetching
- Update checks

### Features That Work Offline
- View download history
- Open downloaded files
- Open containing folders
- Change settings
- Switch themes
- View analytics

### Implementation Pattern
```tsx
const isOnline = useOnlineStatus();

// Disable download input
<input 
  disabled={!isOnline}
  placeholder={isOnline ? "Enter URL" : "Offline - Cannot download"}
/>

// Disable download button
<button 
  disabled={!isOnline || loading}
  onClick={handleDownload}
>
  {!isOnline ? 'Offline' : loading ? 'Downloading...' : 'Download'}
</button>

// Show offline message
{!isOnline && (
  <p className="text-warning">
    You are offline. Connect to the internet to download videos.
  </p>
)}
```

## Styling Notes

### OfflineBanner
The banner uses inline styles but can be customized:
- Background: `#f59e0b` (amber/warning color)
- Text: `#ffffff` (white)
- Position: Fixed at top
- Z-index: 9999

### ErrorBoundary
Uses CSS variables for theming:
- `--color-surface`
- `--color-background`
- `--color-error`
- `--color-text-secondary`

### SplashScreen
Uses CSS variables and includes a spinning animation:
- `--color-background`
- `--color-text`
- `--color-border`
- `--color-primary`

## Testing

### Test ErrorBoundary
```tsx
// Create a component that throws an error
function BuggyComponent() {
  throw new Error('Test error');
}

// Wrap it in ErrorBoundary
<ErrorBoundary>
  <BuggyComponent />
</ErrorBoundary>
```

### Test Offline Detection
1. Open DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Verify banner appears
5. Set back to "Online"
6. Verify banner disappears

### Test SplashScreen
1. Add artificial delay in initialization
2. Verify splash screen shows
3. Verify it disappears after initialization

## Migration Checklist

- [ ] Import ErrorBoundary in main.tsx or App.tsx
- [ ] Wrap App component with ErrorBoundary
- [ ] Import OfflineBanner component
- [ ] Import useOnlineStatus hook
- [ ] Add OfflineBanner to App component
- [ ] Use isOnline to disable download features
- [ ] Add SplashScreen for initialization
- [ ] Test error boundary with intentional error
- [ ] Test offline detection
- [ ] Test splash screen timing
- [ ] Update CSS variables if needed
- [ ] Test on different themes (light/dark)

## Additional Enhancements (Optional)

### 1. Retry Failed Downloads When Back Online
```tsx
useEffect(() => {
  if (isOnline && hasFailedDownloads) {
    // Retry failed downloads
    retryFailedDownloads();
  }
}, [isOnline]);
```

### 2. Queue Downloads When Offline
```tsx
const queueDownload = (url) => {
  if (!isOnline) {
    addToQueue(url);
    showMessage('Download queued. Will start when online.');
  } else {
    startDownload(url);
  }
};
```

### 3. Show Connection Status in UI
```tsx
<div className="status-bar">
  <span className={isOnline ? 'status-online' : 'status-offline'}>
    {isOnline ? '● Online' : '● Offline'}
  </span>
</div>
```

## Support

For issues or questions:
- Check the main documentation in `docs/USER_GUIDE.md`
- Review the testing checklist in `docs/TESTING_CHECKLIST.md`
- See the implementation summary in `docs/TASKS_11_12_14_15_SUMMARY.md`
