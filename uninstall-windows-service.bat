@echo off
echo ========================================
echo   Uninstalling YTStreamer007 Windows Service
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

echo Creating uninstall script...
cd backend

REM Create service uninstaller
(
echo const Service = require^('node-windows'^).Service;
echo const path = require^('path'^);
echo.
echo // Create a new service object
echo const svc = new Service^({
echo   name: 'YTStreamer007 Bot',
echo   script: path.join^(__dirname, 'src', 'server.js'^)
echo }^);
echo.
echo // Listen for the "uninstall" event
echo svc.on^('uninstall', function^(^) {
echo   console.log^('Service uninstalled successfully!'^);
echo   console.log^('YTStreamer007 service has been removed.'^);
echo }^);
echo.
echo // Uninstall the service
echo svc.uninstall^(^);
) > uninstall-service.js

echo Uninstalling service...
node uninstall-service.js

echo.
echo ========================================
echo   Uninstallation Complete!
echo ========================================
echo.
echo The YTStreamer007 service has been removed.
echo.
pause
