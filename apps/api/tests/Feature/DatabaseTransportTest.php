<?php

namespace Tests\Feature;

use App\Services\OperationalHealth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseTransportTest extends TestCase
{
    public function test_production_checks_resolved_url_tls_before_database_queries(): void
    {
        $original = config('database.default');
        config(['app.env' => 'production', 'operations.hosts' => ['localhost'], 'database.default' => 'transport_test']);
        try {
            foreach (['disable' => false, 'allow' => false, 'prefer' => false, 'require' => true, 'verify-ca' => true, 'verify-full' => true] as $mode => $secure) {
                config(['database.connections.transport_test' => array_merge(config('database.connections.pgsql'), [
                    'url' => 'postgresql://fixture@127.0.0.1:9/fixture?sslmode='.$mode,
                    'sslmode' => 'require',
                ])]);
                DB::purge('transport_test');
                $this->assertSame($mode, DB::connection()->getConfig('sslmode'));
                $this->assertSame($secure, app(OperationalHealth::class)->databaseTransportIsSecure());
                if (! $secure) {
                    $this->getJson('https://localhost/api/v1/properties')->assertServiceUnavailable()->assertJsonMissingPath('database');
                }
            }
        } finally {
            DB::purge('transport_test');
            config(['database.default' => $original]);
        }
    }
}
