@echo off
echo ========================================
echo  YouTube Downloader Pro - Web App
echo ========================================
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js: OK

echo.
echo [2/3] Checking dependencies...
cd backend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo [3/3] Starting server...
echo.
echo ========================================
echo  Server starting on http://localhost:3000
echo  Open this URL in your browser!
echo ========================================
echo.

call npm start
