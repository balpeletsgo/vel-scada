#!/bin/bash

# ============================================
# Vel-SCADA - Stop Script (Linux/Mac)
# ============================================

echo ""
echo "🛑 Menghentikan Vel-SCADA..."
echo ""

cd "$(dirname "$0")"

docker compose -f docker/compose/prod.yml down

echo ""
echo "✅ Vel-SCADA berhasil dihentikan"
echo ""
