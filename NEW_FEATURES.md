# New Features Added - v2.0.0

## 🎯 Custom Download Path

You can now choose where your downloads are saved on your phone!

### How to Use:

1. Open the app and go to the **Settings** tab (last icon in bottom navigation)
2. In the "Download Location" section, tap **Choose Folder**
3. Select the folder where you want your downloads saved
4. All future downloads will be saved to this location

### Features:

- **Custom Path**: Choose any folder on your phone
- **Default Path**: Use the app's default Downloads folder
- **Reset Option**: Easily reset to default location
- **Persistent**: Your choice is saved and remembered

## ⚙️ Default Settings

Configure your preferred download settings:

### Default Quality
- Choose from: Highest, 1080p, 720p, 480p, 360p
- This will be pre-selected when downloading videos

### Default Type
- Choose between Video or Audio
- Quick toggle for your most common download type

## 📱 How to Install the New APK

1. Run `build-apk.bat` to build the new APK
2. Transfer `build\app\outputs\flutter-apk\app-release.apk` to your phone
3. Install the APK (you may need to enable "Install from Unknown Sources")
4. Enjoy the new features!

## 🔧 Technical Updates

- Updated Java version from 8 to 17 (fixes obsolete warnings)
- Added file_picker dependency for folder selection
- Added settings service for persistent configuration
- Improved download path management

## 📝 Notes

- On Android, you can select any accessible folder
- The app will create a Downloads subfolder if using default path
- Your download history and settings are preserved between updates
