<?php

use App\Http\Middleware\ActiveUser;
use App\Http\Middleware\EdgeSecurity;
use App\Http\Middleware\RequestId;
use App\Http\Middleware\TrustedProxies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->append(RequestId::class);
        $middleware->append(EdgeSecurity::class);
        $middleware->replace(TrustProxies::class, TrustedProxies::class);
        $middleware->alias(['active' => ActiveUser::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (Throwable $error) {
            $code = (string) $error->getCode();
            Log::error('application_error', ['request_id' => request()->attributes->get('request_id'), 'class' => get_class($error), 'code' => preg_match('/^[A-Z0-9]{1,10}$/', $code) ? $code : 'unavailable']);

            return false;
        });
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*', 'auth/*') || $request->expectsJson(),
        );
        $exceptions->respond(function ($response) {
            if ($response instanceof JsonResponse && $response->getStatusCode() >= 400) {
                $data = $response->getStatusCode() >= 500
                    ? ['message' => 'Layanan mengalami kendala. Silakan coba lagi.']
                    : array_intersect_key($response->getData(true), array_flip(['message', 'errors']));
                $id = request()->attributes->get('request_id');
                $response->setData(array_merge($data, ['request_id' => $id]));
                $response->headers->set('X-Request-ID', (string) $id);
            }

            return EdgeSecurity::headers($response, request());
        });
    })->create();
