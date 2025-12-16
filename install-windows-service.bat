@echo off
echo ========================================
echo   Installing StreamedV3 as Windows Service
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/4] Installing node-windows globally...
call npm install -g node-windows
if %errorlevel% neq 0 (
    echo ERROR: Failed to install node-windows!
    pause
    exit /b 1
)

echo [3/4] Creating service installation script...
cd backend

REM Create service installer
(
echo const Service = require^('node-windows'^).Service;
echo const path = require^('path'^);
echo.
echo // Create a new service object
echo const svc = new Service^({
echo   name: 'StreamedV3 Bot',
echo   description: 'StreamedV3 YouTube Downloader Telegram Bot',
echo   script: path.join^(__dirname, 'src', 'server.js'^),
echo   nodeOptions: [
echo     '--harmony',
echo     '--max_old_space_size=4096'
echo   ],
echo   env: [
echo     {
echo       name: 'NODE_ENV',
echo       value: 'production'
echo     }
echo   ]
echo }^);
echo.
echo // Listen for the "install" event
echo svc.on^('install', function^(^) {
echo   console.log^('Service installed successfully!'^);
echo   console.log^('Starting service...'^);
echo   svc.start^(^);
echo }^);
echo.
echo // Listen for the "start" event
echo svc.on^('start', function^(^) {
echo   console.log^('Service started successfully!'^);
echo   console.log^('StreamedV3 is now running as a Windows service.'^);
echo }^);
echo.
echo // Install the service
echo svc.install^(^);
) > install-service.js

echo [4/4] Installing Windows service...
node install-service.js

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Service Name: StreamedV3 Bot
echo Status: Running
echo.
echo The bot will now start automatically when Windows starts.
echo.
echo To manage the service:
echo - Open Services (services.msc)
echo - Find "StreamedV3 Bot"
echo - Right-click to Stop/Start/Restart
echo.
echo To uninstall, run: uninstall-windows-service.bat
echo.
pause
