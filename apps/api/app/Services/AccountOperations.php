<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AccountOperations
{
    public function create(User $actor, array $data): User
    {
        $this->admin($actor);
        try {
            return DB::transaction(function () use ($actor, $data) {
                $current = User::query()->whereKey($actor->id)->lockForUpdate()->first();
                abort_unless($current?->is_active && $current->role === 'ADMIN', 403);
                $user = new User;
                $user->forceFill(['name' => $data['name'], 'email' => mb_strtolower($data['email']), 'password' => $data['password'], 'role' => $data['role'], 'is_active' => true, 'email_verified_at' => ($data['identity_verified'] ?? false) ? now() : null])->save();
                $this->audit($actor, $user, 'CREATED', ['role' => $user->role, 'identity_verified' => (bool) $user->email_verified_at]);

                return $user->refresh();
            });
        } catch (UniqueConstraintViolationException $exception) {
            abort(409, 'Email sudah digunakan.');
        }
    }

    public function update(User $actor, int $id, array $data, bool $profile = false): User
    {
        if (! $profile) {
            $this->admin($actor);
        }
        try {
            return DB::transaction(function () use ($actor, $id, $data, $profile) {
                $admins = User::query()->where('role', 'ADMIN')->where('is_active', true)->orderBy('id')->lockForUpdate()->get();
                $user = User::query()->whereKey($id)->lockForUpdate()->firstOrFail();
                $currentActor = $actor->fresh();
                abort_unless($currentActor?->is_active && in_array($currentActor->role, ['ADMIN', 'MARKETING'], true), 403, 'Akun tidak aktif.');
                abort_unless($profile || $currentActor->role === 'ADMIN', 403);
                abort_if($profile && $id !== $actor->id, 403);
                $role = $data['role'] ?? $user->role;
                $active = $data['is_active'] ?? $user->is_active;
                if ($user->role === 'ADMIN' && $user->is_active && ($role !== 'ADMIN' || ! $active)) {
                    abort_if($admins->count() <= 1, 409, 'Admin aktif terakhir tidak dapat dinonaktifkan atau diubah perannya.');
                }
                if ($user->role === 'MARKETING' && ($role !== 'MARKETING' || ! $active)) {
                    $catalog = Property::query()->where('owner_id', $id)->where('publication', '!=', 'ARCHIVED')->exists();
                    $leads = Lead::query()->where('assigned_marketing_id', $id)->whereNotIn('status', ['DEAL', 'LOST'])->exists();
                    abort_if($catalog || $leads, 409, 'Alihkan atau arsipkan properti dan selesaikan/alihkan lead aktif terlebih dahulu.');
                }
                $version = $data['version'];
                unset($data['version'], $data['current_password'], $data['password_confirmation']);
                $securityChange = array_key_exists('password', $data) || array_key_exists('email', $data) || array_key_exists('role', $data) || array_key_exists('is_active', $data);
                if (isset($data['email'])) {
                    $data['email'] = mb_strtolower($data['email']);
                    if ($data['email'] !== $user->email) {
                        $data['email_verified_at'] = null;
                    }
                }
                if (array_key_exists('identity_verified', $data)) {
                    $data['email_verified_at'] = $data['identity_verified'] ? now() : null;
                    unset($data['identity_verified']);
                }
                $audit = array_intersect_key($data, array_flip(['role', 'is_active']));
                $audit['profile_changed'] = isset($data['name']);
                $audit['email_changed'] = isset($data['email']);
                $audit['password_changed'] = isset($data['password']);
                if (isset($data['password'])) {
                    $data['password'] = Hash::make($data['password']);
                }
                if ($securityChange) {
                    $data['remember_token'] = Str::random(60);
                }
                $changed = User::query()->whereKey($id)->where('version', $version)->update(array_merge($data, ['version' => DB::raw('version + 1'), 'updated_at' => now()]));
                abort_unless($changed === 1, 409, 'Data akun berubah. Muat ulang sebelum melanjutkan.');
                if ($securityChange) {
                    $this->revoke($user);
                }
                $this->audit($actor, $user, $profile ? 'PROFILE_UPDATED' : 'UPDATED', $audit);

                return $user->refresh();
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            abort(409, 'Email sudah digunakan.');
        }
    }

    public function revoke(User $user): void
    {
        DB::table('sessions')->where('user_id', $user->id)->delete();
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();
    }

    public function audit(User $actor, User $subject, string $action, array $changes): void
    {
        ActivityLog::create(['actor_id' => $actor->id, 'subject_type' => 'USER', 'subject_id' => $subject->id, 'action' => $action, 'changes' => $changes]);
    }

    private function admin(User $actor): void
    {
        $current = $actor->fresh();
        abort_unless($current?->is_active && $current->role === 'ADMIN', 403);
    }
}
