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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('type', ['solar', 'battery', 'main_power', 'transaction', 'scada', 'system']);
            $table->string('action'); // charging, discharging, buy, sell, reading, etc
            $table->text('description');
            $table->json('metadata')->nullable(); // Store additional data
            $table->timestamp('logged_at');
            $table->timestamps();

            // Composite indexes for fast queries
            $table->index(['user_id', 'type', 'logged_at']);
            $table->index(['type', 'logged_at']);
            $table->index('logged_at'); // For time-based queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
