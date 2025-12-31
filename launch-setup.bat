@echo off
echo Starting YTStreamer007 Setup Application...

cd setup-app

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo Launching application...
npm start