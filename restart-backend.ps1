# Restart Backend Server Script
# This script stops any existing backend server and starts a fresh one

Write-Host "=== Restarting Backend Server ===" -ForegroundColor Green
Write-Host ""

# Find and stop any Node.js processes running on port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $pid" -ForegroundColor Gray
        } catch {
            Write-Host "  Could not stop process $pid" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
}

# Navigate to backend directory
$backendDir = Join-Path $PSScriptRoot "backend\backend-node"
if (-not (Test-Path $backendDir)) {
    Write-Host "Error: Backend directory not found at $backendDir" -ForegroundColor Red
    exit 1
}

Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host ""

# Start the backend server
Set-Location $backendDir
node server.js
