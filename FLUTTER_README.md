# YouTube Downloader Pro - Flutter Edition

## 🎉 Complete Flutter/Dart Conversion

This is the **Flutter/Dart** version of YouTube Downloader Pro, converted from the original Electron + React/TypeScript stack. The app now runs natively on **Windows, macOS, Linux, Android, iOS, and Web** from a single codebase!

## 🚀 What's New

### Architecture
- **Single Codebase**: One Flutter app for all platforms
- **Native Performance**: Compiled to native code for each platform
- **Modern UI**: Material Design 3 with smooth animations
- **State Management**: Provider pattern for reactive state
- **Type Safety**: Dart's strong typing system

### Features Implemented
✅ Single video download
✅ Download queue with real-time progress
✅ Download history
✅ Settings management
✅ Dark/Light/System theme
✅ Responsive design
✅ WebSocket real-time updates
✅ Video info preview

### Coming Soon
🔄 Batch downloads
🔄 Search functionality
🔄 Playlist downloads
🔄 Analytics dashboard

## 📋 Prerequisites

### Required
1. **Flutter SDK** (3.0.0 or higher)
   - Download: https://flutter.dev/docs/get-started/install
   - Verify: `flutter doctor`

2. **Dart SDK** (comes with Flutter)
   - Verify: `dart --version`

3. **Backend Server** (Node.js)
   - The existing Node.js backend in `/backend` folder
   - Or convert to Dart backend (optional)

### Platform-Specific Requirements

#### Windows
- Visual Studio 2022 with C++ development tools
- Windows 10 SDK

#### macOS
- Xcode 14 or higher
- CocoaPods: `sudo gem install cocoapods`

#### Linux
- Clang
- CMake
- GTK development libraries
- Ninja build system

#### Android
- Android Studio
- Android SDK (API 21+)
- Java JDK 11+

#### iOS
- macOS with Xcode
- iOS 12.0+
- Apple Developer account (for device testing)

## 🛠️ Installation

### 1. Install Flutter

**Windows:**
```powershell
# Download Flutter SDK from flutter.dev
# Extract to C:\src\flutter
# Add to PATH: C:\src\flutter\bin
flutter doctor
```

**macOS/Linux:**
```bash
# Download Flutter SDK
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"
flutter doctor
```

### 2. Clone and Setup

```bash
# Navigate to project root
cd youtube-downloader-pro

# Get Flutter dependencies
flutter pub get

# Check for issues
flutter doctor -v
```

### 3. Setup Backend

The Flutter app connects to the existing Node.js backend:

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`

## 🎮 Running the App

### Desktop (Windows/macOS/Linux)

```bash
# Run on current platform
flutter run -d windows
flutter run -d macos
flutter run -d linux

# Or let Flutter choose
flutter run
```

### Mobile (Android/iOS)

```bash
# List available devices
flutter devices

# Run on Android
flutter run -d android

# Run on iOS (macOS only)
flutter run -d ios
```

### Web

```bash
# Run in Chrome
flutter run -d chrome

# Run in Edge
flutter run -d edge

# Build for production
flutter build web
```

## 📦 Building Release Versions

### Windows

```bash
flutter build windows --release
```
Output: `build/windows/runner/Release/`

### macOS

```bash
flutter build macos --release
```
Output: `build/macos/Build/Products/Release/`

### Linux

```bash
flutter build linux --release
```
Output: `build/linux/x64/release/bundle/`

### Android APK

```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle

```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### iOS

```bash
flutter build ios --release
```
Then open in Xcode to archive and distribute.

### Web

```bash
flutter build web --release
```
Output: `build/web/`

## 📁 Project Structure

```
lib/
├── main.dart                    # App entry point
├── models/                      # Data models
│   ├── video_info.dart
│   ├── download_item.dart
│   └── search_result.dart
├── providers/                   # State management
│   ├── theme_provider.dart
│   ├── download_provider.dart
│   └── settings_provider.dart
├── services/                    # API & WebSocket
│   ├── api_service.dart
│   └── websocket_service.dart
├── screens/                     # App screens
│   ├── home_screen.dart
│   ├── single_download_screen.dart
│   ├── batch_download_screen.dart
│   ├── search_screen.dart
│   ├── queue_screen.dart
│   ├── history_screen.dart
│   └── settings_screen.dart
├── widgets/                     # Reusable widgets
│   ├── video_info_card.dart
│   └── download_progress_card.dart
└── utils/                       # Utilities
    ├── constants.dart
    └── helpers.dart
