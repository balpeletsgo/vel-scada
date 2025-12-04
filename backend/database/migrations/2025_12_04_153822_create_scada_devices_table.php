<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scada_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('device_id', 100)->unique();
            $table->string('device_name');
            $table->string('device_type', 100)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->integer('port')->nullable();
            $table->string('protocol', 50)->nullable()->comment('Modbus, DNP3, IEC61850, etc');
            $table->enum('status', ['active', 'inactive', 'maintenance', 'fault'])->default('active');
            $table->timestamp('last_communication')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scada_devices');
    }
};
