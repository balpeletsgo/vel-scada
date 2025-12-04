<?php

namespace Database\Seeders;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();
        $userIds = $users->pluck('id')->toArray();
        
        // Generate 100 random P2P transactions
        for ($i = 0; $i < 100; $i++) {
            $seller = fake()->randomElement($userIds);
            $buyer = fake()->randomElement(array_diff($userIds, [$seller]));
            
            $energyAmount = fake()->randomFloat(3, 0.5, 10); // 0.5-10 kWh
            $pricePerKwh = fake()->randomFloat(2, 1200, 1800);
            $totalPrice = $energyAmount * $pricePerKwh;
            
            $timestamp = Carbon::now()->subDays(fake()->numberBetween(0, 30));
            $status = fake()->randomElement(['completed', 'completed', 'completed', 'pending', 'failed']);
            
            Transaction::create([
                'transaction_code' => 'TRX-' . strtoupper(fake()->unique()->bothify('####????')),
                'seller_id' => $seller,
                'buyer_id' => $buyer,
                'energy_amount_kwh' => $energyAmount,
                'price_per_kwh' => $pricePerKwh,
                'total_price' => $totalPrice,
                'tx_hash' => '0x' . fake()->sha256(),
                'smart_contract_address' => '0x' . fake()->sha256(),
                'status' => $status,
                'confirmed_at' => $status === 'completed' ? $timestamp : null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }
}
