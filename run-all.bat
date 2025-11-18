@echo off
echo ========================================
echo Starting YouTube Downloader
echo ========================================
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Starting Flutter Windows App...
flutter run -d windows

pause
