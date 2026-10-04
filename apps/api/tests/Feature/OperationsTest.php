<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\Property;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class OperationsTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'ADMIN'): User
    {
        return User::factory()->create(['role' => $role, 'is_active' => true, 'email_verified_at' => now()]);
    }

    private function property(User $owner): Property
    {
        return Property::create(['owner_id' => $owner->id, 'slug' => 'operasi-'.fake()->unique()->numerify('#####'), 'title' => 'Rumah Operasi', 'house_type' => 'Tipe 60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bogor', 'address' => 'Alamat pengujian', 'description' => 'Deskripsi pengujian', 'price_idr' => 800000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2]);
    }

    public function test_admin_accounts_are_versioned_audited_and_last_admin_is_protected(): void
    {
        $admin = $this->user();
        $this->actingAs($admin)->postJson('/api/v1/internal/users', ['name' => 'Tim Baru', 'email' => 'TIM@example.test', 'role' => 'MARKETING', 'password' => 'Sandi-pengujian-2026', 'password_confirmation' => 'Sandi-pengujian-2026', 'identity_verified' => true])->assertCreated()->assertJsonPath('data.email', 'tim@example.test')->assertJsonMissingPath('data.password');
        $target = User::where('email', 'tim@example.test')->firstOrFail();
        $this->patchJson('/api/v1/internal/users/'.$target->id, ['version' => 1, 'name' => 'Tim Diperbarui'])->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson('/api/v1/internal/users/'.$target->id, ['version' => 1, 'is_active' => false])->assertConflict();
        $this->patchJson('/api/v1/internal/users/'.$admin->id, ['version' => 1, 'is_active' => false])->assertConflict();
        $this->assertDatabaseHas('activity_logs', ['subject_type' => 'USER', 'subject_id' => $target->id, 'action' => 'CREATED']);
        $this->actingAs($this->user('MARKETING'))->getJson('/api/v1/internal/users')->assertForbidden();
    }

    public function test_workload_must_be_transferred_before_deactivation_and_old_owner_loses_access(): void
    {
        $admin = $this->user();
        $old = $this->user('MARKETING');
        $new = $this->user('MARKETING');
        $property = $this->property($old);
        $this->actingAs($admin)->patchJson('/api/v1/internal/users/'.$old->id, ['version' => 1, 'is_active' => false])->assertConflict();
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/owner', ['version' => 1, 'owner_id' => $new->id, 'reason' => 'Alih tanggung jawab'])->assertOk()->assertJsonPath('data.version', 2);
        $this->actingAs($old)->getJson('/api/v1/internal/properties/'.$property->id)->assertNotFound();
        $this->actingAs($admin)->patchJson('/api/v1/internal/users/'.$old->id, ['version' => 1, 'is_active' => false])->assertOk();
        $this->assertDatabaseHas('activity_logs', ['subject_type' => 'PROPERTY', 'subject_id' => $property->id, 'action' => 'OWNER_CHANGED']);
    }

    public function test_profile_password_changes_revoke_sessions_and_require_current_password(): void
    {
        $user = $this->user('MARKETING');
        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        $this->actingAs($user)->patchJson('/api/v1/me', ['version' => 1, 'name' => 'Nama Profil', 'role' => 'ADMIN'])->assertUnprocessable();
        $this->patchJson('/api/v1/me', ['version' => 1, 'name' => 'Nama Profil', 'current_password' => 'wrong', 'password' => 'Sandi-baru-2026', 'password_confirmation' => 'Sandi-baru-2026'])->assertUnprocessable();
        $this->patchJson('/api/v1/me', ['version' => 1, 'name' => 'Nama Profil', 'current_password' => 'password', 'password' => 'Sandi-baru-2026', 'password_confirmation' => 'Sandi-baru-2026'])->assertOk();
        $this->assertTrue(Hash::check('Sandi-baru-2026', $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']);
    }

    public function test_recovery_is_generic_verified_active_single_use_and_revokes_sessions(): void
    {
        Notification::fake();
        $user = $this->user('MARKETING');
        $this->postJson('/auth/forgot-password', ['email' => $user->email])->assertAccepted();
        $this->postJson('/auth/forgot-password', ['email' => 'absent@example.test'])->assertAccepted();
        Notification::assertSentTo($user, ResetPassword::class);
        $token = Password::createToken($user);
        DB::table('sessions')->insert(['id' => 'recovery-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        $body = ['email' => $user->email, 'token' => $token, 'password' => 'Sandi-recovery-2026', 'password_confirmation' => 'Sandi-recovery-2026'];
        $this->postJson('/auth/reset-password', $body)->assertOk();
        $this->postJson('/auth/reset-password', $body)->assertUnprocessable();
        $this->assertDatabaseMissing('sessions', ['id' => 'recovery-session']);
        $inactive = $this->user('MARKETING');
        $inactive->forceFill(['is_active' => false])->save();
        $this->postJson('/auth/forgot-password', ['email' => $inactive->email])->assertAccepted();
        Notification::assertNotSentTo($inactive, ResetPassword::class);
    }

    public function test_lead_contact_correction_is_admin_only_atomic_deduplicated_and_versioned(): void
    {
        $admin = $this->user();
        $marketing = $this->user('MARKETING');
        $property = $this->property($marketing);
        $lead = Lead::create(['name' => 'Nama Lama', 'whatsapp_number' => '628111111111', 'property_id' => $property->id, 'assigned_marketing_id' => $marketing->id]);
        $this->actingAs($marketing)->patchJson('/api/v1/leads/'.$lead->id.'/contact', ['version' => 1, 'name' => 'Nama Benar', 'whatsapp_number' => '081222222222', 'reason' => 'Koreksi input'])->assertForbidden();
        $this->actingAs($admin)->patchJson('/api/v1/leads/'.$lead->id.'/contact', ['version' => 1, 'name' => 'Nama Benar', 'whatsapp_number' => '081222222222', 'reason' => 'Koreksi input'])->assertOk()->assertJsonPath('data.whatsapp_number', '6281222222222')->assertJsonPath('data.version', 2);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'CONTACT_UPDATED', 'note' => 'Koreksi input']);
        $other = Lead::create(['name' => 'Lain', 'whatsapp_number' => '6281333333333', 'property_id' => $property->id]);
        $this->patchJson('/api/v1/leads/'.$lead->id.'/contact', ['version' => 2, 'name' => 'Duplikat', 'whatsapp_number' => $other->whatsapp_number, 'reason' => 'Koreksi'])->assertConflict();
        $this->assertSame(2, $lead->fresh()->version);
    }

    public function test_expired_and_unverified_recovery_tokens_cannot_change_password(): void
    {
        Notification::fake();
        $user = $this->user('MARKETING');
        $token = Password::createToken($user);
        DB::table('password_reset_tokens')->where('email', $user->email)->update(['created_at' => now()->subMinutes(61)]);
        $body = ['email' => $user->email, 'token' => $token, 'password' => 'Sandi-expired-2026', 'password_confirmation' => 'Sandi-expired-2026'];
        $this->postJson('/auth/reset-password', $body)->assertUnprocessable();
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
        $user->forceFill(['email_verified_at' => null])->save();
        $this->postJson('/auth/forgot-password', ['email' => $user->email])->assertAccepted();
        Notification::assertNotSentTo($user, ResetPassword::class);
    }

    public function test_security_stamp_rejects_a_session_recreated_after_revocation(): void
    {
        $user = $this->user();
        $this->withHeader('Origin', 'http://localhost:3000')->withSession(['account_security_stamp' => 'old-stamp'])->actingAs($user)->getJson('/api/v1/me')->assertUnauthorized();
        $this->assertSame($user->remember_token, $user->fresh()->remember_token);
        $this->withSession([])->actingAs($user)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_inactive_account_denial_also_clears_the_stale_login_session(): void
    {
        $user = $this->user('MARKETING');
        $user->forceFill(['is_active' => false])->save();
        $this->withHeader('Origin', 'http://localhost:3000')
            ->withSession(['account_security_stamp' => $user->remember_token])
            ->actingAs($user)
            ->getJson('/api/v1/me')
            ->assertForbidden()
            ->assertSessionMissing('account_security_stamp');
        $this->assertGuest('web');
    }

    public function test_auth_errors_are_json_even_when_a_proxy_drops_the_accept_header(): void
    {
        $this->withHeader('Accept', 'text/html')->post('/auth/login', [
            'email' => 'absent@example.test', 'password' => 'Incorrect-password-2026',
        ])->assertUnprocessable()->assertHeader('Content-Type', 'application/json')->assertJsonValidationErrors('email');
        foreach (['/auth/forgot-password', '/auth/reset-password'] as $path) {
            $this->post($path, [])->assertUnprocessable()->assertHeader('Content-Type', 'application/json')->assertJsonValidationErrors('email');
        }
    }

    public function test_normal_logout_does_not_revoke_other_device_security_stamps(): void
    {
        $user = $this->user('MARKETING');
        $stamp = $user->remember_token;
        $this->postJson('/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $this->postJson('/auth/logout')->assertNoContent();
        $this->assertSame($stamp, $user->fresh()->remember_token);
    }

    public function test_case_insensitive_email_duplicates_and_login_are_consistent(): void
    {
        $admin = $this->user();
        $existing = $this->user('MARKETING');
        $this->actingAs($admin)->postJson('/api/v1/internal/users', ['name' => 'Duplikat', 'email' => strtoupper($existing->email), 'role' => 'MARKETING', 'password' => 'Sandi-duplikat-2026', 'password_confirmation' => 'Sandi-duplikat-2026'])->assertConflict();
        $this->postJson('/auth/login', ['email' => strtoupper($existing->email), 'password' => 'password'])->assertOk()->assertJsonPath('data.id', $existing->id);
    }

    public function test_active_assigned_leads_block_deactivation_and_marketing_cannot_transfer_owner(): void
    {
        $admin = $this->user();
        $marketing = $this->user('MARKETING');
        $property = $this->property($marketing);
        $property->update(['publication' => 'ARCHIVED']);
        Lead::create(['name' => 'Masih aktif', 'whatsapp_number' => '628188888888', 'property_id' => $property->id, 'assigned_marketing_id' => $marketing->id]);
        $this->actingAs($admin)->patchJson('/api/v1/internal/users/'.$marketing->id, ['version' => 1, 'is_active' => false])->assertConflict();
        $this->actingAs($marketing)->postJson('/api/v1/internal/properties/'.$property->id.'/owner', ['version' => 1, 'owner_id' => $admin->id, 'reason' => 'Tidak berwenang'])->assertForbidden();
        $this->getJson('/api/v1/internal/audit')->assertForbidden();
    }

    public function test_audit_failure_rolls_back_account_and_contact_mutations(): void
    {
        $admin = $this->user();
        $marketing = $this->user('MARKETING');
        $property = $this->property($marketing);
        $lead = Lead::create(['name' => 'Asli', 'whatsapp_number' => '628199999999', 'property_id' => $property->id]);
        ActivityLog::creating(fn () => throw new \RuntimeException('Simulated audit failure'));
        try {
            $this->actingAs($admin)->patchJson('/api/v1/internal/users/'.$marketing->id, ['version' => 1, 'name' => 'Tidak tersimpan'])->assertStatus(500);
            $this->assertSame(1, $marketing->fresh()->version);
        } finally {
            ActivityLog::flushEventListeners();
        }
        LeadHistory::creating(fn () => throw new \RuntimeException('Simulated history failure'));
        try {
            $this->patchJson('/api/v1/leads/'.$lead->id.'/contact', ['version' => 1, 'name' => 'Tidak tersimpan', 'whatsapp_number' => '628177777777', 'reason' => 'Koreksi'])->assertStatus(500);
            $this->assertSame('Asli', $lead->fresh()->name);
            $this->assertSame(1, $lead->fresh()->version);
        } finally {
            LeadHistory::flushEventListeners();
        }
    }

    public function test_recovery_requests_are_rate_limited_without_account_enumeration(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/auth/forgot-password', ['email' => 'rate-limit@example.test'])->assertAccepted();
        }
        $this->postJson('/auth/forgot-password', ['email' => 'rate-limit@example.test'])->assertTooManyRequests();
    }

    public function test_legacy_email_case_recovery_and_production_mail_gate(): void
    {
        Notification::fake();
        $user = $this->user('MARKETING');
        $user->forceFill(['email' => strtoupper($user->email)])->save();
        $token = Password::createToken($user);
        $this->postJson('/auth/reset-password', ['email' => strtolower($user->email), 'token' => $token, 'password' => 'Sandi-kapital-2026', 'password_confirmation' => 'Sandi-kapital-2026'])->assertOk();
        config(['app.env' => 'production', 'mail.default' => 'log']);
        $this->postJson('/auth/forgot-password', ['email' => $user->email])->assertStatus(503);
        $this->postJson('/auth/forgot-password', ['email' => 'absent-production@example.test'])->assertStatus(503);
        Notification::assertNothingSent();
    }

    public function test_stale_owner_transfer_and_invalid_targets_do_not_add_audit(): void
    {
        $admin = $this->user();
        $owner = $this->user('MARKETING');
        $next = $this->user('MARKETING');
        $property = $this->property($owner);
        $this->actingAs($admin)->postJson('/api/v1/internal/properties/'.$property->id.'/owner', ['version' => 99, 'owner_id' => $next->id, 'reason' => 'Stale'])->assertConflict();
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/owner', ['version' => 1, 'owner_id' => $admin->id, 'reason' => 'Role salah'])->assertUnprocessable();
        $this->assertSame($owner->id, $property->fresh()->owner_id);
        $this->assertDatabaseCount('activity_logs', 0);
        $this->patchJson('/api/v1/internal/audit/1', ['action' => 'UPDATED'])->assertNotFound();
    }
}
