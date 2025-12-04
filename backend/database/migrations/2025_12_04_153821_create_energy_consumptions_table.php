<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('energy_consumptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('consumed_kwh', 10, 3);
            $table->enum('source_type', ['grid', 'solar', 'p2p', 'battery'])->comment('Energy source');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['user_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('energy_consumptions');
    }
};
