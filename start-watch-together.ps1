# Start Watch Together - Backend and Frontend
# This script starts both servers needed for Watch Together

Write-Host "=== Starting Watch Together Servers ===" -ForegroundColor Green
Write-Host ""

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend\backend-node"
$frontendDir = Join-Path $scriptDir "frontend"

# Check if directories exist
if (-not (Test-Path $backendDir)) {
    Write-Host "Error: Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "Error: Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$backendDir'; Write-Host '=== BACKEND SERVER ===' -ForegroundColor Green; Write-Host 'Watch Together Socket.io Server' -ForegroundColor Cyan; Write-Host 'Running on http://localhost:3000' -ForegroundColor Yellow; Write-Host ''; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$frontendDir'; Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Green; Write-Host 'React + Vite Dev Server' -ForegroundColor Cyan; Write-Host 'Running on http://localhost:5173' -ForegroundColor Yellow; Write-Host ''; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✓ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 See START-WATCH-TOGETHER.md for usage instructions" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
