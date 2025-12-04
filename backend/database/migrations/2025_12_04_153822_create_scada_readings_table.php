<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scada_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('scada_device_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('voltage', 10, 2)->nullable()->comment('Voltage in V');
            $table->decimal('current', 10, 3)->nullable()->comment('Current in A');
            $table->decimal('active_power', 10, 2)->nullable()->comment('Active power in W');
            $table->decimal('reactive_power', 10, 2)->nullable()->comment('Reactive power in VAR');
            $table->decimal('power_factor', 5, 3)->nullable();
            $table->decimal('frequency', 5, 2)->nullable()->comment('Frequency in Hz');
            $table->decimal('energy_import', 10, 3)->nullable()->comment('Imported energy kWh');
            $table->decimal('energy_export', 10, 3)->nullable()->comment('Exported energy kWh');
            $table->enum('grid_status', ['connected', 'disconnected', 'fault'])->default('connected');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['user_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scada_readings');
    }
};
