# Settings Management Implementation

## Overview
This document describes the implementation of the settings management system for the YouTube Downloader Pro desktop application.

## Components Implemented

### 1. Settings Storage System (Task 7.1)

#### SettingsManager (`src/electron/settings-manager.js`)
- **Purpose**: Handles settings storage, validation, and migration
- **Features**:
  - Persistent storage in user data directory
  - Settings validation with type checking
  - Version-based migration system
  - Download path validation with write permission checks
  - Import/export functionality
  - Default settings management

**Key Methods**:
- `loadSettings()` - Load settings from file with automatic migration
- `saveSettings(settings)` - Save validated settings to file
- `updateSettings(partialSettings)` - Update specific settings
- `resetSettings()` - Reset to default values
- `validateSettings(settings)` - Validate all settings
- `migrateSettings(oldSettings)` - Migrate from older versions
- `validateDownloadPath(path)` - Check path exists and is writable

**Settings Schema** (Version 1):
```javascript
{
  version: 1,
  // Download preferences
  downloadPath: string,
  defaultQuality: string,
  defaultType: 'video' | 'audio',
  maxConcurrentDownloads: number (1-10),
  
  // Application preferences
  theme: 'light' | 'dark' | 'system',
  minimizeToTray: boolean,
  startOnBoot: boolean,
  closeToTray: boolean,
  
  // Update preferences
  autoCheckUpdates: boolean,
  autoDownloadUpdates: boolean,
  
  // Notification preferences
  showDesktopNotifications: boolean,
  notifyOnComplete: boolean,
  notifyOnError: boolean,
  
  // Advanced
  customYtdlpPath: string | null,
  customFfmpegPath: string | null,
  proxyUrl: string | null
}
```

### 2. Settings UI (Task 7.2)

#### Settings Component (`client/src/components/Settings.tsx`)
- **Purpose**: Provides user interface for managing settings
- **Features**:
  - Tabbed interface with 4 sections:
    - General: Theme, tray behavior, updates
    - Downloads: Path, quality, type, concurrent downloads
    - Notifications: Enable/disable various notifications
    - Advanced: Custom binary paths, proxy, reset
  - Native folder picker integration (Electron)
  - Real-time validation
  - Save/reset functionality
  - Status feedback

**UI Sections**:

1. **General Settings**
   - Theme selection (Light/Dark/System)
   - Minimize to system tray
   - Start on boot
   - Auto check for updates
   - Auto download updates

2. **Download Settings**
   - Download location with folder picker
   - Default video quality
   - Default download type (video/audio)
   - Max concurrent downloads (1-10)

3. **Notification Settings**
   - Enable desktop notifications
   - Notify on download complete
   - Notify on download error

4. **Advanced Settings**
   - Custom yt-dlp path
   - Custom ffmpeg path
   - Proxy URL
   - Reset all settings (danger zone)

### 3. Settings Integration (Task 7.3)

#### SettingsIntegration (`src/electron/settings-integration.js`)
- **Purpose**: Applies settings to various application components
- **Features**:
  - Theme application using nativeTheme API
  - Window behavior configuration
  - Start on boot registration
  - Download path propagation to backend
  - System theme change detection

**Key Methods**:
- `applySettings(settings)` - Apply all settings to application
- `applyTheme(theme)` - Set application theme
- `applyWindowBehavior(settings)` - Configure window behavior
- `applyStartOnBoot(enabled)` - Register/unregister auto-start
- `getCurrentTheme()` - Get current system theme
- `onThemeChange(callback)` - Listen for system theme changes

#### IPC Handler Updates
- Integrated SettingsManager for storage operations
- Added download path validation before saving
- Integrated SettingsIntegration for applying settings
- Removed duplicate applySettings logic

#### Backend Manager Updates
- Added `updateDownloadPath(newPath)` method
- Download path now configurable via environment variable
- Supports dynamic path updates

#### Frontend Integration
- Settings hook (`useSettings`) for loading/saving settings
- Menu events hook (`useMenuEvents`) for Electron menu integration
- Theme synchronization with settings
- Default quality and type from settings
- Settings tab in main navigation

