<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadInquiry;
use App\Models\Property;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GrowthInquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_options_fail_closed_until_exact_allowlist_and_notice_are_ready(): void
    {
        $this->getJson('/api/v1/inquiries/options')->assertOk()
            ->assertJsonPath('data', [])->assertJsonPath('meta.enabled', false)
            ->assertJsonMissingPath('meta.property_ids');

        [$properties] = $this->growthFixture();
        $properties[0]->forceFill(['title' => 'Nama katalog diperbarui'])->save();
        $this->getJson('/api/v1/inquiries/options')->assertOk()->assertJsonPath('meta.enabled', true)
            ->assertJsonPath('data.0.property_id', $properties[0]->id)->assertJsonPath('data.0.title', 'Nama katalog diperbarui');
        $properties[0]->forceFill(['publication' => 'ARCHIVED', 'title' => 'Judul berubah'])->save();
        $this->getJson('/api/v1/inquiries/options')->assertOk()
            ->assertJsonPath('data', [])->assertJsonPath('meta.enabled', false);
    }

    public function test_context_and_intake_are_strict_generic_idempotent_and_admin_reconciles_atomically(): void
    {
        [$properties, $admin, $marketing] = $this->growthFixture();
        $options = $this->getJson('/api/v1/inquiries/options')->assertOk()->assertJsonPath('meta.enabled', true)
            ->assertJsonCount(5, 'data')->assertJsonMissing(['whatsapp_number'])->json('data');
        $this->assertSame('/properti/'.$properties[0]->slug, $options[0]['canonical_path']);

        $context = $this->relayPost('/api/v1/inquiries/context', $this->contextPayload())->assertCreated()
            ->assertJsonStructure(['data' => ['token', 'expires_at']])->assertJsonMissing(['source'])->json('data.token');
        $payload = $this->inquiryPayload($properties[0]->id, $context);
        $key = 'abcdefghijklmnopqrstuv1234567890';
        $first = $this->withHeader('Idempotency-Key', $key)->relayPost('/api/v1/inquiries', $payload)->assertStatus(202);
        $receipt = $first->json('receipt');
        $first->assertExactJson(['accepted' => true, 'receipt' => $receipt]);
        $this->withHeader('Idempotency-Key', $key)->relayPost('/api/v1/inquiries', $payload)->assertStatus(202)->assertJsonPath('receipt', $receipt);
        $this->assertDatabaseCount('lead_inquiries', 1);
        $this->withHeader('Idempotency-Key', $key)->relayPost('/api/v1/inquiries', array_merge($payload, ['message' => 'Berbeda']))->assertConflict();

        $this->actingAs($marketing)->getJson('/api/v1/internal/inquiries')->assertForbidden();
        $item = $this->actingAs($admin)->getJson('/api/v1/internal/inquiries')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.attribution.method', 'CLIENT_REPORTED')->json('data.0');
        $leadId = $this->postJson('/api/v1/internal/inquiries/'.$item['id'].'/resolve', ['version' => 1, 'action' => 'ACCEPT_NEW'])
            ->assertOk()->assertJsonPath('data.state', 'RESOLVED')->json('lead.id');
        $this->assertDatabaseCount('leads', 1);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $leadId, 'type' => 'CREATED']);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $leadId, 'type' => 'INQUIRY_LINKED']);
        $this->assertNull(Lead::firstOrFail()->assigned_marketing_id);
        $this->assertDatabaseHas('lead_histories', ['lead_id' => $leadId, 'type' => 'CREATED', 'to_status' => 'NEW_LEAD']);
        $this->postJson('/api/v1/internal/inquiries/'.$item['id'].'/resolve', ['version' => 1, 'action' => 'ACCEPT_NEW'])
            ->assertOk()->assertJsonPath('lead.id', $leadId);
        $this->assertDatabaseCount('leads', 1);
    }

    public function test_intake_rechecks_publication_and_rejects_privileged_fields_and_unapproved_context(): void
    {
        [$properties] = $this->growthFixture();
        $payload = $this->inquiryPayload($properties[0]->id);
        $this->withHeader('Idempotency-Key', 'abcdefghijklmnopqrstuv1234567890')->relayPost('/api/v1/inquiries', array_merge($payload, ['assigned_marketing_id' => 1]))->assertUnprocessable();
        $this->relayPost('/api/v1/inquiries/context', array_replace_recursive($this->contextPayload(), ['consent' => ['analytics' => false, 'marketing' => false, 'decided_at' => now()->toIso8601String(), 'version' => '2']]))->assertUnprocessable();

        $outside = $properties[0]->replicate();
        $outside->slug = 'published-outside-allowlist';
        $outside->title = 'Bukan BFI2';
        $outside->save();
        $this->withHeader('Idempotency-Key', 'outsideallowlisttoken1234567890')->relayPost('/api/v1/inquiries', $this->inquiryPayload($outside->id))->assertUnprocessable();

        $properties[0]->forceFill(['publication' => 'ARCHIVED'])->save();
        $this->withHeader('Idempotency-Key', 'zyxwvutsrqponmlkjihgfe1234567890')->relayPost('/api/v1/inquiries', $payload)->assertStatus(503);
        $this->assertDatabaseCount('lead_inquiries', 0);
    }

    public function test_link_existing_requires_exact_property_and_contact_and_retention_is_fail_closed(): void
    {
        [$properties, $admin] = $this->growthFixture();
        $lead = Lead::create(['name' => 'Existing', 'whatsapp_number' => '628123456789', 'property_id' => $properties[0]->id]);
        $this->withHeader('Idempotency-Key', 'abcdefghijklmnopqrstuv1234567890')->relayPost('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id))->assertStatus(202);
        $inquiry = LeadInquiry::firstOrFail();
        $this->actingAs($admin)->postJson('/api/v1/internal/inquiries/'.$inquiry->id.'/resolve', ['version' => 1, 'action' => 'LINK_EXISTING', 'lead_id' => $lead->id])->assertOk();
        $this->assertSame($lead->id, $inquiry->fresh()->lead_id);
        $this->assertSame(2, $lead->fresh()->version);

        config(['growth.retention_approved' => false]);
        $this->artisan('flamboyan:growth-cleanup', ['--execute' => true])->assertFailed();
    }

    public function test_signed_edge_paths_are_method_bounded_and_submit_throttle_limits_abuse(): void
    {
        [$properties] = $this->growthFixture();
        $secret = str_repeat('s', 64);
        config(['operations.proxy_secret' => $secret]);
        $time = (string) now()->timestamp;
        $ip = '203.0.113.40';
        $headers = $this->signedHeaders('GET', '/api/v1/inquiries/options', $time, $ip, $secret);
        $this->getJson('/api/v1/inquiries/options', $headers)->assertOk();
        $internalHeaders = $this->signedHeaders('GET', '/api/v1/internal/inquiries', $time, $ip, $secret);
        $this->getJson('/api/v1/internal/inquiries', $internalHeaders)->assertForbidden();
        $wrongMethod = $this->signedHeaders('GET', '/api/v1/inquiries', $time, $ip, $secret);
        $this->getJson('/api/v1/inquiries', $wrongMethod)->assertForbidden();

        for ($i = 0; $i < 5; $i++) {
            $payload = $this->inquiryPayload($properties[$i]->id);
            $payload['whatsapp_number'] = '0812345678'.($i + 1);
            $this->withHeader('Idempotency-Key', 'ratelimittoken'.str_pad((string) $i, 22, 'x'))->relayPost('/api/v1/inquiries', $payload)->assertStatus(202);
        }
        $this->withHeader('Idempotency-Key', 'ratelimittokenxxxxxxxxxxxxxxxxxxxxxx')->relayPost('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id))->assertTooManyRequests();
        $this->assertDatabaseCount('lead_inquiries', 5);
    }

    public function test_approved_cleanup_anonymizes_expired_pii_but_keeps_receipt_tombstone(): void
    {
        [$properties] = $this->growthFixture();
        $this->withHeader('Idempotency-Key', 'cleanuptokenxxxxxxxxxxxxxxxxxxxx')->relayPost('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id))->assertStatus(202);
        $inquiry = LeadInquiry::firstOrFail();
        $receipt = $inquiry->receipt;
        $inquiry->forceFill(['created_at' => now()->subDays(31)])->save();
        config([
            'growth.retention_approved' => true, 'growth.retention_policy_reference' => 'POLICY_2026_01',
            'growth.pending_retention_days' => 30,
        ]);
        $this->artisan('flamboyan:growth-cleanup')->expectsOutputToContain('Dry run only')->assertSuccessful();
        $this->assertNotNull($inquiry->fresh()->whatsapp_number);
        $this->artisan('flamboyan:growth-cleanup', ['--execute' => true])->assertSuccessful();
        $clean = $inquiry->fresh();
        $this->assertSame('EXPIRED', $clean->state);
        $this->assertSame($receipt, $clean->receipt);
        $this->assertNull($clean->name);
        $this->assertNull($clean->whatsapp_number);
        $this->assertNull($clean->preferred_visit_at);
        $this->assertNotNull($clean->anonymized_at);
    }

    public function test_direct_and_expired_relay_requests_are_rejected_without_writes(): void
    {
        [$properties] = $this->growthFixture();
        $this->postJson('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id))->assertForbidden();
        $this->postJson('/api/v1/inquiries/context', $this->contextPayload())->assertForbidden();
        $headers = $this->signedHeaders('POST', '/api/v1/inquiries', (string) now()->subMinute()->timestamp, '203.0.113.20', str_repeat('s', 64));
        $this->postJson('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id), $headers)->assertForbidden();
        $headers = $this->signedHeaders('POST', '/api/v1/inquiries/context', (string) now()->timestamp, '203.0.113.20', str_repeat('s', 64));
        $this->postJson('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id), $headers)->assertForbidden();
        $this->assertDatabaseCount('lead_inquiries', 0);
    }

    public function test_notice_consent_versions_and_utm_terms_remain_distinct(): void
    {
        [$properties] = $this->growthFixture();
        $payload = $this->contextPayload();
        $payload['consent']['decided_at'] = now()->subDays(60)->toIso8601String();
        $payload['first_touch']['term'] = 'rumah bandung';
        $token = $this->relayPost('/api/v1/inquiries/context', $payload)->assertCreated()->json('data.token');
        $this->withHeader('Idempotency-Key', 'separateversionstokenxxxxxxxxxxx')->relayPost('/api/v1/inquiries', $this->inquiryPayload($properties[0]->id, $token))->assertStatus(202);
        $this->assertDatabaseHas('lead_attributions', ['privacy_notice_version' => 'privacy-1', 'consent_version' => '2', 'first_term' => 'rumah bandung']);
        $payload['last_touch']['captured_at'] = now()->subDays(2)->toIso8601String();
        $this->relayPost('/api/v1/inquiries/context', $payload)->assertUnprocessable();
        config(['growth.privacy_notice_approved' => false]);
        $this->getJson('/api/v1/inquiries/options')->assertJsonPath('meta.enabled', false);
        $this->relayPost('/api/v1/inquiries/context', $this->contextPayload())->assertStatus(503);
        config(['growth.privacy_notice_approved' => true, 'growth.retention_approved' => false]);
        $this->getJson('/api/v1/inquiries/options')->assertJsonPath('meta.enabled', false);
        $this->artisan('flamboyan:growth-cleanup')->assertSuccessful();
    }

    private function relayPost(string $path, array $data)
    {
        return $this->postJson($path, $data, $this->signedHeaders('POST', $path, (string) now()->timestamp, '203.0.113.40', (string) config('operations.proxy_secret')));
    }

    public function test_catalog_pages_and_sitemap_lastmod_follow_effective_price_dates(): void
    {
        [$properties] = $this->growthFixture();
        $this->travelTo(CarbonImmutable::parse('2026-10-17T10:00:00+07:00'));
        $property = $properties[0];
        $property->forceFill(['updated_at' => now()->subDays(10), 'offer_price_idr' => 490000000, 'offer_start' => '2026-10-10', 'offer_end' => '2026-10-16'])->save();
        $this->getJson('/api/v1/properties?page=999')->assertNotFound();
        $sitemap = $this->getJson('/api/v1/sitemap')->assertOk()->assertJsonMissingPath('data.0.owner_id')->assertJsonMissingPath('data.0.commercial')->json('data');
        $entry = collect($sitemap)->firstWhere('slug', $property->slug);
        $this->assertSame('2026-10-16T17:00:00+00:00', $entry['updated_at']);
        $property->forceFill(['next_price_idr' => 600000000, 'next_price_start' => '2026-10-20'])->save();
        $this->assertTrue($property->publicLastModified()->lte(now()));
    }

    private function growthFixture(): array
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $marketing = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $properties = collect(range(1, 5))->map(fn ($number) => Property::create([
            'owner_id' => $marketing->id, 'slug' => 'growth-'.$number, 'title' => 'Tipe '.$number,
            'house_type' => (string) $number, 'condition' => 'NEW', 'certificate' => 'SHM',
            'location' => 'Kabupaten Bandung', 'address' => 'Alamat', 'description' => 'Hunian',
            'price_idr' => 500000000 + $number, 'land_area' => 60, 'building_area' => 36,
            'bedrooms' => 2, 'bathrooms' => 1, 'publication' => 'PUBLISHED',
        ]))->all();
        config([
            'operations.proxy_secret' => str_repeat('s', 64),
            'growth.inquiries_enabled' => true, 'growth.attribution_enabled' => true,
            'growth.property_ids' => collect($properties)->pluck('id')->all(),
            'growth.privacy_notice_version' => 'privacy-1', 'growth.privacy_notice_url' => '/privasi',
            'growth.privacy_notice_approved' => true,
            'growth.retention_approved' => true, 'growth.retention_policy_reference' => 'TEST_POLICY_2026',
        ]);

        return [$properties, $admin, $marketing];
    }

    private function inquiryPayload(int $propertyId, ?string $token = null): array
    {
        return array_filter([
            'name' => 'Budi Pembeli', 'whatsapp_number' => '08123456789', 'property_id' => $propertyId,
            'purpose' => 'CONSULTATION', 'message' => 'Mohon informasi.',
            'privacy_notice_version' => 'privacy-1', 'marketing_opt_in' => false, 'attribution_token' => $token,
        ], fn ($value) => $value !== null);
    }

    private function contextPayload(): array
    {
        $touch = ['source' => 'google', 'medium' => 'cpc', 'campaign' => 'bfi2_bandung', 'captured_at' => now()->subMinute()->toIso8601String()];

        return ['first_touch' => $touch, 'last_touch' => $touch, 'consent' => ['analytics' => true, 'marketing' => false, 'decided_at' => now()->subMinute()->toIso8601String(), 'version' => '2']];
    }

    private function signedHeaders(string $method, string $path, string $time, string $ip, string $secret): array
    {
        return [
            'X-Flamboyan-Client-IP' => $ip,
            'X-Flamboyan-Proxy-Time' => $time,
            'X-Flamboyan-Proxy-Signature' => hash_hmac('sha256', $method."\n".$path."\n".$time."\n".$ip, $secret),
        ];
    }
}
