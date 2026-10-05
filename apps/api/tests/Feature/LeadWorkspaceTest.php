<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_summary_and_work_queues_are_scoped_and_cover_the_entire_dataset(): void
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $other = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create([
            'owner_id' => $owner->id, 'slug' => 'workspace-home', 'title' => 'Rumah',
            'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM',
            'location' => 'Bandung', 'address' => 'Alamat', 'description' => 'Rumah',
            'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60,
            'bedrooms' => 3, 'bathrooms' => 2,
        ]);
        $make = function (?User $assignee, string $status = 'NEW_LEAD', bool $anonymous = false) use ($property): Lead {
            $lead = Lead::create(['name' => 'Pembeli', 'whatsapp_number' => fake()->unique()->numerify('628##########'), 'property_id' => $property->id, 'assigned_marketing_id' => $assignee?->id]);
            $lead->forceFill(['status' => $status, 'anonymized_at' => $anonymous ? now() : null])->save();

            return $lead;
        };
        for ($i = 0; $i < 23; $i++) {
            $make($owner);
        }
        $make($other);
        $make(null);
        $make($owner, 'FOLLOWED_UP');
        $make($owner, 'SURVEY_LOKASI');
        $make($owner, 'PEMBERKASAN_KPR');
        $make(null, 'DEAL');
        $make($owner, 'LOST');
        $make($owner, 'NEW_LEAD', true);

        $this->actingAs($admin)->getJson('/api/v1/leads/summary')->assertOk()
            ->assertJsonPath('data.total', 31)->assertJsonPath('data.active', 28)
            ->assertJsonPath('data.work.unassigned', 1)->assertJsonPath('data.work.contact', 24)
            ->assertJsonPath('data.work.visit', 2)->assertJsonPath('data.work.documents', 1)
            ->assertJsonMissingPath('data.name')->assertJsonMissingPath('data.whatsapp_number');

        $this->actingAs($owner)->getJson('/api/v1/leads/summary')->assertOk()
            ->assertJsonPath('data.total', 28)->assertJsonPath('data.active', 26)
            ->assertJsonPath('data.work.unassigned', 0)->assertJsonPath('data.work.contact', 23)
            ->assertJsonPath('data.statuses.DEAL', 0);
        foreach (['unassigned' => 0, 'contact' => 23, 'visit' => 2, 'documents' => 1] as $queue => $count) {
            $this->getJson('/api/v1/leads?work='.$queue.'&per_page=1')->assertOk()->assertJsonPath('meta.total', $count);
        }
        $this->getJson('/api/v1/leads?work=contact&status=LOST')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/v1/leads?work=contact&assigned_marketing_id='.$other->id)->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/v1/leads?work=invalid')->assertUnprocessable();
        $this->actingAs($admin)->getJson('/api/v1/leads?work=unassigned')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_summary_requires_an_active_session_and_empty_counts_are_zero(): void
    {
        $this->getJson('/api/v1/leads/summary')->assertUnauthorized();
        $this->actingAs(User::factory()->create(['is_active' => false]))->getJson('/api/v1/leads/summary')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'MARKETING', 'is_active' => true]))
            ->getJson('/api/v1/leads/summary')->assertOk()->assertJsonPath('data.total', 0)
            ->assertJsonPath('data.active', 0)->assertJsonPath('data.statuses.NEW_LEAD', 0);
    }
}