## File Structure

```
src/electron/
├── settings-manager.js          # Settings storage and validation
├── settings-integration.js      # Settings application logic
├── ipc-handler.js              # Updated with settings integration
├── backend-manager.js          # Updated with download path support
└── main.js                     # Updated with settings initialization

client/src/
├── components/
│   └── Settings.tsx            # Settings UI component
├── hooks/
│   └── useElectron.ts          # Settings and menu hooks
├── utils/
│   └── electron-adapter.ts     # Settings adapter methods
└── App.tsx                     # Integrated settings and theme
```

## Settings Flow

### Loading Settings
1. App starts → `main.js` initializes
2. SettingsManager loads settings from file
3. If file doesn't exist, creates with defaults
4. If version mismatch, migrates settings
5. SettingsIntegration applies settings to app
6. Frontend loads settings via IPC

### Saving Settings
1. User modifies settings in UI
2. Frontend calls `saveSettings()` via electron adapter
3. IPC handler receives settings
4. SettingsManager validates settings
5. If download path changed, validates path
6. Settings saved to file
7. SettingsIntegration applies new settings
8. Frontend receives confirmation

### Theme Application
1. Settings specify theme (light/dark/system)
2. SettingsIntegration applies via nativeTheme API
3. Frontend detects theme and updates UI
4. System theme changes trigger updates

## IPC Channels

### Settings Management
- `settings:get` - Get current settings
- `settings:set` - Update settings (partial or full)
- `settings:reset` - Reset to defaults

## Storage Location

Settings are stored in:
- **Windows**: `%APPDATA%/yt-downloader/settings.json`
- **macOS**: `~/Library/Application Support/yt-downloader/settings.json`
- **Linux**: `~/.config/yt-downloader/settings.json`

## Migration Strategy

Settings include a `version` field for migration:
- Current version: 1
- When loading, if version < current, migrate
- Migration preserves user data
- New settings get default values
- Old settings are validated

## Validation Rules

### Download Path
- Must be a valid string
- Directory must exist or be creatable
- Must have write permissions

### Quality
- Valid values: 'highest', 'best', '4k', '2k', '1080', '720', '480', '360', '240'

### Type
- Valid values: 'video', 'audio'

### Max Concurrent Downloads
- Must be number between 1 and 10

### Theme
- Valid values: 'light', 'dark', 'system'

### Boolean Settings
- All boolean settings validated as true/false
- Invalid values reset to defaults

### Custom Paths
- Can be null or valid string
- No validation on custom binary paths (user responsibility)

## Future Enhancements

Potential improvements for future versions:

1. **Settings Sync**
   - Cloud sync across devices
   - Import/export settings file

2. **Advanced Validation**
   - Verify custom binary paths exist
   - Test proxy connectivity

3. **Profile Management**
   - Multiple settings profiles
   - Quick profile switching

4. **Settings Search**
   - Search within settings
   - Quick navigation to specific settings

5. **Settings History**
   - Track settings changes
   - Rollback to previous settings

## Testing

To test settings management:

1. **Storage**
   - Verify settings file creation
   - Test migration from version 0 to 1
   - Validate settings persistence

2. **UI**
   - Test all input controls
   - Verify folder picker (Electron)
   - Test save/reset functionality

3. **Integration**
   - Verify theme changes apply
   - Test start on boot registration
   - Verify download path updates backend
   - Test notification preferences

4. **Validation**
   - Test invalid download paths
   - Test out-of-range values
   - Test invalid enum values

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 3.1**: Settings stored in local application data directory ✓
- **Requirement 3.2**: Download path validation with write permissions ✓
- **Requirement 3.3**: Settings persist between restarts ✓
- **Requirement 3.5**: Native folder picker dialog ✓
- **Requirement 4.4**: Auto-update preferences ✓

## Conclusion

The settings management system provides a robust, user-friendly way to configure the application. It includes proper validation, migration support, and seamless integration with both the Electron main process and React frontend.
