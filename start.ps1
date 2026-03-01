# TimeTrack Startup Script for Windows
# Запускает backend и frontend с автоматическим перезапуском

$ErrorActionPreference = "Continue"

# Colors (ANSI)
function Write-Color($Message, $Color = "White") {
    $colors = @{
        "Green" = "`e[0;32m"
        "Yellow" = "`e[1;33m"
        "Red" = "`e[0;31m"
        "White" = "`e[0m"
    }
    Write-Host "$($colors[$Color])$Message$($colors['White'])"
}

$script:BACKEND_PID = $null
$script:FRONTEND_PID = $null

# Kill existing processes
Write-Color "Stopping any existing processes..." "Yellow"

# Stop processes by PID files
if (Test-Path "backend.pid") {
    $pid = Get-Content "backend.pid" -ErrorAction SilentlyContinue
    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Remove-Item "backend.pid" -ErrorAction SilentlyContinue
}

if (Test-Path "frontend.pid") {
    $pid = Get-Content "frontend.pid" -ErrorAction SilentlyContinue
    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Remove-Item "frontend.pid" -ErrorAction SilentlyContinue
}

# Kill node processes on ports 3000 and 3001
Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1

# Function to start backend
function Start-Backend {
    Write-Color "Starting backend..." "Green"
    Push-Location backend
    $process = Start-Process -FilePath "npm" -ArgumentList "run","dev" -PassThru -NoNewWindow
    $script:BACKEND_PID = $process.Id
    $script:BACKEND_PID | Out-File "backend.pid" -Encoding utf8
    Pop-Location
    Write-Color "Backend started with PID: $($script:BACKEND_PID)" "Green"
}

# Function to start frontend
function Start-Frontend {
    Write-Color "Starting frontend..." "Green"
    Push-Location frontend
    $process = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow
    $script:FRONTEND_PID = $process.Id
    $script:FRONTEND_PID | Out-File "frontend.pid" -Encoding utf8
    Pop-Location
    Write-Color "Frontend started with PID: $($script:FRONTEND_PID)" "Green"
}

# Function to restart crashed process
function Restart-Crashed($type) {
    if ($type -eq "backend") {
        Write-Color "Backend crashed, restarting..." "Yellow"
        Start-Backend
    } else {
        Write-Color "Frontend crashed, restarting..." "Yellow"
        Start-Frontend
    }
}

# Start services
Start-Backend
Start-Sleep -Seconds 2
Start-Frontend

Start-Sleep -Seconds 5

Write-Color ""
Write-Color "========================================" "Green"
Write-Color "TimeTrack is running!" "Green"
Write-Color "Backend: http://localhost:3001" "Green"
Write-Color "Frontend: http://localhost:3000" "Green"
Write-Color "========================================" "Green"
Write-Color ""

# Monitor processes in loop
Write-Color "Monitoring processes... (Press Ctrl+C to stop)" "Yellow"

try {
    while ($true) {
        Start-Sleep -Seconds 3
        
        # Check backend
        if ($script:BACKEND_PID) {
            if (-not (Get-Process -Id $script:BACKEND_PID -ErrorAction SilentlyContinue)) {
                Restart-Crashed "backend"
            }
        }
        
        # Check frontend
        if ($script:FRONTEND_PID) {
            if (-not (Get-Process -Id $script:FRONTEND_PID -ErrorAction SilentlyContinue)) {
                Restart-Crashed "frontend"
            }
        }
    }
}
finally {
    Write-Color "`nStopping services..." "Yellow"
    
    if ($script:BACKEND_PID) {
        Stop-Process -Id $script:BACKEND_PID -Force -ErrorAction SilentlyContinue
    }
    if ($script:FRONTEND_PID) {
        Stop-Process -Id $script:FRONTEND_PID -Force -ErrorAction SilentlyContinue
    }
    
    Remove-Item "backend.pid" -ErrorAction SilentlyContinue
    Remove-Item "frontend.pid" -ErrorAction SilentlyContinue
    
    Write-Color "Services stopped." "Green"
}
