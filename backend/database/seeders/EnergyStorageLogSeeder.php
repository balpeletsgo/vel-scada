<?php

namespace Database\Seeders;

use App\Models\EnergyStorage;
use App\Models\EnergyStorageLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnergyStorageLogSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();

        foreach ($users as $user) {
            $energyStorage = EnergyStorage::where('user_id', $user->id)->first();

            if (!$energyStorage) {
                continue;
            }

            // Generate 10 initial log entries (history for chart)
            $batteryKwh = $energyStorage->current_kwh;
            $mainPowerKwh = $user->main_power_kwh ?? 66;
            $now = now();

            for ($i = 9; $i >= 0; $i--) {
                $recordedAt = $now->copy()->subMinutes($i * 10);

                // Simulate solar charging during the day
                $solarOutput = rand(5, 8) / 100; // 0.05 - 0.08 kWh per 10 min
                $consumption = 0.046; // Fixed consumption rate

                // Calculate values at this point in history
                $historicalBattery = max(0, $batteryKwh - ($solarOutput * (9 - $i)));
                $historicalMainPower = max(0, $mainPowerKwh + ($consumption * (9 - $i)));

                EnergyStorageLog::create([
                    'user_id' => $user->id,
                    'energy_storage_id' => $energyStorage->id,
                    'battery_kwh' => round($historicalBattery, 4),
                    'main_power_kwh' => round($historicalMainPower, 4),
                    'solar_output' => round($solarOutput, 4),
                    'action' => 'charging',
                    'recorded_at' => $recordedAt,
                ]);
            }
        }
    }
}
