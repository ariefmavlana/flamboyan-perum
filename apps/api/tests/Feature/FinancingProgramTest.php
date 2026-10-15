<?php

namespace Tests\Feature;

use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancingProgramTest extends TestCase
{
    use RefreshDatabase;

    private function program(): array
    {
        return ['kind' => 'FINANCING_PROGRAM', 'position' => 0, 'published' => true, 'verified' => true, 'payload' => ['bank' => 'BSI', 'product' => 'Angsuran tetap 15 tahun', 'development_name' => 'Bukit Flamboyan Indah 2', 'method' => 'FIXED_INSTALLMENT', 'house_types' => ['36/60'], 'monthly_idr' => '3700000', 'tenor_months' => '180', 'source_name' => 'Instruksi pemilik', 'checked_date' => now('Asia/Jakarta')->toDateString(), 'conditions' => 'Khusus 36/60. DP dan biaya dikonfirmasi tertulis.']];
    }

    public function test_fixed_installment_has_no_invented_interest_and_is_admin_verified_versioned(): void
    {
        $data = $this->program();
        $this->postJson('/api/v1/internal/content', $data)->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'MARKETING', 'is_active' => true]));
        $this->postJson('/api/v1/internal/content', $data)->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $this->postJson('/api/v1/internal/content', array_replace($data, ['verified' => false]))->assertUnprocessable();
        $created = $this->postJson('/api/v1/internal/content', $data)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.financing_programs.0.monthly_idr', 3700000)->assertJsonPath('data.financing_programs.0.tenor_months', 180)->assertJsonMissingPath('data.financing_programs.0.annual_rate')->assertJsonMissingPath('data.financing_programs.0.verified_by');
        $path = '/api/v1/internal/content/'.$created->json('data.id');
        $this->patchJson($path, $data + ['version' => 1])->assertOk();
        $this->patchJson($path, $data + ['version' => 1])->assertConflict();
        $this->assertDatabaseCount('activity_logs', 2);
    }

    public function test_unknown_bni_rate_cannot_publish_fabricated_installments_or_interest(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $data = $this->program();
        $data['payload']['bank'] = 'BNI';
        $data['payload']['method'] = 'REFERENCE_ONLY';
        $this->postJson('/api/v1/internal/content', $data)->assertUnprocessable();
        unset($data['payload']['monthly_idr'], $data['payload']['tenor_months']);
        $data['payload']['annual_rate'] = 5;
        $this->postJson('/api/v1/internal/content', $data)->assertUnprocessable();
        unset($data['payload']['annual_rate']);
        $created = $this->postJson('/api/v1/internal/content', $data)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.financing_programs.0.method', 'REFERENCE_ONLY')->assertJsonMissingPath('data.financing_programs.0.monthly_idr');
        $record = SiteContent::findOrFail($created->json('data.id'));
        $record->update(['payload' => $record->payload + ['monthly_idr' => 1, 'tenor_months' => 1, 'owner_email' => 'private']]);
        $this->getJson('/api/v1/content')->assertJsonMissingPath('data.financing_programs.0.monthly_idr')->assertJsonMissingPath('data.financing_programs.0.owner_email');
        $record->update(['published' => false]);
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.financing_programs');
    }

    public function test_program_rejects_missing_amount_future_source_dates_and_unsafe_links(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        foreach ([['monthly_idr', null], ['monthly_idr', 0], ['tenor_months', 0], ['checked_date', now('Asia/Jakarta')->addDay()->toDateString()], ['source_url', 'javascript:alert(1)']] as [$key, $value]) {
            $data = $this->program();
            $data['payload'][$key] = $value;
            $this->postJson('/api/v1/internal/content', $data)->assertUnprocessable();
        }
        $this->assertDatabaseCount('site_contents', 0);
    }

    public function test_fixed_program_requires_bsi_and_only_type_36_60_and_legacy_unscoped_data_is_hidden(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        foreach ([null, [], ['36/90'], ['36/60', '36/90']] as $types) {
            $data = $this->program();
            $data['payload']['house_types'] = $types;
            $this->postJson('/api/v1/internal/content', $data)->assertUnprocessable();
        }
        $data = $this->program();
        $data['payload']['bank'] = 'BNI';
        $this->postJson('/api/v1/internal/content', $data)->assertUnprocessable();
        $data = $this->program();
        $created = $this->postJson('/api/v1/internal/content', $data)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.financing_programs.0.house_types', ['36/60']);
        unset($data['payload']['house_types']);
        SiteContent::findOrFail($created->json('data.id'))->update(['payload' => $data['payload']]);
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.financing_programs');
    }

    public function test_admin_can_publish_a_bsi_murabahah_quote_for_a_specific_house_price_without_interest(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'ADMIN', 'is_active' => true]));
        $data = $this->program();
        unset($data['payload']['monthly_idr']);
        $data['payload'] = array_replace($data['payload'], ['method' => 'MURABAHAH_QUOTE', 'house_types' => ['56/90'], 'price_idr' => '500000000', 'down_payment_idr' => '100000000', 'total_margin_idr' => '266000000']);
        $this->postJson('/api/v1/internal/content', $data)->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.financing_programs.0.price_idr', 500000000)->assertJsonPath('data.financing_programs.0.house_types', ['56/90'])->assertJsonPath('data.financing_programs.0.total_margin_idr', 266000000)->assertJsonMissingPath('data.financing_programs.0.annual_rate');
        foreach ([['bank', 'BNI'], ['house_types', ['36/60', '56/90']], ['down_payment_idr', 500000001], ['total_margin_idr', -1], ['tenor_months', 181]] as [$key, $value]) {
            $invalid = $data;
            $invalid['payload'][$key] = $value;
            $this->postJson('/api/v1/internal/content', $invalid)->assertUnprocessable();
        }
    }
}
