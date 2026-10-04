<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_property_creation_cannot_spoof_owner_or_round_area_to_zero(): void
    {
        $owner = $this->user();
        $property = $this->property($owner);
        $payload = $property->only(['title', 'house_type', 'condition', 'certificate', 'location', 'address', 'description', 'price_idr', 'land_area', 'building_area', 'bedrooms', 'bathrooms']);
        $payload['slug'] = 'rumah-input';
        $this->actingAs($owner)->postJson('/api/v1/internal/properties', array_merge($payload, ['owner_id' => $this->user()->id]))->assertForbidden();
        $this->postJson('/api/v1/internal/properties', array_merge($payload, ['land_area' => 0.001]))->assertUnprocessable();
        $this->postJson('/api/v1/internal/properties', $payload)->assertCreated()->assertJsonPath('data.owner_id', $owner->id)->assertJsonPath('data.publication', 'DRAFT');
        $this->postJson('/api/v1/internal/properties', $payload)->assertConflict();
    }

    public function test_admin_property_owner_must_be_active_marketing(): void
    {
        $admin = $this->user('ADMIN');
        $property = $this->property($this->user());
        $payload = $property->only(['title', 'house_type', 'condition', 'certificate', 'location', 'address', 'description', 'price_idr', 'land_area', 'building_area', 'bedrooms', 'bathrooms']);
        $payload['slug'] = 'rumah-admin';
        $this->actingAs($admin)->postJson('/api/v1/internal/properties', array_merge($payload, ['owner_id' => $admin->id]))->assertUnprocessable();
        $this->postJson('/api/v1/internal/properties', array_merge($payload, ['owner_id' => $this->user('MARKETING', false)->id]))->assertUnprocessable();
    }

    public function test_reassignment_requires_reason_and_terminal_pipeline_preserves_availability(): void
    {
        $owner = $this->user();
        $property = $this->property($owner);
        $lead = $this->lead($owner, $property);
        $this->actingAs($this->user('ADMIN'))->postJson('/api/v1/leads/'.$lead->id.'/assignment', ['version' => 1, 'marketing_id' => $this->user()->id])->assertUnprocessable();
        foreach (['FOLLOWED_UP', 'SURVEY_LOKASI', 'PEMBERKASAN_KPR', 'DEAL'] as $index => $status) {
            $this->actingAs($owner)->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => $status, 'version' => $index + 1])->assertOk();
        }
        $this->assertSame('AVAILABLE', $property->fresh()->availability);
        $this->actingAs($this->user('ADMIN'))->postJson('/api/v1/leads/'.$lead->id.'/assignment', ['version' => 5, 'marketing_id' => $this->user()->id, 'reason' => 'Tidak boleh'])->assertConflict();
    }

    private function user(string $role = 'MARKETING', bool $active = true): User
    {
        return User::factory()->create(['role' => $role, 'is_active' => $active]);
    }

    private function property(User $owner, array $extra = []): Property
    {
        return Property::create(array_merge([
            'owner_id' => $owner->id, 'slug' => 'rumah-'.fake()->unique()->numerify('#######'),
            'title' => 'Rumah Taman', 'house_type' => 'Tipe 60', 'condition' => 'NEW',
            'certificate' => 'SHM', 'location' => 'Bogor', 'address' => 'Jalan Taman 1',
            'description' => 'Rumah dengan halaman.', 'price_idr' => 850000000,
            'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2,
            'publication' => 'PUBLISHED', 'availability' => 'AVAILABLE', 'featured' => true,
        ], $extra));
    }

    private function lead(User $owner, Property $property): Lead
    {
        return Lead::create(['name' => 'Prospek', 'whatsapp_number' => '628123456789', 'property_id' => $property->id, 'assigned_marketing_id' => $owner->id]);
    }

    public function test_public_visibility_and_allowlist(): void
    {
        $owner = $this->user();
        $published = $this->property($owner);
        $draft = $this->property($owner, ['publication' => 'DRAFT']);
        $this->property($owner, ['publication' => 'ARCHIVED']);
        $this->getJson('/api/v1/properties')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.owner_id')->assertJsonMissingPath('data.0.version');
        $this->getJson('/api/v1/properties/'.$published->slug)->assertOk()->assertJsonPath('data.price_idr', '850000000');
        $this->getJson('/api/v1/properties/'.$draft->slug)->assertNotFound();
    }

    public function test_public_filters_sort_limits_and_literal_wildcards(): void
    {
        $owner = $this->user();
        $this->property($owner, ['title' => 'Premium Garden', 'price_idr' => 950000000]);
        $this->property($owner, ['price_idr' => 800000000]);
        $this->getJson('/api/v1/properties?q=premium&min_price=900000000')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/properties?sort=price_asc&per_page=1')->assertJsonPath('data.0.price_idr', '800000000')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/v1/properties?per_page=1000')->assertUnprocessable();
        $this->getJson('/api/v1/properties?sort=owner_id')->assertUnprocessable();
        $this->getJson('/api/v1/properties?min_price=9&max_price=1')->assertUnprocessable();
        $this->getJson('/api/v1/properties?q=%25')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_authentication_and_active_account_required(): void
    {
        $this->getJson('/api/v1/leads')->assertUnauthorized();
        $this->actingAs($this->user('MARKETING', false))->getJson('/api/v1/leads')->assertForbidden();
    }

    public function test_marketing_scope_and_admin_only_commands(): void
    {
        $owner = $this->user();
        $lead = $this->lead($owner, $this->property($owner));
        $this->actingAs($this->user())->getJson('/api/v1/leads')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/leads/'.$lead->id.'/history')->assertNotFound();
        $this->postJson('/api/v1/leads', [])->assertForbidden();
        $this->postJson('/api/v1/leads/'.$lead->id.'/assignment', [])->assertForbidden();
    }

    public function test_creation_normalizes_phone_and_rejects_duplicate(): void
    {
        $property = $this->property($this->user());
        $payload = ['name' => 'Pembeli', 'whatsapp_number' => '0812-3456-789', 'property_id' => $property->id];
        $this->actingAs($this->user('ADMIN'))->postJson('/api/v1/leads', $payload)->assertCreated()->assertJsonPath('data.whatsapp_number', '628123456789');
        $this->postJson('/api/v1/leads', array_merge($payload, ['whatsapp_number' => '+62 812 3456 789']))->assertConflict();
        $this->assertDatabaseCount('leads', 1);
        $this->assertDatabaseCount('lead_histories', 1);
    }

    public function test_reassignment_has_atomic_history_notification_and_revokes_scope(): void
    {
        $owner = $this->user();
        $next = $this->user();
        $lead = $this->lead($owner, $this->property($owner));
        $this->actingAs($this->user('ADMIN'))->postJson('/api/v1/leads/'.$lead->id.'/assignment', ['marketing_id' => $next->id, 'version' => 1, 'reason' => 'Distribusi ulang'])->assertOk()->assertJsonPath('data.version', 2);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $lead->id, 'type' => 'REASSIGNED', 'from_assignee' => $owner->id, 'to_assignee' => $next->id]);
        $this->assertDatabaseHas('user_notifications', ['recipient_id' => $next->id, 'kind' => 'LEAD_ASSIGNED']);
        $this->actingAs($owner)->getJson('/api/v1/leads/'.$lead->id.'/history')->assertNotFound();
    }

    public function test_assignment_rejects_inactive_target_and_stale_version(): void
    {
        $owner = $this->user();
        $lead = $this->lead($owner, $this->property($owner));
        $this->actingAs($this->user('ADMIN'))->postJson('/api/v1/leads/'.$lead->id.'/assignment', ['marketing_id' => $this->user('MARKETING', false)->id, 'version' => 1, 'reason' => 'Transfer'])->assertUnprocessable();
        $this->postJson('/api/v1/leads/'.$lead->id.'/assignment', ['marketing_id' => $this->user()->id, 'version' => 2, 'reason' => 'Transfer'])->assertConflict();
        $this->assertDatabaseCount('lead_histories', 0);
        $this->assertDatabaseCount('user_notifications', 0);
    }

    public function test_pipeline_sequence_versions_and_notifications(): void
    {
        $admin = $this->user('ADMIN');
        $owner = $this->user();
        $lead = $this->lead($owner, $this->property($owner));
        $this->actingAs($owner)->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => 'DEAL', 'version' => 1])->assertConflict();
        $this->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => 'FOLLOWED_UP', 'version' => 1, 'note' => 'Sudah dihubungi'])->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => 'SURVEY_LOKASI', 'version' => 1])->assertConflict();
        $this->assertDatabaseCount('lead_histories', 1);
        $this->assertDatabaseHas('user_notifications', ['recipient_id' => $admin->id, 'kind' => 'LEAD_STATUS_CHANGED']);
        $this->assertNotNull($lead->fresh()->first_followed_up_at);
    }

    public function test_lost_requires_reason_and_terminal_is_locked(): void
    {
        $owner = $this->user();
        $lead = $this->lead($owner, $this->property($owner));
        $this->actingAs($owner)->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => 'LOST', 'version' => 1])->assertUnprocessable();
        $this->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => 'LOST', 'version' => 1, 'note' => 'Kebutuhan berubah'])->assertOk();
        $this->patchJson('/api/v1/leads/'.$lead->id.'/status', ['status' => 'FOLLOWED_UP', 'version' => 2])->assertConflict();
    }

    public function test_notes_history_and_notification_scope(): void
    {
        $owner = $this->user();
        $lead = $this->lead($owner, $this->property($owner));
        $this->actingAs($owner)->postJson('/api/v1/leads/'.$lead->id.'/notes', ['note' => 'Pertama', 'version' => 1])->assertOk();
        $this->postJson('/api/v1/leads/'.$lead->id.'/notes', ['note' => 'Kedua', 'version' => 2])->assertOk();
        $this->getJson('/api/v1/leads/'.$lead->id.'/history')->assertJsonPath('data.0.note', 'Kedua');
        $this->deleteJson('/api/v1/leads/'.$lead->id.'/history/1')->assertNotFound();
    }

    public function test_property_scope_and_version_conflict(): void
    {
        $owner = $this->user();
        $property = $this->property($owner);
        $this->actingAs($this->user())->patchJson('/api/v1/internal/properties/'.$property->id, ['version' => 1, 'title' => 'Tidak boleh'])->assertNotFound();
        $this->actingAs($owner)->patchJson('/api/v1/internal/properties/'.$property->id, ['version' => 1, 'availability' => 'SOLD_OUT'])->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson('/api/v1/internal/properties/'.$property->id, ['version' => 1, 'title' => 'Stale'])->assertConflict();
        $this->assertSame('PUBLISHED', $property->fresh()->publication);
    }
}
