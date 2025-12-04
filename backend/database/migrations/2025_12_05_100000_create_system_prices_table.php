<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_prices', function (Blueprint $table) {
            $table->id();
            $table->decimal('base_price', 10, 2)->comment('PLN base price per kWh');
            $table->decimal('multiplier', 5, 4)->default(1.0)->comment('Supply/demand multiplier');
            $table->decimal('final_price', 10, 2)->comment('Final price per kWh');
            $table->decimal('supply_kwh', 12, 2)->default(0)->comment('Total supply at calculation time');
            $table->decimal('demand_kwh', 12, 2)->default(0)->comment('Total demand at calculation time');
            $table->decimal('supply_demand_ratio', 8, 4)->nullable()->comment('Supply/demand ratio');
            $table->enum('market_condition', ['high_supply', 'balanced', 'high_demand'])->default('balanced');
            $table->boolean('is_active')->default(true)->comment('Current active price');
            $table->timestamp('effective_from')->useCurrent();
            $table->timestamp('effective_until')->nullable();
            $table->timestamps();

            $table->index('is_active');
            $table->index('effective_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_prices');
    }
};
