<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sync energy price from ML service every 24 hours
Schedule::command('energy:sync-price')
    ->daily()
    ->at('00:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/energy-price-sync.log'));
