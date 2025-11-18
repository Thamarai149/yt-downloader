# ⚡ Quick Reference Card

## 🚀 One-Click Commands

### Windows Desktop
```
run-all.bat
```
Starts backend + Flutter app

### Android APK
```
fix-android-build.bat
```
Fixes build issues and creates APK

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `START_HERE.md` | 👈 Start here! |
| `fix-android-build.bat` | Fix Android build |
| `build-android-apk.bat` | Build APK |
| `run-all.bat` | Run Windows app |
| `COMPLETE_GUIDE.md` | Full documentation |
| `ANDROID_BUILD_FIX.md` | Build troubleshooting |

---

## 🐛 Quick Fixes

### Build Failed?
```
fix-android-build.bat
```

### Backend Not Starting?
```bash
cd backend
npm install
npm run dev
```

### Can't Connect (Android)?
- Emulator: `http://10.0.2.2:3001`
- Device: `http://YOUR_IP:3001`

---

## 📱 Platforms

### ✅ Windows Desktop
- Status: **Fully Working**
- Run: `run-all.bat`
- No setup needed

### ✅ Android
- Status: **Fixed & Working**
- Build: `fix-android-build.bat`
- Requires: Backend on PC

---

## 🎯 Features

- ✅ Download videos (4K-240p)
- ✅ Download audio (MP3)
- ✅ Search YouTube
- ✅ Batch downloads
- ✅ Real-time progress
- ✅ Download history
- ✅ Dark/Light themes

---

## 🔧 Commands

### Flutter
```bash
flutter clean          # Clean build
flutter pub get        # Get dependencies
flutter doctor         # Check setup
flutter run -d windows # Run on Windows
flutter build apk      # Build Android
```

### Backend
```bash
cd backend
npm install           # Install dependencies
npm run dev          # Start server
```

---

## 📊 Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | `fix-android-build.bat` |
| Backend won't start | `cd backend && npm install` |
| Can't connect | Check IP address |
| Port in use | `taskkill /F /IM node.exe` |

---

## 🎉 Quick Start

1. **Windows:** Double-click `run-all.bat`
2. **Android:** Double-click `fix-android-build.bat`
3. **Done!** 🚀

---

## 📞 Need Help?

Check these in order:
1. `START_HERE.md`
2. `COMPLETE_GUIDE.md`
3. `ANDROID_BUILD_FIX.md`
4. `FIXES_APPLIED.md`
