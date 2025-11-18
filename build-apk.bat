@echo off
echo ========================================
echo Building YT Downloader Pro APK
echo ========================================
echo.

echo Step 1: Getting dependencies...
call flutter pub get
if errorlevel 1 (
    echo Failed to get dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Cleaning previous build...
call flutter clean
echo.

echo Step 3: Building release APK...
call flutter build apk --release
if errorlevel 1 (
    echo Failed to build APK
    pause
    exit /b 1
)
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo APK Location: build\app\outputs\flutter-apk\app-release.apk
echo.
echo You can now install this APK on your Android phone!
echo.
pause
