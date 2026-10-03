<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AccountOperations;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecoveryController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:254']);
        abort_if((app()->environment('production') || config('app.env') === 'production') && in_array(config('mail.default'), ['log', 'array'], true), 503, 'Pemulihan email belum dikonfigurasi.');
        $user = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])->where('is_active', true)->whereNotNull('email_verified_at')->first();
        if ($user && in_array($user->role, ['ADMIN', 'MARKETING'], true)) {
            Password::sendResetLink(['email' => $user->email, 'is_active' => true]);
        }

        return response()->json(['message' => 'Jika akun aktif dan identitas email telah diverifikasi, petunjuk pemulihan akan dikirim.'], 202);
    }

    public function reset(Request $request, AccountOperations $accounts)
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:254', 'token' => 'required|string|max:256', 'password' => 'required|string|min:12|max:1024|confirmed']);
        $data['email'] = mb_strtolower($data['email']);
        DB::transaction(function () use ($data, $accounts) {
            $user = User::query()->whereRaw('LOWER(email) = ?', [$data['email']])->where('is_active', true)->whereNotNull('email_verified_at')->lockForUpdate()->first();
            if ($user) {
                $data['email'] = $user->email;
            }
            $status = $user && in_array($user->role, ['ADMIN', 'MARKETING'], true)
                ? Password::reset($data, function (User $target, string $password) use ($accounts) {
                    $target->forceFill(['password' => $password, 'remember_token' => Str::random(60), 'version' => $target->version + 1])->save();
                    $accounts->revoke($target);
                    $accounts->audit($target, $target, 'PASSWORD_RESET', ['sessions_revoked' => true]);
                    event(new PasswordReset($target));
                }) : Password::InvalidToken;
            if ($status !== Password::PasswordReset) {
                throw ValidationException::withMessages(['token' => 'Tautan tidak valid, kedaluwarsa, atau sudah digunakan.']);
            }
        }, 3);

        return ['message' => 'Kata sandi diperbarui. Silakan masuk kembali.'];
    }
}
