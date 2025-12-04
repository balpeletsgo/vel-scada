<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'price_per_kwh',
        'stock_kwh',
        'is_selling',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'price_per_kwh' => 'decimal:2',
        'stock_kwh' => 'decimal:4',
        'is_selling' => 'boolean',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_selling', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_selling', true)
            ->where(function ($q) {
                $q->whereNull('valid_until')
                    ->orWhere('valid_until', '>', now());
            });
    }
}
