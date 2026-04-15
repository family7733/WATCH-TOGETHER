@echo off
echo Starting development server on http://localhost:5173
echo Press Ctrl+C to stop the server
cd /d "%~dp0"
npm run dev
pause

