@echo off
echo ========================================
echo Building Android App Bundle (AAB)
echo ========================================
echo.
echo This will create an AAB file for Google Play Store...
echo.

flutter clean
flutter pub get
flutter build appbundle --release

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo AAB Location: build\app\outputs\bundle\release\app-release.aab
echo.
echo Upload this file to Google Play Console!
echo.
pause
