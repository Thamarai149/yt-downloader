@echo off
echo ========================================
echo Fixing Android Build Issues
echo ========================================
echo.

echo Step 1: Cleaning Flutter cache...
flutter clean

echo.
echo Step 2: Cleaning pub cache for problematic packages...
flutter pub cache clean

echo.
echo Step 3: Cleaning Android Gradle cache...
cd android
if exist .gradle rmdir /s /q .gradle
if exist build rmdir /s /q build
if exist app\build rmdir /s /q app\build
cd ..

echo.
echo Step 4: Removing pubspec.lock...
if exist pubspec.lock del pubspec.lock

echo.
echo Step 5: Getting fresh dependencies...
flutter pub get

echo.
echo Step 6: Building APK (this may take 3-5 minutes)...
flutter build apk --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Success! Build Fixed!
    echo ========================================
    echo.
    echo APK Location: build\app\outputs\flutter-apk\app-release.apk
    echo APK Size: Check the file size above
    echo.
    echo Next Steps:
    echo 1. Transfer APK to your Android device
    echo 2. Enable "Install from Unknown Sources"
    echo 3. Install and enjoy!
) else (
    echo.
    echo ========================================
    echo Build Failed - Try Manual Steps
    echo ========================================
    echo.
    echo 1. Update Flutter: flutter upgrade
    echo 2. Check setup: flutter doctor -v
    echo 3. Accept licenses: flutter doctor --android-licenses
    echo 4. Check Java: java -version (should be 11+)
    echo 5. Try again: flutter build apk --release
)

echo.
pause
