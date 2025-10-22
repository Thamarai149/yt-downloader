@echo off
echo ========================================
echo   YouTube Downloader Pro - Installation
echo ========================================
echo.

echo Installing Backend Dependencies...
cd backend
set YOUTUBE_DL_SKIP_PYTHON_CHECK=1
call npm install
if %errorlevel% neq 0 (
    echo Backend installation failed!
    pause
    exit /b 1
)
cd ..

echo.
echo Installing Frontend Dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Frontend installation failed!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo To start the application, run: START.bat
echo.
pause
