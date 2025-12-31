@echo off
echo Starting YTStreamer007 Backend Server...

REM Kill any existing processes on port 3000
echo Cleaning up port 3000...
call kill-port.bat 3000

REM Wait a moment for cleanup
timeout /t 2 /nobreak >nul

echo Starting server...
npm run dev