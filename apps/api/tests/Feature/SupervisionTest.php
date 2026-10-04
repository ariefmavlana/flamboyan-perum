<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\Property;
use App\Models\User;
use App\Services\LeadPrivacy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class SupervisionTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $marketing = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create(['owner_id' => $marketing->id, 'publication' => 'PUBLISHED', 'slug' => 'report-test', 'title' => 'Report test', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bogor', 'address' => 'Test', 'description' => 'Test', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2]);

        return [$admin, $marketing, $property];
    }

    public function test_cohort_jakarta_boundaries_conversion_and_first_actor_are_distinct(): void
    {
        [$admin, $marketing, $property] = $this->fixture();
        $this->travelTo(now()->setDate(2026, 10, 3)->setTime(12, 0));
        $other = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        foreach ([['2026-10-01 16:59:59', 'DEAL'], ['2026-10-01 17:00:00', 'DEAL'], ['2026-10-02 16:59:59', 'NEW_LEAD'], ['2026-10-02 17:00:00', 'LOST']] as $i => [$created, $status]) {
            $lead = Lead::create(['name' => 'Secret contact', 'whatsapp_number' => '62812345678'.$i, 'property_id' => $property->id]);
            $lead->forceFill(['created_at' => $created, 'status' => $status, 'assigned_marketing_id' => $other->id, 'assigned_at' => '2026-10-02 01:00:00', 'first_followed_up_at' => $status === 'DEAL' ? '2026-10-02 03:00:00' : null])->save();
            if ($status === 'DEAL') {
                LeadHistory::create(['lead_id' => $lead->id, 'actor_id' => $marketing->id, 'type' => 'STATUS_CHANGED', 'to_status' => 'FOLLOWED_UP']);
            }
        }
        $this->getJson('/api/v1/internal/reports')->assertUnauthorized();
        $this->actingAs($marketing)->getJson('/api/v1/internal/reports')->assertForbidden();
        $result = $this->actingAs($admin)->getJson('/api/v1/internal/reports?from=2026-10-02&to=2026-10-02')->assertOk()->assertJsonPath('data.cohort_size', 2)->assertJsonPath('data.conversion_percent', 50)->assertJsonPath('data.follow_up.median_seconds', 7200)->assertJsonPath('data.follow_up.not_followed_up', 1)->json('data');
        $this->assertSame($other->id, $result['current_assignees'][0]['user_id']);
        $this->assertSame($marketing->id, $result['first_follow_up_actors'][0]['user_id']);
        $this->assertStringNotContainsString('Secret contact', json_encode($result));
        $this->getJson('/api/v1/internal/reports?from=2024-01-01&to=2026-10-02')->assertUnprocessable();
        $this->getJson('/api/v1/internal/reports?from=2026-10-03&to=2026-10-02')->assertUnprocessable();
        $this->getJson('/api/v1/internal/reports?from=2026-09-01&to=2026-09-01')->assertJsonPath('data.cohort_size', 0)->assertJsonPath('data.follow_up.median_seconds', null);
    }

    public function test_funnel_records_only_aggregate_allowlist_and_never_matches_a_contact(): void
    {
        [, , $property] = $this->fixture();
        $this->postJson('/api/v1/analytics', ['property_id' => $property->id, 'event' => 'property_view'])->assertServiceUnavailable();
        config(['privacy.analytics_enabled' => true]);
        foreach (range(1, 2) as $_) {
            $this->postJson('/api/v1/analytics', ['property_id' => $property->id, 'event' => 'property_view'])->assertStatus(202)->assertCookieMissing('laravel_session');
        }
        $this->assertDatabaseHas('property_event_totals', ['property_id' => $property->id, 'event' => 'property_view', 'total' => 2]);
        $this->assertDatabaseCount('property_event_totals', 1);
        $this->postJson('/api/v1/analytics', ['property_id' => $property->id, 'event' => 'whatsapp_click', 'phone' => 'secret'])->assertUnprocessable();
        $property->update(['publication' => 'DRAFT']);
        $this->postJson('/api/v1/analytics', ['property_id' => $property->id, 'event' => 'whatsapp_click'])->assertNotFound();
        $this->assertDatabaseCount('leads', 0);
    }

    public function test_privacy_policy_terminal_version_atomic_redaction_and_no_api_history_mutation(): void
    {
        [$admin, $marketing, $property] = $this->fixture();
        $lead = Lead::create(['name' => 'Private customer', 'whatsapp_number' => '628123456789', 'property_id' => $property->id]);
        $history = LeadHistory::create(['lead_id' => $lead->id, 'actor_id' => $marketing->id, 'type' => 'NOTE_ADDED', 'note' => 'Private number 628123456789']);
        ActivityLog::create(['actor_id' => $admin->id, 'subject_type' => 'LEAD', 'subject_id' => $lead->id, 'action' => 'CONTACT_UPDATED', 'reason' => 'Private customer correction']);
        $this->artisan('flamboyan:lead-anonymize', ['id' => $lead->id])->assertSuccessful();
        $this->assertSame('Private customer', $lead->fresh()->name);
        $privacy = app(LeadPrivacy::class);
        try {
            $privacy->anonymize($admin, $lead->id, 1, 'CASE-001', false);
            $this->fail('Policy required');
        } catch (HttpException $error) {
            $this->assertSame(503, $error->getStatusCode());
        }
        config(['privacy.retention_approved' => true, 'privacy.policy_reference' => 'POLICY-001']);
        try {
            $privacy->anonymize($admin, $lead->id, 1, 'CASE-001', false);
            $this->fail('Terminal required');
        } catch (HttpException $error) {
            $this->assertSame(409, $error->getStatusCode());
        }
        $lead->forceFill(['status' => 'LOST'])->save();
        ActivityLog::creating(fn ($row) => $row->action === 'ANONYMIZED' ? throw new \RuntimeException('Audit unavailable') : null);
        try {
            $privacy->anonymize($admin, $lead->id, 1, 'CASE-001', false);
            $this->fail('Audit rollback');
        } catch (\RuntimeException) {
        }
        $this->assertSame('Private customer', $lead->fresh()->name);
        $this->assertNotNull($history->fresh()->note);
        ActivityLog::flushEventListeners();
        $privacy->anonymize($admin, $lead->id, 1, 'CASE-001', false);
        $this->assertNull($lead->fresh()->whatsapp_number);
        $this->assertNull($history->fresh()->note);
        $this->assertNotNull($history->fresh()->redacted_at);
        $this->assertSame(2, $lead->fresh()->version);
        $this->assertDatabaseHas('activity_logs', ['action' => 'ANONYMIZED', 'reason' => 'CASE-001']);
        $this->actingAs($admin)->postJson('/api/v1/leads/'.$lead->id.'/notes', ['version' => 2, 'note' => 'reinsert PII'])->assertConflict();
        $this->patchJson('/api/v1/leads/'.$lead->id.'/history/'.$history->id, ['note' => 'edit'])->assertNotFound();
        $this->assertSame($marketing->id, $history->fresh()->actor_id);
    }

    public function test_retention_candidates_exclude_live_recent_and_redacted_and_cli_requires_identity(): void
    {
        [$admin, $marketing, $property] = $this->fixture();
        $lead = Lead::create(['name' => 'Customer', 'whatsapp_number' => '628987654321', 'property_id' => $property->id]);
        $lead->forceFill(['status' => 'LOST', 'updated_at' => now()->subMonths(25)])->save();
        $this->actingAs($marketing)->getJson('/api/v1/internal/privacy')->assertForbidden();
        $this->actingAs($admin)->getJson('/api/v1/internal/privacy')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.name')->assertJsonPath('data.0.id', $lead->id);
        config(['privacy.retention_approved' => true, 'privacy.policy_reference' => 'POLICY-001']);
        $this->artisan('flamboyan:lead-anonymize', ['id' => $lead->id, '--execute' => true, '--actor' => $admin->email, '--lead-version' => 1, '--request' => 'CASE-002'])->expectsQuestion('Kata sandi Admin', 'wrong-password')->assertFailed();
        $this->assertNull($lead->fresh()->anonymized_at);
        $this->artisan('flamboyan:lead-anonymize', ['id' => $lead->id, '--execute' => true, '--actor' => $admin->email, '--lead-version' => 1, '--request' => 'CASE-002', '--retention' => true])->expectsQuestion('Kata sandi Admin', 'password')->expectsQuestion('Ketik ANONYMIZE '.$lead->id.' untuk konfirmasi redaksi permanen', 'ANONYMIZE '.$lead->id)->assertSuccessful();
        $this->getJson('/api/v1/internal/privacy')->assertJsonCount(0, 'data');
        $this->assertDatabaseCount('leads', 1);
        $this->assertNull(DB::table('leads')->value('whatsapp_number'));
    }
}
