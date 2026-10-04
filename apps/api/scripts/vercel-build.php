<?php

use Symfony\Component\Process\Process;

require __DIR__.'/../vendor/autoload.php';

$root = dirname(__DIR__);
foreach (['bootstrap/cache', 'storage/framework/views', 'storage/framework/cache/data', 'storage/logs'] as $directory) {
    if (! is_dir($root.'/'.$directory)) {
        mkdir($root.'/'.$directory, 0775, true);
    }
}
$composer = getenv('COMPOSER_BINARY') ?: getenv('COMPOSER_HOME').'/composer.phar';
if (! is_file($composer)) {
    $composer = getenv('PHP_INI_EXTENSION_DIR') ? dirname(getenv('PHP_INI_EXTENSION_DIR')).'/composer' : '';
}
if (! is_file($composer)) {
    throw new RuntimeException('Composer binary must be available to validate the build.');
}

$testEnvironment = [
    'APP_ENV' => 'testing', 'APP_DEBUG' => 'false',
    'APP_KEY' => 'base64:'.base64_encode(str_repeat('t', 32)),
    'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:', 'DB_URL' => '',
    'DB_HOST' => '127.0.0.1', 'DB_USERNAME' => '', 'DB_PASSWORD' => '',
    'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'QUEUE_CONNECTION' => 'sync',
    'MEDIA_DISK_DRIVER' => 'local', 'MEDIA_PROCESS_IN_REQUEST' => 'false',
    'MAIL_MAILER' => 'array', 'BROADCAST_CONNECTION' => 'null', 'REALTIME_ENABLED' => 'false',
    'APP_CONFIG_CACHE' => $root.'/bootstrap/cache/config-tests.php',
    'APP_SERVICES_CACHE' => $root.'/bootstrap/cache/services-tests.php',
    'APP_PACKAGES_CACHE' => $root.'/bootstrap/cache/packages-tests.php',
    'APP_ROUTES_CACHE' => $root.'/bootstrap/cache/routes-tests.php',
    'APP_EVENTS_CACHE' => $root.'/bootstrap/cache/events-tests.php',
    'VIEW_COMPILED_PATH' => $root.'/storage/framework/views',
];

$run = function (array $args, ?array $environment = null) use ($root): void {
    // The native runtime caches CLI bytecode without timestamp checks. Composer
    // rewrites autoload files between dev and production installs in this build.
    array_splice($args, 1, 0, ['-d', 'opcache.enable_cli=0']);
    $process = new Process($args, $root, $environment);
    $process->setTimeout(300);
    $process->mustRun(fn ($type, $buffer) => print ($buffer));
};

// Vercel PHP installs production dependencies first. Test tools exist only
// during this build, and all tests override cloud database/storage settings.
$run([PHP_BINARY, $composer, 'install', '--no-interaction', '--prefer-dist', '--no-scripts', '--ignore-platform-reqs']);
$run([PHP_BINARY, 'vendor/bin/pint', '--test'], $testEnvironment);
$run([PHP_BINARY, 'vendor/bin/phpunit'], $testEnvironment);
$run([PHP_BINARY, $composer, 'validate', '--strict']);
$run([PHP_BINARY, $composer, 'audit']);
$run([PHP_BINARY, $composer, 'install', '--no-dev', '--no-interaction', '--prefer-dist', '--no-scripts', '--ignore-platform-reqs']);

foreach (glob($root.'/bootstrap/cache/*-tests.php') ?: [] as $cache) {
    unlink($cache);
}

// Apply forward migrations only on a production deployment, after checks.
// Preview builds never migrate the shared cloud database.
if (getenv('VERCEL_ENV') === 'production' && getenv('VERCEL_RUN_MIGRATIONS') === '1') {
    $run([PHP_BINARY, 'artisan', 'migrate', '--force', '--isolated']);
}
