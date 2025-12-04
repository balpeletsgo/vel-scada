<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify enum to include 'discharging'
        DB::statement("ALTER TABLE energy_storages MODIFY COLUMN status ENUM('active', 'charging', 'idle', 'discharging') DEFAULT 'idle'");
    }

    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE energy_storages MODIFY COLUMN status ENUM('active', 'charging', 'idle') DEFAULT 'idle'");
    }
};
