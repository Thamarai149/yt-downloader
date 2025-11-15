@echo off
echo ========================================
echo YouTube Downloader Pro - Setup and Fix
echo ========================================
echo.

echo [1/6] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo.

echo [2/6] Installing backend dependencies...
cd backend
call npm install --omit=dev
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [3/6] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [4/6] Building frontend...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [5/6] Downloading binaries...
call node scripts/download-binaries.js
if %errorlevel% neq 0 (
    echo WARNING: Failed to download binaries automatically
    echo You may need to download them manually
)
echo.

echo [6/6] Verifying setup...
call node scripts/pre-build.js
if %errorlevel% neq 0 (
    echo WARNING: Some verification checks failed
    echo The application may still work
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now:
echo   1. Run in development: npm run electron:dev
echo   2. Build installer: npm run package:win
echo.
pause
