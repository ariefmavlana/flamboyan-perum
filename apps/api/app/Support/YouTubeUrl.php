<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class YouTubeUrl
{
    public static function embed(string $url, string $field = 'url'): string
    {
        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');
        $path = $parts['path'] ?? '';
        parse_str($parts['query'] ?? '', $query);
        $id = match (true) {
            $host === 'youtu.be' => trim($path, '/'),
            (bool) preg_match('~^/(?:embed|shorts)/([a-zA-Z0-9_-]{11})/?$~', $path, $matches) => $matches[1],
            $path === '/watch' => $query['v'] ?? '',
            default => '',
        };
        $time = $query['start'] ?? $query['t'] ?? '0';
        $seconds = null;
        if (is_string($time) && preg_match('/^\d+$/', $time)) {
            $seconds = (int) $time;
        } elseif (is_string($time) && preg_match('/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/', $time, $duration) && $time !== '') {
            $seconds = (int) ($duration[1] ?? 0) * 3600 + (int) ($duration[2] ?? 0) * 60 + (int) ($duration[3] ?? 0);
        }
        if (! $parts || ($parts['scheme'] ?? '') !== 'https' || isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port'] !== 443) || ! in_array($host, ['youtu.be', 'youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'], true) || ! is_string($id) || ! preg_match('/^[a-zA-Z0-9_-]{11}$/', $id) || $seconds === null || $seconds > 86400) {
            throw ValidationException::withMessages([$field => 'Gunakan tautan HTTPS YouTube yang valid; waktu mulai maksimum 24 jam.']);
        }

        return 'https://www.youtube-nocookie.com/embed/'.$id.($seconds ? '?start='.$seconds : '');
    }
}
