# ============================================
# Vel-SCADA - Stop Script (Windows)
# ============================================

Write-Host ""
Write-Host "🛑 Menghentikan Vel-SCADA..." -ForegroundColor Yellow
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

docker compose -f docker/compose/prod.yml down

Write-Host ""
Write-Host "✅ Vel-SCADA berhasil dihentikan" -ForegroundColor Green
Write-Host ""
