<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('users')->selectRaw('LOWER(email)')->groupByRaw('LOWER(email)')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Selesaikan duplikasi email tanpa membedakan kapital sebelum migrasi workspace operasi.');
        }
        Schema::table('users', fn (Blueprint $table) => $table->unsignedInteger('version')->default(1));
        DB::statement('CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))');
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('subject_type', 30);
            $table->unsignedBigInteger('subject_id');
            $table->string('action', 40);
            $table->json('changes')->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['subject_type', 'subject_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        DB::statement('DROP INDEX users_email_lower_unique');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('version'));
    }
};
