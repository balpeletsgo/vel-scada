<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyStorage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_kwh',
        'max_capacity',
        'min_threshold',
        'battery_health',
    ];

    protected $casts = [
        'current_kwh' => 'decimal:2',
        'max_capacity' => 'decimal:2',
        'min_threshold' => 'decimal:2',
        'battery_health' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getPercentageAttribute(): float
    {
        if ($this->max_capacity == 0) return 0;
        return round(($this->current_kwh / $this->max_capacity) * 100, 1);
    }
}
