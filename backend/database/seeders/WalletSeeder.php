<?php

namespace Database\Seeders;

use App\Models\Wallet;
use App\Models\User;
use Illuminate\Database\Seeder;

class WalletSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            Wallet::create([
                'user_id' => $user->id,
                'balance' => fake()->randomFloat(2, 100, 10000), // 100-10000 tokens
                'locked_balance' => fake()->randomFloat(2, 0, 500),
            ]);
        }
    }
}
