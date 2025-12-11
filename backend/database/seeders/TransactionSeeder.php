<?php

namespace Database\Seeders;

use App\Models\Transaction;
use App\Models\User;
use App\Models\EnergyStorage;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        if ($users->count() < 2) {
            $this->command->warn('Skipping TransactionSeeder: Need at least 2 users');
            return;
        }

        // Create 10-15 historical transactions (last 24 hours)
        $transactionsCount = rand(10, 15);

        for ($i = 0; $i < $transactionsCount; $i++) {
            // Random seller and buyer
            $seller = $users->random();
            $buyer = $users->where('id', '!=', $seller->id)->random();

            $sellerBattery = EnergyStorage::where('user_id', $seller->id)->first();
            $buyerBattery = EnergyStorage::where('user_id', $buyer->id)->first();

            if (!$sellerBattery || !$buyerBattery) {
                continue;
            }

            // Random energy amount (3-15 kWh)
            $energyKwh = [3, 5, 7.5, 10, 12.5, 15][array_rand([3, 5, 7.5, 10, 12.5, 15])];

            // Random price from historical range (1300-1600)
            $pricePerKwh = rand(1300, 1600);
            $totalPrice = $energyKwh * $pricePerKwh;

            // Create transaction with timestamp in last 24 hours
            Transaction::create([
                'seller_id' => $seller->id,
                'buyer_id' => $buyer->id,
                'energy_kwh' => $energyKwh,
                'price_per_kwh' => $pricePerKwh,
                'total_price' => $totalPrice,
                'seller_battery_before' => $sellerBattery->current_kwh,
                'seller_battery_after' => $sellerBattery->current_kwh,
                'buyer_battery_before' => $buyerBattery->current_kwh,
                'buyer_battery_after' => $buyerBattery->current_kwh,
                'status' => 'completed',
                'completed_at' => Carbon::now()->subMinutes(rand(30, 1440)), // Random within last 24h
                'created_at' => Carbon::now()->subMinutes(rand(30, 1440)),
                'updated_at' => Carbon::now()->subMinutes(rand(30, 1440)),
            ]);
        }

        $totalTransactions = Transaction::where('status', 'completed')->count();
        $totalVolume = Transaction::where('status', 'completed')->sum('energy_kwh');

        $this->command->info("Created {$totalTransactions} historical transactions");
        $this->command->info("Total volume: {$totalVolume} kWh");
    }
}
