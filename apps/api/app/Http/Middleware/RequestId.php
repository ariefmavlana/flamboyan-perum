<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('request_id', (string) Str::uuid());
        if ($request->is('api/*')) {
            $request->headers->set('Accept', 'application/json');
        }
        $response = $next($request);
        $response->headers->set('X-Request-ID', $request->attributes->get('request_id'));
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-store');
        }

        return $response;
    }
}
