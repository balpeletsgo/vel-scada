<?php

namespace Database\Seeders;

use App\Models\EnergyPrice;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class EnergyPriceSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();

        foreach ($users as $user) {
            // Get user's battery to determine available stock
            $battery = $user->energyStorage;
            $maxStock = $battery ? $battery->current_kwh * 0.5 : 0; // Max 50% of battery for sale
            $stockKwh = $maxStock > 0 ? fake()->randomFloat(2, 1, $maxStock) : 0;

            // If user is selling, reduce their battery by stock amount
            if ($stockKwh > 0 && $battery) {
                $battery->current_kwh -= $stockKwh;
                $battery->save();
            }

            EnergyPrice::create([
                'user_id' => $user->id,
                'price_per_kwh' => fake()->randomFloat(2, 1200, 1800), // IDR per kWh
                'stock_kwh' => $stockKwh,
                'is_selling' => $stockKwh > 0, // Only selling if has stock
                'valid_from' => now(),
                'valid_until' => now()->addDays(30),
            ]);
        }
    }
}
