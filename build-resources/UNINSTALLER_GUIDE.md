# Uninstaller Guide

## Overview

The YouTube Downloader Pro uninstaller includes custom prompts to give users control over their data during uninstallation. This ensures a clean removal while respecting user preferences for keeping personal data.

## Features

### 1. Downloads Prompt
When uninstalling, users are asked whether they want to keep their downloaded videos:
- **Yes**: Downloads remain in `%APPDATA%\yt-downloader\downloads`
- **No**: All downloaded videos are permanently deleted

### 2. Settings Prompt
Users can choose to keep or delete their application settings:
- **Yes**: Settings, preferences, and download history are preserved
- **No**: All configuration files are removed, including:
  - `settings.json` - User preferences
  - `window-state.json` - Window position and size
  - `download-history.json` - Download history
  - `logs/` - Application logs
  - `cache/` - Cached data

### 3. Automatic Cleanup
The uninstaller automatically removes:
- Desktop shortcut
- Start menu shortcuts
- Registry entries
- Windows startup entries (if enabled)
- Installation directory files

## User Data Locations

### Application Files
- **Location**: `C:\Program Files\YouTube Downloader Pro\` (or user-selected directory)
- **Contents**: Application binaries, resources, and bundled tools
- **Removal**: Always removed during uninstallation

### User Data
- **Location**: `%APPDATA%\yt-downloader\`
- **Contents**: 
  - `downloads/` - Downloaded videos
  - `settings.json` - User preferences
  - `window-state.json` - Window state
  - `download-history.json` - Download history
  - `logs/` - Application logs
  - `cache/` - Cached thumbnails and data
- **Removal**: User choice via prompts

### Registry Entries
- **Location**: `HKEY_CURRENT_USER\Software\YouTube Downloader Pro`
- **Contents**: Application settings and uninstaller information
- **Removal**: Always removed during uninstallation

### Shortcuts
- **Desktop**: `%USERPROFILE%\Desktop\YouTube Downloader Pro.lnk`
- **Start Menu**: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\YouTube Downloader Pro\`
- **Removal**: Always removed during uninstallation

## Uninstallation Process

### Step 1: Launch Uninstaller
Users can uninstall via:
- Windows Settings → Apps → YouTube Downloader Pro → Uninstall
- Control Panel → Programs and Features → YouTube Downloader Pro → Uninstall
- Start Menu → YouTube Downloader Pro → Uninstall

### Step 2: Downloads Prompt
```
Do you want to keep your downloaded videos?

Your downloads are located in:
C:\Users\[Username]\AppData\Roaming\yt-downloader\downloads

Click 'Yes' to keep them, 'No' to delete them.
```

### Step 3: Settings Prompt
```
Do you want to keep your application settings?

This includes your preferences, download history, and configuration.

Click 'Yes' to keep them, 'No' to delete them.
```

### Step 4: Cleanup
The uninstaller removes:
- Application files from installation directory
- Desktop and Start Menu shortcuts
- Registry entries
- Windows startup entries (if present)

### Step 5: Completion
```
YouTube Downloader Pro has been uninstalled.

