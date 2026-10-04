<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EdgeSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('app.env') === 'production') {
            abort_unless(in_array($request->getHost(), config('operations.hosts'), true), 400, 'Host tidak diizinkan.');
        }
        if ($request->headers->has('X-Flamboyan-Proxy-Signature')) {
            $secret = (string) config('operations.proxy_secret');
            $ip = (string) $request->header('X-Flamboyan-Client-IP');
            $time = (string) $request->header('X-Flamboyan-Proxy-Time');
            $path = '/'.$request->path();
            $public = preg_match('#^/api/v1/(properties(/[^/]+)?|content(/[0-9]+/logo)?|compare|sitemap|analytics)$#', $path);
            abort_unless($public && strlen($secret) >= 32 && filter_var($ip, FILTER_VALIDATE_IP) && ctype_digit($time) && abs(now()->timestamp - (int) $time) <= 30, 403);
            $expected = hash_hmac('sha256', $request->method()."\n".$path."\n".$time."\n".$ip, $secret);
            abort_unless(hash_equals($expected, (string) $request->header('X-Flamboyan-Proxy-Signature')), 403);
            $request->attributes->set('public_client_ip', $ip);
        }

        return self::headers($next($request), $request);
    }

    public static function headers(Response $response, Request $request): Response
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        if (config('app.env') === 'production' && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
