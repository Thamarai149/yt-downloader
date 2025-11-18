# 📱 Android Setup Guide

## ✅ What's Been Fixed

1. **Android Permissions** - Added all necessary permissions for downloads
2. **Network Configuration** - Enabled cleartext traffic for local backend
3. **API URLs** - Auto-configured for Android emulator and physical devices
4. **Build Configuration** - Optimized for release builds
5. **App Name** - Changed to "YT Downloader Pro"

## 🚀 Quick Start

### Step 1: Build the APK

**Double-click this file:**
```
build-android-apk.bat
```

Or run manually:
```bash
flutter build apk --release
```

### Step 2: Install on Device

The APK will be at:
```
build\app\outputs\flutter-apk\app-release.apk
```

**Transfer to your Android device and install!**

## 🔧 Backend Server Setup for Android

### For Android Emulator

The app is pre-configured to use `http://10.0.2.2:3001` which maps to your computer's localhost.

**Just start the backend:**
```bash
cd backend
npm run dev
```

### For Physical Android Device

You need to use your computer's IP address instead of localhost.

#### Step 1: Find Your Computer's IP

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```

#### Step 2: Start Backend on All Interfaces

Update `backend/.env`:
```env
HOST=0.0.0.0
PORT=3001
```

Or start with:
```bash
cd backend
node src/server.js
```

#### Step 3: Update App Settings

In the app:
1. Go to Settings
2. Change Backend URL to: `http://YOUR_IP:3001`
3. Example: `http://192.168.1.100:3001`

#### Step 4: Allow Firewall Access

**Windows Firewall:**
- Allow Node.js through Windows Firewall when prompted
- Or manually add rule for port 3001

**Test Connection:**
```bash
# From your phone's browser, visit:
http://YOUR_IP:3001/api/health
```

## 📋 Requirements

### Device Requirements
- Android 5.0 (API 21) or higher
- 100 MB free storage
- Internet connection

### Development Requirements
- Flutter SDK 3.0+
- Android SDK
- Java 11+

## 🔐 Permissions Explained

The app requests these permissions:

| Permission | Why Needed |
|------------|------------|
| Internet | Download videos from YouTube |
| Storage | Save downloaded files |
| Network State | Check if connected to internet |
| Notifications | Show download progress |

## 🎯 Testing Checklist

After installing the APK:

- [ ] App opens successfully
- [ ] Can connect to backend server
- [ ] Can search for videos
- [ ] Can start a download
- [ ] Download progress shows
- [ ] Files save to device storage
- [ ] Can view download history
- [ ] Notifications work
- [ ] Dark/Light theme works

## 🐛 Troubleshooting

### "Unable to connect to server"

**For Emulator:**
- Make sure backend is running on port 3001
- Check if `http://10.0.2.2:3001` is accessible

**For Physical Device:**
- Ensure phone and computer are on same WiFi network
- Check firewall isn't blocking port 3001
- Verify IP address is correct
- Try accessing `http://YOUR_IP:3001` in phone's browser

### "Permission Denied" when downloading

1. Go to Android Settings
2. Apps → YT Downloader Pro
3. Permissions → Storage → Allow

### Build Fails

```bash
# Clean and rebuild
flutter clean
cd android
gradlew clean
cd ..
flutter pub get
flutter build apk --release
```

### Gradle Issues

Update `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m
android.useAndroidX=true
android.enableJetifier=true
```

## 📦 Build Variants

### Standard APK (Recommended)
```bash
flutter build apk --release
```
Size: ~50-60 MB

### Split APKs (Smaller)
```bash
flutter build apk --split-per-abi --release
```
Creates 3 APKs:
- ARM 32-bit: ~20 MB
- ARM 64-bit: ~20 MB  
- x86 64-bit: ~20 MB

### App Bundle (For Play Store)
```bash
flutter build appbundle --release
```

## 🌐 Network Configuration

### Backend CORS Settings

The backend is already configured to accept connections from Android devices.

If you have issues, verify `backend/src/server.js` has:
```javascript
cors: {
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(null, false);
  }
}
```

### Android Network Security

The app uses `android:usesCleartextTraffic="true"` to allow HTTP connections to your local backend.

For production, you should:
1. Use HTTPS
2. Remove cleartext traffic permission
3. Add network security config

## 📱 Distribution

### Direct Installation (APK)
- Share the APK file directly
- Users need to enable "Install from Unknown Sources"

### Google Play Store (AAB)
1. Build app bundle: `flutter build appbundle --release`
2. Create signing key
3. Upload to Play Console
4. Follow Play Store guidelines

## 🔑 Signing for Release

For production releases:

1. **Generate keystore:**
```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. **Create `android/key.properties`:**
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=upload
storeFile=C:/path/to/upload-keystore.jks
```

3. **Update `android/app/build.gradle.kts`:**
```kotlin
signingConfigs {
    create("release") {
        storeFile = file(keystoreProperties["storeFile"] as String)
        storePassword = keystoreProperties["storePassword"] as String
        keyAlias = keystoreProperties["keyAlias"] as String
        keyPassword = keystoreProperties["keyPassword"] as String
    }
}
```

## 🎨 App Icon

To change the app icon:

1. Replace icons in `android/app/src/main/res/mipmap-*/ic_launcher.png`
2. Or use `flutter_launcher_icons` package

## 📊 Performance Tips

- Downloads run in background
- Use WiFi for large downloads
- Clear download history periodically
- Check storage space regularly

## 🆘 Support

If you encounter issues:

1. Check this guide first
2. Run `flutter doctor` to verify setup
3. Check backend logs
4. Test on emulator first
5. Verify network connectivity

## 🎉 Success!

Once everything works:
- ✅ App installed on Android
- ✅ Backend server accessible
- ✅ Downloads working
- ✅ Files saving correctly

Enjoy your YouTube Downloader on Android! 📱🎥
