# 🔧 Vel-SCADA - Developer Documentation

Dokumentasi teknis untuk pengembang.

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (Port 8000)                        │
│                      Reverse Proxy + Static                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌───────────────┐
│    Laravel    │       │     Reverb      │       │  ML Service   │
│   PHP-FPM     │       │   WebSocket     │       │   FastAPI     │
│  (Port 9000)  │       │  (Port 8080)    │       │  (Port 8001)  │
└───────────────┘       └─────────────────┘       └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌───────────────┐
│     MySQL     │       │     Redis       │       │   Simulator   │
│  (Port 3306)  │       │  (Port 6379)    │       │   (artisan)   │
└───────────────┘       └─────────────────┘       └───────────────┘
```

---

## 🛠️ Tech Stack

| Layer                | Technology                         |
| -------------------- | ---------------------------------- |
| **Frontend**         | React 18 + TypeScript + Inertia.js |
| **UI Components**    | shadcn/ui + Tailwind CSS           |
| **Backend**          | Laravel 11 + PHP 8.4               |
| **Database**         | MySQL 8.0                          |
| **Cache/Queue**      | Redis 7                            |
| **WebSocket**        | Laravel Reverb                     |
| **ML Service**       | Python 3.11 + FastAPI              |
| **Containerization** | Docker + Docker Compose            |

---

## 📁 Struktur Project

```
vel-scada/
├── backend/                 # Laravel Application
│   ├── app/
│   │   ├── Console/Commands/   # Artisan Commands (Simulator)
│   │   ├── Events/             # WebSocket Events
│   │   ├── Http/Controllers/   # API Controllers
│   │   └── Models/             # Eloquent Models
│   ├── resources/js/           # React Frontend
│   │   ├── Pages/              # Inertia Pages
│   │   ├── components/         # UI Components
│   │   ├── hooks/              # Custom Hooks
│   │   └── Layouts/            # Layout Components
│   └── routes/                 # API & Web Routes
├── ml-service/              # Python ML Service
│   └── app/
│       └── main.py             # FastAPI Application
├── docker/
│   ├── compose/
│   │   ├── dev.yml             # Development Compose
│   │   └── prod.yml            # Production Compose
│   └── nginx/
│       └── default.conf        # Nginx Configuration
└── start.sh / start.ps1     # One-click Scripts
```

---

## 🚀 Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (untuk development)
- PHP 8.4+ (opsional, untuk local dev)

### Quick Start (Dev Mode)

```bash
# Clone repository
git clone <repo-url>
cd vel-scada

# Start with hot-reload
docker compose -f docker/compose/dev.yml up -d

# Access
# App: http://localhost:8000
# Vite: http://localhost:5173 (hot-reload)
```

### Production Mode

```bash
# Build dan start
docker compose -f docker/compose/prod.yml up -d --build

# Fresh database
docker compose -f docker/compose/prod.yml exec laravel php artisan migrate:fresh --seed
```

---

## 🔑 Environment Variables

### Laravel (.env)

```env
APP_KEY=base64:xxxx                    # Generate: php artisan key:generate
DB_CONNECTION=mysql
DB_HOST=mysql
DB_DATABASE=vel_scada
DB_USERNAME=vel_scada_user
DB_PASSWORD=secret

REDIS_HOST=redis
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=vel-scada
REVERB_APP_KEY=vel-scada-key
REVERB_APP_SECRET=vel-scada-secret
REVERB_HOST=reverb
REVERB_PORT=8080

ML_SERVICE_URL=http://ml-service:8001
```

---

## 📊 Database Schema

### Core Tables

| Table             | Description                    |
| ----------------- | ------------------------------ |
| `users`           | User accounts (prosumers)      |
| `energy_storages` | Battery & Main Power storage   |
| `solar_panels`    | Solar panel configurations     |
| `transactions`    | P2P trading transactions       |
| `energy_prices`   | Market listings (stock system) |
| `system_prices`   | Base price (PLN tariff)        |

### Key Relationships

```
User
 ├── EnergyStorage (battery, main_power)
 ├── SolarPanel
 ├── Transactions (as buyer/seller)
 └── EnergyPrice (market listing)
```

---

## 🔄 Real-time Features

### WebSocket Channels

```typescript
// Private channel for user energy data
Echo.private(`energy.${userId}`).listen("EnergyDataUpdated", (data) => {
	// Update dashboard in real-time
});
```

### Event: EnergyDataUpdated

```php
// Broadcast every 10 minutes by Simulator
broadcast(new EnergyDataUpdated([
    'userId' => $user->id,
    'mainPower' => $storage->main_power_kwh,
    'battery' => $storage->battery_kwh,
    'solarProduction' => $solarGenerated,
    'consumption' => $consumption,
    'timestamp' => now(),
]));
```

---

## 🧠 ML Price Algorithm

### Endpoint

```
POST http://ml-service:8001/predict
```

### Request

```json
{
	"base_price": 1444.7,
	"supply": 150.5,
	"demand": 200.0,
	"time_of_day": 14,
	"day_of_week": 2
}
```

### Response

```json
{
	"predicted_price": 1589.17,
	"price_multiplier": 1.1,
	"market_condition": "high_demand"
}
```

### Price Formula

```
Price Multiplier = f(supply, demand, time, day)

When demand > supply: multiplier increases (max 1.5x)
When supply > demand: multiplier decreases (min 0.7x)
Peak hours (17-21): +10% adjustment
Weekends: -5% adjustment

Final Price = Base Price × Price Multiplier
```

---

## 🔧 Useful Commands

### Artisan

```bash
# Run simulator manually
php artisan simulate:energy

# Sync price from ML
php artisan energy:sync-price

# Clear cache
php artisan cache:clear
php artisan config:clear
```

### Docker

```bash
# View logs
docker compose -f docker/compose/prod.yml logs -f [service]

# Shell access
docker compose -f docker/compose/prod.yml exec laravel bash

# Database access
docker compose -f docker/compose/prod.yml exec mysql mysql -u vel_scada_user -p vel_scada
```

---

## 🧪 Testing

```bash
# Run PHP tests
docker compose -f docker/compose/prod.yml exec laravel php artisan test

# Run frontend type check
cd backend && npm run type-check
```

---

## 📝 API Endpoints

### Dashboard

| Method | Endpoint     | Description                     |
| ------ | ------------ | ------------------------------- |
| GET    | `/dashboard` | Main dashboard with energy data |

### Transfer

| Method | Endpoint    | Description                           |
| ------ | ----------- | ------------------------------------- |
| GET    | `/transfer` | Transfer page                         |
| POST   | `/transfer` | Execute battery → main power transfer |

### Marketplace

| Method | Endpoint                      | Description            |
| ------ | ----------------------------- | ---------------------- |
| GET    | `/marketplace`                | Market listings        |
| POST   | `/marketplace/add-stock`      | Add energy to sell     |
| POST   | `/marketplace/buy`            | Buy energy from seller |
| POST   | `/marketplace/toggle-selling` | Enable/disable selling |

### Transactions

| Method | Endpoint                   | Description                      |
| ------ | -------------------------- | -------------------------------- |
| GET    | `/transactions`            | User transaction history         |
| GET    | `/api/public-transactions` | Public ledger (all transactions) |

---

## 🔐 Authentication

Using Laravel Breeze with Inertia.js React stack.

- Session-based authentication
- CSRF protection
- Email verification (optional)

---

## 📄 License

MIT License
