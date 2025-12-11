<?php

namespace Database\Seeders;

use App\Models\EnergyListing;
use App\Models\User;
use App\Models\EnergyStorage;
use App\Models\SystemPrice;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class EnergyListingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users and system price
        $users = User::all();
        $systemPrice = SystemPrice::first();

        if (!$systemPrice || $users->count() === 0) {
            $this->command->warn('Skipping EnergyListingSeeder: No users or system price found');
            return;
        }

        $pricePerKwh = $systemPrice->final_price;

        // Create 2-3 listings per user (except the first user for demo purposes)
        foreach ($users->skip(1)->take(3) as $user) {
            $battery = EnergyStorage::where('user_id', $user->id)->first();

            if (!$battery || $battery->current_kwh < 10) {
                continue; // Skip if no battery or insufficient energy
            }

            // Create 5-10 random listings
            $listingsCount = rand(5, 10);

            for ($i = 0; $i < $listingsCount; $i++) {
                $energyKwh = $this->getRandomEnergy();

                // Check if battery has enough energy
                if ($battery->current_kwh < $energyKwh) {
                    continue;
                }

                // Create listing
                EnergyListing::create([
                    'user_id' => $user->id,
                    'energy_kwh' => $energyKwh,
                    'price_per_kwh' => $pricePerKwh,
                    'total_price' => $energyKwh * $pricePerKwh,
                    'status' => 'available',
                    'created_at' => Carbon::now()->subMinutes(rand(5, 120)),
                    'updated_at' => Carbon::now()->subMinutes(rand(5, 120)),
                ]);

                // Deduct from battery
                $battery->current_kwh -= $energyKwh;
                $battery->save();
            }
        }

        $totalListings = EnergyListing::where('status', 'available')->count();
        $this->command->info("Created {$totalListings} energy listings");
    }

    /**
     * Get random energy amount for listing
     */
    private function getRandomEnergy(): float
    {
        $amounts = [3, 5];
        return $amounts[array_rand($amounts)];
    }
}
