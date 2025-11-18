# Quick Start Guide - YT Downloader Pro v2.0.0

## 🎉 New Features Added

### 1. Custom Download Path
- Users can choose where to save downloads on their phone
- Access via Settings → Download Location → Choose Folder

### 2. Default Settings
- Set default video quality (1080p, 720p, etc.)
- Set default download type (Video or Audio)

### 3. In-App Update System
- Automatic update notifications on app start
- Manual update check in Settings
- Download and install updates directly from the app

### 4. Fixed Issues
- Updated Java from version 8 to 17 (no more obsolete warnings)
- Fixed deprecated Flutter APIs
- Improved app stability

## 🚀 Build Your APK

### Quick Build:
```bash
build-apk.bat
```

### Manual Build:
```bash
flutter pub get
flutter clean
flutter build apk --release
```

APK will be at: `build\app\outputs\flutter-apk\app-release.apk`

## 📱 Install on Phone

1. Transfer `app-release.apk` to your phone
2. Open the APK file
3. Enable "Install from Unknown Sources" if prompted
4. Install the app
5. Done!

## 🔄 Setup Update System (Optional)

If you want the in-app update feature to work:

1. **Create a GitHub repository** (or use any web server)

2. **Upload version.json** to your repository

3. **Update the URL** in `lib/services/update_service.dart`:
   ```dart
   static const String versionCheckUrl = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/version.json';
   ```

4. **When releasing updates**:
   - Update version in `pubspec.yaml`
   - Build new APK
   - Upload APK to GitHub Releases
   - Update `version.json` with new version info

See `UPDATE_SYSTEM_GUIDE.md` for detailed instructions.

## 📋 Version Management

Current version: **2.0.0 (Build 1)**

To update version for next release:

Edit `pubspec.yaml`:
```yaml
version: 2.1.0+2  # version+buildNumber
```

Then rebuild the APK.

## 🎯 Features Overview

### Single Download
- Download individual videos or audio
- Choose quality before download
- Real-time progress tracking

### Batch Download
- Download multiple videos at once
- Paste multiple URLs
- Queue management

### Search
- Search YouTube directly in the app
- Preview videos before download
- Quick download from search results

### Queue
- View active downloads
- See download progress
- Cancel downloads if needed

### History
- View all completed downloads
- See failed downloads
- Clear history

### Settings
- **Download Location**: Choose custom folder
- **Default Quality**: Set preferred quality
- **Default Type**: Video or Audio
- **App Information**: Check version and updates
- **Theme**: Toggle dark/light mode

## 🔧 Dependencies Added

New packages in this version:
- `file_picker` - For folder selection
- `package_info_plus` - For version checking
- `dio` - For downloading updates
- `flutter_launcher_icons` - For custom app icon

## 📝 Files Created

- `lib/services/settings_service.dart` - Settings management
- `lib/services/update_service.dart` - Update checking
- `lib/screens/settings_screen.dart` - Settings UI
- `lib/widgets/update_dialog.dart` - Update notification dialog
- `version.json` - Version information for updates
- `build-apk.bat` - Quick build script

## 🎨 Next Steps

### Add Custom App Icon:
1. Create a 1024x1024 PNG icon
2. Save as `assets/icon/app_icon.png`
3. Run: `flutter pub run flutter_launcher_icons`
4. Rebuild APK

### Customize App:
- Change app name in `android/app/src/main/AndroidManifest.xml`
- Update colors in theme providers
- Modify UI layouts as needed

## 📞 Support

For issues or questions:
1. Check `UPDATE_SYSTEM_GUIDE.md` for update system help
2. Check `NEW_FEATURES.md` for feature documentation
3. Review Flutter documentation for general issues

## ✅ Checklist Before Release

- [ ] Test all download features
- [ ] Test settings (download path, quality, type)
- [ ] Test update system (if configured)
- [ ] Verify app icon shows correctly
- [ ] Test on actual Android device
- [ ] Update version.json (if using updates)
- [ ] Create GitHub release (if using updates)
- [ ] Share APK with users

---

**Ready to build?** Run `build-apk.bat` and install on your phone! 🚀
