<?php

namespace App\Console\Commands;

use App\Events\EnergyDataUpdated;
use App\Models\User;
use App\Models\EnergyProduction;
use App\Models\EnergyConsumption;
use App\Models\ScadaReading;
use Illuminate\Console\Command;

class SimulateEnergyData extends Command
{
    protected $signature = 'simulate:energy';
    protected $description = 'Simulate real-time energy data (every 10 minutes)';

    // Constants
    const SOLAR_OUTPUT_PER_HOUR = 0.37;     // kWh per jam
    const CONSUMPTION_PER_HOUR = 0.275;      // kWh per jam (66 kWh / 10 hari / 24 jam)
    const INTERVAL_SECONDS = 600;            // 10 minutes

    public function handle(): void
    {
        $this->info("Starting energy simulation (every 10 minutes)");
        $this->info("Solar: " . self::SOLAR_OUTPUT_PER_HOUR . " kWh/jam");
        $this->info("Consumption: " . self::CONSUMPTION_PER_HOUR . " kWh/jam");
        $this->info("Press Ctrl+C to stop...\n");

        while (true) {
            $this->simulateAllUsers();
            sleep(self::INTERVAL_SECONDS);
        }
    }

    private function simulateAllUsers(): void
    {
        $users = User::with(['solarPanel', 'energyStorage', 'scadaDevices'])->get();

        foreach ($users as $user) {
            if (!$user->solarPanel || !$user->energyStorage) {
                continue;
            }

            $data = $this->processUserEnergy($user);

            event(new EnergyDataUpdated($user->id, $data));

            $this->line(sprintf(
                "[%s] %s: Solar +%.4f | Consumption -%.4f | Battery %.2f/100 | Main %.2f kWh",
                now()->format('H:i:s'),
                $user->name,
                $data['solar_output'],
                $data['consumption'],
                $data['battery_level'],
                $data['main_power']
            ));
        }
    }

    private function processUserEnergy(User $user): array
    {
        $hour = (int) now()->format('H');
        $panel = $user->solarPanel;
        $battery = $user->energyStorage;
        $now = now();

        // Per 60 seconds values
        $intervalFactor = self::INTERVAL_SECONDS / 3600; // 60/3600 = 0.0167

        // === SOLAR GENERATION (only 06:00 - 18:00) ===
        $solarGenerated = 0;
        if ($hour >= 6 && $hour <= 18) {
            $solarGenerated = self::SOLAR_OUTPUT_PER_HOUR * $intervalFactor; // 0.37 * 0.0167 = 0.00617 kWh
        }

        // Add solar to battery (max 100 kWh)
        $batteryKwh = (float) $battery->current_kwh;
        $maxCapacity = (float) $battery->max_capacity;

        if ($solarGenerated > 0) {
            $batteryKwh = min($maxCapacity, $batteryKwh + $solarGenerated);
        }

        // Update battery status
        $batteryStatus = $solarGenerated > 0 ? 'charging' : 'idle';

        $battery->update([
            'current_kwh' => round($batteryKwh, 4),
            'status' => $batteryStatus,
        ]);

        // Update solar panel output
        $panel->update([
            'current_output' => $solarGenerated > 0 ? self::SOLAR_OUTPUT_PER_HOUR : 0,
        ]);

        // === CONSUMPTION from Main Power ===
        $consumption = self::CONSUMPTION_PER_HOUR * $intervalFactor; // 0.275 * 0.0167 = 0.00458 kWh

        $mainPowerKwh = (float) $user->main_power_kwh;
        $mainPowerKwh = max(0, $mainPowerKwh - $consumption);

        $user->update([
            'main_power_kwh' => round($mainPowerKwh, 4),
        ]);

        // === SAVE TO DATABASE ===

        // Save production
        if ($solarGenerated > 0) {
            EnergyProduction::create([
                'solar_panel_id' => $panel->id,
                'produced_kwh' => round($solarGenerated, 6),
                'recorded_at' => $now,
            ]);
        }

        // Save consumption
        EnergyConsumption::create([
            'user_id' => $user->id,
            'consumed_kwh' => round($consumption, 6),
            'source_type' => 'grid', // Main power = grid
            'recorded_at' => $now,
        ]);

        // === SCADA READINGS ===
        $voltage = 220;
        $wattUsage = self::CONSUMPTION_PER_HOUR * 1000; // 275 Watt
        $current = round($wattUsage / $voltage, 2);

        if ($device = $user->scadaDevices->first()) {
            ScadaReading::create([
                'user_id' => $user->id,
                'scada_device_id' => $device->id,
                'voltage' => $voltage,
                'current' => $current,
                'active_power' => $wattUsage,
                'reactive_power' => round($wattUsage * 0.1, 2),
                'frequency' => 50.0,
                'power_factor' => 0.95,
                'grid_status' => 'connected',
                'recorded_at' => $now,
            ]);

            $device->update(['last_communication' => $now]);
        }

        return [
            'timestamp' => $now->toIso8601String(),
            'solar_output' => round($solarGenerated, 6),
            'solar_status' => $solarGenerated > 0 ? 'active' : 'inactive',
            'consumption' => round($consumption, 6),
            'battery_level' => round($batteryKwh, 4),
            'battery_capacity' => $maxCapacity,
            'battery_percentage' => round(($batteryKwh / $maxCapacity) * 100, 2),
            'battery_status' => $batteryStatus,
            'main_power' => round($mainPowerKwh, 4),
            'scada' => [
                'voltage' => $voltage,
                'current' => $current,
                'frequency' => 50.0,
                'power_factor' => 0.95,
                'power_watt' => $wattUsage,
            ],
        ];
    }
}
