<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('buyer_id')->constrained('users')->onDelete('cascade');
            $table->decimal('energy_kwh', 10, 4); // Energy transferred
            $table->decimal('price_per_kwh', 10, 2); // Price at transaction time
            $table->decimal('total_price', 12, 2); // Total = energy * price
            
            // Battery tracking - before/after transaction
            $table->decimal('seller_battery_before', 10, 4)->nullable();
            $table->decimal('seller_battery_after', 10, 4)->nullable();
            $table->decimal('buyer_battery_before', 10, 4)->nullable();
            $table->decimal('buyer_battery_after', 10, 4)->nullable();
            
            $table->enum('status', ['pending', 'completed', 'cancelled', 'failed'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
