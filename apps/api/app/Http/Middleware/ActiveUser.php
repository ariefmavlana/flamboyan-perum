<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->is_active && in_array($request->user()->role, ['ADMIN', 'MARKETING'], true), 403, 'Akun tidak memiliki akses aktif.');

        return $next($request);
    }
}
