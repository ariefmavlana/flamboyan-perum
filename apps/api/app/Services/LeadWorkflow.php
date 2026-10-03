<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeadWorkflow
{
    public function create(User $actor, array $data): Lead
    {
        abort_unless($actor->role === 'ADMIN', 403);
        try {
            return DB::transaction(function () use ($actor, $data) {
                $current = User::query()->whereKey($actor->id)->lockForUpdate()->first();
                abort_unless($current?->is_active && $current->role === 'ADMIN', 403);
                $lead = Lead::create($data)->refresh();
                $this->history($lead, $actor, ['type' => 'CREATED', 'to_status' => $lead->status]);

                return $lead;
            });
        } catch (UniqueConstraintViolationException $exception) {
            abort(409, 'Lead untuk nomor dan properti ini sudah tercatat.');
        }
    }

    public function assign(User $actor, int $id, array $data): Lead
    {
        abort_unless($actor->role === 'ADMIN', 403);

        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            abort_unless($actor->fresh()?->role === 'ADMIN', 403);
            $target = User::query()->whereKey($data['marketing_id'])->lockForUpdate()->first();
            if (! $target || ! $target->is_active || $target->role !== 'MARKETING') {
                throw ValidationException::withMessages(['marketing_id' => 'Pilih Marketing aktif.']);
            }
            abort_if(LeadStatus::from($lead->status)->isTerminal(), 409, 'Lead terminal tidak dapat ditugaskan ulang.');
            abort_if($lead->assigned_marketing_id === $target->id, 409, 'Lead sudah ditugaskan kepada Marketing ini.');
            if ($lead->assigned_marketing_id && empty($data['reason'])) {
                throw ValidationException::withMessages(['reason' => 'Alasan reassignment wajib diisi.']);
            }
            $previous = $lead->assigned_marketing_id;
            $this->update($lead, $data['version'], ['assigned_marketing_id' => $target->id, 'assigned_at' => $lead->assigned_at ?? now()]);
            $history = $this->history($lead, $actor, ['type' => $previous ? 'REASSIGNED' : 'ASSIGNED', 'from_assignee' => $previous, 'to_assignee' => $target->id, 'note' => $data['reason'] ?? null]);
            $this->notify($target->id, $lead, $history, 'LEAD_ASSIGNED');

            return $lead;
        }, 3);
    }

    public function transition(User $actor, int $id, array $data): Lead
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            $assignee = User::query()->whereKey($lead->assigned_marketing_id)->lockForUpdate()->first();
            abort_unless($assignee?->is_active && $assignee->role === 'MARKETING', 409, 'Lead harus memiliki Marketing aktif.');
            $from = LeadStatus::from($lead->status);
            $to = LeadStatus::from($data['status']);
            abort_unless($from->canTransitionTo($to), 409, 'Perpindahan status tidak diizinkan.');
            $changes = ['status' => $to->value];
            if ($to === LeadStatus::FollowedUp && ! $lead->first_followed_up_at) {
                $changes['first_followed_up_at'] = now();
            }
            $this->update($lead, $data['version'], $changes);
            $history = $this->history($lead, $actor, ['type' => 'STATUS_CHANGED', 'from_status' => $from->value, 'to_status' => $to->value, 'note' => $data['note'] ?? null]);
            foreach (User::query()->where('role', 'ADMIN')->where('is_active', true)->where('id', '!=', $actor->id)->pluck('id') as $recipient) {
                $this->notify($recipient, $lead, $history, 'LEAD_STATUS_CHANGED');
            }

            return $lead;
        }, 3);
    }

    public function addNote(User $actor, int $id, array $data): Lead
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            $this->update($lead, $data['version'], []);
            $this->history($lead, $actor, ['type' => 'NOTE_ADDED', 'note' => $data['note']]);

            return $lead;
        }, 3);
    }

    public function correctContact(User $actor, int $id, array $data): Lead
    {
        abort_unless($actor->role === 'ADMIN', 403);
        try {
            return DB::transaction(function () use ($actor, $id, $data) {
                $lead = $this->locked($actor, $id);
                abort_unless($actor->fresh()?->role === 'ADMIN', 403);
                $this->update($lead, $data['version'], ['name' => $data['name'], 'whatsapp_number' => $data['whatsapp_number']]);
                $this->history($lead, $actor, ['type' => 'CONTACT_UPDATED', 'note' => $data['reason']]);

                return $lead;
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            abort(409, 'Lead untuk nomor dan properti ini sudah tercatat.');
        }
    }

    private function locked(User $actor, int $id): Lead
    {
        $current = $actor->fresh();
        abort_unless($current?->is_active && in_array($current->role, ['ADMIN', 'MARKETING'], true), 403);

        return Lead::query()->visibleTo($current)->whereKey($id)->lockForUpdate()->firstOrFail();
    }

    private function update(Lead $lead, int $version, array $changes): void
    {
        $updated = Lead::query()->whereKey($lead->id)->where('version', $version)->update(array_merge($changes, ['version' => DB::raw('version + 1'), 'updated_at' => now()]));
        abort_unless($updated === 1, 409, 'Data sudah berubah. Muat ulang sebelum melanjutkan.');
        $lead->refresh();
    }

    private function history(Lead $lead, User $actor, array $event): LeadHistory
    {
        return LeadHistory::create(array_merge(['lead_id' => $lead->id, 'actor_id' => $actor->id], $event));
    }

    private function notify(int $recipient, Lead $lead, LeadHistory $history, string $kind): void
    {
        UserNotification::create(['recipient_id' => $recipient, 'lead_id' => $lead->id, 'history_id' => $history->id, 'kind' => $kind]);
    }
}
