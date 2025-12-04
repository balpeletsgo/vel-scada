<?php

namespace App\Events;

use App\Models\SystemPrice;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SystemPriceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $priceData;

    public function __construct(SystemPrice $systemPrice)
    {
        $this->priceData = [
            'base_price' => (float) $systemPrice->base_price,
            'multiplier' => (float) $systemPrice->multiplier,
            'final_price' => (float) $systemPrice->final_price,
            'supply_kwh' => (float) $systemPrice->supply_kwh,
            'demand_kwh' => (float) $systemPrice->demand_kwh,
            'market_condition' => $systemPrice->market_condition,
            'effective_from' => $systemPrice->effective_from->format('d M Y H:i'),
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('system-price'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'price.updated';
    }
}
