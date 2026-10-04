<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\Property;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\LeadWorkflow;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class SecurityAndAtomicityTest extends TestCase
{
    use RefreshDatabase;

    private function demo(): void
    {
        config(['app.env' => 'testing']);
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $marketing = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create(['owner_id' => $marketing->id, 'slug' => 'security-'.fake()->uuid(), 'title' => fake()->sentence(3), 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => fake()->city(), 'address' => fake()->address(), 'description' => fake()->paragraph(), 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2]);
        $lead = app(LeadWorkflow::class)->create($admin, ['name' => fake()->name(), 'whatsapp_number' => '628000'.fake()->numerify('########'), 'property_id' => $property->id]);
        app(LeadWorkflow::class)->assign($admin, $lead->id, ['marketing_id' => $marketing->id, 'version' => 1]);
    }

    public function test_session_login_logout_inactive_and_unsupported_token(): void
    {
        $user = User::factory()->create(['password' => 'Fixture-only-strong-password', 'role' => 'ADMIN']);
        $this->postJson('/auth/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/auth/login', ['email' => $user->email, 'password' => 'Fixture-only-strong-password'])->assertOk()->assertJsonMissingPath('data.password');
        $this->getJson('/api/v1/me')->assertOk();
        $this->postJson('/auth/logout')->assertNoContent();
        $this->assertGuest('web');
        Auth::forgetGuards();
        $user->forceFill(['is_active' => false])->save();
        $this->postJson('/auth/login', ['email' => $user->email, 'password' => 'Fixture-only-strong-password'])->assertUnprocessable();
        $this->withHeader('Authorization', 'Bearer 1|invalidtoken')->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_notification_failure_rolls_back_lead_and_history(): void
    {
        $this->demo();
        $admin = User::where('role', 'ADMIN')->firstOrFail();
        $owner = User::where('role', 'MARKETING')->firstOrFail();
        $lead = Lead::create(['name' => 'Prospek kedua', 'whatsapp_number' => '628000000001', 'property_id' => Property::firstOrFail()->id]);
        $historyCount = LeadHistory::count();
        UserNotification::creating(fn () => throw new \RuntimeException('Injected notification failure'));
        try {
            $this->actingAs($admin)->postJson('/api/v1/leads/'.$lead->id.'/assignment', ['version' => 1, 'marketing_id' => $owner->id])->assertServerError()->assertJsonPath('message', 'Layanan mengalami kendala. Silakan coba lagi.');
            $this->assertNull($lead->fresh()->assigned_marketing_id);
            $this->assertSame(1, $lead->fresh()->version);
            $this->assertDatabaseCount('lead_histories', $historyCount);
        } finally {
            UserNotification::flushEventListeners();
        }
    }

    public function test_notification_scope_read_idempotency_and_error_request_id(): void
    {
        $this->demo();
        $notice = UserNotification::firstOrFail();
        $this->actingAs(User::where('role', 'ADMIN')->firstOrFail())->patchJson('/api/v1/notifications/'.$notice->id.'/read')->assertNotFound()->assertJsonStructure(['message', 'request_id'])->assertHeader('X-Request-ID');
        $this->actingAs(User::findOrFail($notice->recipient_id))->getJson('/api/v1/notifications')->assertJsonPath('unread_count', 1);
        $this->patchJson('/api/v1/notifications/'.$notice->id.'/read')->assertOk();
        $first = $notice->fresh()->read_at;
        $this->travel(1)->minutes();
        $this->patchJson('/api/v1/notifications/'.$notice->id.'/read')->assertOk();
        $this->assertTrue($first->equalTo($notice->fresh()->read_at));
        $this->getJson('/api/v1/notifications')->assertJsonPath('unread_count', 0);
    }

    public function test_demo_seeding_is_rejected_in_production(): void
    {
        config(['app.env' => 'production']);
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }
}
