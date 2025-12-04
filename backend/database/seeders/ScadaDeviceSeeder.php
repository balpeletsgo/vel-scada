<?php

namespace Database\Seeders;

use App\Models\ScadaDevice;
use App\Models\User;
use Illuminate\Database\Seeder;

class ScadaDeviceSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('email', '!=', 'admin@velscada.com')->get();
        
        foreach ($users as $user) {
            // Smart meter
            ScadaDevice::create([
                'user_id' => $user->id,
                'device_id' => 'SM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'device_name' => "Smart Meter - {$user->name}",
                'device_type' => 'smart_meter',
                'protocol' => 'Modbus',
                'ip_address' => '192.168.1.' . (100 + $user->id),
                'port' => 502,
                'status' => 'active',
                'last_communication' => now(),
            ]);
            
            // Inverter
            ScadaDevice::create([
                'user_id' => $user->id,
                'device_id' => 'INV-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'device_name' => "Solar Inverter - {$user->name}",
                'device_type' => 'inverter',
                'protocol' => 'Modbus',
                'ip_address' => '192.168.1.' . (200 + $user->id),
                'port' => 502,
                'status' => 'active',
                'last_communication' => now(),
            ]);
            
            // Battery controller
            ScadaDevice::create([
                'user_id' => $user->id,
                'device_id' => 'BAT-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'device_name' => "Battery Controller - {$user->name}",
                'device_type' => 'battery_controller',
                'protocol' => 'IEC61850',
                'ip_address' => '192.168.1.' . (300 + $user->id),
                'port' => 102,
                'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']),
                'last_communication' => now()->subMinutes(fake()->numberBetween(0, 60)),
            ]);
        }
    }
}
