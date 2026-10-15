<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:254', 'password' => 'required|string|max:1024']);
        $account = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])->first();
        $data['email'] = $account?->email ?? mb_strtolower($data['email']);
        if (! Auth::guard('web')->attempt(array_merge($data, ['is_active' => true]))) {
            Log::warning('login_failed', ['request_id' => $request->attributes->get('request_id'), 'ip_hash' => substr(hash('sha256', (string) $request->ip()), 0, 16)]);
            throw ValidationException::withMessages(['email' => 'Email atau kata sandi tidak sesuai.']);
        }
        $user = Auth::guard('web')->user();
        if (! in_array($user->role, ['ADMIN', 'MARKETING'], true)) {
            Auth::guard('web')->logoutCurrentDevice();
            abort(403, 'Akun tidak memiliki akses.');
        }
        $request->session()->regenerate();
        $request->session()->put('account_security_stamp', (string) $user->remember_token);
        try {
            ActivityLog::create(['actor_id' => $user->id, 'subject_type' => 'USER', 'subject_id' => $user->id, 'action' => 'LOGIN', 'changes' => ['role' => $user->role]]);
        } catch (\Throwable $error) {
            Auth::guard('web')->logoutCurrentDevice();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            throw $error;
        }

        return response()->json(['data' => $user->only(['id', 'name', 'role'])]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logoutCurrentDevice();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
