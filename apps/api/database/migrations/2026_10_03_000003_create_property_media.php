<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->string('kind', 20);
            $table->string('state', 20)->default('PROCESSING');
            $table->string('alt', 240);
            $table->unsignedInteger('position')->default(0);
            $table->boolean('published')->default(true);
            $table->string('staging_path')->nullable();
            $table->string('url', 2048)->nullable();
            $table->string('mime', 80)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->json('variants')->nullable();
            $table->string('failure_code', 40)->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('purged_at')->nullable();
            $table->timestamps();
            $table->index(['property_id', 'state', 'published', 'position', 'id']);
            $table->index(['state', 'archived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_media');
    }
};
