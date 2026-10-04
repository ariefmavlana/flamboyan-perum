<?php

namespace App\Console\Commands;

use App\Jobs\DeliverNotification;
use App\Models\UserNotification;
use App\Services\PusherDelivery;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecoverNotifications extends Command
{
    protected $signature = 'flamboyan:notifications-recover {--execute : Requeue unsent notifications from the last 24 hours after repairing delivery}';

    protected $description = 'Dry-run by default; recover recent persisted notifications without contact data';

    public function handle(PusherDelivery $provider): int
    {
        if ($this->option('execute') && (! $provider->ready() || (config('queue.connections.database.connection') !== null && config('queue.connections.database.connection') !== config('database.default')))) {
            $this->error('Konfigurasi provider/queue database belum siap.');

            return self::FAILURE;
        }
        $count = 0;
        UserNotification::query()->whereNull('push_sent_at')->whereBetween('created_at', [now()->subDay(), now()->subSeconds(30)])->orderBy('id')->chunkById(100, function ($rows) use (&$count) {
            foreach ($rows as $notification) {
                if (DB::table('jobs')->where('queue', 'notifications')->where('payload', 'like', '%'.$notification->id.'%')->exists()) {
                    continue;
                }
                $count++;
                if ($this->option('execute')) {
                    DeliverNotification::dispatch($notification->id)->onConnection('database')->onQueue('notifications')->beforeCommit();
                }
            }
        });
        $this->info(($this->option('execute') ? 'Requeued: ' : 'Dry-run candidates: ').$count);

        return self::SUCCESS;
    }
}
