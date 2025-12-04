<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('predicted_price', 10, 2);
            $table->decimal('actual_price', 10, 2)->nullable()->comment('Filled after actual price known');
            $table->date('forecast_date');
            $table->integer('forecast_hour')->nullable()->comment('0-23 for hourly prediction');
            $table->decimal('confidence_level', 5, 2)->nullable()->comment('Confidence percentage');
            $table->string('model_version', 50)->nullable();
            $table->json('features_used')->nullable()->comment('Input features for prediction');
            $table->timestamps();

            $table->index(['user_id', 'forecast_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_forecasts');
    }
};
