# ============================================
# Vel-SCADA - Start Script (Windows)
# ============================================

Write-Host ""
Write-Host "🔋 ==================================" -ForegroundColor Cyan
Write-Host "   Vel-SCADA P2P Energy Trading" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker sudah berjalan" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker tidak berjalan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Silakan:" -ForegroundColor Yellow
    Write-Host "1. Buka Docker Desktop"
    Write-Host "2. Tunggu sampai Docker ready"
    Write-Host "3. Jalankan script ini lagi"
    Write-Host ""
    exit 1
}

Write-Host ""

# Navigate to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📦 Memulai semua services..." -ForegroundColor Yellow
Write-Host "   (Ini mungkin butuh beberapa menit untuk pertama kali)"
Write-Host ""

# Start containers
docker compose -f docker/compose/prod.yml up -d --build

# Wait for MySQL to be ready
Write-Host ""
Write-Host "⏳ Menunggu database siap..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migrations
Write-Host "🔄 Menyiapkan database..." -ForegroundColor Yellow
docker compose -f docker/compose/prod.yml exec -T laravel php artisan migrate --force 2>$null

# Check if we need to seed
$usersCount = docker compose -f docker/compose/prod.yml exec -T laravel php artisan tinker --execute="echo App\Models\User::count();" 2>$null
if ($usersCount -match "^0$" -or [string]::IsNullOrEmpty($usersCount)) {
    Write-Host "🌱 Mengisi data awal..." -ForegroundColor Yellow
    docker compose -f docker/compose/prod.yml exec -T laravel php artisan db:seed --force 2>$null
}

Write-Host ""
Write-Host "✅ ==================================" -ForegroundColor Green
Write-Host "   Vel-SCADA berhasil dijalankan!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Buka browser dan akses:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Aplikasi : " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Yellow
Write-Host "   Database : " -NoNewline; Write-Host "http://localhost:8888" -ForegroundColor Yellow
Write-Host ""
Write-Host "👤 Akun Demo:" -ForegroundColor Cyan
Write-Host "   Email    : jhonest@example.com"
Write-Host "   Password : password"
Write-Host ""
Write-Host "🛑 Untuk menghentikan, jalankan: " -NoNewline; Write-Host ".\stop.ps1" -ForegroundColor Yellow
Write-Host ""
