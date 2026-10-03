<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->is_active && in_array($request->user()->role, ['ADMIN', 'MARKETING'], true), 403, 'Akun tidak memiliki akses aktif.');
        if ($request->hasSession() && (! $request->session()->has('account_security_stamp') || ! hash_equals((string) $request->user()->remember_token, (string) $request->session()->get('account_security_stamp')))) {
            Auth::guard('web')->logoutCurrentDevice();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            abort(401, 'Sesi akun telah dicabut. Silakan masuk kembali.');
        }

        return $next($request);
    }
}
