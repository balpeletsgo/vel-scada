<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('main_power_kwh', 10, 4)->default(66)->after('email')->comment('Main power buffer in kWh');
            $table->decimal('wallet_balance', 12, 2)->default(0)->after('main_power_kwh')->comment('Wallet balance in IDR');
            $table->string('wallet_address')->nullable()->unique()->after('wallet_balance')->comment('Blockchain wallet address');
            $table->text('address')->nullable()->after('wallet_address')->comment('Physical home address');
            $table->string('phone', 20)->nullable()->after('address');
            $table->boolean('is_active')->default(true)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['main_power_kwh', 'wallet_balance', 'wallet_address', 'address', 'phone', 'is_active']);
        });
    }
};
