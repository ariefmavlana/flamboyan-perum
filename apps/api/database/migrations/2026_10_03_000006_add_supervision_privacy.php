<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('whatsapp_number', 15)->nullable()->change();
            $table->timestamp('anonymized_at')->nullable();
            $table->index(['created_at', 'id']);
            $table->index(['anonymized_at', 'status', 'updated_at']);
        });
        Schema::table('lead_histories', fn (Blueprint $table) => $table->timestamp('redacted_at')->nullable());
        Schema::create('property_event_totals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->date('day');
            $table->string('event', 30);
            $table->unsignedBigInteger('total')->default(0);
            $table->unique(['property_id', 'day', 'event']);
            $table->index(['day', 'event']);
        });
    }

    public function down(): void
    {
        // Anonymization cannot be undone. Keep the compatible expanded schema;
        // recovery from a backup needs approved re-redaction before serving data.
        throw new RuntimeException('Privacy schema rollback requires an approved isolated restore; use code rollback with schema retained.');
    }
};