Thank you for using our application!
```

## Testing the Uninstaller

### Prerequisites
- Clean Windows installation (VM recommended)
- YouTube Downloader Pro installed
- Some downloaded videos and configured settings

### Test Scenarios

#### Scenario 1: Keep Everything
1. Install the application
2. Download some videos
3. Configure settings (theme, download path, etc.)
4. Run uninstaller
5. Choose "Yes" for both prompts
6. Verify:
   - ✅ Application removed from Programs
   - ✅ Downloads still exist in AppData
   - ✅ Settings files still exist
   - ✅ Shortcuts removed
   - ✅ Registry entries removed

#### Scenario 2: Delete Everything
1. Install the application
2. Download some videos
3. Configure settings
4. Run uninstaller
5. Choose "No" for both prompts
6. Verify:
   - ✅ Application removed from Programs
   - ✅ Downloads deleted
   - ✅ Settings files deleted
   - ✅ Shortcuts removed
   - ✅ Registry entries removed
   - ✅ AppData directory removed (if empty)

#### Scenario 3: Keep Downloads, Delete Settings
1. Install the application
2. Download some videos
3. Configure settings
4. Run uninstaller
5. Choose "Yes" for downloads, "No" for settings
6. Verify:
   - ✅ Application removed from Programs
   - ✅ Downloads still exist
   - ✅ Settings files deleted
   - ✅ Shortcuts removed
   - ✅ Registry entries removed

#### Scenario 4: Delete Downloads, Keep Settings
1. Install the application
2. Download some videos
3. Configure settings
4. Run uninstaller
5. Choose "No" for downloads, "Yes" for settings
6. Verify:
   - ✅ Application removed from Programs
   - ✅ Downloads deleted
   - ✅ Settings files still exist
   - ✅ Shortcuts removed
   - ✅ Registry entries removed

### Automated Testing

Run the configuration test:
```bash
node scripts/test-uninstaller.js
```

This verifies:
- Custom NSIS script exists
- Prompts are properly configured
- Registry cleanup is implemented
- Shortcut removal is implemented
- electron-builder.json is properly configured

## Technical Implementation

### NSIS Script
The custom uninstaller logic is implemented in `build-resources/installer.nsh` using NSIS macros:

- `!macro customUnInstall` - Main uninstaller logic
- `!macro customRemoveFiles` - Additional file cleanup
- `!macro customInstall` - Installation flag creation

### Key Features
1. **User Data Detection**: Checks if `%APPDATA%\yt-downloader` exists
2. **Interactive Prompts**: Uses `MessageBox` for user choices
3. **Conditional Deletion**: Only deletes data based on user response
4. **Complete Cleanup**: Removes shortcuts, registry entries, and startup entries
5. **User Feedback**: Shows completion message

### Configuration
In `electron-builder.json`:
```json
{
  "nsis": {
    "deleteAppDataOnUninstall": false,
    "include": "build-resources/installer.nsh"
  }
}
```

## Troubleshooting

### Issue: Prompts Not Appearing
**Cause**: Custom NSIS script not included in build
**Solution**: Verify `electron-builder.json` has `"include": "build-resources/installer.nsh"`

### Issue: Data Not Deleted When Choosing "No"
**Cause**: Incorrect path or permissions
**Solution**: Check that `%APPDATA%\yt-downloader` path is correct and accessible

### Issue: Shortcuts Not Removed
**Cause**: Shortcuts created in non-standard locations
**Solution**: Verify shortcut paths match those in the NSIS script

### Issue: Registry Entries Remain
**Cause**: Incorrect registry key paths
**Solution**: Check registry paths in NSIS script match actual entries

## Best Practices

### For Users
1. **Backup Important Downloads**: Before uninstalling, consider backing up important videos
2. **Note Custom Settings**: If you plan to reinstall, note your custom settings
3. **Check Download Location**: If you changed the download location, those files won't be affected

### For Developers
1. **Test on Clean System**: Always test uninstaller on a clean Windows installation
2. **Verify All Paths**: Ensure all file and registry paths are correct
3. **Handle Edge Cases**: Test with missing directories, locked files, etc.
4. **User Communication**: Clearly communicate what will be deleted
5. **Graceful Failures**: Handle errors gracefully (e.g., locked files)

## Requirements Mapping

This implementation satisfies the following requirements:

- **9.1**: Uninstaller accessible from Windows Control Panel ✅
- **9.2**: Removes all application files from Program Files ✅
- **9.3**: Prompts whether to keep or delete downloaded videos ✅
- **9.4**: Prompts whether to keep or delete user settings ✅
- **9.5**: Removes desktop shortcuts and start menu entries ✅

## Future Enhancements

Potential improvements for future versions:
1. Export settings before uninstall
2. Create backup of downloads
3. Uninstall survey/feedback
4. Selective file deletion (choose specific downloads)
5. Repair installation option
6. Rollback to previous version

## Support

If users experience issues with uninstallation:
1. Check Windows Event Viewer for errors
2. Manually delete remaining files from `%APPDATA%\yt-downloader`
3. Use Windows Registry Editor to remove `HKCU\Software\YouTube Downloader Pro`
4. Contact support with uninstaller log files
