<?php

namespace App\Services;

use App\Models\UserNotification;
use Illuminate\Support\Facades\Http;

class PusherDelivery
{
    public function ready(): bool
    {
        return (bool) config('realtime.enabled') && preg_match('/^[0-9]+$/', (string) config('realtime.app_id')) && preg_match('/^[a-zA-Z0-9_-]+$/', (string) config('realtime.key')) && (string) config('realtime.secret') !== '' && preg_match('/^[a-z]{2}[0-9]?$/', (string) config('realtime.cluster'));
    }

    public function authorize(string $socket, string $channel): string
    {
        abort_unless($this->ready(), 503, 'Real-time belum dikonfigurasi.');

        return config('realtime.key').':'.hash_hmac('sha256', $socket.':'.$channel, config('realtime.secret'));
    }

    public function send(UserNotification $notification): void
    {
        if (! $this->ready()) {
            throw new \RuntimeException('PUSH_CONFIGURATION_UNAVAILABLE');
        }
        $path = '/apps/'.config('realtime.app_id').'/events';
        $body = json_encode(['name' => 'notification.created', 'channels' => ['private-users.'.$notification->recipient_id], 'data' => json_encode($notification->only(['id', 'lead_id', 'history_id', 'kind']), JSON_THROW_ON_ERROR)], JSON_THROW_ON_ERROR);
        $query = ['auth_key' => config('realtime.key'), 'auth_timestamp' => (string) now()->timestamp, 'auth_version' => '1.0', 'body_md5' => md5($body)];
        ksort($query);
        $canonical = http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        $signature = hash_hmac('sha256', "POST\n".$path."\n".$canonical, config('realtime.secret'));
        $url = 'https://api-'.config('realtime.cluster').'.pusher.com'.$path.'?'.$canonical.'&auth_signature='.$signature;
        try {
            $response = Http::timeout(8)->connectTimeout(3)->withOptions(['allow_redirects' => false])->withBody($body, 'application/json')->send('POST', $url);
            if (! $response->successful()) {
                throw new \RuntimeException('PUSH_PROVIDER_UNAVAILABLE');
            }
        } catch (\Throwable) {
            // Do not retain provider response, signed URL or credentials in failed-job logs.
            throw new \RuntimeException('PUSH_PROVIDER_UNAVAILABLE');
        }
    }
}
