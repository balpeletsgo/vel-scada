<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@velscada.com',
            'password' => Hash::make('password'),
            'wallet_balance' => 10000000, // 10 juta IDR
            'wallet_address' => '0x' . fake()->sha256(),
            'address' => 'Jl. Admin No. 1, Jakarta',
            'phone' => '081234567890',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Create 10 prosumer users (houses with solar panels)
        for ($i = 1; $i <= 10; $i++) {
            User::create([
                'name' => "Rumah $i",
                'email' => "rumah$i@velscada.com",
                'password' => Hash::make('password'),
                'wallet_balance' => fake()->numberBetween(500000, 5000000), // 500rb - 5jt IDR
                'wallet_address' => '0x' . fake()->sha256(),
                'address' => fake()->address(),
                'phone' => fake()->phoneNumber(),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }
    }
}
