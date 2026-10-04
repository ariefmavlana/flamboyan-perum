<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:254', 'password' => 'required|string|max:1024']);
        $account = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])->first();
        $data['email'] = $account?->email ?? mb_strtolower($data['email']);
        if (! Auth::guard('web')->attempt(array_merge($data, ['is_active' => true]))) {
            throw ValidationException::withMessages(['email' => 'Email atau kata sandi tidak sesuai.']);
        }
        $user = Auth::guard('web')->user();
        if (! in_array($user->role, ['ADMIN', 'MARKETING'], true)) {
            Auth::guard('web')->logoutCurrentDevice();
            abort(403, 'Akun tidak memiliki akses.');
        }
        $request->session()->regenerate();
        $request->session()->put('account_security_stamp', (string) $user->remember_token);

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
