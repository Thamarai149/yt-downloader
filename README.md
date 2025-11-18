# 🎥 YouTube Downloader Pro

A modern, feature-rich YouTube video downloader with beautiful UI for Windows and Android.

## ⚡ Quick Start

### 🖥️ Windows Desktop (Recommended)
```bash
run-all.bat
```
Double-click and you're done!

### 📱 Android APK
```bash
fix-android-build.bat
```
Builds APK automatically!

## ✨ Features

- 📹 **Download Videos** - 4K, 1080p, 720p, 480p, 360p, 240p
- 🎵 **Download Audio** - MP3 format
- 🔍 **Search YouTube** - With thumbnails and previews
- 📦 **Batch Downloads** - Multiple videos at once
- 📊 **Real-time Progress** - Live download tracking
- 📜 **Download History** - Track all downloads
- 🌓 **Dark/Light Themes** - Beautiful modern UI
- ⚙️ **Settings** - Customize everything

## 🚀 Platforms

| Platform | Status | Command |
|----------|--------|---------|
| Windows Desktop | ✅ Fully Working | `run-all.bat` |
| Android APK | ✅ Fixed & Ready | `fix-android-build.bat` |
| Web | ⚠️ CORS Issues | Use desktop instead |

## 📦 Tech Stack

### Frontend (Flutter)
- **Framework:** Flutter 3.35.6
- **State Management:** Provider
- **HTTP Client:** Dio
- **WebSocket:** web_socket_channel
- **UI:** Material Design 3

### Backend (Node.js)
- **Runtime:** Node.js 18+
- **Framework:** Express
- **Real-time:** Socket.IO
- **Downloader:** youtube-dl-exec
- **Validation:** Joi

## 🔧 Requirements

### Development
- Flutter SDK 3.0+
- Node.js 18+
- Android SDK (for Android builds)
- Visual Studio Build Tools (for Windows builds)

### Runtime
- Windows 10/11 (for desktop)
- Android 5.0+ (for mobile)
- Internet connection

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [START_HERE.md](START_HERE.md) | 👈 **Start here!** |
| [BUILD_SUCCESS.md](BUILD_SUCCESS.md) | Android build guide |
| [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md) | Full documentation |
| [MINIMAL_BUILD.md](MINIMAL_BUILD.md) | Package details |
| [FIXES_APPLIED.md](FIXES_APPLIED.md) | Fix history |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command reference |

## 🎯 Installation

### Windows Desktop

1. **Start everything:**
   ```bash
   run-all.bat
   ```

2. **Or run separately:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Flutter
   flutter run -d windows
   ```

### Android

1. **Build APK:**
   ```bash
   fix-android-build.bat
   ```

2. **Install:**
   - Transfer `build\app\outputs\flutter-apk\app-release.apk` to device
   - Enable "Unknown Sources"
   - Install APK

3. **Configure:**
   - Start backend on PC
   - Set backend URL in app settings
   - For emulator: `http://10.0.2.2:3001`
   - For device: `http://YOUR_IP:3001`

## 🐛 Troubleshooting

### Build Fails
```bash
fix-android-build.bat
```

### Backend Won't Start
```bash
cd backend
npm install
npm run dev
```

### Can't Connect (Android)
- Emulator: Use `http://10.0.2.2:3001`
- Device: Use your PC's IP address
- Check firewall allows Node.js

### Port Already in Use
```bash
taskkill /F /IM node.exe
```

## 📊 Project Structure

```
ytdownloader/
├── lib/                    # Flutter app
│   ├── models/            # Data models
│   ├── providers/         # State management
│   ├── screens/           # UI screens
│   ├── services/          # API & WebSocket
│   └── widgets/           # Reusable components
│
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── server.js     # Entry point
│   └── package.json
│
├── android/              # Android config
├── windows/              # Windows config
│
├── run-all.bat          # Start everything
├── fix-android-build.bat # Fix & build Android
└── README.md            # This file
```

## 🎨 Screenshots

### Windows Desktop
- Modern, clean interface
- Real-time progress tracking
- Dark/Light theme support

### Android
- Mobile-optimized UI
- Touch-friendly controls
- Responsive design

## 🔐 Permissions

### Windows
- No special permissions needed

### Android
- **Internet** - Download videos
- **Storage** - Save files
- **Network State** - Check connectivity

## 🚧 Known Issues

### Fixed ✅
- ✅ Android build errors (flutter_local_notifications)
- ✅ Android build errors (file_picker)
- ✅ CORS issues (use Windows desktop)
- ✅ Download queue not showing
- ✅ Progress not updating

### Limitations
- ⚠️ Web version has CORS issues (use desktop)
- ⚠️ No system notifications on Android (in-app works)
- ⚠️ No custom download path picker (uses default)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a personal project, but feel free to fork and modify!

## 🆘 Support

Check documentation in this order:
1. [START_HERE.md](START_HERE.md)
2. [BUILD_SUCCESS.md](BUILD_SUCCESS.md)
3. [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
4. [FIXES_APPLIED.md](FIXES_APPLIED.md)

## 🎉 Credits

- **Flutter** - UI framework
- **youtube-dl** - Download engine
- **Node.js** - Backend runtime
- **Socket.IO** - Real-time updates

## 📈 Version

**Version:** 2.0.0
**Build:** 1
**Last Updated:** November 2025

## 🎊 Status

✅ **Production Ready**
- Windows Desktop: Fully functional
- Android APK: Build fixed, ready to use
- Backend: Stable and tested
- Documentation: Complete

---

## 🚀 Get Started Now!

**Windows:**
```bash
run-all.bat
```

**Android:**
```bash
fix-android-build.bat
```

**Happy downloading!** 🎥📱✨
