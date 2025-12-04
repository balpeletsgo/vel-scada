<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SolarPanel;
use App\Models\EnergyStorage;
use App\Models\Wallet;
use App\Models\EnergyPrice;
use App\Models\ScadaDevice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create 10 Prosumer users
        $prosumers = [
            ['name' => 'Jhonest', 'email' => 'jones@example.com', 'address' => 'Jl. Merdeka No. 1, Jakarta'],
            ['name' => 'Dhafa Dito', 'email' => 'ditod@example.com', 'address' => 'Jl. Sudirman No. 25, Jakarta'],
            ['name' => 'Fadhli', 'email' => 'fadhli@example.com', 'address' => 'Jl. Gatot Subroto No. 10, Jakarta'],
        ];

        foreach ($prosumers as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'main_power_kwh' => 66, // Token listrik 10 hari
                'wallet_balance' => rand(500000, 5000000), // 500rb - 5jt IDR
                'address' => $data['address'],
                'phone' => '08' . rand(1000000000, 9999999999),
            ]);

            // 1 User = 1 Solar Panel (0.37 kWh per jam)
            SolarPanel::create([
                'user_id' => $user->id,
                'name' => "Solar Panel {$user->name}",
                'capacity_kwh' => 0.37, // 0.37 kWh per jam
                'current_output' => 0,
                'efficiency' => 100, // Sudah dihitung fix 0.37 kWh/jam
                'status' => 'active',
                'installation_date' => now()->subMonths(rand(1, 24)),
            ]);

            // 1 User = 1 Battery (100 kWh capacity, start 50 kWh)
            $batteryKwh = 50;
            $stockKwh = rand(5, 20); // Stock untuk dijual (diambil dari battery)

            EnergyStorage::create([
                'user_id' => $user->id,
                'name' => "Battery {$user->name}",
                'max_capacity' => 100,
                'current_kwh' => $batteryKwh - $stockKwh, // Battery dikurangi stock
                'status' => 'idle',
            ]);

            // 1 User = 1 Wallet
            Wallet::create([
                'user_id' => $user->id,
                'balance' => rand(100000, 500000),
                'currency' => 'IDR',
            ]);

            // 1 User = 1 Energy Price (with stock)
            EnergyPrice::create([
                'user_id' => $user->id,
                'price_per_kwh' => rand(1200, 1800),
                'stock_kwh' => $stockKwh,
                'is_selling' => true,
            ]);

            // 1 User = 1 SCADA Device
            ScadaDevice::create([
                'user_id' => $user->id,
                'device_id' => 'SCADA-' . strtoupper(substr(md5($user->id), 0, 8)),
                'device_name' => "SCADA {$user->name}",
                'device_type' => 'smart_meter',
                'status' => 'active',
                'last_communication' => now(),
            ]);
        }

        // Seed initial system price
        $this->call(SystemPriceSeeder::class);

        $this->command->info('Seeded: 3 Prosumers (each with solar 0.37kWh/jam, battery 100kWh, main_power 66kWh)');
        $this->command->info('Seeded: System Price (PLN R-1/TR 1.300 VA = Rp 1.444,70/kWh)');
    }
}
