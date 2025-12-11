<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SolarPanel;
use App\Models\EnergyStorage;
use App\Models\EnergyProduction;
use App\Models\EnergyConsumption;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\EnergyStorageLog;
use App\Models\ActivityLog;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get solar panel data
        $solarPanel = SolarPanel::where('user_id', $user->id)->first();

        // Get battery/energy storage data
        $energyStorage = EnergyStorage::where('user_id', $user->id)->first();

        // Get chart history from database (last 30 records)
        $chartHistory = $this->getChartHistory($user->id, $solarPanel?->id);

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
            'chartHistory' => $chartHistory,
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

    /**
     * Realtime Monitor page
     */
    public function realtime(Request $request)
    {
        $user = $request->user();

        // Get recent solar activity logs (only solar type, only current user)
        $activityLogs = ActivityLog::with('user')
            ->where('type', 'solar')
            ->where('user_id', $user->id)
            ->orderBy('logged_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_id' => $log->user_id,
                    'user_name' => $log->user?->name ?? 'System',
                    'type' => $log->type,
                    'action' => $log->action,
                    'description' => $log->description,
                    'metadata' => $log->metadata,
                    'logged_at' => $log->logged_at->toISOString(),
                    'time_ago' => $log->logged_at->diffForHumans(),
                ];
            });

        return Inertia::render('RealtimeMonitor', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Get chart history from database - using energy_storage_logs for accurate history
     */
    private function getChartHistory(int $userId, ?int $solarPanelId): array
    {
        // Get last 30 energy storage logs (includes all changes: charging, transfer, etc)
        $logs = EnergyStorageLog::where('user_id', $userId)
            ->orderBy('recorded_at', 'desc')
            ->take(30)
            ->get()
            ->reverse()
            ->values();

        // Build chart data from logs
        $chartData = [];

        foreach ($logs as $log) {
            $chartData[] = [
                'time' => $log->recorded_at->format('H:i:s'),
                'timestamp' => $log->recorded_at->toIso8601String(),
                'solar' => round((float) $log->solar_output, 4), // kWh
                'mainPower' => round((float) $log->main_power_kwh, 4), // kWh
                'battery' => round((float) $log->battery_kwh, 4), // kWh
                'action' => $log->action,
            ];
        }

        return $chartData;
    }
}
