<?php

namespace Tests\Feature;

use App\Jobs\DeliverNotification;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\Property;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\PusherDelivery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RealtimeTest extends TestCase
{
    use RefreshDatabase;

    private function configure(): void
    {
        config(['realtime.enabled' => true, 'realtime.key' => 'public-test-key', 'realtime.secret' => 'private-test-secret', 'realtime.app_id' => '123', 'realtime.cluster' => 'ap1']);
    }

    private function notice(): UserNotification
    {
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create(['owner_id' => $owner->id, 'slug' => 'realtime-test', 'title' => 'Realtime test', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bogor', 'address' => 'Test', 'description' => 'Test', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2]);
        $lead = Lead::create(['name' => 'Private lead name', 'whatsapp_number' => '628123456789', 'property_id' => $property->id, 'assigned_marketing_id' => $owner->id]);
        $history = LeadHistory::create(['lead_id' => $lead->id, 'actor_id' => $owner->id, 'type' => 'ASSIGNED']);

        return UserNotification::create(['recipient_id' => $owner->id, 'lead_id' => $lead->id, 'history_id' => $history->id, 'kind' => 'LEAD_ASSIGNED']);
    }

    public function test_private_channel_auth_requires_active_session_owner_and_never_exposes_secret(): void
    {
        $this->configure();
        $user = User::factory()->create(['is_active' => true, 'role' => 'MARKETING']);
        $this->postJson('/api/v1/realtime/auth', ['socket_id' => '123.456', 'channel_name' => 'private-users.'.$user->id])->assertUnauthorized();
        $this->actingAs($user);
        $channel = 'private-users.'.$user->id;
        $this->postJson('/api/v1/realtime/auth', ['socket_id' => '123.456', 'channel_name' => $channel])->assertOk()->assertExactJson(['auth' => 'public-test-key:'.hash_hmac('sha256', '123.456:'.$channel, 'private-test-secret')]);
        $this->postJson('/api/v1/realtime/auth', ['socket_id' => '123.456', 'channel_name' => 'private-users.'.($user->id + 1)])->assertForbidden();
        $this->postJson('/api/v1/realtime/auth', ['socket_id' => 'bad', 'channel_name' => $channel])->assertUnprocessable();
        $this->getJson('/api/v1/realtime')->assertExactJson(['data' => ['enabled' => true, 'key' => 'public-test-key', 'cluster' => 'ap1']]);
        $user->forceFill(['is_active' => false])->save();
        $this->app['auth']->forgetGuards();
        $this->actingAs($user->fresh())->postJson('/api/v1/realtime/auth', ['socket_id' => '123.456', 'channel_name' => $channel])->assertForbidden();
    }

    public function test_durable_job_is_atomic_and_never_calls_provider_in_transaction(): void
    {
        $this->configure();
        Http::fake();
        $notice = $this->notice();
        $this->assertDatabaseCount('jobs', 1);
        Http::assertNothingSent();
        $count = UserNotification::count();
        try {
            DB::transaction(function () use ($notice) {
                $notice->replicate()->fill(['history_id' => LeadHistory::create(['lead_id' => $notice->lead_id, 'actor_id' => $notice->recipient_id, 'type' => 'NOTE_ADDED'])->id])->save();
                throw new \RuntimeException('rollback');
            });
        } catch (\RuntimeException) {
        }
        $this->assertDatabaseCount('user_notifications', $count);
        $this->assertDatabaseCount('jobs', 1);
        Http::assertNothingSent();
    }

    public function test_delivery_signing_payload_allowlist_duplicate_and_provider_failure(): void
    {
        $this->configure();
        Queue::fake();
        $notice = $this->notice();
        Queue::assertPushed(DeliverNotification::class);
        $providerStatus = 200;
        Http::fake(function () use (&$providerStatus) {
            return Http::response([], $providerStatus);
        });
        $job = new DeliverNotification($notice->id);
        $job->handle(app(PusherDelivery::class));
        Http::assertSent(function ($request) use ($notice) {
            $body = json_decode($request->body(), true);
            $data = json_decode($body['data'], true);
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);
            $signature = $query['auth_signature'];
            unset($query['auth_signature']);
            ksort($query);
            $canonical = http_build_query($query, '', '&', PHP_QUERY_RFC3986);

            return $body['name'] === 'notification.created' && $body['channels'] === ['private-users.'.$notice->recipient_id] && array_keys($data) === ['id', 'lead_id', 'history_id', 'kind'] && $query['body_md5'] === md5($request->body()) && $signature === hash_hmac('sha256', "POST\n/apps/123/events\n".$canonical, 'private-test-secret') && ! str_contains($request->body(), 'Private lead name') && ! str_contains($request->body(), '628123456789');
        });
        $this->assertNotNull($notice->fresh()->push_sent_at);
        $job->handle(app(PusherDelivery::class));
        Http::assertSentCount(1);
        UserNotification::query()->whereKey($notice->id)->update(['push_sent_at' => null]);
        $providerStatus = 503;
        try {
            $job->handle(app(PusherDelivery::class));
            $this->fail('Provider failure must retry.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('PUSH_PROVIDER_UNAVAILABLE', $exception->getMessage());
        }
        $this->assertNull($notice->fresh()->push_sent_at);
        $this->assertDatabaseCount('user_notifications', 1);
    }

    public function test_disabled_or_unconfigured_push_falls_back_and_inactive_recipient_is_not_sent(): void
    {
        Http::fake();
        $notice = $this->notice();
        $this->assertDatabaseCount('jobs', 0);
        $this->actingAs(User::findOrFail($notice->recipient_id))->getJson('/api/v1/realtime')->assertJsonPath('data.enabled', false)->assertJsonMissingPath('data.secret');
        $this->configure();
        User::query()->whereKey($notice->recipient_id)->update(['is_active' => false]);
        (new DeliverNotification($notice->id))->handle(app(PusherDelivery::class));
        Http::assertNothingSent();
    }

    public function test_queue_insert_failure_rolls_back_assignment_history_and_notification(): void
    {
        $notice = $this->notice();
        Lead::query()->whereKey($notice->lead_id)->update(['assigned_marketing_id' => null]);
        $this->configure();
        $this->actingAs(User::factory()->create(['is_active' => true, 'role' => 'ADMIN']));
        $manager = Queue::getFacadeRoot();
        Queue::partialMock()->shouldReceive('connection')->with('database')->andThrow(new \RuntimeException('Queue unavailable'));
        try {
            $this->postJson('/api/v1/leads/'.$notice->lead_id.'/assignment', ['version' => 1, 'marketing_id' => $notice->recipient_id])->assertStatus(500);
        } finally {
            Queue::swap($manager);
        }
        $this->assertSame(1, Lead::findOrFail($notice->lead_id)->version);
        $this->assertNull(Lead::findOrFail($notice->lead_id)->assigned_marketing_id);
        $this->assertDatabaseCount('lead_histories', 1);
        $this->assertDatabaseCount('user_notifications', 1);
        $this->assertDatabaseCount('jobs', 0);
        $this->postJson('/api/v1/leads/'.$notice->lead_id.'/assignment', ['version' => 1, 'marketing_id' => $notice->recipient_id])->assertOk();
        $this->assertDatabaseCount('jobs', 1);
    }

    public function test_official_auth_vector_and_explicit_delivery_recovery(): void
    {
        $this->configure();
        config(['realtime.key' => '278d425bdf160c739803', 'realtime.secret' => '7ad3773142a6692b25b8']);
        $this->assertSame('278d425bdf160c739803:58df8b0c36d6982b82c3ecf6b4662e34fe8c25bba48f5369f135bf843651c3a4', app(PusherDelivery::class)->authorize('1234.1234', 'private-foobar'));
        $notice = $this->notice();
        UserNotification::query()->whereKey($notice->id)->update(['created_at' => now()->subMinute()]);
        DB::table('jobs')->delete();
        $this->artisan('flamboyan:notifications-recover')->assertSuccessful();
        $this->assertDatabaseCount('jobs', 0);
        $this->artisan('flamboyan:notifications-recover', ['--execute' => true])->assertSuccessful();
        $this->assertDatabaseCount('jobs', 1);
        $this->artisan('flamboyan:notifications-recover', ['--execute' => true])->assertSuccessful();
        $this->assertDatabaseCount('jobs', 1);
    }
}
