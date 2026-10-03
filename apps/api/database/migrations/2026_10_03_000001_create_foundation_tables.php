<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('MARKETING');
            $table->boolean('is_active')->default(true);
        });
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->string('slug', 160)->unique();
            $table->string('title', 160);
            $table->string('house_type', 80);
            $table->string('condition', 20);
            $table->string('certificate', 80);
            $table->string('location', 160);
            $table->string('address', 500);
            $table->text('description');
            $table->bigInteger('price_idr');
            $table->decimal('land_area', 10, 2);
            $table->decimal('building_area', 10, 2);
            $table->unsignedSmallInteger('bedrooms');
            $table->unsignedSmallInteger('bathrooms');
            $table->string('publication', 20)->default('DRAFT');
            $table->string('availability', 20)->default('AVAILABLE');
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->index(['publication', 'created_at', 'id']);
            $table->index(['publication', 'price_idr', 'id']);
            $table->index('owner_id');
        });
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('whatsapp_number', 15);
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('assigned_marketing_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('status', 30)->default('NEW_LEAD');
            $table->unsignedInteger('version')->default(1);
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('first_followed_up_at')->nullable();
            $table->timestamps();
            $table->unique(['whatsapp_number', 'property_id']);
            $table->index(['assigned_marketing_id', 'status', 'id']);
            $table->index(['status', 'created_at']);
        });
        Schema::create('lead_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('type', 30);
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30)->nullable();
            $table->foreignId('from_assignee')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('to_assignee')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['lead_id', 'created_at', 'id']);
        });
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('recipient_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('lead_id')->constrained()->restrictOnDelete();
            $table->foreignId('history_id')->constrained('lead_histories')->restrictOnDelete();
            $table->string('kind', 30);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['recipient_id', 'history_id']);
            $table->index(['recipient_id', 'read_at', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('lead_histories');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('properties');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'is_active']));
    }
};
