<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('energy_storage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('energy_storage_id')->constrained()->onDelete('cascade');
            $table->decimal('battery_kwh', 10, 4);
            $table->decimal('main_power_kwh', 10, 4);
            $table->decimal('solar_output', 10, 6)->default(0);
            $table->enum('action', ['charging', 'discharging', 'transfer', 'idle', 'buy', 'sell'])->default('idle');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['user_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('energy_storage_logs');
    }
};
