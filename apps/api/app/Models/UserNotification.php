<?php

namespace App\Models;

use App\Jobs\DeliverNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = ['recipient_id', 'lead_id', 'history_id', 'kind'];

    protected static function booted(): void
    {
        static::created(function (UserNotification $notification) {
            if (! config('realtime.enabled')) {
                return;
            }
            abort_unless(! config('queue.connections.database.connection') || config('queue.connections.database.connection') === config('database.default'), 503, 'Queue database harus memakai database aplikasi.');
            DeliverNotification::dispatch($notification->id)->onConnection('database')->onQueue('notifications')->beforeCommit();
        });
    }

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'push_sent_at' => 'datetime'];
    }
}
