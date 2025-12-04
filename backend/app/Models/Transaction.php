<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'tx_hash',
        'buyer_id',
        'seller_id',
        'energy_kwh',
        'price_per_kwh',
        'total_price',
        'seller_battery_before',
        'seller_battery_after',
        'buyer_battery_before',
        'buyer_battery_after',
        'status',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'energy_kwh' => 'decimal:4',
        'price_per_kwh' => 'decimal:2',
        'total_price' => 'decimal:2',
        'seller_battery_before' => 'decimal:4',
        'seller_battery_after' => 'decimal:4',
        'buyer_battery_before' => 'decimal:4',
        'buyer_battery_after' => 'decimal:4',
        'completed_at' => 'datetime',
    ];

    /**
     * Generate simulated blockchain transaction hash
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->tx_hash)) {
                $model->tx_hash = self::generateTxHash();
            }
        });
    }

    /**
     * Generate a fake Ethereum-like transaction hash
     * Format: 0x + 64 hex characters
     */
    public static function generateTxHash(): string
    {
        return '0x' . bin2hex(random_bytes(32));
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
