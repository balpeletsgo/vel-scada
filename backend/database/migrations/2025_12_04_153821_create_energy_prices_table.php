<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('energy_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('price_per_kwh', 10, 2)->comment('Selling price per kWh');
            $table->decimal('min_sale_kwh', 10, 2)->default(0)->comment('Minimum kWh to sell');
            $table->decimal('max_sale_kwh', 10, 2)->nullable()->comment('Maximum kWh willing to sell');
            $table->boolean('is_selling')->default(false)->comment('Currently selling status');
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('energy_prices');
    }
};
