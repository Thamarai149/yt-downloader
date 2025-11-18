# 🎉 YouTube Downloader Pro - Complete Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Windows Desktop](#windows-desktop)
3. [Android APK](#android-apk)
4. [Features](#features)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Windows Desktop (Recommended)

**Just double-click:**
```
run-all.bat
```

This starts both backend and Flutter Windows app!

### Android APK

**Just double-click:**
```
build-android-apk.bat
```

Then install the APK on your Android device!

---

## 💻 Windows Desktop

### Option 1: Run Everything (Easiest)
```
run-all.bat
```

### Option 2: Run Separately
```
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Flutter
flutter run -d windows
```

### Features on Windows
- ✅ No CORS issues
- ✅ Fast downloads
- ✅ Real-time progress
- ✅ Native performance
- ✅ System notifications

---

## 📱 Android APK

### Step 1: Build APK

**Double-click:**
```
build-android-apk.bat
```

**Or manually:**
```bash
flutter build apk --release
```

### Step 2: Install APK

APK location:
```
build\app\outputs\flutter-apk\app-release.apk
```

Transfer to your Android device and install!

### Step 3: Configure Backend

#### For Android Emulator
- Backend URL: `http://10.0.2.2:3001` (pre-configured)
- Just start backend: `cd backend && npm run dev`

#### For Physical Device
1. Find your computer's IP:
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., 192.168.1.100)

2. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

3. In app settings, change URL to:
   ```
   http://YOUR_IP:3001
   ```

4. Allow Node.js through Windows Firewall

### Android Requirements
- Android 5.0+ (API 21)
- 100 MB storage
- Internet connection

---

## ✨ Features

### Download Options
- 📹 **Video**: 4K, 1080p, 720p, 480p, 360p, 240p
- 🎵 **Audio**: MP3 format
- 📊 **Real-time progress** tracking
- 🔄 **Batch downloads** for multiple videos

### Search & Discovery
- 🔍 **YouTube search** with thumbnails
- 📝 **Video info** preview
- 🎬 **Playlist support**

### User Interface
- 🌓 **Dark/Light themes**
- 🎨 **Modern, beautiful UI**
- 📱 **Responsive design**
- ⚡ **Smooth animations**

### Management
- 📜 **Download history**
- ⏸️ **Pause/Resume** downloads
- ❌ **Cancel** active downloads
- 🗑️ **Clear history**

---

## 🔧 Troubleshooting

### Windows Desktop Issues

#### "Backend not starting"
```bash
cd backend
npm install
npm run dev
```

#### "Flutter not found"
```bash
flutter doctor
```

#### "Port 3001 already in use"
```bash
# Kill existing Node processes
taskkill /F /IM node.exe
```

### Android Issues

#### "Unable to connect to server"

**Emulator:**
- Ensure backend is running
- URL should be `http://10.0.2.2:3001`

**Physical Device:**
- Phone and PC on same WiFi
- Use computer's IP: `http://192.168.1.100:3001`
- Allow Node.js through firewall
- Test in browser: `http://YOUR_IP:3001`

#### "Permission Denied"
1. Settings → Apps → YT Downloader Pro
2. Permissions → Storage → Allow

#### "Build Failed"
```bash
flutter clean
flutter pub get
flutter build apk --release
```

### Backend Issues

#### "youtube-dl not working"
```bash
cd backend
npm install youtube-dl-exec@latest
```

#### "Downloads not starting"
- Check backend logs
- Verify URL is valid YouTube link
- Check internet connection

---

## 📁 Project Structure

```
ytdownloader/
├── lib/                    # Flutter app code
│   ├── models/            # Data models
│   ├── providers/         # State management
│   ├── screens/           # UI screens
│   ├── services/          # API & WebSocket
│   ├── widgets/           # Reusable components
│   └── main.dart          # App entry point
│
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── server.js     # Server entry
│   └── package.json
│
├── android/              # Android configuration
├── windows/              # Windows configuration
│
├── run-all.bat          # Start everything (Windows)
├── run-flutter-windows.bat  # Start Flutter only
├── build-android-apk.bat    # Build Android APK
└── build-android-appbundle.bat  # Build for Play Store
```

---

## 🎯 Usage Examples

### Download a Video
1. Open app
2. Paste YouTube URL
3. Select quality (e.g., 1080p)
4. Click "Download Video"
5. Watch progress in real-time

### Download Audio Only
1. Paste YouTube URL
2. Click "Download Audio"
3. Get MP3 file

### Search YouTube
1. Go to Search tab
2. Enter search query
3. Browse results with thumbnails
4. Click download on any video

### Batch Download
1. Go to Batch Download tab
2. Add multiple URLs
3. Select quality for all
4. Start batch download

---

## 🔐 Permissions

### Windows
- No special permissions needed
- Windows Defender may prompt for Node.js

### Android
- **Internet**: Download videos
- **Storage**: Save files
- **Network State**: Check connectivity
- **Notifications**: Show progress

---

## 📊 Performance

### Download Speeds
- Depends on your internet connection
- Backend uses youtube-dl-exec (optimized)
- Multiple simultaneous downloads supported

### File Sizes
- **Windows App**: ~150 MB installed
- **Android APK**: ~50-60 MB
- **Backend**: ~50 MB (node_modules)

### System Requirements

**Windows:**
- Windows 10/11
- 4 GB RAM
- 500 MB free space

**Android:**
- Android 5.0+
- 2 GB RAM
- 100 MB free space

---

## 🌐 Network Configuration

### Backend Server
- Default port: 3001
- CORS enabled for localhost
- WebSocket support for real-time updates

### API Endpoints
- `POST /api/download` - Start download
- `GET /api/download/active` - Active downloads
- `GET /api/download/history` - Download history
- `GET /api/video/search` - Search YouTube
- `GET /api/video/info` - Get video info

---

## 🎨 Customization

### Change Theme
- Settings → Appearance → Dark/Light/System

### Change Download Path
- Settings → Download Path → Browse

### Change Backend URL
- Settings → Backend URL → Enter custom URL

---

## 📦 Build Options

### Windows Desktop
```bash
flutter build windows --release
```

### Android APK (Standard)
```bash
flutter build apk --release
```

### Android APK (Split by ABI)
```bash
flutter build apk --split-per-abi --release
```

### Android App Bundle (Play Store)
```bash
flutter build appbundle --release
```

---

## 🆘 Getting Help

### Check Logs

**Backend:**
```bash
cd backend
npm run dev
# Watch console output
```

**Flutter:**
```bash
flutter run -d windows
# Watch console output
```

### Common Issues

1. **Downloads not starting**
   - Check backend is running
   - Verify URL is valid
   - Check internet connection

2. **Slow downloads**
   - Check internet speed
   - Try different quality
   - Close other downloads

3. **App crashes**
   - Check Flutter version: `flutter doctor`
   - Rebuild: `flutter clean && flutter build`

---

## 🎉 Success Checklist

### Windows Desktop
- [ ] Backend starts successfully
- [ ] Flutter app opens
- [ ] Can paste YouTube URL
- [ ] Download starts
- [ ] Progress shows in real-time
- [ ] File saves to disk
- [ ] History shows completed downloads

### Android
- [ ] APK builds successfully
- [ ] APK installs on device
- [ ] App opens
- [ ] Backend connection works
- [ ] Can download videos
- [ ] Files save to device
- [ ] Notifications work

---

## 📚 Additional Resources

- **Flutter Documentation**: https://flutter.dev/docs
- **youtube-dl**: https://github.com/ytdl-org/youtube-dl
- **Node.js**: https://nodejs.org/

---

## 🎊 You're All Set!

Your YouTube Downloader Pro is ready to use!

**Windows**: Double-click `run-all.bat`
**Android**: Double-click `build-android-apk.bat`

Enjoy downloading! 🎥📱
