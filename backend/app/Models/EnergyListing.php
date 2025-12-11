<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyListing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'energy_kwh',
        'price_per_kwh',
        'total_price',
        'status',
        'buyer_id',
        'sold_at',
    ];

    protected $casts = [
        'energy_kwh' => 'decimal:4',
        'price_per_kwh' => 'decimal:2',
        'total_price' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    /**
     * Get the seller (user who created the listing)
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the buyer (user who purchased the listing)
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Scope: Get only available listings
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope: Get only sold listings
     */
    public function scopeSold($query)
    {
        return $query->where('status', 'sold');
    }

    /**
     * Mark listing as sold
     */
    public function markAsSold(int $buyerId): void
    {
        $this->update([
            'status' => 'sold',
            'buyer_id' => $buyerId,
            'sold_at' => now(),
        ]);
    }

    /**
     * Cancel listing
     */
    public function cancel(): void
    {
        $this->update([
            'status' => 'cancelled',
        ]);
    }
}
