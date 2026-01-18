$Ports = 5002..5010
Write-Host "🚀 Rapid Fix: Clearing CivicReport Ports..." -ForegroundColor Cyan

foreach ($Port in $Ports) {
    $Process = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($Process) {
        Write-Host "🛑 Stopping process on port $Port (PID: $($Process.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $Process.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Ports cleared. Starting server..." -ForegroundColor Green
node server.js
