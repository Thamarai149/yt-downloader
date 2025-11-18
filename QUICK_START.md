# 🚀 Quick Start Guide

## Prerequisites

1. **Flutter SDK** - [Install Flutter](https://flutter.dev/docs/get-started/install)
2. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
3. **yt-dlp** - [Install yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)

## Installation (5 minutes)

### Step 1: Install Flutter Dependencies
```bash
flutter pub get
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 3: Verify Installation
```bash
flutter doctor
node --version
npm --version
```

## Running the App

### Option 1: Development Mode (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```
✅ Backend running on http://localhost:5000

**Terminal 2 - Start Flutter:**
```bash
flutter run
```
✅ Choose your device (Chrome, Windows, Android, iOS)

### Option 2: Quick Test
```bash
# Start backend in background
cd backend
start npm start

# Run Flutter app
cd ..
flutter run -d chrome
```

## First Time Setup

### 1. Install yt-dlp

**Windows (Chocolatey):**
```bash
choco install yt-dlp
```

**Windows (Manual):**
```bash
# Download from: https://github.com/yt-dlp/yt-dlp/releases
# Place yt-dlp.exe in backend folder or add to PATH
```

**macOS (Homebrew):**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### 2. Verify yt-dlp
```bash
yt-dlp --version
```

## Usage

### Download a Video

1. Open the app
2. Go to **Single** tab
3. Paste YouTube URL
4. Select **Video** or **Audio**
5. Choose quality
6. Click **Download**
7. Check **Queue** tab for progress

### Search Videos

1. Go to **Search** tab
2. Enter search term
3. Browse results
4. Click download on any video

### Batch Download

1. Go to **Batch** tab
2. Paste multiple URLs (one per line)
3. Click **Download All**

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm start
```

### Flutter errors
```bash
flutter clean
flutter pub get
flutter run
```

### yt-dlp not found
```bash
# Check if installed
yt-dlp --version

# If not, install it (see above)
```

### Port 5000 already in use
Edit `backend/server.js`:
```javascript
const PORT = process.env.PORT || 5001; // Change port
```

## Development Tips

### Hot Reload
Press `r` in Flutter terminal to hot reload changes

### View Logs
Backend logs appear in Terminal 1
Flutter logs appear in Terminal 2

### Change Backend URL
Edit `lib/utils/constants.dart`:
```dart
static const String defaultBackendUrl = 'http://localhost:5000';
```

## Building for Production

### Android APK
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Windows EXE
```bash
flutter build windows --release
```
Output: `build/windows/runner/Release/`

### Web
```bash
flutter build web --release
```
Output: `build/web/`

### iOS
```bash
flutter build ios --release
```
Requires macOS and Xcode

## Project Structure

```
ytdownloader/
├── lib/              # Flutter app code
├── backend/          # Node.js server
├── assets/           # Images, icons, fonts
└── pubspec.yaml      # Flutter dependencies
```

## Support

- Check `PROJECT_STATUS.md` for detailed status
- Check `ICON_USAGE_GUIDE.md` for icon usage
- Check `README.md` for full documentation

## Next Steps

1. ✅ Run the app
2. ✅ Test downloading a video
3. ✅ Customize colors and theme
4. ✅ Add more features
5. ✅ Deploy to production

---

**Ready to go!** 🎉

Run these two commands in separate terminals:
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
flutter run
```
