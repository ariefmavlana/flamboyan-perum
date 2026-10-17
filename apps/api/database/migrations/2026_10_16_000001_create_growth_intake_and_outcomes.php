<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_inquiries', function (Blueprint $table) {
            $table->id();
            $table->uuid('receipt')->unique();
            $table->char('idempotency_key_hash', 64)->unique();
            $table->char('payload_hash', 64);
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name', 160)->nullable();
            $table->string('whatsapp_number', 15)->nullable();
            $table->string('purpose', 30);
            $table->timestamp('preferred_visit_at')->nullable();
            $table->text('message')->nullable();
            $table->string('privacy_notice_version', 80);
            $table->boolean('marketing_opt_in')->default(false);
            $table->string('state', 20)->default('PENDING');
            $table->unsignedInteger('version')->default(1);
            $table->string('resolution_action', 30)->nullable();
            $table->text('resolution_reason')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('anonymized_at')->nullable();
            $table->timestamps();
            $table->index(['state', 'created_at', 'id']);
            $table->index(['property_id', 'whatsapp_number']);
            $table->index(['lead_id', 'created_at']);
            $table->index(['anonymized_at', 'state', 'updated_at']);
        });

        Schema::create('lead_attributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inquiry_id')->nullable()->unique()->constrained('lead_inquiries')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('first_source', 120)->nullable();
            $table->string('first_medium', 120)->nullable();
            $table->string('first_campaign', 120)->nullable();
            $table->string('first_content', 120)->nullable();
            $table->string('first_term', 120)->nullable();
            $table->timestamp('first_captured_at')->nullable();
            $table->string('last_source', 120)->nullable();
            $table->string('last_medium', 120)->nullable();
            $table->string('last_campaign', 120)->nullable();
            $table->string('last_content', 120)->nullable();
            $table->string('last_term', 120)->nullable();
            $table->timestamp('last_captured_at')->nullable();
            $table->string('method', 30)->default('UNKNOWN');
            $table->boolean('analytics_consent')->default(false);
            $table->boolean('marketing_consent')->default(false);
            $table->string('privacy_notice_version', 80);
            $table->timestamp('captured_at')->nullable();
            $table->string('consent_version', 80)->nullable();
            $table->timestamp('consent_decided_at')->nullable();
            $table->timestamps();
            $table->index(['lead_id', 'captured_at']);
            $table->index(['first_source', 'first_campaign', 'created_at']);
            $table->index(['last_source', 'last_campaign', 'created_at']);
        });

        Schema::create('lead_outcomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->unique()->constrained()->restrictOnDelete();
            $table->boolean('qualified')->nullable();
            $table->text('qualification_reason')->nullable();
            $table->foreignId('qualification_actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('qualification_changed_at')->nullable();
            $table->boolean('akad_confirmed')->default(false);
            $table->timestamp('akad_occurred_at')->nullable();
            $table->string('akad_reference', 120)->nullable();
            $table->text('akad_reason')->nullable();
            $table->foreignId('akad_actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('akad_changed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('lead_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->restrictOnDelete();
            $table->timestamp('scheduled_at')->nullable();
            $table->string('status', 20);
            $table->boolean('was_confirmed')->default(false);
            $table->text('reason')->nullable();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->index(['lead_id', 'created_at', 'id']);
            $table->index(['status', 'scheduled_at']);
        });

        Schema::table('lead_histories', function (Blueprint $table) {
            $table->json('metadata')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lead_histories', fn (Blueprint $table) => $table->dropColumn('metadata'));
        Schema::dropIfExists('lead_visits');
        Schema::dropIfExists('lead_outcomes');
        Schema::dropIfExists('lead_attributions');
        Schema::dropIfExists('lead_inquiries');
    }
};
