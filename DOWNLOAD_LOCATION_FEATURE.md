# Download Location Feature

## Overview
Users can now customize where their YouTube downloads are saved with an easy-to-use interface in the Settings tab. **The app automatically detects each user's PC and provides personalized folder presets!**

## Features

### 1. **Automatic User Detection** ⭐ NEW!
- Automatically detects the current Windows user
- Uses `os.homedir()` to get the user's home directory
- Works for ANY user on ANY PC - no hardcoded paths!
- Each user gets their own personalized download locations

### 2. **Custom Download Path**
- Enter any custom path on your Windows system
- Path validation ensures the directory exists or can be created
- Real-time path display shows current save location

### 3. **Dynamic Quick Presets** ⭐ NEW!
Four convenient preset paths that adapt to YOUR PC:
- **📥 Default Downloads**: `C:\Users\[YourUsername]\Downloads\YT-Downloads`
- **🎬 Videos Folder**: `C:\Users\[YourUsername]\Videos\YouTube`
- **🎵 Music Folder**: `C:\Users\[YourUsername]\Music\YouTube`
- **🖥️ Desktop**: `C:\Users\[YourUsername]\Desktop\YT-Downloads`

*Note: [YourUsername] is automatically replaced with your actual Windows username!*

### 3. **Persistent Configuration**
- Download path is saved to `download-config.json` in the backend
- Settings persist across server restarts
- Automatically loads saved path on startup

### 4. **Path Management**
- **Update Button**: Apply new download path
- **Refresh Files**: Reload file list from current location
- **Open Folder**: Copy path to clipboard with instructions

## How to Use

### Change Download Location:

1. Go to **Settings** tab
2. Scroll to **Download Location** section
3. Either:
   - Type a custom path in the input field
   - Click a preset button for quick selection
4. Click **Update** button
5. Success notification confirms the change

### Path Format:
```
Windows: C:\Users\YourName\Downloads\MyFolder
```

### Example Paths:
```
C:\Users\John\Downloads\YT-Downloads      (User: John)
C:\Users\Sarah\Videos\YouTube             (User: Sarah)
D:\Media\YouTube                          (Custom drive)
E:\Videos\Downloaded                      (External drive)
C:\Users\Admin\Desktop\Videos             (User: Admin)
```

**The app automatically uses YOUR username, not a hardcoded one!**

## Backend API

### Get Current Path
```http
GET /api/download-path
```

**Response:**
```json
{
  "downloadPath": "C:\\Users\\CurrentUser\\Downloads\\YT-Downloads"
}
```

### Get User Info & Presets ⭐ NEW!
```http
GET /api/user-info
```

**Response:**
```json
{
  "homeDir": "C:\\Users\\CurrentUser",
  "username": "CurrentUser",
  "presets": {
    "downloads": "C:\\Users\\CurrentUser\\Downloads\\YT-Downloads",
    "videos": "C:\\Users\\CurrentUser\\Videos\\YouTube",
    "music": "C:\\Users\\CurrentUser\\Music\\YouTube",
    "desktop": "C:\\Users\\CurrentUser\\Desktop\\YT-Downloads"
  }
}
```

### Update Path
```http
POST /api/download-path
Content-Type: application/json

{
  "downloadPath": "C:\\Users\\CurrentUser\\Videos\\YouTube"
}
```

**Response:**
```json
{
  "message": "Download path updated successfully",
  "downloadPath": "C:\\Users\\CurrentUser\\Videos\\YouTube"
}
```

## Technical Details

### Backend Changes:
- **Uses `os.homedir()`** to automatically detect current user's home directory ⭐
- **Uses `os.userInfo().username`** to get the current Windows username ⭐
- `downloadsDir` is now a mutable variable (changed from `const` to `let`)
- Config file `download-config.json` stores the custom path
- Path validation ensures directory exists or can be created
- Automatic folder creation if path doesn't exist
- New `/api/user-info` endpoint provides user-specific presets ⭐

### Frontend Changes:
- New `loadUserPresets()` function to fetch user-specific paths ⭐
- New `userPresets` state to store dynamic preset paths ⭐
- New `updateDownloadPath()` function to update path
- New `loadDownloadPath()` function to load path on mount
- Quick preset buttons use dynamic paths from backend ⭐
- Visual feedback with toast notifications
- Path display with monospace font for clarity
- Shows current user's Downloads path in instructions ⭐

## Error Handling

- **Invalid Path**: Shows error if path cannot be created
- **Empty Path**: Validates path is not empty
- **Network Error**: Handles connection failures gracefully
- **Permission Error**: Alerts if folder cannot be created

## Benefits

✅ **Universal**: Works for ANY Windows user automatically
✅ **Smart Detection**: Automatically finds YOUR Downloads, Videos, Music folders
✅ **No Hardcoding**: No need to manually change usernames in code
✅ **Multi-User**: Perfect for shared computers - each user gets their own paths
✅ **Flexibility**: Save downloads anywhere on your system
✅ **Organization**: Separate videos and audio to different folders
✅ **Convenience**: Quick presets for common locations
✅ **Persistence**: Settings saved automatically
✅ **Safety**: Path validation prevents errors

## Future Enhancements

- Browse folder dialog (requires Electron or native integration)
- Multiple download locations with rules
- Auto-organize by video type (video/audio)
- Auto-organize by date or channel
- Cloud storage integration (OneDrive, Google Drive)
