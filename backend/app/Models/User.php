<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'main_power_kwh',
        'wallet_balance',
        'wallet_address',
        'address',
        'phone',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'main_power_kwh' => 'decimal:4',
            'wallet_balance' => 'decimal:2',
        ];
    }

    // ==================
    // Relationships
    // ==================

    public function solarPanel(): HasOne
    {
        return $this->hasOne(SolarPanel::class);
    }

    public function energyStorage(): HasOne
    {
        return $this->hasOne(EnergyStorage::class);
    }

    public function energyPrice(): HasOne
    {
        return $this->hasOne(EnergyPrice::class)->latestOfMany();
    }

    public function energyPrices(): HasMany
    {
        return $this->hasMany(EnergyPrice::class);
    }

    public function energyProductions(): HasMany
    {
        return $this->hasMany(EnergyProduction::class);
    }

    public function energyConsumptions(): HasMany
    {
        return $this->hasMany(EnergyConsumption::class);
    }

    public function buyTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'buyer_id');
    }

    public function sellTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'seller_id');
    }

    public function scadaDevices(): HasMany
    {
        return $this->hasMany(ScadaDevice::class);
    }

    public function scadaReadings(): HasMany
    {
        return $this->hasMany(ScadaReading::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function priceForecasts(): HasMany
    {
        return $this->hasMany(PriceForecast::class);
    }
}
