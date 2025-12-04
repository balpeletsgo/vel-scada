<?php

namespace Database\Seeders;

use App\Models\EnergyStorage;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnergyStorageSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();

        foreach ($users as $user) {
            $maxCapacity = fake()->randomFloat(2, 5, 15); // 5-15 kWh
            EnergyStorage::create([
                'user_id' => $user->id,
                'max_capacity' => $maxCapacity,
                'current_kwh' => fake()->randomFloat(2, 0, $maxCapacity),
                'min_threshold' => fake()->randomFloat(2, 1, 3),
                'battery_health' => fake()->randomFloat(2, 80, 100),
            ]);
        }
    }
}
