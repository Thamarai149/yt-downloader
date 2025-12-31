@echo off
set PORT=%1
if "%PORT%"=="" set PORT=3000

echo Killing processes on port %PORT%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT%') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Done!