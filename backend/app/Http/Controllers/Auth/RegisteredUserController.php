<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EnergyStorage;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Use transaction to ensure both user and energy storage are created
        $user = DB::transaction(function () use ($request) {
            // Create user with default energy values (same as seeder)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'prosumer',
                'main_power_kwh' => 66.00, // Default token listrik ~10 hari
                'wallet_balance' => 100000, // Rp 100.000 starting balance
                'is_active' => true,
            ]);

            // Create energy storage (battery) for the user
            EnergyStorage::create([
                'user_id' => $user->id,
                'type' => 'battery',
                'capacity_kwh' => 100.00, // 100 kWh battery capacity
                'current_kwh' => 50.00, // Start with 50% charge
                'status' => 'idle',
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
