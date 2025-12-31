@echo off
echo YTStreamer007 Setup Application Installer
echo ========================================

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
node --version

echo.
echo Installing setup application dependencies...
cd setup-app
npm install

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Setup complete! You can now:
echo 1. Run 'launch-setup.bat' to start the setup application
echo 2. Or build an executable with 'setup-app\build.bat'
echo.
pause