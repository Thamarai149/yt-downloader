@echo off
echo ========================================
echo   YouTube Downloader Pro - Starting
echo ========================================
echo.

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    set YOUTUBE_DL_SKIP_PYTHON_CHECK=1
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo Starting Backend Server...
start "YT Downloader Backend" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "YT Downloader Frontend" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo   Application Started!
echo ========================================
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
