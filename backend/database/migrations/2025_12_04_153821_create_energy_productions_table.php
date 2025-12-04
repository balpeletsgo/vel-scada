<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('energy_productions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('solar_panel_id')->constrained()->onDelete('cascade');
            $table->decimal('produced_kwh', 10, 3);
            $table->string('weather_condition', 50)->nullable()->comment('sunny, cloudy, rainy, etc');
            $table->decimal('temperature', 5, 2)->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['user_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('energy_productions');
    }
};
