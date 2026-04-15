# Force restart backend server
Write-Host "=== Restarting Backend Server ===" -ForegroundColor Green
Write-Host ""

# Kill any process on port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Stopping processes on port 3000..." -ForegroundColor Yellow
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

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
node server.js
