<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadVisit;
use App\Models\Property;
use App\Models\User;
use App\Services\LeadPrivacy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GrowthOutcomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_outcomes_are_scoped_version_guarded_and_append_only(): void
    {
        [$admin, $marketing, $other, $lead] = $this->fixture();

        $this->actingAs($other)->getJson('/api/v1/internal/leads/'.$lead->id.'/outcomes')->assertNotFound();
        $this->actingAs($marketing)->getJson('/api/v1/internal/leads/'.$lead->id.'/outcomes')->assertOk()
            ->assertJsonPath('data.lead_version', 1)->assertJsonPath('data.qualification', null)
            ->assertJsonPath('data.visits', [])->assertJsonPath('data.attribution.method', 'UNKNOWN');

        $this->patchJson('/api/v1/internal/leads/'.$lead->id.'/qualification', ['version' => 1, 'qualified' => true, 'reason' => 'Anggaran dan kebutuhan terkonfirmasi.'])
            ->assertOk()->assertJsonPath('data.lead_version', 2)->assertJsonPath('data.qualification.qualified', true);
        $this->patchJson('/api/v1/internal/leads/'.$lead->id.'/qualification', ['version' => 1, 'qualified' => false, 'reason' => 'Stale'])->assertConflict();
        $visit = $this->postJson('/api/v1/internal/leads/'.$lead->id.'/visits', ['version' => 2, 'status' => 'REQUESTED', 'reason' => 'Calon pembeli meminta survei.'])
            ->assertCreated()->assertJsonPath('data.lead_version', 3)->json('data.visits.0');
        $this->patchJson('/api/v1/internal/leads/'.$lead->id.'/visits/'.$visit['id'], [
            'version' => 3, 'status' => 'CONFIRMED', 'scheduled_at' => now()->addDay()->toIso8601String(),
        ])->assertOk()->assertJsonPath('data.lead_version', 4)->assertJsonPath('data.visits.0.status', 'CONFIRMED');
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'QUALIFICATION_CHANGED']);
        $this->assertDatabaseCount('lead_histories', 3);

        $this->actingAs($other)->patchJson('/api/v1/internal/leads/'.$lead->id.'/qualification', ['version' => 4, 'qualified' => false, 'reason' => 'Tidak boleh'])->assertNotFound();
        $this->actingAs($marketing)->postJson('/api/v1/internal/leads/'.$lead->id.'/akad-confirmation', ['version' => 4, 'confirmed' => true, 'occurred_at' => now()->toIso8601String(), 'reference' => 'AKAD-001'])->assertForbidden();

        $lead->forceFill(['status' => 'DEAL'])->save();
        $this->actingAs($admin)->postJson('/api/v1/internal/leads/'.$lead->id.'/akad-confirmation', [
            'version' => 4, 'confirmed' => true, 'occurred_at' => now()->subHour()->toIso8601String(), 'reference' => 'AKAD-001', 'reason' => 'Diverifikasi Admin.',
        ])->assertOk()->assertJsonPath('data.lead_version', 5)->assertJsonPath('data.akad.confirmed', true);
        $this->postJson('/api/v1/internal/leads/'.$lead->id.'/akad-confirmation', [
            'version' => 5, 'confirmed' => false, 'reason' => 'Koreksi dokumen.',
        ])->assertOk()->assertJsonPath('data.lead_version', 6)->assertJsonPath('data.akad.confirmed', false);
        $this->patchJson('/api/v1/internal/leads/'.$lead->id.'/attribution', [
            'version' => 6, 'source' => 'walk_in', 'medium' => 'offline', 'campaign' => 'kantor_pemasaran', 'reason' => 'Dikonfirmasi Admin.',
        ])->assertOk()->assertJsonPath('data.lead_version', 7)->assertJsonPath('data.attribution.method', 'ADMIN_REPORTED');
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'AKAD_CONFIRMED']);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'AKAD_REVOKED']);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'ATTRIBUTION_CORRECTED']);
    }

    public function test_akad_requires_deal_and_non_pii_reference(): void
    {
        [$admin, , , $lead] = $this->fixture();
        $this->actingAs($admin)->postJson('/api/v1/internal/leads/'.$lead->id.'/akad-confirmation', [
            'version' => 1, 'confirmed' => true, 'occurred_at' => now()->toIso8601String(), 'reference' => 'AKAD-001',
        ])->assertConflict();
        $lead->forceFill(['status' => 'DEAL'])->save();
        $this->postJson('/api/v1/internal/leads/'.$lead->id.'/akad-confirmation', [
            'version' => 1, 'confirmed' => true, 'occurred_at' => now()->toIso8601String(), 'reference' => '628123456789',
        ])->assertUnprocessable();
        $this->assertDatabaseMissing('lead_histories', ['lead_id' => $lead->id, 'type' => 'AKAD_CONFIRMED']);
    }

    public function test_visit_reschedule_attendance_and_terminal_guards(): void
    {
        [$admin, , , $lead] = $this->fixture();
        $base = '/api/v1/internal/leads/'.$lead->id;
        $this->actingAs($admin);
        $created = $this->postJson($base.'/visits', ['version' => 1, 'status' => 'CONFIRMED', 'scheduled_at' => now()->addDay()->toIso8601String()])->assertCreated();
        $visit = $created->json('data.visits.0.id');
        $this->patchJson($base.'/visits/'.$visit, ['version' => 2, 'status' => 'COMPLETED'])->assertUnprocessable();
        $this->patchJson($base.'/visits/'.$visit, ['version' => 2, 'status' => 'NO_SHOW', 'reason' => 'Belum waktunya'])->assertUnprocessable();
        $this->patchJson($base.'/visits/'.$visit, ['version' => 2, 'status' => 'CONFIRMED', 'scheduled_at' => now()->subDay()->toIso8601String(), 'reason' => 'Invalid'])->assertUnprocessable();
        $this->patchJson($base.'/visits/'.$visit, ['version' => 2, 'status' => 'CONFIRMED', 'scheduled_at' => now()->addDays(2)->toIso8601String(), 'reason' => 'Disepakati ulang'])->assertOk()->assertJsonPath('data.lead_version', 3);
        $this->travel(3)->days();
        $this->patchJson($base.'/visits/'.$visit, ['version' => 3, 'status' => 'COMPLETED'])->assertOk()->assertJsonPath('data.visits.0.status', 'COMPLETED');
        $from = $lead->created_at->timezone('Asia/Jakarta')->toDateString();
        $to = now()->timezone('Asia/Jakarta')->toDateString();
        $this->getJson('/api/v1/internal/reports?from='.$from.'&to='.$to)->assertOk()
            ->assertJsonPath('data.growth.visits_confirmed_unique', 1)
            ->assertJsonPath('data.growth.visits_completed_unique', 1);
        $next = $this->postJson($base.'/visits', ['version' => 4, 'status' => 'REQUESTED'])->assertCreated()->json('data.visits.0.id');
        $lead->forceFill(['status' => 'LOST'])->save();
        $this->patchJson($base.'/visits/'.$next, ['version' => 5, 'status' => 'CANCELLED', 'reason' => 'Terminal'])->assertConflict();
        $this->assertSame(5, $lead->fresh()->version);
    }

    public function test_akad_correction_requires_reason_and_privacy_clears_growth_pii_atomically(): void
    {
        [$admin, , , $lead] = $this->fixture();
        $lead->forceFill(['status' => 'DEAL'])->save();
        $this->actingAs($admin);
        $base = '/api/v1/internal/leads/'.$lead->id;
        $data = ['version' => 1, 'confirmed' => true, 'occurred_at' => now()->subHour()->toIso8601String(), 'reference' => 'AKAD-TEST'];
        $this->postJson($base.'/akad-confirmation', $data)->assertOk();
        $this->postJson($base.'/akad-confirmation', array_replace($data, ['version' => 2]))->assertConflict();
        $data['version'] = 2;
        $data['reference'] = 'AKAD-CORRECTED';
        $this->postJson($base.'/akad-confirmation', $data)->assertUnprocessable();
        $data['reason'] = 'Koreksi referensi';
        $this->postJson($base.'/akad-confirmation', $data)->assertOk();
        config(['privacy.retention_approved' => true, 'privacy.policy_reference' => 'TEST_POLICY']);
        app(LeadPrivacy::class)->anonymize($admin, $lead->id, 3, 'CASE_TEST', false);
        $this->assertDatabaseHas('lead_outcomes', ['lead_id' => $lead->id, 'akad_confirmed' => true, 'akad_reference' => null, 'akad_reason' => null]);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'AKAD_CORRECTED', 'metadata' => null, 'note' => null]);
    }

    public function test_growth_report_counts_manual_leads_once_and_keeps_unknown_costs_null(): void
    {
        [$admin, , , $lead] = $this->fixture();
        $this->actingAs($admin)->patchJson('/api/v1/internal/leads/'.$lead->id.'/qualification', ['version' => 1, 'qualified' => true, 'reason' => 'Dua arah'])->assertOk();
        foreach ([2, 3] as $version) {
            $this->patchJson('/api/v1/internal/leads/'.$lead->id.'/attribution', ['version' => $version, 'source' => 'google', 'medium' => 'organic', 'campaign' => 'bfi2', 'reason' => 'Admin mengonfirmasi sumber'])->assertOk();
        }
        $date = now()->timezone('Asia/Jakarta')->toDateString();
        $this->getJson('/api/v1/internal/reports?from='.$date.'&to='.$date)->assertOk()
            ->assertJsonPath('data.growth.cohort', 'lead_created_at')
            ->assertJsonPath('data.growth.inquiries.total', 0)
            ->assertJsonPath('data.growth.valid_leads_unique', 1)
            ->assertJsonPath('data.growth.qualified_unique', 1)
            ->assertJsonPath('data.growth.campaigns.0.valid_leads_unique', 1)
            ->assertJsonPath('data.growth.campaigns.0.method', 'ADMIN_REPORTED')
            ->assertJsonPath('data.growth.costs.cpl_idr', null);
    }

    public function test_visits_are_paginated_and_do_not_load_other_leads(): void
    {
        [$admin, , , $lead] = $this->fixture();
        for ($i = 0; $i < 51; $i++) {
            LeadVisit::create(['lead_id' => $lead->id, 'status' => 'REQUESTED', 'actor_id' => $admin->id]);
        }
        $this->actingAs($admin)->getJson('/api/v1/internal/leads/'.$lead->id.'/outcomes')->assertOk()
            ->assertJsonCount(50, 'data.visits')->assertJsonPath('data.visits_meta.total', 51)->assertJsonPath('data.visits_meta.last_page', 2);
        $this->getJson('/api/v1/internal/leads/'.$lead->id.'/outcomes?visits_page=2')->assertOk()
            ->assertJsonCount(1, 'data.visits')->assertJsonPath('data.visits_meta.current_page', 2);
    }

    private function fixture(): array
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $marketing = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $other = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create([
            'owner_id' => $marketing->id, 'slug' => 'outcome-home', 'title' => 'Tipe 36/60', 'house_type' => '36/60',
            'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Kabupaten Bandung', 'address' => 'Alamat',
            'description' => 'Hunian', 'price_idr' => 500000000, 'land_area' => 60, 'building_area' => 36,
            'bedrooms' => 2, 'bathrooms' => 1, 'publication' => 'PUBLISHED',
        ]);
        $lead = Lead::create(['name' => 'Calon pembeli', 'whatsapp_number' => '628123456789', 'property_id' => $property->id, 'assigned_marketing_id' => $marketing->id]);

        return [$admin, $marketing, $other, $lead];
    }
}
