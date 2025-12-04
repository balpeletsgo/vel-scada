<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Display transaction history
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::with(['buyer', 'seller'])
            ->where(function ($query) use ($user) {
                $query->where('buyer_id', $user->id)
                    ->orWhere('seller_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($transaction) use ($user) {
                $isBuyer = $transaction->buyer_id === $user->id;

                return [
                    'id' => $transaction->id,
                    'tx_hash' => $transaction->tx_hash,
                    'type' => $isBuyer ? 'buy' : 'sell',
                    'counterparty' => $isBuyer ? $transaction->seller->name : $transaction->buyer->name,
                    'energy_kwh' => (float) $transaction->energy_kwh,
                    'price_per_kwh' => (float) $transaction->price_per_kwh,
                    'total_price' => (float) $transaction->total_price,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('d M Y H:i'),
                    'completed_at' => $transaction->completed_at?->format('d M Y H:i'),
                ];
            });

        // Get summary stats
        $buyTotal = Transaction::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->sum('total_price');

        $sellTotal = Transaction::where('seller_id', $user->id)
            ->where('status', 'completed')
            ->sum('total_price');

        $buyEnergyTotal = Transaction::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->sum('energy_kwh');

        $sellEnergyTotal = Transaction::where('seller_id', $user->id)
            ->where('status', 'completed')
            ->sum('energy_kwh');

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'summary' => [
                'buy_total' => (float) $buyTotal,
                'sell_total' => (float) $sellTotal,
                'buy_energy_total' => (float) $buyEnergyTotal,
                'sell_energy_total' => (float) $sellEnergyTotal,
                'net_balance' => (float) ($sellTotal - $buyTotal),
            ],
        ]);
    }
}
