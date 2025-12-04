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

# Check if Node.js is installed for building frontend
Write-Host "🔍 Mengecek Node.js..." -ForegroundColor Yellow
$nodeInstalled = $false
try {
    node --version | Out-Null
    $nodeInstalled = $true
    Write-Host "✅ Node.js terinstall" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Node.js tidak terinstall" -ForegroundColor Yellow
}

# Check if we need to build frontend
$buildExists = Test-Path "backend/public/build/manifest.json"

if (-not $buildExists) {
    if ($nodeInstalled) {
        Write-Host ""
        Write-Host "🔨 Building frontend assets..." -ForegroundColor Yellow
        Set-Location backend
        npm install
        npm run build
        Set-Location ..
        Write-Host "✅ Frontend berhasil di-build" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ ERROR: Frontend belum di-build dan Node.js tidak tersedia!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solusi:" -ForegroundColor Yellow
        Write-Host "1. Install Node.js dari https://nodejs.org/" -ForegroundColor White
        Write-Host "2. Restart PowerShell" -ForegroundColor White
        Write-Host "3. Jalankan script ini lagi" -ForegroundColor White
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "✅ Frontend assets sudah ada" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Memulai semua services..." -ForegroundColor Yellow
Write-Host "   (Ini mungkin butuh beberapa menit untuk pertama kali)"
Write-Host ""

# Start containers
docker compose -f docker/compose/prod.yml up -d --build

# Wait for MySQL to be ready
Write-Host ""
Write-Host "⏳ Menunggu database siap..." -ForegroundColor Yellow

# Wait until MySQL is ready
$maxRetries = 30
$retryCount = 0
do {
    $retryCount++
    $result = docker compose -f docker/compose/prod.yml exec -T mysql mysqladmin ping -h localhost -u vel_scada_user -psecret 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   MySQL belum siap, menunggu... ($retryCount/$maxRetries)"
        Start-Sleep -Seconds 3
    }
} while ($LASTEXITCODE -ne 0 -and $retryCount -lt $maxRetries)

if ($retryCount -ge $maxRetries) {
    Write-Host "❌ MySQL tidak bisa diakses setelah $maxRetries percobaan" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MySQL siap" -ForegroundColor Green
Start-Sleep -Seconds 5

# Run migrations
Write-Host ""
Write-Host "🔄 Menjalankan migrasi database..." -ForegroundColor Yellow
docker compose -f docker/compose/prod.yml exec -T laravel php artisan migrate --force

# Check if we need to seed
Write-Host ""
Write-Host "🔍 Mengecek data..." -ForegroundColor Yellow
$usersCount = docker compose -f docker/compose/prod.yml exec -T laravel php artisan tinker --execute="echo App\Models\User::count();" 2>$null | Select-String -Pattern "^\d+$" | ForEach-Object { $_.Matches[0].Value }

if ([string]::IsNullOrEmpty($usersCount) -or $usersCount -eq "0") {
    Write-Host "🌱 Mengisi data awal (seeding)..." -ForegroundColor Yellow
    docker compose -f docker/compose/prod.yml exec -T laravel php artisan db:seed --force
} else {
    Write-Host "✅ Data sudah ada ($usersCount users)" -ForegroundColor Green
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
