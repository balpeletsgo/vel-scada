<?php

namespace Database\Seeders;

use App\Models\EnergyProduction;
use App\Models\SolarPanel;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class EnergyProductionSeeder extends Seeder
{
    public function run(): void
    {
        $panels = SolarPanel::all();
        $startDate = Carbon::now()->subDays(7);
        
        foreach ($panels as $panel) {
            // Generate readings every 10 minutes for last 7 days
            for ($minutes = 0; $minutes < 7 * 24 * 60; $minutes += 10) {
                $timestamp = $startDate->copy()->addMinutes($minutes);
                $hour = $timestamp->hour;
                
                // Solar production based on time of day (peak at noon)
                $sunlightFactor = 0;
                if ($hour >= 6 && $hour <= 18) {
                    // Bell curve peaking at noon
                    $sunlightFactor = sin(($hour - 6) * M_PI / 12);
                }
                
                // Weather variation
                $weatherFactor = fake()->randomFloat(2, 0.6, 1.0);
                
                $power = $panel->capacity_kw * $panel->efficiency * $sunlightFactor * $weatherFactor;
                $energy = $power * (10 / 60); // kWh for 10 minutes
                
                EnergyProduction::create([
                    'solar_panel_id' => $panel->id,
                    'timestamp' => $timestamp,
                    'power_output_kw' => max(0, $power),
                    'energy_produced_kwh' => max(0, $energy),
                    'irradiance' => $sunlightFactor * 1000 * $weatherFactor, // W/m²
                    'temperature' => fake()->randomFloat(1, 25, 45),
                ]);
            }
        }
    }
}
