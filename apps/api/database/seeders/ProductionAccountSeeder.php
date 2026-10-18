<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\AdministratorProvisioning;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProductionAccountSeeder extends Seeder
{
    public function __construct(private readonly AdministratorProvisioning $administratorProvisioning) {}

    public function run(): void
    {
        $accounts = [
            ['name' => 'Andre', 'email' => 'andre@admin.com', 'role' => 'ADMIN', 'password' => config('provisioning.admin_password')],
            ['name' => 'Marketing 1', 'email' => 'marketing1@arief.com', 'role' => 'MARKETING', 'password' => config('provisioning.marketing_password')],
        ];
        foreach ($accounts as $account) {
            Validator::make($account, ['password' => 'required|string|min:12|max:1024'])->validate();
        }

        $this->administratorProvisioning->transaction(function () use ($accounts) {
            $configuredAdminEmail = mb_strtolower($accounts[0]['email']);
            if (User::query()->where('role', 'ADMIN')->whereRaw('LOWER(email) <> ?', [$configuredAdminEmail])->exists()) {
                throw ValidationException::withMessages(['email' => 'Administrator existing harus dipulihkan; bootstrap pengganti tidak diizinkan.']);
            }

            foreach ($accounts as $account) {
                $user = User::query()->where('email', $account['email'])->lockForUpdate()->first();
                if ($user) {
                    if ($user->role !== $account['role'] || ! $user->is_active) {
                        throw ValidationException::withMessages(['email' => 'Akun existing memerlukan pemeriksaan role/status sebelum provisioning.']);
                    }

                    continue;
                }
                User::forceCreate($account + ['is_active' => true]);
            }
        });
    }
}
