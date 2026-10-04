<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateUser extends Command
{
    protected $signature = 'flamboyan:create-user';

    protected $description = 'Provision an internal account using interactive prompts.';

    public function handle(): int
    {
        $data = ['name' => $this->ask('Nama'), 'email' => $this->ask('Email'), 'role' => $this->choice('Role', ['ADMIN', 'MARKETING']), 'password' => $this->secret('Kata sandi (minimal 12 karakter)')];
        $validator = Validator::make($data, ['name' => 'required|string|max:160', 'email' => 'required|email|max:254|unique:users,email', 'role' => ['required', Rule::in(['ADMIN', 'MARKETING'])], 'password' => 'required|string|min:12|max:1024']);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }
        if ($data['password'] !== $this->secret('Ulangi kata sandi')) {
            $this->error('Konfirmasi kata sandi berbeda.');

            return self::FAILURE;
        }
        User::forceCreate(array_merge($validator->validated(), ['is_active' => true]));
        $this->info('Akun internal berhasil dibuat.');

        return self::SUCCESS;
    }
}
