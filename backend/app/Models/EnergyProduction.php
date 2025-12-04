<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyProduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'solar_panel_id',
        'produced_kwh',
        'weather_condition',
        'temperature',
        'recorded_at',
    ];

    protected $casts = [
        'produced_kwh' => 'decimal:3',
        'temperature' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function solarPanel(): BelongsTo
    {
        return $this->belongsTo(SolarPanel::class);
    }
}
