# ============================================
# Vel-SCADA - Reset Script (Windows)
# ============================================

Write-Host ""
Write-Host "🔄 ==================================" -ForegroundColor Yellow
Write-Host "   Reset Vel-SCADA" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  PERINGATAN: Semua data akan dihapus!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Yakin ingin melanjutkan? (y/n)"

if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Dibatalkan" -ForegroundColor Red
    exit
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host ""
Write-Host "🛑 Menghentikan services..." -ForegroundColor Yellow
docker compose -f docker/compose/prod.yml down -v

Write-Host ""
Write-Host "🗑️  Menghapus data lama..." -ForegroundColor Yellow
docker volume rm compose_mysql-data compose_redis-data 2>$null

Write-Host ""
Write-Host "📦 Memulai ulang services..." -ForegroundColor Yellow
docker compose -f docker/compose/prod.yml up -d --build

Write-Host ""
Write-Host "⏳ Menunggu database siap..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🔄 Menyiapkan database baru..." -ForegroundColor Yellow
docker compose -f docker/compose/prod.yml exec -T laravel php artisan migrate:fresh --seed --force

Write-Host ""
Write-Host "✅ ==================================" -ForegroundColor Green
Write-Host "   Reset berhasil!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Buka browser: " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
