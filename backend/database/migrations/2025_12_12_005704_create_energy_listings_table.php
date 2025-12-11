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
        Schema::create('energy_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Seller
            $table->decimal('energy_kwh', 10, 4); // Jumlah kWh dijual
            $table->decimal('price_per_kwh', 10, 2); // Snapshot system price saat create
            $table->decimal('total_price', 12, 2); // energy_kwh * price_per_kwh
            $table->enum('status', ['available', 'sold', 'cancelled'])->default('available');
            $table->foreignId('buyer_id')->nullable()->constrained('users')->onDelete('set null'); // Diisi saat sold
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('energy_listings');
    }
};
