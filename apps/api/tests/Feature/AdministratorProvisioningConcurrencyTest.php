<?php

namespace Tests\Feature;

use App\Services\AdministratorProvisioning;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class AdministratorProvisioningConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_concurrent_cli_bootstrap_creates_exactly_one_admin_on_postgresql(): void
    {
        // test-high-impact: two real CLI processes must reach the production advisory lock before it is released.
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL concurrency contract; SQLite serialization is covered by the same service path.');
        }

        $emails = ['admin-race-a@example.test', 'admin-race-b@example.test'];
        $lockName = 'administrator_provisioning_lock';
        $observerName = 'administrator_provisioning_observer';
        $database = DB::connection()->getConfig();
        config([
            'database.connections.'.$lockName => $database,
            'database.connections.'.$observerName => $database,
        ]);
        DB::purge($lockName);
        DB::purge($observerName);
        $lock = DB::connection($lockName);
        $observer = DB::connection($observerName);
        $observer->table('users')->whereIn('email', $emails)->delete();

        $reflection = new ReflectionClass(AdministratorProvisioning::class);
        $namespace = (int) $reflection->getReflectionConstant('LOCK_NAMESPACE')->getValue();
        $key = (int) $reflection->getReflectionConstant('LOCK_KEY')->getValue();
        $lock->beginTransaction();
        $lock->select('select pg_advisory_xact_lock(?, ?)', [$namespace, $key]);

        $environment = array_filter([
            'APP_ENV' => 'testing',
            'APP_DEBUG' => 'false',
            'APP_KEY' => 'base64:4jQf1B83CSfMIX5i2dA8AAWvBQqygbISfUiPQBMOvVE=',
            'CACHE_STORE' => 'array',
            'SESSION_DRIVER' => 'array',
            'LOG_CHANNEL' => 'null',
            'DB_CONNECTION' => 'pgsql',
            'DB_URL' => '',
            'DB_HOST' => (string) $database['host'],
            'DB_PORT' => (string) $database['port'],
            'DB_DATABASE' => (string) $database['database'],
            'DB_USERNAME' => (string) $database['username'],
            'DB_PASSWORD' => (string) $database['password'],
            'DB_SCHEMA' => is_string($database['search_path'] ?? null) ? $database['search_path'] : 'public',
            'DB_SSLMODE' => (string) ($database['sslmode'] ?? 'prefer'),
            'DB_SSLROOTCERT' => (string) ($database['sslrootcert'] ?? ''),
        ], static fn (string $value): bool => $value !== '');
        $code = <<<'PHP'
        require $argv[1];
        $app = require $argv[2];
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        $inputs = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
        $app->bind(Illuminate\Console\OutputStyle::class, function ($app, array $parameters) {
            return new class($parameters['input'], $parameters['output']) extends Illuminate\Console\OutputStyle {
                public function askQuestion(Symfony\Component\Console\Question\Question $question): mixed
                {
                    if ($question->isHidden()) {
                        $question->setHidden(false);
                    }

                    return parent::askQuestion($question);
                }
            };
        });
        $command = $kernel->all()['flamboyan:create-user'];
        $tester = new Symfony\Component\Console\Tester\CommandTester($command);
        $tester->setInputs($inputs);
        $status = $tester->execute([], ['interactive' => true, 'decorated' => false]);
        fwrite(STDOUT, $tester->getDisplay());
        exit($status);
        PHP;
        $autoload = base_path('vendor/autoload.php');
        $bootstrap = base_path('bootstrap/app.php');
        $processes = array_map(function (string $email) use ($autoload, $bootstrap, $code, $environment): Process {
            $process = new Process([
                PHP_BINARY,
                '-d',
                'extension_dir='.ini_get('extension_dir'),
                '-d',
                'opcache.enable_cli=0',
                '-r',
                $code,
                $autoload,
                $bootstrap,
            ], base_path(), $environment);
            $process->setInput(json_encode([
                'Admin race',
                $email,
                '0',
                'Sandi-pengujian-2026',
                'Sandi-pengujian-2026',
                false,
            ], JSON_THROW_ON_ERROR));
            $process->setTimeout(20);
            $process->start();

            return $process;
        }, $emails);

        try {
            $deadline = microtime(true) + 10;
            do {
                $waiting = (int) $observer->table('pg_stat_activity')
                    ->where('datname', $database['database'])
                    ->where('wait_event', 'advisory')
                    ->where('query', 'like', '%pg_advisory_xact_lock%')
                    ->count();
                if ($waiting === 2) {
                    break;
                }
                if (collect($processes)->every(static fn (Process $process): bool => ! $process->isRunning())) {
                    break;
                }
                usleep(25000);
            } while (microtime(true) < $deadline);

            $diagnostic = collect($processes)->map(static fn (Process $process): string => $process->getOutput().$process->getErrorOutput())->implode(PHP_EOL);
            $this->assertSame(2, $waiting, 'Both CLI workers must be observed waiting on the shared advisory lock. '.$diagnostic);

            $lock->commit();
            foreach ($processes as $process) {
                $process->wait();
            }

            $exitCodes = array_map(static fn (Process $process): int => $process->getExitCode(), $processes);
            sort($exitCodes);
            $this->assertSame([0, 1], $exitCodes, $diagnostic);
            $output = collect($processes)->map(static fn (Process $process): string => $process->getOutput().$process->getErrorOutput())->implode(PHP_EOL);
            $this->assertStringContainsString('Akun internal berhasil dibuat.', $output);
            $this->assertStringContainsString('Hanya satu akun Administrator yang diizinkan.', $output);
            $this->assertSame(1, $observer->table('users')->where('role', 'ADMIN')->whereIn('email', $emails)->count());
        } finally {
            if ($lock->transactionLevel() > 0) {
                $lock->rollBack();
            }
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop(2);
                }
            }
            $observer->table('users')->whereIn('email', $emails)->delete();
            DB::disconnect($lockName);
            DB::disconnect($observerName);
        }
    }
}
