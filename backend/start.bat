@echo off
echo ========================================
echo Starting YouTube Downloader Backend
echo ========================================
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo [WARNING] Dependencies not installed!
    echo Installing dependencies...
    call npm install
    echo.
)

echo Server will start on http://localhost:3001
echo Press Ctrl+C to stop the server
echo.
call npm run dev
