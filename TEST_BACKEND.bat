@echo off
echo ========================================
echo Testing Backend API
echo ========================================
echo.

echo [1/4] Testing Health Endpoint...
curl -s http://localhost:3001/api/health
echo.
echo.

echo [2/4] Testing Video Search...
curl -s "http://localhost:3001/api/video/search?query=test&limit=2"
echo.
echo.

echo [3/4] Testing Active Downloads...
curl -s http://localhost:3001/api/download/active
echo.
echo.

echo [4/4] Testing Download History...
curl -s http://localhost:3001/api/download/history
echo.
echo.

echo ========================================
echo Test Complete!
echo ========================================
pause
