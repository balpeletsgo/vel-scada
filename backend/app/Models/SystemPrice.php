<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'base_price',
        'multiplier',
        'final_price',
        'supply_kwh',
        'demand_kwh',
        'supply_demand_ratio',
        'market_condition',
        'is_active',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'multiplier' => 'decimal:4',
        'final_price' => 'decimal:2',
        'supply_kwh' => 'decimal:2',
        'demand_kwh' => 'decimal:2',
        'supply_demand_ratio' => 'decimal:4',
        'is_active' => 'boolean',
        'effective_from' => 'datetime',
        'effective_until' => 'datetime',
    ];

    /**
     * Get the current active price
     */
    public static function current(): ?self
    {
        return self::where('is_active', true)
            ->orderBy('effective_from', 'desc')
            ->first();
    }

    /**
     * Get current price per kWh or default PLN price
     */
    public static function currentPrice(): float
    {
        $current = self::current();
        return $current ? (float) $current->final_price : 1444.70;
    }

    /**
     * Deactivate all previous prices
     */
    public static function deactivateAll(): void
    {
        self::where('is_active', true)->update([
            'is_active' => false,
            'effective_until' => now(),
        ]);
    }
}
