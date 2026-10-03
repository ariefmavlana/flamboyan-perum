<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:254', 'password' => 'required|string|max:1024']);
        if (! Auth::guard('web')->attempt(array_merge($data, ['is_active' => true]))) {
            throw ValidationException::withMessages(['email' => 'Email atau kata sandi tidak sesuai.']);
        }
        $user = Auth::guard('web')->user();
        if (! in_array($user->role, ['ADMIN', 'MARKETING'], true)) {
            Auth::guard('web')->logout();
            abort(403, 'Akun tidak memiliki akses.');
        }
        $request->session()->regenerate();

        return response()->json(['data' => $user->only(['id', 'name', 'role'])]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
