<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SolarPanel extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'capacity_kwh',
        'current_output',
        'efficiency',
        'brand',
        'model',
        'status',
        'installed_at',
    ];

    protected $casts = [
        'capacity_kwh' => 'decimal:2',
        'current_output' => 'decimal:2',
        'efficiency' => 'decimal:2',
        'installed_at' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function energyProductions(): HasMany
    {
        return $this->hasMany(EnergyProduction::class);
    }
}
