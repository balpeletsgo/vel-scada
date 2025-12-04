<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceForecast extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'predicted_price',
        'actual_price',
        'forecast_date',
        'forecast_hour',
        'confidence_level',
        'model_version',
        'features_used',
    ];

    protected $casts = [
        'predicted_price' => 'decimal:2',
        'actual_price' => 'decimal:2',
        'forecast_date' => 'date',
        'confidence_level' => 'decimal:2',
        'features_used' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
