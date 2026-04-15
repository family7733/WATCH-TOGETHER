# Restart Both Frontend and Backend Servers
# This script stops all existing servers and starts fresh ones

Write-Host "=== Restarting All Servers ===" -ForegroundColor Green
Write-Host ""

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend\backend-node"
$frontendDir = Join-Path $scriptDir "frontend"

# Stop Backend (Port 3000)
Write-Host "Stopping Backend Server (Port 3000)..." -ForegroundColor Yellow
$backendProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($backendProcesses) {
    foreach ($pid in $backendProcesses) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Stopped backend process $pid" -ForegroundColor Gray
        } catch {
            Write-Host "  ✗ Could not stop process $pid" -ForegroundColor Red
        }
    }
}

# Stop Frontend (Port 5173)
Write-Host "Stopping Frontend Server (Port 5173)..." -ForegroundColor Yellow
$frontendProcesses = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($frontendProcesses) {
    foreach ($pid in $frontendProcesses) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Stopped frontend process $pid" -ForegroundColor Gray
        } catch {
            Write-Host "  ✗ Could not stop process $pid" -ForegroundColor Red
        }
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$backendDir'; Write-Host '=== BACKEND SERVER ===' -ForegroundColor Green; Write-Host 'Port: 3000' -ForegroundColor Yellow; Write-Host 'Socket.io: Enabled' -ForegroundColor Cyan; Write-Host ''; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$frontendDir'; Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Green; Write-Host 'Port: 5173' -ForegroundColor Yellow; Write-Host 'Vite Dev Server' -ForegroundColor Cyan; Write-Host ''; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✓ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Wait 5-10 seconds for servers to fully start..." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
