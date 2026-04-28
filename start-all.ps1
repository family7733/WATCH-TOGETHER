# SHADOW STUDIO - Start All Servers
# This script starts both backend and frontend servers

Write-Host "=== SHADOW STUDIO - Starting All Servers ===" -ForegroundColor Green
Write-Host ""

# Set execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend\backend-node"
$frontendDir = Join-Path $scriptDir "frontend"

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$backendDir'; Write-Host '=== BACKEND SERVER ===' -ForegroundColor Green; Write-Host 'Running on http://localhost:3000' -ForegroundColor Cyan; Write-Host ''; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$frontendDir'; Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Green; Write-Host 'Running on http://localhost:5173' -ForegroundColor Cyan; Write-Host ''; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✓ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

