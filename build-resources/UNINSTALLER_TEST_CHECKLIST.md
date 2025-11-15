# Uninstaller Testing Checklist

## Prerequisites

### Test Environment
- [ ] Clean Windows 10 or Windows 11 installation (VM recommended)
- [ ] No previous installation of YouTube Downloader Pro
- [ ] Administrator access (for installation)
- [ ] At least 500MB free disk space

### Test Data Preparation
- [ ] Install YouTube Downloader Pro
- [ ] Download at least 3 test videos
- [ ] Configure custom settings:
  - [ ] Change theme (light/dark)
  - [ ] Set custom download path
  - [ ] Enable/disable notifications
  - [ ] Configure quality preferences
- [ ] Verify files exist in `%APPDATA%\yt-downloader\`

## Test Scenarios

### Scenario 1: Keep Everything
**Objective**: Verify that user data is preserved when user chooses to keep it

#### Steps
1. [ ] Open Windows Settings → Apps → Apps & features
2. [ ] Find "YouTube Downloader Pro" in the list
3. [ ] Click "Uninstall"
4. [ ] When prompted about downloads, click "Yes" (keep)
5. [ ] When prompted about settings, click "Yes" (keep)
6. [ ] Wait for uninstallation to complete
7. [ ] Click "OK" on completion message

#### Verification
- [ ] Application removed from Apps list
- [ ] Application removed from `C:\Program Files\YouTube Downloader Pro\`
- [ ] Desktop shortcut removed
- [ ] Start Menu shortcut removed
- [ ] Downloads still exist in `%APPDATA%\yt-downloader\downloads\`
- [ ] Settings file still exists: `%APPDATA%\yt-downloader\settings.json`
- [ ] Download history still exists: `%APPDATA%\yt-downloader\download-history.json`
- [ ] Registry key removed: `HKCU\Software\YouTube Downloader Pro`
- [ ] Startup entry removed (if was enabled)

#### Expected Result
✅ Application removed, user data preserved

---

### Scenario 2: Delete Everything
**Objective**: Verify that all data is removed when user chooses to delete it

#### Steps
1. [ ] Reinstall YouTube Downloader Pro
2. [ ] Download test videos and configure settings
3. [ ] Open Control Panel → Programs and Features
4. [ ] Find "YouTube Downloader Pro"
5. [ ] Click "Uninstall"
6. [ ] When prompted about downloads, click "No" (delete)
7. [ ] When prompted about settings, click "No" (delete)
8. [ ] Wait for uninstallation to complete
9. [ ] Click "OK" on completion message

#### Verification
- [ ] Application removed from Programs list
- [ ] Application removed from `C:\Program Files\YouTube Downloader Pro\`
- [ ] Desktop shortcut removed
- [ ] Start Menu shortcut removed
- [ ] Downloads deleted from `%APPDATA%\yt-downloader\downloads\`
- [ ] Settings file deleted: `%APPDATA%\yt-downloader\settings.json`
- [ ] Window state deleted: `%APPDATA%\yt-downloader\window-state.json`
- [ ] Download history deleted: `%APPDATA%\yt-downloader\download-history.json`
- [ ] Logs directory deleted: `%APPDATA%\yt-downloader\logs\`
- [ ] Cache directory deleted: `%APPDATA%\yt-downloader\cache\`
- [ ] AppData directory removed: `%APPDATA%\yt-downloader\` (if empty)
- [ ] Registry key removed: `HKCU\Software\YouTube Downloader Pro`
- [ ] Startup entry removed (if was enabled)

#### Expected Result
✅ Complete removal of application and all user data

---

### Scenario 3: Keep Downloads, Delete Settings
**Objective**: Verify selective data preservation

#### Steps
1. [ ] Reinstall YouTube Downloader Pro
2. [ ] Download test videos and configure settings
3. [ ] Run uninstaller from Start Menu → YouTube Downloader Pro → Uninstall
4. [ ] When prompted about downloads, click "Yes" (keep)
5. [ ] When prompted about settings, click "No" (delete)
6. [ ] Wait for uninstallation to complete
7. [ ] Click "OK" on completion message

#### Verification
- [ ] Application removed from Programs list
- [ ] Application removed from installation directory
- [ ] Desktop shortcut removed
- [ ] Start Menu shortcut removed
- [ ] Downloads still exist in `%APPDATA%\yt-downloader\downloads\`
- [ ] Settings file deleted: `%APPDATA%\yt-downloader\settings.json`
- [ ] Window state deleted: `%APPDATA%\yt-downloader\window-state.json`
- [ ] Download history deleted: `%APPDATA%\yt-downloader\download-history.json`
- [ ] Logs directory deleted: `%APPDATA%\yt-downloader\logs\`
- [ ] Cache directory deleted: `%APPDATA%\yt-downloader\cache\`
- [ ] Registry key removed: `HKCU\Software\YouTube Downloader Pro`

#### Expected Result
✅ Downloads preserved, settings removed

---

### Scenario 4: Delete Downloads, Keep Settings
**Objective**: Verify selective data deletion

#### Steps
1. [ ] Reinstall YouTube Downloader Pro
2. [ ] Download test videos and configure settings
3. [ ] Run uninstaller
4. [ ] When prompted about downloads, click "No" (delete)
5. [ ] When prompted about settings, click "Yes" (keep)
6. [ ] Wait for uninstallation to complete
7. [ ] Click "OK" on completion message

#### Verification
- [ ] Application removed from Programs list
- [ ] Application removed from installation directory
- [ ] Desktop shortcut removed
- [ ] Start Menu shortcut removed
- [ ] Downloads deleted from `%APPDATA%\yt-downloader\downloads\`
- [ ] Settings file still exists: `%APPDATA%\yt-downloader\settings.json`
- [ ] Window state still exists: `%APPDATA%\yt-downloader\window-state.json`
- [ ] Download history still exists: `%APPDATA%\yt-downloader\download-history.json`
- [ ] Registry key removed: `HKCU\Software\YouTube Downloader Pro`

#### Expected Result
✅ Settings preserved, downloads removed

---

### Scenario 5: Uninstall with Application Running
**Objective**: Verify graceful handling when app is running

#### Steps
1. [ ] Reinstall YouTube Downloader Pro
2. [ ] Launch the application
3. [ ] Start a download (optional)
4. [ ] Run uninstaller while app is running
5. [ ] Observe behavior

#### Verification
- [ ] Uninstaller prompts to close the application OR
- [ ] Uninstaller automatically closes the application OR
- [ ] Uninstaller shows error message with instructions

#### Expected Result
✅ Graceful handling of running application

---

### Scenario 6: Uninstall with Custom Download Location
**Objective**: Verify that custom download locations are not affected

#### Steps
1. [ ] Reinstall YouTube Downloader Pro
2. [ ] Change download location to `D:\MyVideos\` (or another custom path)
3. [ ] Download test videos to custom location
4. [ ] Run uninstaller
5. [ ] Choose "No" to delete downloads

#### Verification
- [ ] Application removed
- [ ] Files in `%APPDATA%\yt-downloader\downloads\` deleted (if any)
- [ ] Files in custom location `D:\MyVideos\` NOT affected
- [ ] Settings file deleted (contains custom path reference)

#### Expected Result
✅ Custom download location files are not affected by uninstaller

---

### Scenario 7: Reinstall After Keeping Data
**Objective**: Verify that preserved data is recognized by new installation

#### Steps
1. [ ] Uninstall with "Keep Everything" option
2. [ ] Verify data still exists in AppData
3. [ ] Reinstall YouTube Downloader Pro
4. [ ] Launch the application

#### Verification
- [ ] Application launches successfully
- [ ] Previous settings are NOT loaded (fresh install)
- [ ] Previous downloads are NOT shown in history
- [ ] Old data files still exist but are not used

#### Expected Result
✅ Fresh installation with old data preserved but not loaded

---

### Scenario 8: Multiple Uninstall Attempts
**Objective**: Verify idempotent uninstallation

#### Steps
1. [ ] Install YouTube Downloader Pro
2. [ ] Uninstall completely (delete everything)
3. [ ] Try to run uninstaller again from installation directory (if exists)

#### Verification
- [ ] Second uninstall attempt handles missing files gracefully
- [ ] No error messages about missing files
- [ ] No crashes or hangs

#### Expected Result
✅ Graceful handling of already-uninstalled application

---

## Edge Cases

### Edge Case 1: Locked Files
**Setup**: 
1. [ ] Install and run application
2. [ ] Open a downloaded video in a media player
3. [ ] Run uninstaller and choose to delete downloads

**Expected**: 
- [ ] Uninstaller handles locked files gracefully
- [ ] Shows error message or skips locked files
- [ ] Completes uninstallation without crashing

---

### Edge Case 2: Missing AppData Directory
**Setup**:
1. [ ] Install application
2. [ ] Manually delete `%APPDATA%\yt-downloader\` directory
3. [ ] Run uninstaller

**Expected**:
- [ ] Uninstaller handles missing directory gracefully
- [ ] No error messages
- [ ] Completes uninstallation successfully

---

### Edge Case 3: Corrupted Settings File
**Setup**:
1. [ ] Install application
2. [ ] Manually corrupt `settings.json` (add invalid JSON)
3. [ ] Run uninstaller

**Expected**:
- [ ] Uninstaller handles corrupted file gracefully
- [ ] Prompts still appear
- [ ] Completes uninstallation successfully

---

### Edge Case 4: Insufficient Permissions
**Setup**:
1. [ ] Install as administrator
2. [ ] Log in as standard user
3. [ ] Try to uninstall

**Expected**:
- [ ] Uninstaller requests elevation OR
- [ ] Shows appropriate error message
- [ ] Does not leave system in inconsistent state

---

## Registry Verification

### Before Uninstall
Open Registry Editor and verify these keys exist:
- [ ] `HKCU\Software\YouTube Downloader Pro`
- [ ] `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\[AppKey]`
- [ ] `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\YouTube Downloader Pro` (if startup enabled)

### After Uninstall
Verify these keys are removed:
- [ ] `HKCU\Software\YouTube Downloader Pro` - REMOVED
- [ ] `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\[AppKey]` - REMOVED
- [ ] `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\YouTube Downloader Pro` - REMOVED

---

## File System Verification

### Installation Directory
**Before**: `C:\Program Files\YouTube Downloader Pro\`
- [ ] Contains application files

**After**: 
- [ ] Directory completely removed OR
- [ ] Directory empty (will be removed by Windows)

### User Data Directory
**Before**: `%APPDATA%\yt-downloader\`
- [ ] Contains downloads, settings, logs, cache

**After** (depends on user choice):
- [ ] Completely removed (if deleted everything)
- [ ] Only downloads remain (if kept downloads only)
- [ ] Only settings remain (if kept settings only)
- [ ] Everything remains (if kept everything)

### Shortcuts
**Before**:
- [ ] Desktop: `%USERPROFILE%\Desktop\YouTube Downloader Pro.lnk`
- [ ] Start Menu: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\YouTube Downloader Pro\`

**After**:
- [ ] Desktop shortcut removed
- [ ] Start Menu folder removed

---

## Performance Testing

### Uninstall Speed
- [ ] Uninstallation completes in < 30 seconds (with small dataset)
- [ ] Uninstallation completes in < 2 minutes (with 100+ downloads)
- [ ] No UI freezing or hanging
- [ ] Progress indication (if applicable)

### Resource Usage
- [ ] Uninstaller uses < 100MB RAM
- [ ] No excessive CPU usage
- [ ] No disk thrashing

---

## User Experience Testing

### Dialog Clarity
- [ ] Prompts are clear and easy to understand
- [ ] Button labels are unambiguous ("Yes"/"No" clearly indicate action)
- [ ] File paths are shown to help user make informed decision
- [ ] Completion message is friendly and professional

### Error Handling
- [ ] Errors are reported with clear messages
- [ ] User is not left in confused state
- [ ] Partial failures are handled gracefully
- [ ] User can retry or get help

---

## Compatibility Testing

### Windows Versions
- [ ] Windows 10 (21H2)
- [ ] Windows 10 (22H2)
- [ ] Windows 11 (21H2)
- [ ] Windows 11 (22H2)
- [ ] Windows 11 (23H2)

### User Account Types
- [ ] Administrator account
- [ ] Standard user account
- [ ] Domain user account (if applicable)

### Antivirus Software
- [ ] Windows Defender enabled
- [ ] Third-party antivirus (if available)
- [ ] No false positives during uninstallation

---

## Sign-off

### Test Results Summary
- Total Scenarios Tested: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Tester Information
- **Name**: _______________________________________________
- **Date**: _______________________________________________
- **Build Version**: _______________________________________________
- **Test Environment**: _______________________________________________

### Approval
- [ ] All critical scenarios passed
- [ ] All edge cases handled appropriately
- [ ] User experience is satisfactory
- [ ] Ready for release

**Signature**: _______________________________________________
**Date**: _______________________________________________
