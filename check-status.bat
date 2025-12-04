@echo off
echo ========================================
echo   Server Status Check
echo ========================================
echo.

REM Check if port 3001 is in use
echo Checking port 3001 (Backend)...
netstat -ano | findstr :3001
if %errorlevel% equ 0 (
    echo [OK] Backend server is running
) else (
    echo [X] Backend server is NOT running
)

echo.
echo Checking port 8080 (Frontend)...
netstat -ano | findstr :8080
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running
) else (
    echo [X] Frontend server is NOT running
)

echo.
echo ========================================
echo   Node.js Information
echo ========================================
node --version
npm --version

echo.
echo ========================================
echo   Environment Check
echo ========================================
if exist "backend\.env" (
    echo [OK] Backend .env file exists
) else (
    echo [X] Backend .env file NOT found
)

if exist "backend\node_modules" (
    echo [OK] Backend dependencies installed
) else (
    echo [X] Backend dependencies NOT installed
)

if exist "web-frontend\node_modules" (
    echo [OK] Frontend dependencies installed
) else (
    echo [X] Frontend dependencies NOT installed
)

echo.
pause
