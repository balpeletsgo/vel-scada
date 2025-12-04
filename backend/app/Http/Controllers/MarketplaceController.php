<?php

namespace App\Http\Controllers;

use App\Jobs\SyncEnergyPriceJob;
use App\Models\User;
use App\Models\EnergyPrice;
use App\Models\EnergyStorage;
use App\Models\SystemPrice;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    /**
     * Display marketplace with available sellers
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get current system price
        $systemPrice = SystemPrice::current();
        $currentPrice = $systemPrice ? (float) $systemPrice->final_price : 1444.70;

        // Get current user's energy price setting
        $myEnergyPrice = EnergyPrice::where('user_id', $user->id)->first();

        // Get user's battery
        $myBattery = EnergyStorage::where('user_id', $user->id)->first();

        // Get all active sellers (excluding current user) with stock > 0
        $sellers = EnergyPrice::with(['user'])
            ->where('is_selling', true)
            ->where('user_id', '!=', $user->id)
            ->where('stock_kwh', '>=', 1) // At least 1 kWh stock available
            ->get()
            ->map(function ($energyPrice) use ($currentPrice) {
                return [
                    'id' => $energyPrice->id,
                    'user_id' => $energyPrice->user_id,
                    'seller_name' => $energyPrice->user->name,
                    'price_per_kwh' => $currentPrice, // Use system price
                    'stock_kwh' => (float) $energyPrice->stock_kwh,
                    'is_selling' => $energyPrice->is_selling,
                ];
            })
            ->values();

        return Inertia::render('Marketplace/Index', [
            'sellers' => $sellers,
            'myEnergyPrice' => $myEnergyPrice ? [
                'id' => $myEnergyPrice->id,
                'price_per_kwh' => $currentPrice, // Use system price
                'stock_kwh' => (float) $myEnergyPrice->stock_kwh,
                'is_selling' => $myEnergyPrice->is_selling,
            ] : null,
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
     * Add stock to sell (transfer from battery to stock)
     */
    public function addStock(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ], [
            'amount.required' => 'Jumlah energi harus diisi',
            'amount.min' => 'Minimal 1 kWh',
        ]);

        $user = $request->user();
        $amount = (float) $request->amount;

        // Check if user has battery with enough energy
        $battery = EnergyStorage::where('user_id', $user->id)->first();
        if (!$battery || $battery->current_kwh < $amount) {
            return back()->withErrors(['amount' => 'Energi di battery tidak mencukupi']);
        }

        DB::transaction(function () use ($user, $battery, $amount) {
            // Deduct from battery
            $battery->current_kwh -= $amount;
            $battery->save();

            // Add to stock (create or update energy price)
            $energyPrice = EnergyPrice::firstOrCreate(
                ['user_id' => $user->id],
                ['price_per_kwh' => SystemPrice::currentPrice(), 'stock_kwh' => 0, 'is_selling' => false]
            );

            $energyPrice->stock_kwh += $amount;
            $energyPrice->is_selling = true; // Automatically start selling
            $energyPrice->save();
        });

        // Sync price (supply changed)
        SyncEnergyPriceJob::dispatch();

        $formattedAmount = floor($amount) == $amount ? (int) $amount : number_format($amount, 2);
        return back()->with('success', "Berhasil menambahkan {$formattedAmount} kWh ke stok jual");
    }

    /**
     * Withdraw stock back to battery
     */
    public function withdrawStock(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ], [
            'amount.required' => 'Jumlah energi harus diisi',
            'amount.min' => 'Minimal 1 kWh',
        ]);

        $user = $request->user();
        $amount = (float) $request->amount;

        // Get energy price with stock
        $energyPrice = EnergyPrice::where('user_id', $user->id)->first();
        if (!$energyPrice || $energyPrice->stock_kwh < $amount) {
            return back()->withErrors(['amount' => 'Stok jual tidak mencukupi']);
        }

        // Check battery capacity
        $battery = EnergyStorage::where('user_id', $user->id)->first();
        if (!$battery) {
            return back()->withErrors(['battery' => 'Anda tidak memiliki battery']);
        }

        $remainingCapacity = $battery->max_capacity - $battery->current_kwh;
        if ($amount > $remainingCapacity) {
            return back()->withErrors(['amount' => "Battery hanya dapat menampung {$remainingCapacity} kWh lagi"]);
        }

        DB::transaction(function () use ($battery, $energyPrice, $amount) {
            // Deduct from stock
            $energyPrice->stock_kwh -= $amount;
            if ($energyPrice->stock_kwh < 1) {
                $energyPrice->is_selling = false; // Stop selling if stock < 1
            }
            $energyPrice->save();

            // Add back to battery
            $battery->current_kwh += $amount;
            $battery->save();
        });

        // Sync price (supply changed)
        SyncEnergyPriceJob::dispatch();

        $formattedAmount = floor($amount) == $amount ? (int) $amount : number_format($amount, 2);
        return back()->with('success', "Berhasil menarik {$formattedAmount} kWh dari stok jual ke battery");
    }

    /**
     * Toggle selling status
     */
    public function toggleSelling(Request $request)
    {
        $user = $request->user();

        $energyPrice = EnergyPrice::where('user_id', $user->id)->first();
        if (!$energyPrice) {
            return back()->withErrors(['stock' => 'Anda belum memiliki stok jual']);
        }

        if (!$energyPrice->is_selling && $energyPrice->stock_kwh < 1) {
            return back()->withErrors(['stock' => 'Tidak dapat mengaktifkan penjualan. Stok jual kosong.']);
        }

        $energyPrice->is_selling = !$energyPrice->is_selling;
        $energyPrice->save();

        $status = $energyPrice->is_selling ? 'aktif' : 'nonaktif';
        return back()->with('success', "Status penjualan {$status}");
    }

    /**
     * Buy energy from a seller
     */
    public function buy(Request $request)
    {
        $request->validate([
            'seller_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:1',
        ], [
            'seller_id.required' => 'Penjual harus dipilih',
            'seller_id.exists' => 'Penjual tidak ditemukan',
            'amount.required' => 'Jumlah energi harus diisi',
            'amount.min' => 'Minimal pembelian 1 kWh',
        ]);

        $buyer = $request->user();
        $sellerId = $request->seller_id;
        $amount = (float) $request->amount;

        // Can't buy from yourself
        if ($buyer->id === $sellerId) {
            return back()->withErrors(['seller_id' => 'Tidak dapat membeli dari diri sendiri']);
        }

        // Get seller and their energy price/stock
        $seller = User::find($sellerId);
        $energyPrice = EnergyPrice::where('user_id', $sellerId)
            ->where('is_selling', true)
            ->first();

        if (!$energyPrice) {
            return back()->withErrors(['seller_id' => 'Penjual tidak aktif menjual']);
        }

        // Check seller's stock
        if ($energyPrice->stock_kwh < $amount) {
            return back()->withErrors(['amount' => 'Stok penjual tidak mencukupi. Tersedia: ' . number_format($energyPrice->stock_kwh, 2) . ' kWh']);
        }

        // Get system price (all transactions use same price)
        $pricePerKwh = SystemPrice::currentPrice();
        $totalPrice = $amount * $pricePerKwh;

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
        if ($amount > $remainingCapacity) {
            return back()->withErrors(['amount' => "Battery Anda hanya dapat menampung " . number_format($remainingCapacity, 2) . " kWh lagi"]);
        }

        // Perform transaction
        DB::transaction(function () use ($buyer, $seller, $buyerBattery, $energyPrice, $amount, $pricePerKwh, $totalPrice) {
            // Store before values (stock is seller's "battery" in marketplace context)
            $sellerStockBefore = $energyPrice->stock_kwh;
            $buyerBatteryBefore = $buyerBattery->current_kwh;

            // Transfer energy: seller stock -> buyer battery
            $energyPrice->stock_kwh -= $amount;
            if ($energyPrice->stock_kwh < 1) {
                $energyPrice->is_selling = false; // Stop selling if stock < 1
            }
            $energyPrice->save();

            $buyerBattery->current_kwh += $amount;
            $buyerBattery->save();

            // Transfer money: buyer wallet -> seller wallet
            $buyer->wallet_balance -= $totalPrice;
            $buyer->save();

            $seller->wallet_balance += $totalPrice;
            $seller->save();

            // Create transaction record
            Transaction::create([
                'seller_id' => $seller->id,
                'buyer_id' => $buyer->id,
                'energy_kwh' => $amount,
                'price_per_kwh' => $pricePerKwh,
                'total_price' => $totalPrice,
                'seller_battery_before' => $sellerStockBefore,
                'seller_battery_after' => $energyPrice->stock_kwh,
                'buyer_battery_before' => $buyerBatteryBefore,
                'buyer_battery_after' => $buyerBattery->current_kwh,
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        });

        // Sync price after transaction (supply/demand changed)
        SyncEnergyPriceJob::dispatch();

        $formattedAmount = floor($amount) == $amount ? (int) $amount : number_format($amount, 2);
        $formattedPrice = number_format($totalPrice, 0, ',', '.');

        return back()->with('success', "Berhasil membeli {$formattedAmount} kWh dari {$seller->name} seharga Rp {$formattedPrice}");
    }
}
