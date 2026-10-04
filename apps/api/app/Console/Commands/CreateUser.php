<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateUser extends Command
{
    protected $signature = 'flamboyan:create-user';

    protected $description = 'Provision an internal account using interactive prompts.';

    public function handle(): int
    {
        $data = ['name' => $this->ask('Nama'), 'email' => $this->ask('Email'), 'role' => $this->choice('Role', ['ADMIN', 'MARKETING']), 'password' => $this->secret('Kata sandi (minimal 12 karakter)')];
        if (is_string($data['email'])) {
            $data['email'] = mb_strtolower($data['email']);
        }
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
        $verified = $this->confirm('Identitas pemilik email sudah diverifikasi melalui prosedur tim?', false);
        try {
            User::forceCreate(array_merge($validator->validated(), ['is_active' => true, 'email_verified_at' => $verified ? now() : null]));
        } catch (UniqueConstraintViolationException $exception) {
            $this->error('Email sudah digunakan.');

            return self::FAILURE;
        }
        $this->info('Akun internal berhasil dibuat.');

        return self::SUCCESS;
    }
}
