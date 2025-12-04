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
        Schema::table('energy_prices', function (Blueprint $table) {
            // Add stock_kwh column for energy being sold (separate from battery)
            $table->decimal('stock_kwh', 10, 4)->default(0)->after('price_per_kwh')
                ->comment('Energy stock available for sale (transferred from battery)');

            // Drop unused columns
            $table->dropColumn(['min_sale_kwh', 'max_sale_kwh']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('energy_prices', function (Blueprint $table) {
            $table->dropColumn('stock_kwh');
            $table->decimal('min_sale_kwh', 10, 2)->default(0)->after('price_per_kwh');
            $table->decimal('max_sale_kwh', 10, 2)->nullable()->after('min_sale_kwh');
        });
    }
};
