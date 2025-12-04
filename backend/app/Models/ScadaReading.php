<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScadaReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'scada_device_id',
        'voltage',
        'current',
        'active_power',
        'reactive_power',
        'power_factor',
        'frequency',
        'energy_import',
        'energy_export',
        'grid_status',
        'recorded_at',
    ];

    protected $casts = [
        'voltage' => 'decimal:2',
        'current' => 'decimal:3',
        'active_power' => 'decimal:2',
        'reactive_power' => 'decimal:2',
        'power_factor' => 'decimal:3',
        'frequency' => 'decimal:2',
        'energy_import' => 'decimal:3',
        'energy_export' => 'decimal:3',
        'recorded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(ScadaDevice::class, 'scada_device_id');
    }
}
