<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEvaluationTest extends TestCase
{
    use RefreshDatabase;

    private function property(): Property
    {
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $this->actingAs($owner);

        return Property::create(['owner_id' => $owner->id, 'slug' => 'evaluation-test', 'title' => 'Properti Evaluasi', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bogor', 'address' => 'Alamat test', 'description' => 'Data pengujian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED']);
    }

    public function test_compare_deduplicates_preserves_order_and_never_exposes_drafts(): void
    {
        $published = $this->property();
        $draft = $published->replicate()->fill(['slug' => 'draft', 'publication' => 'DRAFT']);
        $draft->save();
        $this->getJson('/api/v1/compare?ids[]='.$draft->id.'&ids[]='.$published->id.'&ids[]='.$published->id)->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $published->id)->assertJsonPath('missing.0', $draft->id)->assertJsonMissingPath('data.0.owner_id');
        $this->getJson('/api/v1/compare?ids[]=1&ids[]=2&ids[]=3&ids[]=4')->assertUnprocessable();
        $second = $published->replicate()->fill(['slug' => 'second']);
        $second->save();
        $third = $published->replicate()->fill(['slug' => 'third']);
        $third->save();
        $this->getJson('/api/v1/compare?ids[]='.$third->id.'&ids[]='.$published->id.'&ids[]='.$second->id)->assertOk()->assertJsonCount(3, 'data')->assertJsonPath('data.0.id', $third->id)->assertJsonPath('data.1.id', $published->id)->assertJsonPath('data.2.id', $second->id);
    }

    public function test_editorial_content_requires_admin_attestation_and_has_public_allowlist(): void
    {
        $this->property();
        $content = ['kind' => 'TESTIMONIAL', 'published' => true, 'position' => 0, 'payload' => ['name' => 'Nama berizin', 'quote' => 'Pengalaman yang disetujui.', 'context' => 'Pembeli rumah']];
        $this->postJson('/api/v1/internal/content', $content)->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $this->postJson('/api/v1/internal/content', $content)->assertUnprocessable();
        $created = $this->postJson('/api/v1/internal/content', $content + ['verified' => true])->assertCreated()->assertJsonPath('data.version', 1);
        $this->getJson('/api/v1/content')->assertOk()->assertJsonPath('data.testimonials.0.name', 'Nama berizin')->assertJsonMissingPath('data.testimonials.0.updated_by')->assertJsonMissingPath('data.testimonials.0.verified_by');
        $id = $created->json('data.id');
        $this->patchJson('/api/v1/internal/content/'.$id, $content + ['version' => 1, 'verified' => true])->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson('/api/v1/internal/content/'.$id, $content + ['version' => 1, 'verified' => true])->assertConflict();
        $this->assertDatabaseCount('activity_logs', 2);
    }

    public function test_bank_rates_are_current_only_and_validate_dates_and_sources(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $content = ['kind' => 'BANK_RATE', 'published' => true, 'position' => 0, 'verified' => true, 'payload' => ['bank' => 'Bank test', 'product' => 'Produk test', 'annual_rate' => 5.5, 'effective_date' => now()->subDay()->toDateString(), 'valid_until' => now()->addDay()->toDateString(), 'fixed_months' => 36, 'source_url' => 'https://bank.example.test/rate']];
        $this->postJson('/api/v1/internal/content', $content)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonCount(1, 'data.bank_rates');
        $this->travel(2)->days();
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.bank_rates');
        $content['payload']['source_url'] = 'javascript:alert(1)';
        $this->postJson('/api/v1/internal/content', $content)->assertUnprocessable();
    }

    public function test_location_is_scoped_versioned_bounded_and_editorial(): void
    {
        $property = $this->property();
        $payload = ['version' => 1, 'latitude' => -6.6, 'longitude' => 106.8, 'pois' => [['name' => 'Stasiun test', 'category' => 'TRANSPORT', 'distance_m' => 1200, 'source_url' => 'https://example.test/source', 'source_date' => now()->toDateString()]]];
        $this->actingAs(User::factory()->create(['role' => 'MARKETING', 'is_active' => true]))->patchJson('/api/v1/internal/properties/'.$property->id.'/location', $payload)->assertNotFound();
        $this->actingAs(User::findOrFail($property->owner_id));
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/location', $payload)->assertOk()->assertJsonPath('data.version', 2);
        $this->getJson('/api/v1/properties/evaluation-test')->assertJsonPath('data.pois.0.distance_m', 1200)->assertJsonMissingPath('data.owner_id');
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/location', $payload)->assertConflict();
        $payload['version'] = 2;
        $payload['longitude'] = null;
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/location', $payload)->assertUnprocessable();
        $this->assertSame(2, $property->fresh()->version);
    }

    public function test_editorial_audit_failure_rolls_back_and_sitemap_contains_only_published(): void
    {
        $property = $this->property();
        $draft = $property->replicate()->fill(['slug' => 'draft', 'publication' => 'DRAFT']);
        $draft->save();
        $this->getJson('/api/v1/sitemap')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', $property->slug)->assertJsonMissingPath('data.0.owner_id');
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        ActivityLog::creating(function () {
            throw new \RuntimeException('audit unavailable');
        });
        try {
            $this->postJson('/api/v1/internal/content', ['kind' => 'HERO', 'published' => false, 'position' => 0, 'payload' => ['title' => 'Judul hero', 'description' => 'Deskripsi hero', 'eyebrow' => 'Flamboyan', 'property_id' => null]])->assertStatus(500);
            $this->assertDatabaseCount('site_contents', 0);
        } finally {
            ActivityLog::flushEventListeners();
        }
    }

    public function test_hero_draft_reference_and_unknown_payload_are_not_public(): void
    {
        $property = $this->property();
        $property->update(['publication' => 'DRAFT']);
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $content = ['kind' => 'HERO', 'published' => true, 'position' => 0, 'verified' => true, 'payload' => ['title' => 'Hero test', 'description' => 'Deskripsi test', 'eyebrow' => 'Test', 'property_id' => $property->id]];
        $this->postJson('/api/v1/internal/content', $content)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.property', null)->assertJsonPath('data.hero.property_id', null)->assertJsonMissingPath('data.hero.verified_by');
        $content['payload']['owner_email'] = 'private@example.test';
        $this->postJson('/api/v1/internal/content', $content)->assertUnprocessable();
        $this->assertDatabaseCount('site_contents', 1);
    }
}
