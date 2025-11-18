# In-App Update System Guide

## 🚀 How It Works

Your app now has an automatic update notification system that:
1. Checks for updates when the app starts (after 2 seconds)
2. Shows a dialog if a new version is available
3. Allows users to download and install updates directly
4. Has a manual "Check for Updates" button in Settings

## 📋 Setup Instructions

### Step 1: Host Your version.json File

You need to host a `version.json` file that contains information about the latest version. You have several options:

#### Option A: GitHub (Recommended - Free)
1. Create a GitHub repository for your app
2. Upload `version.json` to the repository
3. Get the raw file URL: `https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/version.json`
4. Update the URL in `lib/services/update_service.dart`

#### Option B: Your Own Server
1. Upload `version.json` to your web server
2. Make sure it's accessible via HTTPS
3. Update the URL in `lib/services/update_service.dart`

### Step 2: Update the version.json URL

Edit `lib/services/update_service.dart` and change this line:

```dart
static const String versionCheckUrl = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/version.json';
```

Replace with your actual URL.

### Step 3: Build and Release

1. Update version in `pubspec.yaml`:
   ```yaml
   version: 2.1.0+2  # version+buildNumber
   ```

2. Build the APK:
   ```bash
   flutter build apk --release
   ```

3. Upload the APK to GitHub Releases or your server

4. Update `version.json` with new version info:
   ```json
   {
     "version": "2.1.0",
     "buildNumber": 2,
     "downloadUrl": "https://your-server.com/app-release.apk",
     "releaseNotes": "What's new in this version...",
     "forceUpdate": false
   }
   ```

## 📝 version.json Format

```json
{
  "version": "2.0.0",           // Display version (must match pubspec.yaml)
  "buildNumber": 1,             // Build number (must be higher than current)
  "downloadUrl": "https://...", // Direct link to APK file
  "releaseNotes": "...",        // What's new (supports \n for line breaks)
  "forceUpdate": false          // If true, user cannot skip update
}
```

### Fields Explained:

- **version**: The version string shown to users (e.g., "2.0.0")
- **buildNumber**: Integer that must be higher than the current app's build number
- **downloadUrl**: Direct download link to the APK file
- **releaseNotes**: Description of what's new (use \n for line breaks)
- **forceUpdate**: 
  - `false`: User can click "Later" to skip
  - `true`: User must update (no "Later" button)

## 🔄 Update Flow

1. **App Starts** → Checks for updates after 2 seconds
2. **Update Found** → Shows dialog with version info and release notes
3. **User Clicks "Update Now"** → Downloads APK to phone's Download folder
4. **Download Complete** → Opens browser/installer to install APK
5. **User Installs** → App is updated!

## 🎯 Manual Update Check

Users can also manually check for updates:
1. Open the app
2. Go to **Settings** tab
3. Scroll to **App Information** section
4. Click **Check for Updates** button

## 📱 Example Release Workflow

### When releasing version 2.1.0:

1. **Update pubspec.yaml**:
   ```yaml
   version: 2.1.0+2
   ```

2. **Build APK**:
   ```bash
   flutter build apk --release
   ```

3. **Upload APK** to GitHub Releases:
   - Create a new release: v2.1.0
   - Upload `app-release.apk`
   - Get download URL

4. **Update version.json**:
   ```json
   {
     "version": "2.1.0",
     "buildNumber": 2,
     "downloadUrl": "https://github.com/username/repo/releases/download/v2.1.0/app-release.apk",
     "releaseNotes": "🎉 New Features:\n• Feature 1\n• Feature 2\n\n🐛 Bug Fixes:\n• Fix 1\n• Fix 2",
     "forceUpdate": false
   }
   ```

5. **Commit and push** version.json to GitHub

6. **Done!** Users will be notified on next app start

## 🛠️ Testing

To test the update system:

1. Build and install version 2.0.0 (buildNumber: 1)
2. Update version.json with version 2.1.0 (buildNumber: 2)
3. Open the app
4. You should see the update dialog after 2 seconds
5. Or go to Settings → Check for Updates

## ⚠️ Important Notes

- **buildNumber** must always increase (1, 2, 3, 4...)
- The APK download URL must be a direct link (not a webpage)
- Users need to enable "Install from Unknown Sources" on Android
- The app will download APK to `/storage/emulated/0/Download/`
- After download, the system installer will open automatically

## 🔐 Security

- Always use HTTPS for version.json and APK downloads
- Host files on trusted servers (GitHub is recommended)
- Consider signing your APKs with the same key for smooth updates

## 🎨 Customization

You can customize the update dialog in `lib/widgets/update_dialog.dart`:
- Change colors
- Modify layout
- Add more information
- Change button text

## 📊 Version Tracking

Keep track of your releases:

| Version | Build | Date | Notes |
|---------|-------|------|-------|
| 2.0.0 | 1 | 2024-01-01 | Initial release with update system |
| 2.1.0 | 2 | 2024-01-15 | Added new features |
| 2.2.0 | 3 | 2024-02-01 | Bug fixes |

## 🆘 Troubleshooting

**Update not showing?**
- Check if version.json URL is correct
- Verify buildNumber is higher than current
- Check internet connection
- Look at console logs for errors

**Download fails?**
- Verify APK URL is a direct download link
- Check file permissions
- Ensure stable internet connection

**Can't install APK?**
- Enable "Install from Unknown Sources" in Android settings
- Check if APK is signed correctly
- Verify APK is not corrupted
