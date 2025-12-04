<?php

namespace Database\Seeders;

use App\Models\SolarPanel;
use App\Models\User;
use Illuminate\Database\Seeder;

class SolarPanelSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();

        foreach ($users as $user) {
            SolarPanel::create([
                'user_id' => $user->id,
                'capacity_kwh' => fake()->randomFloat(2, 3, 10), // 3-10 kWh
                'current_output' => fake()->randomFloat(2, 0, 5),
                'efficiency' => fake()->randomFloat(2, 75, 95), // 75-95%
                'brand' => fake()->randomElement(['SunPower', 'LG', 'Panasonic', 'JinkoSolar', 'Canadian Solar']),
                'model' => fake()->bothify('SP-####??'),
                'status' => 'active',
                'installed_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
    }
}
