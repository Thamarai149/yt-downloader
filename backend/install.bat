@echo off
echo ========================================
echo YouTube Downloader Backend Setup
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please configure it before starting the server.
) else (
    echo .env file already exists. Skipping...
)
echo.

echo [3/4] Creating downloads directory...
if not exist downloads (
    mkdir downloads
    echo Downloads directory created.
) else (
    echo Downloads directory already exists.
)
echo.

echo [4/4] Checking requirements...
echo Checking for yt-dlp...
where yt-dlp >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: yt-dlp not found in PATH
    echo Please install yt-dlp: winget install yt-dlp
    echo Or download from: https://github.com/yt-dlp/yt-dlp/releases
) else (
    echo yt-dlp found!
)
echo.

echo Checking for ffmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: ffmpeg not found in PATH
    echo Please install ffmpeg: winget install ffmpeg
    echo Or download from: https://ffmpeg.org/download.html
) else (
    echo ffmpeg found!
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure .env file with your settings
echo 2. Run: npm run dev (development)
echo    Or: npm start (production)
echo.
echo For more information, see:
echo - QUICK_START.md
echo - README.md
echo - FEATURES.md
echo.
pause
