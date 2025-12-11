<?php

namespace App\Jobs;

use App\Events\SystemPriceUpdated;
use App\Models\EnergyListing;
use App\Models\SystemPrice;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SyncEnergyPriceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        $mlServiceUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');

        try {
            // Calculate supply (total available listings in marketplace)
            $totalSupply = EnergyListing::where('status', 'available')
                ->sum('energy_kwh');

            // Calculate demand (transactions in last 24 hours + baseline)
            $totalDemand = Transaction::where('status', 'completed')
                ->where('created_at', '>=', Carbon::now()->subHours(24))
                ->sum('energy_kwh');

            // Add baseline demand (10 kWh) to avoid zero demand scenario
            $totalDemand = max($totalDemand, 10);

            // Call ML service
            $response = Http::timeout(10)->post("{$mlServiceUrl}/price/calculate", [
                'total_supply_kwh' => (float) $totalSupply,
                'total_demand_kwh' => (float) $totalDemand,
            ]);

            if (!$response->successful()) {
                Log::error('ML Service error in job', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return;
            }

            $data = $response->json();

            if (!$data['success']) {
                Log::error('ML service returned error in job');
                return;
            }

            $priceData = $data['data'];

            // Deactivate previous prices
            SystemPrice::deactivateAll();

            // Create new price record
            $systemPrice = SystemPrice::create([
                'base_price' => $priceData['base_price'],
                'multiplier' => $priceData['multiplier'],
                'final_price' => $priceData['final_price'],
                'supply_kwh' => $priceData['supply_kwh'],
                'demand_kwh' => $priceData['demand_kwh'],
                'supply_demand_ratio' => $priceData['supply_demand_ratio'],
                'market_condition' => $priceData['market_condition'],
                'is_active' => true,
                'effective_from' => now(),
            ]);

            // Broadcast price update to all clients
            broadcast(new SystemPriceUpdated($systemPrice));

            Log::info('Energy price synced via job', [
                'final_price' => $priceData['final_price'],
                'market_condition' => $priceData['market_condition'],
                'supply' => $totalSupply,
                'demand' => $totalDemand,
            ]);

        } catch (\Exception $e) {
            Log::error('Energy price sync job failed', [
                'error' => $e->getMessage(),
            ]);
            throw $e; // Re-throw for retry
        }
    }
}
