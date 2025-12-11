<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransferController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/transfer', [TransferController::class, 'index'])->name('transfer');
    Route::post('/transfer', [TransferController::class, 'store'])->name('transfer.store');

    // Realtime Monitor
    Route::get('/realtime', [DashboardController::class, 'realtime'])->name('realtime');

    // Marketplace
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace');
    Route::post('/marketplace/create-listing', [MarketplaceController::class, 'createListing'])->name('marketplace.create-listing');
    Route::post('/marketplace/cancel-listing', [MarketplaceController::class, 'cancelListing'])->name('marketplace.cancel-listing');
    Route::post('/marketplace/buy', [MarketplaceController::class, 'buy'])->name('marketplace.buy');

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
