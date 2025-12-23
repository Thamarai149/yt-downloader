@echo off
echo ========================================
echo   YTStreamer007 - Web Only Mode
echo ========================================
echo.
echo Starting services...
echo.

REM Start backend (API only)
echo [1/2] Starting backend API...
start "Backend API" cmd /k "cd backend && npm start"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/2] Starting web interface...
start "Web Interface" cmd /k "cd web-frontend && npx http-server -p 8080"

echo.
echo ========================================
echo   Services Started!
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Web Interface: http://localhost:8080
echo.
echo Note: Telegram bot is disabled
echo Users can access the web downloader directly
echo.
echo Press any key to open web interface...
pause >nul

REM Open web interface
start http://localhost:8080

echo.
echo To stop services, close the command windows
echo or run stop-server.bat
echo.
pause