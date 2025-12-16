@echo off
echo ========================================
echo   Starting StreamedV3 with PM2
echo ========================================
echo.

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 is not installed!
    echo.
    echo Installing PM2...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install PM2!
        pause
        exit /b 1
    )
)

echo [1/4] Stopping existing instance...
cd backend
pm2 stop streamedv3-bot 2>nul

echo [2/4] Starting bot with PM2...
pm2 start src/server.js --name streamedv3-bot --time

echo [3/4] Saving PM2 configuration...
pm2 save

echo [4/4] Checking status...
pm2 status

echo.
echo ========================================
echo   Bot Started Successfully!
echo ========================================
echo.
echo Bot Name: streamedv3-bot
echo Status: Running
echo.
echo Useful Commands:
echo   pm2 logs streamedv3-bot  - View logs
echo   pm2 monit                - Monitor resources
echo   pm2 restart streamedv3-bot - Restart bot
echo   pm2 stop streamedv3-bot  - Stop bot
echo.
echo To enable auto-start with Windows:
echo   1. Run: pm2-service-install (as Administrator)
echo   2. Run: pm2 save
echo.
pause
