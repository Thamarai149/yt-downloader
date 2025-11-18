@echo off
echo Cleaning up project - keeping only Flutter and backend files...

REM Remove Electron files
if exist "src" rmdir /s /q "src"
if exist "dist-electron" rmdir /s /q "dist-electron"
if exist "electron-builder.json" del /q "electron-builder.json"

REM Remove React/Web client
if exist "client" rmdir /s /q "client"

REM Remove iOS/Android Capacitor
if exist "ios" rmdir /s /q "ios"
if exist "android" rmdir /s /q "android"
if exist "capacitor.config.ts" del /q "capacitor.config.ts"

REM Remove build resources
if exist "build-resources" rmdir /s /q "build-resources"

REM Remove binaries
if exist "binaries" rmdir /s /q "binaries"

REM Remove scripts (except this one)
if exist "scripts" rmdir /s /q "scripts"

REM Remove docs folder
if exist "docs" rmdir /s /q "docs"

REM Remove GitHub workflows
if exist ".github" rmdir /s /q ".github"

REM Remove unnecessary documentation
if exist "BUILD.md" del /q "BUILD.md"
if exist "CODE_SIGNING.md" del /q "CODE_SIGNING.md"
if exist "CONTRIBUTING.md" del /q "CONTRIBUTING.md"
if exist "CONVERSION_COMPLETE.md" del /q "CONVERSION_COMPLETE.md"
if exist "FLUTTER_CONVERSION_PLAN.md" del /q "FLUTTER_CONVERSION_PLAN.md"
if exist "FLUTTER_CONVERSION_SUMMARY.md" del /q "FLUTTER_CONVERSION_SUMMARY.md"
if exist "MIGRATION_GUIDE.md" del /q "MIGRATION_GUIDE.md"
if exist "MOBILE_CONVERSION_COMPLETE.md" del /q "MOBILE_CONVERSION_COMPLETE.md"
if exist "MOBILE_QUICKSTART.md" del /q "MOBILE_QUICKSTART.md"
if exist "MOBILE_SETUP.md" del /q "MOBILE_SETUP.md"
if exist "PLATFORM_CONVERSION_COMPLETE.md" del /q "PLATFORM_CONVERSION_COMPLETE.md"
if exist "QUICK_START.md" del /q "QUICK_START.md"
if exist "STACK_COMPARISON.md" del /q "STACK_COMPARISON.md"
if exist "WEB_DEPLOYMENT.md" del /q "WEB_DEPLOYMENT.md"

REM Remove setup scripts
if exist "INSTALL.bat" del /q "INSTALL.bat"
if exist "SETUP-AND-FIX.bat" del /q "SETUP-AND-FIX.bat"
if exist "START.bat" del /q "START.bat"
if exist "flutter_setup.bat" del /q "flutter_setup.bat"

REM Remove root package files (Electron related)
if exist "package.json" del /q "package.json"
if exist "package-lock.json" del /q "package-lock.json"

REM Remove signing example
if exist ".env.signing.example" del /q ".env.signing.example"

REM Remove Flutter plugins dependencies (will be regenerated)
if exist ".flutter-plugins-dependencies" del /q ".flutter-plugins-dependencies"

echo.
echo Cleanup complete!
echo.
echo Kept files:
echo - lib/ (Flutter Dart code)
echo - backend/ (Node.js backend server)
echo - assets/ (Flutter assets)
echo - pubspec.yaml (Flutter dependencies)
echo - README.md (Main documentation)
echo - CHANGELOG.md (Version history)
echo - LICENSE (License file)
echo - .gitignore (Git ignore rules)
echo.
echo Removed:
echo - Electron desktop app files
echo - React web client
echo - iOS/Android Capacitor files
echo - Build resources and scripts
echo - Unnecessary documentation
echo.
pause
