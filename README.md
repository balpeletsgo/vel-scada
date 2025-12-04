# 🔋 Vel-SCADA - P2P Energy Trading Platform

Platform simulasi perdagangan energi peer-to-peer dengan sistem SCADA untuk monitoring real-time.

---

## 📋 Persyaratan

Pastikan sudah menginstall **Docker Desktop**:

| OS          | Download                                                 |
| ----------- | -------------------------------------------------------- |
| **Windows** | https://docs.docker.com/desktop/install/windows-install/ |
| **Linux**   | https://docs.docker.com/desktop/install/linux/           |
| **Mac**     | https://docs.docker.com/desktop/install/mac-install/     |

> ⚠️ **Windows**: Pastikan WSL2 sudah aktif. Ikuti panduan di link di atas.

---

## 🚀 Cara Menjalankan (1 Command!)

### **Linux / Mac**

Buka Terminal, masuk ke folder project, lalu jalankan:

```bash
./start.sh
```

### **Windows**

Buka PowerShell **sebagai Administrator**, masuk ke folder project, lalu jalankan:

```powershell
.\start.ps1
```

---

## 🌐 Akses Aplikasi

Setelah berhasil jalan, buka browser dan akses:

| Halaman               | URL                   |
| --------------------- | --------------------- |
| 🏠 **Aplikasi Utama** | http://localhost:8000 |
| 📊 **Database Admin** | http://localhost:8888 |

### Akun Demo

| Email                 | Password   |
| --------------------- | ---------- |
| `jhonest@example.com` | `password` |
| `ditod@example.com`   | `password` |
| `fadhli@example.com`  | `password` |

---

## 🛑 Cara Menghentikan

### **Linux / Mac**

```bash
./stop.sh
```

### **Windows**

```powershell
.\stop.ps1
```

---

## 🔄 Reset Data (Fresh Start)

Jika ingin menghapus semua data dan mulai dari awal:

### **Linux / Mac**

```bash
./reset.sh
```

### **Windows**

```powershell
.\reset.ps1
```

---

## ❓ Troubleshooting

### Docker tidak jalan?

1. Pastikan Docker Desktop sudah **running** (lihat icon di system tray)
2. Restart Docker Desktop
3. Restart komputer jika perlu

### Port sudah dipakai?

Jika muncul error "port already in use":

- Tutup aplikasi lain yang menggunakan port 8000, 8080, 3306, atau 6379
- Atau restart komputer

### Windows: Script tidak bisa jalan?

Jalankan perintah ini di PowerShell (Administrator) terlebih dahulu:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Mau lihat log/error?

```bash
# Linux/Mac
docker compose -f docker/compose/prod.yml logs -f

# Windows (PowerShell)
docker compose -f docker/compose/prod.yml logs -f
```

---

## 📱 Fitur Aplikasi

1. **Dashboard** - Monitoring energi real-time (Main Power, Battery, Solar)
2. **Transfer** - Transfer energi dari Battery ke Main Power
3. **Marketplace** - Jual beli energi dengan pengguna lain
4. **Transaction History** - Riwayat transaksi dengan blockchain hash
5. **Public Ledger** - Catatan transaksi publik (seperti blockchain)

---

## 🔧 Untuk Developer

Lihat dokumentasi teknis di [DEVELOPER.md](./DEVELOPER.md)

---

## 📄 Lisensi

MIT License - Bebas digunakan untuk keperluan edukasi.
