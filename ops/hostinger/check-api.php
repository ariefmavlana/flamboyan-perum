<?php

declare(strict_types=1);
use App\Services\OperationalHealth;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

try {
    $root = realpath((string) getenv('FLAMBOYAN_ROOT'));
    $base = isset($argv[1]) ? realpath($argv[1]) : false;
    if (! $root || ! $base || ! str_starts_with($base, $root.'/releases/') || ! str_ends_with($base, '/apps/api') || realpath($base.'/.env') !== $root.'/shared/.env') {
        throw new RuntimeException('Release path guard');
    }
    if (PHP_VERSION_ID < 80400 || PHP_VERSION_ID >= 80500 || ! extension_loaded('pdo_pgsql') || ! extension_loaded('gd') || ! gd_info()['WebP Support'] || ! extension_loaded('pcntl')) {
        throw new RuntimeException('Runtime guard');
    }
    require $base.'/vendor/autoload.php';
    $app = require $base.'/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
    $db = DB::connection();
    if (config('app.env') !== 'production' || config('app.debug') || $db->getDriverName() !== 'pgsql' || $db->getConfig('sslmode') !== 'verify-full' || $db->getConfig('search_path') !== 'public' || ! config('session.secure') || ! config('session.encrypt')) {
        throw new RuntimeException('Production configuration guard');
    }
    $db->beginTransaction();
    $db->statement('SET TRANSACTION READ ONLY');
    $db->statement("SET LOCAL statement_timeout = '10s'");
    $applied = $db->table('migrations')->pluck('migration')->all();
    $source = array_map(static fn ($path) => basename($path, '.php'), glob($base.'/database/migrations/*.php'));
    $pending = array_values(array_diff($source, $applied));
    $db->rollBack();
    if ($pending) {
        throw new RuntimeException('Pending migration requires a manual release');
    }
    $health = app(OperationalHealth::class)->snapshot();
    if (! $health['ready']) {
        throw new RuntimeException('Application readiness guard');
    }
    echo json_encode(['ready' => true, 'php' => PHP_VERSION, 'pending_migrations' => 0, 'database_tls' => 'verify-full', 'private_storage' => true, 'production_configuration' => true], JSON_THROW_ON_ERROR), PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, 'API release preflight failed; keep the previous release. Details withheld.'.PHP_EOL);
    exit(1);
}
