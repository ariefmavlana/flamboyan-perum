<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OperationalHealth
{
    public function snapshot(): array
    {
        $database = $storage = false;
        $media = null;
        $queue = ['pending' => null, 'oldest_age_seconds' => null, 'failed' => null, 'backlog_alert' => true];
        try {
            DB::select('select 1');
            $database = true;
            $oldest = DB::table('jobs')->min('created_at');
            $age = $oldest ? max(0, now()->timestamp - (int) $oldest) : 0;
            $queue = ['pending' => DB::table('jobs')->count(), 'oldest_age_seconds' => $age, 'failed' => DB::table('failed_jobs')->count(), 'backlog_alert' => $age > 300];
            $media = ['failed' => DB::table('property_media')->where('state', 'FAILED')->count(), 'stale_processing' => DB::table('property_media')->where('state', 'PROCESSING')->where('updated_at', '<', now()->subMinutes(15))->count()];
        } catch (\Throwable) {
            $database = false;
        }
        $probe = '.health-'.Str::uuid();
        try {
            Storage::disk('media')->put($probe, 'ready');
            $storage = Storage::disk('media')->get($probe) === 'ready';
        } catch (\Throwable) {
        } finally {
            try {
                Storage::disk('media')->delete($probe);
            } catch (\Throwable) {
            }
        }
        $ready = $database && $storage && ! $queue['backlog_alert'];
        $verified = null;
        try {
            $marker = config('operations.backup_marker');
            if (is_file($marker) && ! is_link($marker) && filesize($marker) <= 4096) {
                $data = json_decode(file_get_contents($marker), true, 16, JSON_THROW_ON_ERROR);
                $value = $data['verified_at'] ?? '';
                if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $value)) {
                    $parsed = CarbonImmutable::createFromFormat('!Y-m-d\TH:i:s\Z', $value, 'UTC');
                    if ($parsed && $parsed->format('Y-m-d\TH:i:s\Z') === $value && $parsed->lte(now())) {
                        $verified = $parsed;
                    }
                }
            }
        } catch (\Throwable) {
        }
        $backupAge = $verified ? (int) $verified->diffInSeconds(now()) : null;
        $production = config('app.env') === 'production';
        $key = (string) config('app.key');
        $key = str_starts_with($key, 'base64:') ? base64_decode(substr($key, 7), true) : $key;
        $configuration = ! $production || (! config('app.debug') && is_string($key) && strlen($key) === 32 && strlen((string) config('operations.proxy_secret')) >= 32 && config('session.secure') === true && str_starts_with((string) config('app.url'), 'https://') && (! config('realtime.enabled') || app(PusherDelivery::class)->ready()));

        return ['ready' => $ready && $configuration, 'database' => $database, 'private_storage' => $storage, 'production_configuration' => $configuration, 'queue' => $queue, 'media' => $database ? $media : null, 'backup' => ['verified_at' => $verified?->toIso8601String(), 'age_seconds' => $backupAge, 'overdue' => $backupAge === null || $backupAge > 93600]];
    }
}
