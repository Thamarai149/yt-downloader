@echo off
echo ========================================
echo   Installing Dependencies
echo ========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version
echo.

REM Install backend dependencies
echo [1/2] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/2] Installing frontend dependencies...
cd web-frontend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo All dependencies installed successfully.
echo.
echo Next steps:
echo 1. Configure your .env file in backend folder
echo 2. Run start-dev.bat to start the server
echo.
pause
