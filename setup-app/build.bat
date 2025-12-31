@echo off
echo Installing dependencies...
npm install

echo Building Windows executable...
npm run build-win

echo Build complete! Check the dist folder for the installer.
pause