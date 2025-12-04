<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SolarPanel;
use App\Models\EnergyStorage;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get solar panel data
        $solarPanel = SolarPanel::where('user_id', $user->id)->first();

        // Get battery/energy storage data
        $energyStorage = EnergyStorage::where('user_id', $user->id)->first();

        // Get public/global recent transactions (all users)
        $publicTransactions = Transaction::with(['seller', 'buyer'])
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'tx_hash' => $transaction->tx_hash,
                    'seller_name' => $transaction->seller->name,
                    'buyer_name' => $transaction->buyer->name,
                    'energy_kwh' => (float) $transaction->energy_kwh,
                    'price_per_kwh' => (float) $transaction->price_per_kwh,
                    'total_price' => (float) $transaction->total_price,
                    'created_at' => $transaction->created_at->format('d M Y H:i'),
                ];
            });

        // Calculate total energy sold/bought
        $totalSold = Transaction::where('seller_id', $user->id)
            ->where('status', 'completed')
            ->sum('energy_kwh');

        $totalBought = Transaction::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->sum('energy_kwh');

        return Inertia::render('Dashboard', [
            'energyData' => [
                // Main Power (token listrik) dari users table
                'mainPower' => [
                    'current' => (float) ($user->main_power_kwh ?? 66.0),
                    'unit' => 'kWh',
                ],
                // Solar Panel
                'solar' => [
                    'currentOutput' => (float) ($solarPanel->current_output ?? 0),
                    'maxCapacity' => (float) ($solarPanel->max_capacity ?? 0.37),
                    'status' => $solarPanel->status ?? 'inactive',
                    'unit' => 'kWh',
                ],
                // Battery / Energy Storage
                'battery' => [
                    'currentKwh' => (float) ($energyStorage->current_kwh ?? 0),
                    'maxCapacity' => (float) ($energyStorage->max_capacity ?? 100),
                    'percentage' => $energyStorage ? round(($energyStorage->current_kwh / $energyStorage->max_capacity) * 100, 2) : 0,
                    'status' => $energyStorage->status ?? 'idle',
                    'unit' => 'kWh',
                ],
                // Trading stats
                'trading' => [
                    'totalSold' => (float) $totalSold,
                    'totalBought' => (float) $totalBought,
                    'balance' => (float) ($totalSold - $totalBought),
                ],
                // Consumption rate info (interval 10 menit)
                'consumption' => [
                    'ratePerHour' => 0.275, // 66 kWh / 240 hours (10 days)
                    'ratePer10Minutes' => 0.046, // Per 10 minutes
                    'unit' => 'kWh',
                ],
            ],
            'publicTransactions' => $publicTransactions,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'address' => $user->address,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
            ],
        ]);
    }
}
