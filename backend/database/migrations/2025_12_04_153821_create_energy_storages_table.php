<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('energy_storages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->string('name')->default('Home Battery');
            $table->decimal('max_capacity', 10, 4)->default(100)->comment('Max capacity in kWh');
            $table->decimal('current_kwh', 10, 4)->default(50)->comment('Current stored energy in kWh');
            $table->enum('status', ['active', 'charging', 'idle'])->default('idle');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('energy_storages');
    }
};
