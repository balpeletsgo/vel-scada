<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EnergyDataUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public array $data
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('energy.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'energy.updated';
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
