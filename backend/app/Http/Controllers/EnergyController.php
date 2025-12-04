<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EnergyStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnergyController extends Controller
{
    /**
     * Transfer energy from Battery to Main Power (MANUAL)
     * One-way transfer: Battery -> Main Power only
     */
    public function transferToMainPower(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.0001|max:100',
        ]);

        $user = $request->user();
        $amount = (float) $request->amount;

        // Get user's battery
        $battery = EnergyStorage::where('user_id', $user->id)->first();

        if (!$battery) {
            return response()->json([
                'success' => false,
                'message' => 'Battery not found',
            ], 404);
        }

        // Check if battery has enough energy
        if ($battery->current_kwh < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient battery energy. Available: ' . number_format($battery->current_kwh, 4) . ' kWh',
            ], 400);
        }

        // Perform transfer using transaction
        DB::transaction(function () use ($user, $battery, $amount) {
            // Decrease battery
            $battery->current_kwh -= $amount;
            $battery->status = 'discharging';
            $battery->save();

            // Increase main power
            $user->main_power_kwh += $amount;
            $user->save();

            // Reset battery status after transfer
            $battery->status = 'idle';
            $battery->save();
        });

        // Refresh data
        $battery->refresh();
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Successfully transferred ' . number_format($amount, 4) . ' kWh from Battery to Main Power',
            'data' => [
                'battery' => [
                    'currentKwh' => (float) $battery->current_kwh,
                    'maxCapacity' => (float) $battery->max_capacity,
                    'percentage' => round(($battery->current_kwh / $battery->max_capacity) * 100, 2),
                ],
                'mainPower' => [
                    'current' => (float) $user->main_power_kwh,
                ],
            ],
        ]);
    }

    /**
     * Get current energy status
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $battery = EnergyStorage::where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'mainPower' => [
                    'current' => (float) ($user->main_power_kwh ?? 66.0),
                    'unit' => 'kWh',
                ],
                'battery' => [
                    'currentKwh' => (float) ($battery->current_kwh ?? 0),
                    'maxCapacity' => (float) ($battery->max_capacity ?? 100),
                    'percentage' => $battery ? round(($battery->current_kwh / $battery->max_capacity) * 100, 2) : 0,
                    'status' => $battery->status ?? 'idle',
                    'unit' => 'kWh',
                ],
            ],
        ]);
    }
}
