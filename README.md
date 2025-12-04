# 🔋 Vel-SCADA - P2P Energy Trading Platform

Platform simulasi perdagangan energi peer-to-peer dengan sistem SCADA untuk monitoring real-time.

---

## 📋 Persyaratan

Cukup install **Docker Desktop** saja:

| OS          | Download                                                 |
| ----------- | -------------------------------------------------------- |
| **Windows** | https://docs.docker.com/desktop/install/windows-install/ |
| **Linux**   | https://docs.docker.com/desktop/install/linux/           |
| **Mac**     | https://docs.docker.com/desktop/install/mac-install/     |

> ⚠️ **Windows**: Pastikan WSL2 sudah aktif saat install Docker Desktop.

---

## 🚀 Cara Menjalankan

### 1. Start (pertama kali butuh waktu ~5 menit)

```bash
docker compose -f docker/compose/prod.yml up -d --build
```

### 2. Setup Database (sekali saja)

```bash
# Tunggu 30 detik setelah start, lalu jalankan:
docker compose -f docker/compose/prod.yml exec laravel php artisan migrate --seed
```

### 3. Buka Aplikasi

🌐 **http://localhost:8000**

---

## 👤 Akun Demo

| Email                 | Password   |
| --------------------- | ---------- |
| `jhonest@example.com` | `password` |
| `dhafa@example.com`   | `password` |
| `fadhli@example.com`  | `password` |

---

## 🛑 Cara Menghentikan

```bash
docker compose -f docker/compose/prod.yml down
```

---

## 🔄 Reset Data (Fresh Start)

```bash
docker compose -f docker/compose/prod.yml down -v
docker compose -f docker/compose/prod.yml up -d --build
# Tunggu 30 detik, lalu:
docker compose -f docker/compose/prod.yml exec laravel php artisan migrate:fresh --seed
```

---

## 📱 Fitur Aplikasi

1. **Dashboard** - Monitoring energi real-time (Main Power, Battery, Solar)
2. **Transfer** - Transfer energi dari Battery ke Main Power
3. **Marketplace** - Jual beli energi dengan pengguna lain
4. **Transaction History** - Riwayat transaksi dengan blockchain hash
5. **Public Ledger** - Catatan transaksi publik (seperti blockchain)

---

## ❓ Troubleshooting

**Docker tidak jalan?**
- Pastikan Docker Desktop sudah running (lihat icon di system tray)

**Port sudah dipakai?**
- Tutup aplikasi yang pakai port 8000, 8080, 3306, atau 6379

**Mau lihat log?**
```bash
docker compose -f docker/compose/prod.yml logs -f
```

---

## 🔧 Untuk Developer

Lihat [DEVELOPER.md](./DEVELOPER.md)
