<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommercialTest extends TestCase
{
    use RefreshDatabase;

    private function property(): Property
    {
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);

        return Property::create(['owner_id' => $owner->id, 'slug' => 'bfi-36-60', 'title' => 'BFI 36/60', 'house_type' => '36/60', 'condition' => 'NEW', 'certificate' => 'Belum diverifikasi', 'location' => 'Bandung', 'address' => 'Alamat sumber', 'description' => 'Ilustrasi dari brosur', 'price_idr' => 505000000, 'land_area' => 60, 'building_area' => 36, 'bedrooms' => 2, 'bathrooms' => 1, 'publication' => 'PUBLISHED', 'availability' => 'CHECK_REQUIRED']);
    }

    private function payload(): array
    {
        return ['version' => 1, 'verified' => true, 'offer_price_idr' => 456700000, 'offer_start' => '2026-08-18', 'offer_end' => '2026-10-29', 'next_price_idr' => 530000000, 'next_price_start' => '2026-10-31', 'commercial' => ['floors' => 1, 'lot_dimensions' => '6 × 10 m', 'planned_units' => 61, 'features' => ['Smart door lock'], 'source_name' => 'Price list dan brosur', 'source_date' => '2026-08-18', 'notes' => 'Unit merupakan rencana, bukan stok.', 'program_fee_idr' => 5000000, 'program_fee_start' => '2026-08-18', 'program_fee_until' => '2026-10-30', 'next_fee_idr' => 25000000, 'next_fee_start' => '2026-10-31', 'fee_notes' => 'Program developer, konfirmasi tertulis.', 'payment_plans' => [['title' => 'Cash bertahap', 'kind' => 'INSTALLMENT', 'upfront_idr' => 250000000, 'months' => 60, 'monthly_idr' => 5500000, 'total_idr' => 580000000, 'valid_from' => '2026-08-18', 'valid_until' => '2026-09-30', 'quota' => 10, 'source_name' => 'Brosur', 'notes' => 'Program sudah berakhir.']]]];
    }

    public function test_admin_commercial_is_versioned_and_rejects_marketing_unverified_and_bad_totals(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 5));
        $property = $this->property();
        $path = '/api/v1/internal/properties/'.$property->id.'/commercial';
        $payload = $this->payload();
        $this->actingAs(User::find($property->owner_id))->patchJson($path, $payload)->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $bad = $payload;
        $bad['verified'] = false;
        $this->patchJson($path, $bad)->assertUnprocessable();
        $bad = $payload;
        $bad['commercial']['payment_plans'][0]['total_idr']++;
        $this->patchJson($path, $bad)->assertUnprocessable();
        $bad = $payload;
        $bad['next_price_start'] = '2026-10-29';
        $this->patchJson($path, $bad)->assertUnprocessable();
        $this->patchJson($path, $payload)->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson($path, $payload)->assertConflict();
        $this->assertDatabaseCount('activity_logs', 1);
        $this->getJson('/api/v1/properties/bfi-36-60')->assertJsonPath('data.price_idr', '456700000')->assertJsonPath('data.commercial.planned_units', 61)->assertJsonCount(0, 'data.commercial.payment_plans')->assertJsonMissingPath('data.commercial._verified_at')->assertJsonMissingPath('data.owner_id');
    }

    public function test_price_filters_sort_compare_and_jakarta_date_boundaries_agree(): void
    {
        $this->travelTo(Carbon::parse('2026-10-29 16:59:00', 'UTC'));
        $property = $this->property();
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/commercial', $this->payload())->assertOk();
        $this->getJson('/api/v1/properties?max_price=460000000&sort=price_asc')->assertJsonCount(1, 'data')->assertJsonPath('data.0.price_idr', '456700000');
        $this->getJson('/api/v1/compare?ids[]='.$property->id)->assertJsonPath('data.0.price_idr', '456700000');
        $this->travelTo(Carbon::parse('2026-10-29 17:00:00', 'UTC'));
        $this->getJson('/api/v1/properties?max_price=460000000')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/properties/bfi-36-60')->assertJsonPath('data.price_idr', '505000000')->assertJsonPath('data.commercial.offer_until', null)->assertJsonPath('data.commercial.program_fee_idr', 5000000);
        $this->travelTo(Carbon::parse('2026-10-30 17:00:00', 'UTC'));
        $this->getJson('/api/v1/properties?min_price=520000000')->assertJsonCount(1, 'data')->assertJsonPath('data.0.price_idr', '530000000')->assertJsonPath('data.0.commercial.program_fee_idr', 25000000);
    }

    public function test_kpr_phase_validation_dates_and_public_admin_only_settings(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 5));
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $rate = ['kind' => 'BANK_RATE', 'published' => true, 'verified' => true, 'position' => 0, 'payload' => ['bank' => 'BCA', 'product' => 'Referensi berjenjang', 'annual_rate' => 4, 'fixed_months' => 120, 'effective_date' => '2026-10-05', 'valid_until' => '2026-10-31', 'source_url' => 'https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first', 'min_tenor_months' => 120, 'max_tenor_months' => 300, 'phases' => [['months' => 36, 'annual_rate' => 4], ['months' => 36, 'annual_rate' => 7.99], ['months' => 48, 'annual_rate' => 9.99]]]];
        $bad = $rate;
        $bad['payload']['phases'][0]['months'] = 35;
        $this->postJson('/api/v1/internal/content', $bad)->assertUnprocessable();
        $bad = $rate;
        $bad['payload']['phases'][0]['owner_email'] = 'private';
        $this->postJson('/api/v1/internal/content', $bad)->assertUnprocessable();
        $this->postJson('/api/v1/internal/content', $rate)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.bank_rates.0.phases.1.annual_rate', 7.99)->assertJsonMissingPath('data.bank_rates.0.verified_by');
        $this->travelTo(now()->setDate(2026, 11, 1));
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.bank_rates');
        $development = ['kind' => 'DEVELOPMENT', 'published' => true, 'verified' => true, 'position' => 0, 'payload' => ['name' => 'BFI 2', 'developer' => 'PT Batu Wangi Indah', 'address' => 'Cikoneng', 'whatsapp' => '62895375894848', 'website' => 'https://rumahrajasa.com', 'planned_units' => 152, 'house_types' => 9, 'facilities' => 'Masjid', 'nearby' => 'Borma Cinunuk', 'source_name' => 'Brosur', 'source_date' => '2026-09-01', 'notes' => 'Rencana kawasan.']];
        $created = $this->postJson('/api/v1/internal/content', $development)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.development.whatsapp', '62895375894848')->assertJsonMissingPath('data.development.updated_by');
        $this->actingAs(User::factory()->create(['role' => 'MARKETING', 'is_active' => true]));
        $this->postJson('/api/v1/internal/content', $development)->assertForbidden();
        $this->patchJson('/api/v1/internal/content/'.$created->json('data.id'), $development + ['version' => 1])->assertForbidden();
        $this->assertTrue(ActivityLog::count() >= 2);
    }

    public function test_bank_optional_limits_are_numeric_independent_and_use_jakarta_check_date(): void
    {
        $this->travelTo(Carbon::parse('2026-10-04 18:00:00', 'UTC'));
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $data = ['kind' => 'BANK_RATE', 'published' => true, 'verified' => true, 'position' => 0, 'payload' => ['bank' => 'BCA', 'product' => 'Referensi test', 'annual_rate' => '4.00', 'fixed_months' => '12', 'effective_date' => '2026-10-05', 'valid_until' => '2026-10-31', 'source_url' => 'https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first', 'checked_date' => '2026-10-05', 'max_tenor_months' => '300', 'max_principal_idr' => '1000000000', 'admin_max_idr' => '3000000', 'max_ltv_percent' => '90.00']];
        $this->postJson('/api/v1/internal/content', $data)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.bank_rates.0.max_tenor_months', 300)->assertJsonPath('data.bank_rates.0.max_principal_idr', 1000000000)->assertJsonPath('data.bank_rates.0.max_ltv_percent', 90);
        $bad = $data;
        $bad['payload']['checked_date'] = '2026-10-06';
        $this->postJson('/api/v1/internal/content', $bad)->assertUnprocessable();
        $bad = $data;
        $bad['payload']['min_tenor_months'] = 360;
        $this->postJson('/api/v1/internal/content', $bad)->assertUnprocessable();
        $bad = $data;
        $bad['payload']['max_ltv_percent'] = 101;
        $this->postJson('/api/v1/internal/content', $bad)->assertUnprocessable();
    }

    public function test_future_developer_fee_and_payment_plan_are_not_active_and_nested_private_keys_are_removed(): void
    {
        $this->travelTo(Carbon::parse('2026-10-05 10:00:00', 'Asia/Jakarta'));
        $property = $this->property();
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $data = $this->payload();
        $data['commercial']['program_fee_start'] = '2026-10-10';
        $data['commercial']['payment_plans'][0]['valid_until'] = '2026-10-31';
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/commercial', $data)->assertOk();
        $this->getJson('/api/v1/properties/bfi-36-60')->assertJsonPath('data.commercial.program_fee_idr', null)->assertJsonCount(1, 'data.commercial.payment_plans');
        $commercial = $property->fresh()->commercial;
        $commercial['payment_plans'][0]['owner_email'] = 'private@example.test';
        $property->forceFill(['commercial' => $commercial])->save();
        $this->getJson('/api/v1/properties/bfi-36-60')->assertJsonMissingPath('data.commercial.payment_plans.0.owner_email');
        $this->travelTo(Carbon::parse('2026-10-10 10:00:00', 'Asia/Jakarta'));
        $this->getJson('/api/v1/properties/bfi-36-60')->assertJsonPath('data.commercial.program_fee_idr', 5000000);
    }
}
