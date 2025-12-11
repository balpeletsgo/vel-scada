<?php

namespace App\Console\Commands;

use App\Events\EnergyDataUpdated;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Console\Command;

class BroadcastSolarOutput extends Command
{
    protected $signature = 'broadcast:solar';
    protected $description = 'Broadcast solar panel output every minute (realtime display only, no DB log)';

    // Constants
    const SOLAR_OUTPUT_PER_HOUR = 0.37;     // kWh per jam
    const INTERVAL_SECONDS = 60;            // 1 minute

    public function handle(): void
    {
        $this->info("Starting solar output broadcast (every 1 minute)");
        $this->info("Solar: " . self::SOLAR_OUTPUT_PER_HOUR . " kWh/jam");
        $this->info("Press Ctrl+C to stop...\n");

        while (true) {
            $this->broadcastAllUsers();
            sleep(self::INTERVAL_SECONDS);
        }
    }

    private function broadcastAllUsers(): void
    {
        $users = User::with(['solarPanel', 'energyStorage'])->get();

        foreach ($users as $user) {
            if (!$user->solarPanel || !$user->energyStorage) {
                continue;
            }

            $data = $this->getSolarData($user);

            // Broadcast solar output
            event(new EnergyDataUpdated($user->id, $data));

            // Log to database for persistent history
            if ($data['solar_output'] > 0) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'type' => 'solar',
                    'action' => 'generation',
                    'description' => sprintf(
                        'Solar panel generated %.4f kWh (%.2f kWh/hour)',
                        $data['solar_output'],
                        $data['solar_output_per_hour']
                    ),
                    'metadata' => [
                        'solar_output' => $data['solar_output'],
                        'solar_output_per_hour' => $data['solar_output_per_hour'],
                        'battery_level' => $data['battery_level'],
                        'battery_status' => $data['battery_status'],
                    ],
                    'logged_at' => now(),
                ]);
            }

            $this->line(sprintf(
                "[%s] %s: Solar %.4f kWh/jam",
                now()->format('H:i:s'),
                $user->name,
                $data['solar_output_per_hour']
            ));
        }
    }

    private function getSolarData(User $user): array
    {
        $hour = (int) now()->format('H');
        $panel = $user->solarPanel;
        $battery = $user->energyStorage;

        // Per 1 minute values
        $intervalFactor = self::INTERVAL_SECONDS / 3600; // 60/3600 = 0.0167

        // === SOLAR GENERATION (only 06:00 - 18:00) ===
        // TODO: Uncomment this for production
        // $solarGenerated = 0;
        // $solarPerHour = 0;
        // if ($hour >= 6 && $hour <= 18) {
        //     $solarGenerated = self::SOLAR_OUTPUT_PER_HOUR * $intervalFactor;
        //     $solarPerHour = self::SOLAR_OUTPUT_PER_HOUR;
        // }

        // DEBUG: Solar always active (remove this for production)
        $solarGenerated = self::SOLAR_OUTPUT_PER_HOUR * $intervalFactor;
        $solarPerHour = self::SOLAR_OUTPUT_PER_HOUR;

        // Return only display data (no state changes)
        return [
            'type' => 'solar_update',
            'solar_output' => round($solarGenerated, 4),           // Per interval (1 min)
            'solar_output_per_hour' => round($solarPerHour, 4),   // Per hour
            'battery_level' => round((float) $battery->current_kwh, 4),
            'battery_status' => $battery->status,
            'main_power' => round((float) $user->main_power_kwh, 4),
            'timestamp' => now()->toISOString(),
        ];
    }
}
