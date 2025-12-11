<?php

namespace App\Http\Controllers;

use App\Models\EnergyStorage;
use App\Models\EnergyStorageLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransferController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get battery/energy storage data
        $energyStorage = EnergyStorage::where('user_id', $user->id)->first();

        return Inertia::render('Transfer', [
            'energyData' => [
                'mainPower' => [
                    'current' => (float) ($user->main_power_kwh ?? 66.0),
                    'unit' => 'kWh',
                ],
                'battery' => [
                    'currentKwh' => (float) ($energyStorage->current_kwh ?? 0),
                    'maxCapacity' => (float) ($energyStorage->max_capacity ?? 100),
                    'percentage' => $energyStorage ? round(($energyStorage->current_kwh / $energyStorage->max_capacity) * 100, 2) : 0,
                    'status' => $energyStorage->status ?? 'idle',
                    'unit' => 'kWh',
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Get user's battery
        $battery = EnergyStorage::where('user_id', $user->id)->first();

        if (!$battery) {
            return back()->withErrors(['amount' => 'Battery tidak ditemukan']);
        }

        // Validate with dynamic max based on battery
        $request->validate([
            'amount' => [
                'required',
                'numeric',
                'min:1',
                'max:' . $battery->current_kwh,
            ],
        ], [
            'amount.required' => 'Jumlah transfer harus diisi',
            'amount.numeric' => 'Masukkan angka yang valid',
            'amount.min' => 'Jumlah minimal adalah 1 kWh',
            'amount.max' => 'Jumlah tidak boleh melebihi saldo battery (' . number_format($battery->current_kwh, 4) . ' kWh)',
        ]);

        $amount = (float) $request->amount;

        // Perform transfer using transaction
        DB::transaction(function () use ($user, $battery, $amount) {
            // Decrease battery
            $battery->current_kwh -= $amount;
            $battery->status = 'discharging';
            $battery->save();

            // Increase main power
            $user->main_power_kwh += $amount;
            $user->save();

            // Log the transfer
            EnergyStorageLog::create([
                'user_id' => $user->id,
                'energy_storage_id' => $battery->id,
                'battery_kwh' => $battery->current_kwh,
                'main_power_kwh' => $user->main_power_kwh,
                'solar_output' => 0,
                'action' => 'transfer',
                'recorded_at' => now(),
            ]);

            // Reset battery status after transfer
            $battery->status = 'idle';
            $battery->save();
        });

        // Format amount without unnecessary decimals
        $formattedAmount = floor($amount) == $amount ? (int) $amount : number_format($amount, 2);

        return back()->with('success', 'Berhasil transfer ' . $formattedAmount . ' kWh dari Battery ke Main Power');
    }
}
