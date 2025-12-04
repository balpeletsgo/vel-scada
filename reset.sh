#!/bin/bash

# ============================================
# Vel-SCADA - Reset Script (Linux/Mac)
# ============================================

echo ""
echo "🔄 =================================="
echo "   Reset Vel-SCADA"
echo "=================================="
echo ""
echo "⚠️  PERINGATAN: Semua data akan dihapus!"
echo ""
read -p "Yakin ingin melanjutkan? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Dibatalkan"
    exit 1
fi

cd "$(dirname "$0")"

echo ""
echo "🛑 Menghentikan services..."
docker compose -f docker/compose/prod.yml down -v

echo ""
echo "🗑️  Menghapus data lama..."
docker volume rm compose_mysql-data compose_redis-data 2>/dev/null || true

echo ""
echo "📦 Memulai ulang services..."
docker compose -f docker/compose/prod.yml up -d --build

echo ""
echo "⏳ Menunggu database siap..."
sleep 15

echo ""
echo "🔄 Menyiapkan database baru..."
docker compose -f docker/compose/prod.yml exec -T laravel php artisan migrate:fresh --seed --force

echo ""
echo "✅ =================================="
echo "   Reset berhasil!"
echo "=================================="
echo ""
echo "🌐 Buka browser: http://localhost:8000"
echo ""
