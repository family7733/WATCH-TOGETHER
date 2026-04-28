# SHADOW STUDIO Backend Server Startup Script
Write-Host "Starting SHADOW STUDIO Backend Server..." -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Set OMDB API key if not already set
if (-not $env:OMDB_API_KEY) {
    $env:OMDB_API_KEY = "773141ea-51ac-438e-8c6c-36fa7f2a8d37"
    Write-Host "OMDB API key set" -ForegroundColor Cyan
}

# Start the server
Write-Host "Starting server on http://localhost:3000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

node server.js

