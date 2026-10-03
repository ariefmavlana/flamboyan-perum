<?php

use App\Http\Middleware\ActiveUser;
use App\Http\Middleware\RequestId;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $middleware->alias(['active' => ActiveUser::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
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

            return $response;
        });
    })->create();
