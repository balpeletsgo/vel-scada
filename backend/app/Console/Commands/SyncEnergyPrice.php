<?php

namespace App\Console\Commands;

use App\Models\EnergyPrice;
use App\Models\SystemPrice;
use App\Models\Transaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SyncEnergyPrice extends Command
{
    protected $signature = 'energy:sync-price {--force : Force sync even if recently synced}';

    protected $description = 'Sync energy price from ML service based on supply/demand';

    private string $mlServiceUrl;

    public function __construct()
    {
        parent::__construct();
        $this->mlServiceUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
    }

    public function handle(): int
    {
        $this->info('Starting energy price sync...');

        try {
            // Calculate supply (total stock available for sale)
            $totalSupply = EnergyPrice::where('is_selling', true)
                ->where('stock_kwh', '>', 0)
                ->sum('stock_kwh');

            // Calculate demand (transactions in last 24 hours)
            $totalDemand = Transaction::where('status', 'completed')
                ->where('created_at', '>=', Carbon::now()->subHours(24))
                ->sum('energy_kwh');

            $this->info("Supply: {$totalSupply} kWh");
            $this->info("Demand (24h): {$totalDemand} kWh");

            // Call ML service
            $response = Http::timeout(10)->post("{$this->mlServiceUrl}/price/calculate", [
                'total_supply_kwh' => (float) $totalSupply,
                'total_demand_kwh' => (float) $totalDemand,
            ]);

            if (!$response->successful()) {
                $this->error('Failed to get price from ML service');
                Log::error('ML Service error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return Command::FAILURE;
            }

            $data = $response->json();

            if (!$data['success']) {
                $this->error('ML service returned error');
                return Command::FAILURE;
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

            $this->info("Price updated successfully!");
            $this->table(
                ['Field', 'Value'],
                [
                    ['Base Price', 'Rp ' . number_format($priceData['base_price'], 2)],
                    ['Multiplier', $priceData['multiplier'] . 'x'],
                    ['Final Price', 'Rp ' . number_format($priceData['final_price'], 2)],
                    ['Market Condition', $priceData['market_condition']],
                ]
            );

            Log::info('Energy price synced', [
                'system_price_id' => $systemPrice->id,
                'final_price' => $priceData['final_price'],
                'market_condition' => $priceData['market_condition'],
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Error: {$e->getMessage()}");
            Log::error('Energy price sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }
}