```

## 🎨 Customization

### Change Theme Colors

Edit `lib/utils/constants.dart`:

```dart
static const Color primaryColor = Color(0xFF6366F1);
static const Color secondaryColor = Color(0xFFEC4899);
static const Color accentColor = Color(0xFF14B8A6);
```

### Change Backend URL

In the app:
1. Go to Settings
2. Tap "Backend URL"
3. Enter new URL
4. Save

Or edit `lib/utils/constants.dart`:

```dart
static const String defaultBackendUrl = 'http://your-server:5000';
```

## 🔧 Configuration

### pubspec.yaml

Key dependencies:
- `provider`: State management
- `dio`: HTTP client
- `web_socket_channel`: WebSocket support
- `shared_preferences`: Local storage
- `cached_network_image`: Image caching
- `flutter_animate`: Animations

### Platform Configurations

#### Android (`android/app/build.gradle`)
```gradle
minSdkVersion 21
targetSdkVersion 33
```

#### iOS (`ios/Runner/Info.plist`)
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 🐛 Troubleshooting

### Flutter Doctor Issues

```bash
flutter doctor -v
```

Fix common issues:
- Android licenses: `flutter doctor --android-licenses`
- Xcode setup: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
- CocoaPods: `sudo gem install cocoapods`

### Build Errors

```bash
# Clean build
flutter clean
flutter pub get

# Rebuild
flutter run
```

### Backend Connection Issues

1. Check backend is running: `http://localhost:5000`
2. Check firewall settings
3. Update backend URL in Settings
4. For mobile: Use computer's IP address instead of localhost

### Hot Reload Not Working

```bash
# Press 'r' in terminal for hot reload
# Press 'R' for hot restart
# Or use IDE buttons
```

## 📱 Platform-Specific Features

### Desktop
- Native window controls
- File system access
- System tray integration (coming soon)
- Desktop notifications

### Mobile
- Share functionality
- Background downloads (coming soon)
- Mobile-optimized UI
- Gesture navigation

### Web
- PWA support (coming soon)
- Responsive design
- Browser notifications
- Offline support (coming soon)

## 🚀 Performance

### Optimization Tips

1. **Use const constructors** where possible
2. **Lazy load images** with `CachedNetworkImage`
3. **Minimize rebuilds** with `const` widgets
4. **Profile performance**: `flutter run --profile`

### Build Optimization

```bash
# Analyze bundle size
flutter build apk --analyze-size

# Enable obfuscation
flutter build apk --obfuscate --split-debug-info=build/debug-info

# Tree shaking
flutter build web --tree-shake-icons
```

## 🧪 Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Integration tests
flutter drive --target=test_driver/app.dart
```

## 📚 Resources

### Flutter Documentation
- Official Docs: https://flutter.dev/docs
- Widget Catalog: https://flutter.dev/docs/development/ui/widgets
- Cookbook: https://flutter.dev/docs/cookbook

### Dart Documentation
- Language Tour: https://dart.dev/guides/language/language-tour
- Effective Dart: https://dart.dev/guides/language/effective-dart

### Community
- Flutter Discord: https://discord.gg/flutter
- Stack Overflow: https://stackoverflow.com/questions/tagged/flutter
- Reddit: https://reddit.com/r/FlutterDev

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- [x] Project setup
- [x] Basic UI structure
- [x] Single download
- [x] Download queue
- [x] History
- [x] Settings
- [x] Theme system

### Phase 2 (In Progress) 🔄
- [ ] Batch downloads
- [ ] Search functionality
- [ ] Playlist support
- [ ] Analytics dashboard

### Phase 3 (Planned) 📋
- [ ] Background downloads (mobile)
- [ ] System tray (desktop)
- [ ] PWA features (web)
- [ ] Subtitle downloads
- [ ] Advanced settings

## 💡 Tips

### Development
- Use **hot reload** (`r`) for quick UI changes
- Use **hot restart** (`R`) for state changes
- Use **DevTools** for debugging: `flutter pub global activate devtools`

### Debugging
```bash
# Enable verbose logging
flutter run -v

# Debug specific platform
flutter run -d windows --debug

# Profile mode
flutter run --profile
```

### IDE Setup
- **VS Code**: Install Flutter extension
- **Android Studio**: Install Flutter plugin
- **IntelliJ IDEA**: Install Flutter plugin

## 🌟 Advantages Over Previous Stack

### Before (Electron + React)
- ❌ Large bundle size (~150MB)
- ❌ High memory usage
- ❌ Separate mobile codebase (Capacitor)
- ❌ Web-based rendering

### After (Flutter)
- ✅ Small bundle size (~15-30MB)
- ✅ Low memory usage
- ✅ Single codebase for all platforms
- ✅ Native rendering
- ✅ Better performance
- ✅ Faster startup time

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/yourusername/youtube-downloader-pro/issues)
- Email: your.email@example.com
- Discord: [Join our server](#)

---

**Made with ❤️ and Flutter**

**Version**: 2.0.0 (Flutter Edition)
**Last Updated**: 2024
