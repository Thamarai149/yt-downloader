# 📱 Building Android APK

## Quick Build

### Option 1: Build APK (For Direct Installation)
```bash
# Double-click this file:
build-android-apk.bat
```

The APK will be created at:
```
build\app\outputs\flutter-apk\app-release.apk
```

### Option 2: Build App Bundle (For Google Play Store)
```bash
# Double-click this file:
build-android-appbundle.bat
```

The AAB will be created at:
```
build\app\outputs\bundle\release\app-release.aab
```

## Manual Build Commands

### Build APK
```bash
flutter clean
flutter pub get
flutter build apk --release
```

### Build Split APKs (Smaller Size)
```bash
flutter build apk --split-per-abi --release
```

This creates separate APKs for different CPU architectures:
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM)
- `app-x86_64-release.apk` (64-bit Intel)

## Installing the APK

### On Physical Device
1. Enable "Unknown Sources" in Android Settings
2. Transfer the APK to your device
3. Open the APK file and install

### Using ADB
```bash
adb install build\app\outputs\flutter-apk\app-release.apk
```

## Important Notes

⚠️ **Backend Server Required**
- The app needs the backend server running to download videos
- Make sure to update the API URL in the app settings
- Default: `http://localhost:3001`
- For Android device: Use your computer's IP address (e.g., `http://192.168.1.100:3001`)

### Finding Your Computer's IP Address
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

## App Permissions

The app requires these permissions:
- ✅ Internet access (to download videos)
- ✅ Storage access (to save downloaded files)
- ✅ Network state (to check connectivity)
- ✅ Notifications (to show download progress)

## Troubleshooting

### Build Fails
```bash
flutter clean
flutter pub get
flutter doctor
```

### Gradle Issues
```bash
cd android
gradlew clean
cd ..
flutter build apk --release
```

### Out of Memory
Add to `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m
```

## Release Signing (Optional)

For production releases, create a signing key:

1. Generate keystore:
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. Create `android/key.properties`:
```
storePassword=<password>
keyPassword=<password>
keyAlias=my-key-alias
storeFile=<path-to-keystore>
```

3. Update `android/app/build.gradle.kts` to use the signing config

## File Size Optimization

Current APK size: ~50-60 MB

To reduce size:
- Use split APKs: `--split-per-abi`
- Remove unused resources
- Enable ProGuard/R8 (already enabled in release builds)

## Testing

### Debug Build (Faster)
```bash
flutter build apk --debug
```

### Profile Build (Performance Testing)
```bash
flutter build apk --profile
```

## Next Steps

After building:
1. ✅ Test the APK on a real device
2. ✅ Configure backend server URL
3. ✅ Test download functionality
4. ✅ Check storage permissions
5. ✅ Verify notifications work

Enjoy your YouTube Downloader on Android! 🎉
