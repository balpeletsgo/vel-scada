#!/bin/bash

# ============================================
# Vel-SCADA - Start Script (Linux/Mac)
# ============================================

set -e

echo ""
echo "🔋 =================================="
echo "   Vel-SCADA P2P Energy Trading"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker tidak berjalan!"
    echo ""
    echo "Silakan:"
    echo "1. Buka Docker Desktop"
    echo "2. Tunggu sampai Docker ready"
    echo "3. Jalankan script ini lagi"
    echo ""
    exit 1
fi

echo "✅ Docker sudah berjalan"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

echo "📦 Memulai semua services..."
echo "   (Ini mungkin butuh beberapa menit untuk pertama kali)"
echo ""

# Start containers
docker compose -f docker/compose/prod.yml up -d --build

# Wait for MySQL to be ready
echo ""
echo "⏳ Menunggu database siap..."
sleep 10

# Check if database needs migration
echo "🔄 Menyiapkan database..."
docker compose -f docker/compose/prod.yml exec -T laravel php artisan migrate --force 2>/dev/null || true

# Check if we need to seed
USERS_COUNT=$(docker compose -f docker/compose/prod.yml exec -T laravel php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tr -d '[:space:]' || echo "0")

if [ "$USERS_COUNT" = "0" ] || [ -z "$USERS_COUNT" ]; then
    echo "🌱 Mengisi data awal..."
    docker compose -f docker/compose/prod.yml exec -T laravel php artisan db:seed --force 2>/dev/null || true
fi

echo ""
echo "✅ =================================="
echo "   Vel-SCADA berhasil dijalankan!"
echo "=================================="
echo ""
echo "🌐 Buka browser dan akses:"
echo ""
echo "   Aplikasi : http://localhost:8000"
echo "   Database : http://localhost:8888"
echo ""
echo "👤 Akun Demo:"
echo "   Email    : jhonest@example.com"
echo "   Password : password"
echo ""
echo "🛑 Untuk menghentikan, jalankan: ./stop.sh"
echo ""
