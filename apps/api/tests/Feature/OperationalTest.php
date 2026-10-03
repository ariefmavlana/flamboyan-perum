<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OperationalTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_errors_and_logs_have_no_request_content(): void
    {
        Log::spy();
        $response = $this->getJson('/api/v1/properties?q=private-test-phone');
        $response->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY')->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $this->getJson('/api/v1/me')->assertUnauthorized()->assertHeader('X-Content-Type-Options', 'nosniff');
        Log::shouldHaveReceived('info')->with('http_request', \Mockery::on(fn ($data) => $data['route'] === 'api/v1/me' && $data['status'] === 401));
        Log::shouldHaveReceived('info')->with('http_request', \Mockery::on(fn ($data) => array_keys($data) === ['request_id', 'method', 'route', 'status', 'duration_ms'] && ! str_contains(json_encode($data), 'private-test-phone')));
    }

    public function test_signed_public_proxy_is_bounded_and_cannot_be_forged_or_replayed_to_another_route(): void
    {
        $secret = str_repeat('s', 64);
        config(['operations.proxy_secret' => $secret]);
        $timestamp = (string) now()->timestamp;
        $ip = '203.0.113.20';
        $signature = hash_hmac('sha256', "GET\n/api/v1/properties\n".$timestamp."\n".$ip, $secret);
        $headers = ['X-Flamboyan-Client-IP' => $ip, 'X-Flamboyan-Proxy-Time' => $timestamp, 'X-Flamboyan-Proxy-Signature' => $signature];
        $this->getJson('/api/v1/properties', $headers)->assertOk();
        $this->getJson('/api/v1/content', $headers)->assertForbidden();
        $this->getJson('/api/v1/properties', array_merge($headers, ['X-Flamboyan-Client-IP' => '203.0.113.21']))->assertForbidden();
        $this->getJson('/api/v1/properties', array_merge($headers, ['X-Flamboyan-Proxy-Time' => (string) now()->subMinute()->timestamp]))->assertForbidden();
        $this->getJson('/api/v1/properties', ['X-Forwarded-For' => '203.0.113.20'])->assertOk();
        $this->assertNotSame($ip, request()->ip());
    }

    public function test_readiness_is_sanitized_and_admin_metrics_detect_backlog(): void
    {
        Storage::fake('media');
        $this->getJson('/ready')->assertOk()->assertExactJson(['status' => 'ready'])->assertHeader('Cache-Control', 'no-store, private');
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $marketing = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $this->getJson('/api/v1/internal/operations')->assertUnauthorized();
        $this->actingAs($marketing)->getJson('/api/v1/internal/operations')->assertForbidden();
        DB::table('jobs')->insert(['queue' => 'notifications', 'payload' => '{}', 'attempts' => 0, 'reserved_at' => null, 'available_at' => now()->timestamp, 'created_at' => now()->subMinutes(6)->timestamp]);
        $this->actingAs($admin)->getJson('/api/v1/internal/operations')->assertOk()->assertJsonPath('data.queue.pending', 1)->assertJsonPath('data.queue.backlog_alert', true)->assertJsonMissingPath('data.database.password');
        $this->getJson('/ready')->assertServiceUnavailable()->assertExactJson(['status' => 'not_ready']);
    }

    public function test_production_host_allowlist_and_https_headers(): void
    {
        config(['app.env' => 'production', 'operations.hosts' => ['flamboyan.example.test']]);
        $this->getJson('https://hostile.example.test/api/v1/properties')->assertStatus(400);
        $this->getJson('https://flamboyan.example.test/api/v1/properties')->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    public function test_database_outage_returns_generic_not_ready_instead_of_partial_success(): void
    {
        Storage::fake('media');
        DB::shouldReceive('select')->with('select 1')->andThrow(new \RuntimeException('private database connection detail'));
        $this->getJson('/ready')->assertServiceUnavailable()->assertExactJson(['status' => 'not_ready']);
    }

    public function test_backup_marker_is_missing_stale_fresh_or_invalid_without_exposing_paths(): void
    {
        $this->freezeTime();
        Storage::fake('media');
        $marker = tempnam(sys_get_temp_dir(), 'flamboyan-backup-');
        config(['operations.backup_marker' => $marker]);
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $this->actingAs($admin);
        try {
            $this->getJson('/api/v1/internal/operations')->assertOk()->assertJsonPath('data.backup.overdue', true);
            foreach ([now()->subHours(27)->utc()->format('Y-m-d\TH:i:s\Z'), now()->addHour()->utc()->format('Y-m-d\TH:i:s\Z'), 'now', '2026-02-31T00:00:00Z'] as $date) {
                file_put_contents($marker, json_encode(['verified_at' => $date]));
                $this->getJson('/api/v1/internal/operations')->assertOk()->assertJsonPath('data.backup.overdue', true)->assertJsonMissingPath('data.backup.path');
            }
            file_put_contents($marker, json_encode(['verified_at' => now()->subHour()->utc()->format('Y-m-d\TH:i:s\Z')]));
            $this->getJson('/api/v1/internal/operations')->assertOk()->assertJsonPath('data.backup.overdue', false)->assertJsonPath('data.backup.age_seconds', 3600);
        } finally {
            @unlink($marker);
        }
    }

    public function test_production_readiness_requires_valid_key_and_secure_configuration(): void
    {
        Storage::fake('media');
        $valid = ['app.env' => 'production', 'app.debug' => false, 'app.key' => 'base64:'.base64_encode(str_repeat('k', 32)), 'app.url' => 'https://localhost', 'session.secure' => true, 'operations.proxy_secret' => str_repeat('p', 64), 'operations.hosts' => ['localhost'], 'realtime.enabled' => false];
        config($valid);
        $this->getJson('https://localhost/ready')->assertOk();
        foreach (['app.debug' => true, 'app.key' => 'base64:invalid', 'session.secure' => false, 'app.url' => 'http://localhost', 'operations.proxy_secret' => ''] as $field => $value) {
            config(array_merge($valid, [$field => $value]));
            $this->getJson('https://localhost/ready')->assertServiceUnavailable()->assertExactJson(['status' => 'not_ready']);
        }
    }
}
