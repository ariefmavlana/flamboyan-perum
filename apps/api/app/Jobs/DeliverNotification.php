<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\UserNotification;
use App\Services\PusherDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeliverNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 15;

    public bool $failOnTimeout = true;

    public function __construct(public string $notificationId) {}

    public function backoff(): array
    {
        return [5, 30, 120];
    }

    public function handle(PusherDelivery $provider): void
    {
        $notification = UserNotification::find($this->notificationId);
        if (! config('realtime.enabled') || ! $notification || $notification->push_sent_at || ! User::query()->whereKey($notification->recipient_id)->where('is_active', true)->whereIn('role', ['ADMIN', 'MARKETING'])->exists()) {
            return;
        }
        $provider->send($notification);
        UserNotification::query()->whereKey($notification->id)->whereNull('push_sent_at')->update(['push_sent_at' => now()]);
    }
}
