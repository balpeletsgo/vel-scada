<?php

namespace App\Http\Controllers;

use App\Jobs\SyncEnergyPriceJob;
use App\Models\User;
use App\Models\EnergyListing;
use App\Models\EnergyStorage;
use App\Models\EnergyStorageLog;
use App\Models\SystemPrice;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    /**
     * Display marketplace with available listings
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get current system price
        $systemPrice = SystemPrice::current();
        $currentPrice = $systemPrice ? (float) $systemPrice->final_price : 1444.70;

        // Get user's battery
        $myBattery = EnergyStorage::where('user_id', $user->id)->first();

        // Get my active listings
        $myListings = EnergyListing::where('user_id', $user->id)
            ->where('status', 'available')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($listing) use ($currentPrice) {
                return [
                    'id' => $listing->id,
                    'energy_kwh' => (float) $listing->energy_kwh,
                    'price_per_kwh' => $currentPrice,
                    'total_price' => (float) $listing->energy_kwh * $currentPrice,
                    'created_at' => $listing->created_at->format('d M Y H:i'),
                ];
            });

        // Get all available listings from other users
        $listings = EnergyListing::with(['seller'])
            ->where('status', 'available')
            ->where('user_id', '!=', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($listing) use ($currentPrice) {
                return [
                    'id' => $listing->id,
                    'seller_id' => $listing->user_id,
                    'seller_name' => $listing->seller->name,
                    'energy_kwh' => (float) $listing->energy_kwh,
                    'price_per_kwh' => $currentPrice,
                    'total_price' => (float) $listing->energy_kwh * $currentPrice,
                    'created_at' => $listing->created_at->format('d M Y H:i'),
                ];
            });

        return Inertia::render('Marketplace/Index', [
            'listings' => $listings,
            'myListings' => $myListings,
            'myBattery' => $myBattery ? [
                'current_kwh' => (float) $myBattery->current_kwh,
                'max_capacity' => (float) $myBattery->max_capacity,
            ] : null,
            'walletBalance' => (float) $user->wallet_balance,
            'systemPrice' => $systemPrice ? [
                'base_price' => (float) $systemPrice->base_price,
                'multiplier' => (float) $systemPrice->multiplier,
                'final_price' => (float) $systemPrice->final_price,
                'market_condition' => $systemPrice->market_condition,
                'effective_from' => $systemPrice->effective_from->format('d M Y H:i'),
            ] : [
                'base_price' => 1444.70,
                'multiplier' => 1.0,
                'final_price' => 1444.70,
                'market_condition' => 'balanced',
                'effective_from' => now()->format('d M Y H:i'),
            ],
        ]);
    }

    /**
     * Create a new listing
     */
    public function createListing(Request $request)
    {
        $request->validate([
            'energy_kwh' => 'required|numeric|min:1|max:50',
        ], [
            'energy_kwh.required' => 'Jumlah energi harus diisi',
            'energy_kwh.min' => 'Minimal 1 kWh per listing',
            'energy_kwh.max' => 'Maksimal 50 kWh per listing',
        ]);

        $user = $request->user();
        $energyKwh = (float) $request->energy_kwh;

        // Check if user has battery with enough energy
        $battery = EnergyStorage::where('user_id', $user->id)->first();
        if (!$battery || $battery->current_kwh < $energyKwh) {
            return back()->withErrors(['energy_kwh' => 'Energi di battery tidak mencukupi']);
        }

        // Get current system price (save as snapshot for history/reference only)
        $systemPrice = SystemPrice::current();
        $pricePerKwh = $systemPrice ? (float) $systemPrice->final_price : 1444.70;
        $totalPrice = $energyKwh * $pricePerKwh;

        DB::transaction(function () use ($user, $battery, $energyKwh, $pricePerKwh, $totalPrice) {
            // Deduct from battery
            $battery->current_kwh -= $energyKwh;
            $battery->save();

            // Create listing
            EnergyListing::create([
                'user_id' => $user->id,
                'energy_kwh' => $energyKwh,
                'price_per_kwh' => $pricePerKwh,
                'total_price' => $totalPrice,
                'status' => 'available',
            ]);

            // Log to energy_storage_logs
            EnergyStorageLog::create([
                'user_id' => $user->id,
                'energy_storage_id' => $battery->id,
                'battery_kwh' => $battery->current_kwh,
                'main_power_kwh' => $user->main_power_kwh ?? 0,
                'solar_output' => 0,
                'action' => 'sell',
                'recorded_at' => now(),
            ]);
        });

        // Sync price immediately (supply changed)
        SyncEnergyPriceJob::dispatchSync();

        $formattedAmount = floor($energyKwh) == $energyKwh ? (int) $energyKwh : number_format($energyKwh, 2);
        $formattedPrice = number_format($totalPrice, 0, ',', '.');
        return back()->with('success', "Listing {$formattedAmount} kWh berhasil dibuat (Total: Rp {$formattedPrice})");
    }

    /**
     * Cancel a listing (return energy to battery)
     */
    public function cancelListing(Request $request)
    {
        $request->validate([
            'listing_id' => 'required|exists:energy_listings,id',
        ]);

        $user = $request->user();
        $listing = EnergyListing::find($request->listing_id);

        // Check ownership
        if ($listing->user_id !== $user->id) {
            return back()->withErrors(['listing' => 'Anda tidak memiliki listing ini']);
        }

        // Check status
        if ($listing->status !== 'available') {
            return back()->withErrors(['listing' => 'Listing ini sudah tidak tersedia']);
        }

        // Check battery capacity
        $battery = EnergyStorage::where('user_id', $user->id)->first();
        if (!$battery) {
            return back()->withErrors(['battery' => 'Anda tidak memiliki battery']);
        }

        $remainingCapacity = $battery->max_capacity - $battery->current_kwh;
        if ($listing->energy_kwh > $remainingCapacity) {
            return back()->withErrors(['battery' => "Battery hanya dapat menampung {$remainingCapacity} kWh lagi"]);
        }

        DB::transaction(function () use ($user, $battery, $listing) {
            // Return energy to battery
            $battery->current_kwh += $listing->energy_kwh;
            $battery->save();

            // Cancel listing
            $listing->cancel();

            // Log to energy_storage_logs
            EnergyStorageLog::create([
                'user_id' => $user->id,
                'energy_storage_id' => $battery->id,
                'battery_kwh' => $battery->current_kwh,
                'main_power_kwh' => $user->main_power_kwh ?? 0,
                'solar_output' => 0,
                'action' => 'charging', // Energy back to battery = charging
                'recorded_at' => now(),
            ]);
        });

        // Sync price immediately (supply changed)
        SyncEnergyPriceJob::dispatchSync();

        $formattedAmount = floor($listing->energy_kwh) == $listing->energy_kwh ? (int) $listing->energy_kwh : number_format($listing->energy_kwh, 2);
        return back()->with('success', "Listing {$formattedAmount} kWh berhasil dibatalkan");
    }

    /**
     * Toggle selling status (deprecated - not used in new system)
     */
    public function toggleSelling(Request $request)
    {
        return back()->with('info', 'Fitur ini sudah tidak digunakan. Gunakan Create Listing untuk menjual energi.');
    }

    /**
     * Buy a listing
     */
    public function buy(Request $request)
    {
        $request->validate([
            'listing_id' => 'required|exists:energy_listings,id',
        ], [
            'listing_id.required' => 'Listing harus dipilih',
            'listing_id.exists' => 'Listing tidak ditemukan',
        ]);

        $buyer = $request->user();
        $listing = EnergyListing::with('seller')->find($request->listing_id);

        // Check listing status
        if ($listing->status !== 'available') {
            return back()->withErrors(['listing' => 'Listing sudah tidak tersedia']);
        }

        // Can't buy from yourself
        if ($buyer->id === $listing->user_id) {
            return back()->withErrors(['listing' => 'Tidak dapat membeli listing sendiri']);
        }

        $seller = $listing->seller;
        $energyKwh = (float) $listing->energy_kwh;

        // Use REAL-TIME system price, not snapshot
        $systemPrice = SystemPrice::current();
        $pricePerKwh = $systemPrice ? (float) $systemPrice->final_price : 1444.70;
        $totalPrice = $energyKwh * $pricePerKwh;

        // Check buyer's wallet balance
        if ($buyer->wallet_balance < $totalPrice) {
            return back()->withErrors(['wallet' => "Saldo tidak cukup. Dibutuhkan Rp " . number_format($totalPrice, 0, ',', '.') . ", saldo Anda Rp " . number_format($buyer->wallet_balance, 0, ',', '.')]);
        }

        // Get buyer's battery
        $buyerBattery = EnergyStorage::where('user_id', $buyer->id)->first();
        if (!$buyerBattery) {
            return back()->withErrors(['battery' => 'Anda tidak memiliki battery untuk menerima energi']);
        }

        // Check buyer battery capacity
        $remainingCapacity = $buyerBattery->max_capacity - $buyerBattery->current_kwh;
        if ($energyKwh > $remainingCapacity) {
            return back()->withErrors(['battery' => "Battery Anda hanya dapat menampung " . number_format($remainingCapacity, 2) . " kWh lagi"]);
        }

        // Perform transaction
        DB::transaction(function () use ($buyer, $seller, $buyerBattery, $listing, $energyKwh, $totalPrice) {
            $buyerBatteryBefore = $buyerBattery->current_kwh;

            // Transfer energy: listing -> buyer battery
            $buyerBattery->current_kwh += $energyKwh;
            $buyerBattery->save();

            // Transfer money: buyer wallet -> seller wallet
            $buyer->wallet_balance -= $totalPrice;
            $buyer->save();

            $seller->wallet_balance += $totalPrice;
            $seller->save();

            // Mark listing as sold
            $listing->markAsSold($buyer->id);

            // Create transaction record
            Transaction::create([
                'seller_id' => $seller->id,
                'buyer_id' => $buyer->id,
                'energy_kwh' => $energyKwh,
                'price_per_kwh' => $listing->price_per_kwh,
                'total_price' => $totalPrice,
                'seller_battery_before' => 0, // N/A for listing-based
                'seller_battery_after' => 0,  // N/A for listing-based
                'buyer_battery_before' => $buyerBatteryBefore,
                'buyer_battery_after' => $buyerBattery->current_kwh,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Log buyer's battery change
            EnergyStorageLog::create([
                'user_id' => $buyer->id,
                'energy_storage_id' => $buyerBattery->id,
                'battery_kwh' => $buyerBattery->current_kwh,
                'main_power_kwh' => $buyer->main_power_kwh ?? 0,
                'solar_output' => 0,
                'action' => 'buy',
                'recorded_at' => now(),
            ]);
        });

        // Sync price immediately after transaction (supply/demand changed)
        SyncEnergyPriceJob::dispatchSync();

        $formattedAmount = floor($energyKwh) == $energyKwh ? (int) $energyKwh : number_format($energyKwh, 2);
        $formattedPrice = number_format($totalPrice, 0, ',', '.');

        return back()->with('success', "Berhasil membeli {$formattedAmount} kWh dari {$seller->name} seharga Rp {$formattedPrice}");
    }
}
