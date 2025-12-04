@echo off
echo ========================================
echo   Restarting StreamedV3 Server
echo ========================================
echo.

REM Stop existing server
echo [1/3] Stopping existing server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Found process: %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM Check if packages are installed
echo [2/3] Checking dependencies...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "web-frontend\node_modules" (
    echo Installing frontend dependencies...
    cd web-frontend
    call npm install
    cd ..
)

REM Start server
echo [3/3] Starting server...
echo.
echo ========================================
echo   Server Starting...
echo   Backend: http://localhost:3001
echo   Frontend: http://localhost:8080
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
node src/server.js
