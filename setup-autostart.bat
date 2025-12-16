@echo off
echo ========================================
echo   Setup StreamedV3 Auto-Start
echo ========================================
echo.
echo Choose installation method:
echo.
echo 1. Windows Service (Recommended)
echo    - Runs in background
echo    - Starts automatically with Windows
echo    - Runs even when not logged in
echo    - Requires Administrator
echo.
echo 2. Startup Folder (Simple)
echo    - Starts when you log in
echo    - Runs in visible window
echo    - No Administrator needed
echo.
echo 3. Task Scheduler (Advanced)
echo    - Most reliable
echo    - Starts automatically with Windows
echo    - Can run without login
echo    - Requires Administrator
echo.
set /p choice="Enter choice (1, 2, or 3): "

if "%choice%"=="1" goto service
if "%choice%"=="2" goto startup
if "%choice%"=="3" goto scheduler
echo Invalid choice!
pause
exit /b 1

:service
echo.
echo Installing as Windows Service...
echo.
call install-windows-service.bat
goto end

:startup
echo.
echo Setting up Startup Folder shortcut...
echo.

REM Create startup script
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SCRIPT_PATH=%CD%\start-dev.bat

echo Creating shortcut in Startup folder...
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%STARTUP_FOLDER%\StreamedV3.lnk'); $SC.TargetPath = '%SCRIPT_PATH%'; $SC.WorkingDirectory = '%CD%'; $SC.Save()"

echo.
echo ========================================
echo   Startup Folder Setup Complete!
echo ========================================
echo.
echo StreamedV3 will start automatically when you log in.
echo.
echo Shortcut location:
echo %STARTUP_FOLDER%\StreamedV3.lnk
echo.
echo To remove: Delete the shortcut from Startup folder
echo.
pause
goto end

:scheduler
echo.
echo Setting up Task Scheduler...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Task Scheduler setup requires Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

REM Create task
schtasks /create /tn "StreamedV3 Bot" /tr "%CD%\start-dev.bat" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Task Scheduler Setup Complete!
    echo ========================================
    echo.
    echo Task Name: StreamedV3 Bot
    echo Trigger: At logon
    echo.
    echo To manage:
    echo - Open Task Scheduler (taskschd.msc)
    echo - Find "StreamedV3 Bot"
    echo.
    echo To remove:
    echo   schtasks /delete /tn "StreamedV3 Bot" /f
    echo.
) else (
    echo ERROR: Failed to create scheduled task!
)
pause
goto end

:end
exit /b 0
