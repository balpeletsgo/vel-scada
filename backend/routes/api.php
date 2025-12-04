<?php

use App\Http\Controllers\EnergyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Energy Management Routes
    Route::prefix('energy')->group(function () {
        Route::get('/status', [EnergyController::class, 'status']);
        Route::post('/transfer-to-main', [EnergyController::class, 'transferToMainPower']);
    });
});
