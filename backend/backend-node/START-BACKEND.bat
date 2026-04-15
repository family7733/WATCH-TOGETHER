@echo off
echo ========================================
echo   PAWAR FILMS - Backend Server
echo ========================================
echo.
echo Starting backend server on port 3000...
echo.
cd /d %~dp0
node server.js
pause

