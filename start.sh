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

# Wait until MySQL is ready to accept connections
until docker compose -f docker/compose/prod.yml exec -T mysql mysqladmin ping -h localhost -u vel_scada_user -psecret --silent 2>/dev/null; do
    echo "   MySQL belum siap, menunggu..."
    sleep 3
done
echo "✅ MySQL siap"

# Wait a bit more for Laravel to be ready
sleep 5

# Run migrations
echo ""
echo "🔄 Menjalankan migrasi database..."
docker compose -f docker/compose/prod.yml exec -T laravel php artisan migrate --force

# Check if we need to seed
echo ""
echo "🔍 Mengecek data..."
USERS_COUNT=$(docker compose -f docker/compose/prod.yml exec -T laravel php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | grep -E '^[0-9]+$' | head -1 || echo "0")

if [ "$USERS_COUNT" = "0" ] || [ -z "$USERS_COUNT" ]; then
    echo "🌱 Mengisi data awal (seeding)..."
    docker compose -f docker/compose/prod.yml exec -T laravel php artisan db:seed --force
else
    echo "✅ Data sudah ada ($USERS_COUNT users)"
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
