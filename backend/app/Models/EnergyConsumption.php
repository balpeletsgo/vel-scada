<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyConsumption extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'consumed_kwh',
        'source_type',
        'recorded_at',
    ];

    protected $casts = [
        'consumed_kwh' => 'decimal:3',
        'recorded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
