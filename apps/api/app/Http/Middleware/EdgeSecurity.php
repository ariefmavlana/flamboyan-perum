<?php

namespace App\Http\Middleware;

use App\Services\OperationalHealth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EdgeSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array(config('app.env'), ['local', 'testing'], true)) {
            abort_unless(in_array($request->getHost(), config('operations.hosts'), true), 400, 'Host tidak diizinkan.');
            abort_unless(app(OperationalHealth::class)->databaseTransportIsSecure(), 503, 'Transport database belum memenuhi konfigurasi aman.');
        }
        $requiresRelay = $request->isMethod('POST') && in_array('/'.$request->path(), ['/api/v1/inquiries', '/api/v1/inquiries/context'], true);
        abort_if($requiresRelay && ! $request->headers->has('X-Flamboyan-Proxy-Signature'), 403);
        if ($request->headers->has('X-Flamboyan-Proxy-Signature')) {
            $secret = (string) config('operations.proxy_secret');
            $ip = (string) $request->header('X-Flamboyan-Client-IP');
            $time = (string) $request->header('X-Flamboyan-Proxy-Time');
            $path = '/'.$request->path();
            $public = match ($request->method()) {
                'GET' => preg_match('#^/api/v1/(properties(/[^/]+)?|content(/[0-9]+/logo)?|compare|sitemap|inquiries/options)$#', $path) === 1,
                'POST' => preg_match('#^/api/v1/(analytics|inquiries/context|inquiries)$#', $path) === 1,
                default => false,
            };
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
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');
        if (config('app.env') === 'production' && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
