<?php

namespace Database\Seeders;

use App\Models\EnergyConsumption;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class EnergyConsumptionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();
        $startDate = Carbon::now()->subDays(7);
        
        foreach ($users as $user) {
            // Base consumption varies per household
            $baseConsumption = fake()->randomFloat(2, 0.5, 2); // kW
            
            // Generate readings every 10 minutes for last 7 days
            for ($minutes = 0; $minutes < 7 * 24 * 60; $minutes += 10) {
                $timestamp = $startDate->copy()->addMinutes($minutes);
                $hour = $timestamp->hour;
                
                // Consumption pattern based on time of day
                $timeFactor = 1.0;
                if ($hour >= 6 && $hour <= 8) $timeFactor = 1.5; // Morning rush
                if ($hour >= 12 && $hour <= 14) $timeFactor = 1.2; // Lunch
                if ($hour >= 17 && $hour <= 22) $timeFactor = 2.0; // Evening peak
                if ($hour >= 0 && $hour <= 5) $timeFactor = 0.3; // Night low
                
                $randomFactor = fake()->randomFloat(2, 0.8, 1.2);
                $power = $baseConsumption * $timeFactor * $randomFactor;
                $energy = $power * (10 / 60); // kWh for 10 minutes
                
                EnergyConsumption::create([
                    'user_id' => $user->id,
                    'timestamp' => $timestamp,
                    'power_consumed_kw' => $power,
                    'energy_consumed_kwh' => $energy,
                    'source' => fake()->randomElement(['grid', 'solar', 'battery']),
                ]);
            }
        }
    }
}
