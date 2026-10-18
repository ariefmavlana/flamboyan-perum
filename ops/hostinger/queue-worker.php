<?php

declare(strict_types=1);
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Queue\Events\JobExceptionOccurred;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\Event;
use Symfony\Component\Console\Input\ArgvInput;

umask(0077);
$queue = $argv[1] ?? '';
$root = realpath((string) getenv('FLAMBOYAN_ROOT'));
if (! $root || ! in_array($queue, ['notifications', 'media', 'default'], true)) {
    exit(64);
}
$base = $root.'/current/apps/api';
require $base.'/vendor/autoload.php';
$app = require $base.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (PHP_VERSION_ID < 80400 || PHP_VERSION_ID >= 80500 || ! extension_loaded('pdo_pgsql') || ! extension_loaded('pcntl') || ! function_exists('pcntl_alarm') || config('app.env') !== 'production' || config('database.default') !== 'pgsql' || config('database.connections.pgsql.sslmode') !== 'verify-full' || config('queue.connections.database.retry_after') !== 180) {
    fwrite(STDERR, 'Worker runtime qualification failed.'.PHP_EOL);
    exit(78);
}
$record = static function (string $kind, $job = null, ?int $exit = null) use ($queue, $root): void {
    $id = $job ? (string) $job->getJobId() : null;
    if ($id !== null && ! preg_match('/^[a-zA-Z0-9_-]{1,64}$/', $id)) {
        $id = 'withheld';
    }
    $entry = ['at' => microtime(true), 'event' => $kind, 'queue' => $queue, 'job_id' => $id, 'pid' => getmypid()];
    if ($exit !== null) {
        $entry['exit'] = $exit;
    }
    file_put_contents($root.'/shared/queue-events.jsonl', json_encode($entry, JSON_THROW_ON_ERROR).PHP_EOL, FILE_APPEND | LOCK_EX);
};
Event::listen(JobProcessing::class, static fn ($event) => $record('processing', $event->job));
Event::listen(JobProcessed::class, static fn ($event) => $record('processed', $event->job));
Event::listen(JobExceptionOccurred::class, static fn ($event) => $record('exception', $event->job));
$record('started');
$exit = $app->handleCommand(new ArgvInput([
    'artisan', 'queue:work', 'database', '--queue='.$queue, '--stop-when-empty',
    '--max-time=50', '--max-jobs=50', '--sleep=1', '--tries=3', '--timeout=30', '--memory=192', '--no-ansi',
]));
$record('finished', null, $exit);
exit($exit);
