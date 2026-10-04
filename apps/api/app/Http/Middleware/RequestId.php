<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class RequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('request_id', (string) Str::uuid());
        if ($request->is('api/*')) {
            $request->headers->set('Accept', 'application/json');
        }
        $started = hrtime(true);
        $status = 500;
        try {
            $response = $next($request);
            $status = $response->getStatusCode();
        } catch (\Throwable $error) {
            $status = match (true) {
                $error instanceof HttpExceptionInterface => $error->getStatusCode(),
                $error instanceof AuthenticationException => 401,
                $error instanceof ValidationException => 422,
                $error instanceof ModelNotFoundException => 404,
                $error instanceof AuthorizationException => 403,
                $error instanceof TokenMismatchException => 419,
                default => 500,
            };
            throw $error;
        } finally {
            Log::info('http_request', ['request_id' => $request->attributes->get('request_id'), 'method' => $request->method(), 'route' => $request->route()?->uri() ?? 'unmatched', 'status' => $status, 'duration_ms' => round((hrtime(true) - $started) / 1000000, 2)]);
        }
        $response->headers->set('X-Request-ID', $request->attributes->get('request_id'));
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-store');
        }

        return $response;
    }
}
