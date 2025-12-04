<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solar_panels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade'); // 1 user = 1 solar panel
            $table->string('name')->default('Home Solar Panel');
            $table->decimal('capacity_kwh', 10, 2); // Max capacity per hour
            $table->decimal('current_output', 10, 4)->default(0); // Current output kW
            $table->decimal('efficiency', 5, 2)->default(85.00); // Panel efficiency %
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->date('installation_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solar_panels');
    }
};
