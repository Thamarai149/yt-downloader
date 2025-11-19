@echo off
echo Starting YouTube Downloader Pro - Development Mode
echo.
echo Starting Backend on http://localhost:3000
echo Starting Frontend on http://localhost:8080
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "cd web-frontend && npm run dev"

echo.
echo Servers starting...
echo Backend API: http://localhost:3000/api
echo Frontend UI: http://localhost:8080
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:8080
