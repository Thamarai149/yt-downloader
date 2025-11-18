@echo off
echo ========================================
echo Killing all Node.js processes...
echo ========================================

REM Kill all node processes
taskkill /F /IM node.exe >nul 2>&1

echo All Node.js processes killed.
echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo ========================================
echo Starting Backend Server...
echo ========================================
echo.

call npm run dev
