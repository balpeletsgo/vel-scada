<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyStorageLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'energy_storage_id',
        'battery_kwh',
        'main_power_kwh',
        'solar_output',
        'action',
        'recorded_at',
    ];

    protected $casts = [
        'battery_kwh' => 'decimal:4',
        'main_power_kwh' => 'decimal:4',
        'solar_output' => 'decimal:6',
        'recorded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function energyStorage(): BelongsTo
    {
        return $this->belongsTo(EnergyStorage::class);
    }
}
