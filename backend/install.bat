@echo off
echo ========================================
echo YouTube Downloader Backend Setup
echo ========================================
echo.

echo Checking requirements...
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check yt-dlp
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] yt-dlp is NOT installed!
    echo Install with: winget install yt-dlp
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [OK] yt-dlp is installed
)

REM Check ffmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] ffmpeg is NOT installed!
    echo Install with: winget install ffmpeg
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [OK] ffmpeg is installed
)

echo.
echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created! Please configure it.
) else (
    echo .env file already exists.
)

echo.
echo [3/3] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit .env file with your settings
echo 2. Run: start.bat (or npm run dev)
echo ========================================
pause
