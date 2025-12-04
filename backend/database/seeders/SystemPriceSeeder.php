<?php

namespace Database\Seeders;

use App\Models\SystemPrice;
use Illuminate\Database\Seeder;

class SystemPriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create initial system price with PLN base rate
        SystemPrice::create([
            'base_price' => 1444.70,
            'multiplier' => 1.0,
            'final_price' => 1444.70,
            'supply_kwh' => 0,
            'demand_kwh' => 0,
            'supply_demand_ratio' => null,
            'market_condition' => 'balanced',
            'is_active' => true,
            'effective_from' => now(),
        ]);
    }
}
