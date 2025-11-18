@echo off
echo ========================================
echo Checking System Requirements
echo ========================================
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [ERROR] Node.js is NOT installed
    echo Download from: https://nodejs.org/
)

echo.
echo [2/3] Checking yt-dlp...
yt-dlp --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] yt-dlp is installed
    yt-dlp --version
) else (
    echo [ERROR] yt-dlp is NOT installed
    echo Install with: winget install yt-dlp
    echo Or download from: https://github.com/yt-dlp/yt-dlp/releases
)

echo.
echo [3/3] Checking ffmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ffmpeg is installed
    ffmpeg -version | findstr "ffmpeg version"
) else (
    echo [ERROR] ffmpeg is NOT installed
    echo Install with: winget install ffmpeg
    echo Or download from: https://ffmpeg.org/download.html
)

echo.
echo ========================================
echo Summary
echo ========================================
echo.

set all_ok=1

node --version >nul 2>&1
if %errorlevel% neq 0 set all_ok=0

yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 set all_ok=0

ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 set all_ok=0

if %all_ok% equ 1 (
    echo [SUCCESS] All requirements are installed!
    echo You can now run: npm install
) else (
    echo [WARNING] Some requirements are missing.
    echo Please install the missing components above.
)

echo.
pause
