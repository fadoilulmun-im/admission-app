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
        Schema::create('pendaftars', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_pendaftaran', 20)->unique();
            $table->string('nama', 100);
            $table->string('nomor_hp', 15);
            $table->string('email', 100);
            $table->string('asal_sekolah', 150);
            $table->string('prodi', 50);
            $table->string('jalur', 20);
            $table->string('status', 20)->default('Menunggu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pendaftars');
    }
};
