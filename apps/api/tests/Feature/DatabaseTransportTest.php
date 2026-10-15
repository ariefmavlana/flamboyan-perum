<?php

namespace Tests\Feature;

use App\Services\OperationalHealth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseTransportTest extends TestCase
{
    public function test_provider_ca_paths_resolve_against_the_application_directory(): void
    {
        $originalEnv = $_ENV['DB_SSLROOTCERT'] ?? null;
        $originalServer = $_SERVER['DB_SSLROOTCERT'] ?? null;
        $originalProcess = getenv('DB_SSLROOTCERT');
        try {
            $paths = ['resources/certificates/supabase-ca-2021.crt' => base_path('resources/certificates/supabase-ca-2021.crt'), '/private/provider.pem' => '/private/provider.pem'];
            if (PHP_OS_FAMILY === 'Windows') {
                $paths['C:/private/provider.pem'] = 'C:/private/provider.pem';
            }
            foreach ($paths as $path => $expected) {
                $_ENV['DB_SSLROOTCERT'] = $_SERVER['DB_SSLROOTCERT'] = $path;
                putenv('DB_SSLROOTCERT='.$path);
                $database = require config_path('database.php');
                $this->assertSame($expected, $database['connections']['pgsql']['sslrootcert']);
            }
        } finally {
            if ($originalEnv === null) {
                unset($_ENV['DB_SSLROOTCERT']);
            } else {
                $_ENV['DB_SSLROOTCERT'] = $originalEnv;
            }
            if ($originalServer === null) {
                unset($_SERVER['DB_SSLROOTCERT']);
            } else {
                $_SERVER['DB_SSLROOTCERT'] = $originalServer;
            }
            putenv($originalProcess === false ? 'DB_SSLROOTCERT' : 'DB_SSLROOTCERT='.$originalProcess);
        }
    }

    public function test_production_checks_resolved_url_tls_before_database_queries(): void
    {
        $original = config('database.default');
        config(['app.env' => 'production', 'operations.hosts' => ['localhost'], 'database.default' => 'transport_test']);
        try {
            foreach (['disable' => false, 'allow' => false, 'prefer' => false, 'require' => false, 'verify-ca' => false, 'verify-full' => true] as $mode => $secure) {
                config(['database.connections.transport_test' => array_merge(config('database.connections.pgsql'), [
                    'url' => 'postgresql://fixture@127.0.0.1:9/fixture?sslmode='.$mode,
                    'sslmode' => 'verify-full',
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
