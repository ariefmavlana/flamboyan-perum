<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->json('commercial')->nullable();
            $table->bigInteger('offer_price_idr')->nullable();
            $table->date('offer_start')->nullable();
            $table->date('offer_end')->nullable();
            $table->bigInteger('next_price_idr')->nullable();
            $table->date('next_price_start')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('properties', fn (Blueprint $table) => $table->dropColumn(['commercial', 'offer_price_idr', 'offer_start', 'offer_end', 'next_price_idr', 'next_price_start']));
    }
};
