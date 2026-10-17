<?php

namespace App\Services;

use App\Http\Resources\InquiryResource;
use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\LeadHistory;
use App\Models\LeadOutcome;
use App\Models\LeadVisit;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class LeadOutcomeWorkflow
{
    public function show(User $actor, int $id, int $page = 1): array
    {
        $lead = Lead::query()->visibleTo($actor)->findOrFail($id);

        return $this->resource($lead, $page);
    }

    public function qualification(User $actor, int $id, array $data): array
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            $outcome = LeadOutcome::query()->where('lead_id', $lead->id)->lockForUpdate()->first();
            abort_if($outcome && $outcome->qualified === (bool) $data['qualified'] && $outcome->qualification_reason === ($data['reason'] ?? null), 409, 'Kualifikasi sudah memiliki nilai tersebut.');
            $this->bump($lead, $data['version']);
            $outcome ??= new LeadOutcome(['lead_id' => $lead->id]);
            $outcome->forceFill([
                'qualified' => (bool) $data['qualified'],
                'qualification_reason' => $data['reason'] ?? null,
                'qualification_actor_id' => $actor->id,
                'qualification_changed_at' => now(),
            ])->save();
            LeadHistory::create([
                'lead_id' => $lead->id, 'actor_id' => $actor->id, 'type' => 'QUALIFICATION_CHANGED',
                'note' => $data['reason'] ?? null,
                'metadata' => ['qualified' => (bool) $data['qualified'], 'rubric_version' => '1'],
            ]);

            return $this->resource($lead->refresh());
        }, 3);
    }

    public function createVisit(User $actor, int $id, array $data): array
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            abort_if(in_array($lead->status, ['DEAL', 'LOST'], true), 409, 'Lead terminal tidak dapat menerima kunjungan baru.');
            abort_unless(in_array($data['status'], ['REQUESTED', 'CONFIRMED'], true), 422, 'Kunjungan baru harus berstatus REQUESTED atau CONFIRMED.');
            abort_if($data['status'] === 'CONFIRMED' && empty($data['scheduled_at']), 422, 'Waktu wajib untuk kunjungan terkonfirmasi.');
            $this->bump($lead, $data['version']);
            $visit = LeadVisit::create([
                'lead_id' => $lead->id, 'scheduled_at' => $data['scheduled_at'] ?? null,
                'status' => $data['status'], 'was_confirmed' => $data['status'] === 'CONFIRMED', 'reason' => $data['reason'] ?? null, 'actor_id' => $actor->id,
            ]);
            LeadHistory::create([
                'lead_id' => $lead->id, 'actor_id' => $actor->id, 'type' => 'VISIT_CHANGED',
                'note' => $data['reason'] ?? null,
                'metadata' => ['visit_id' => $visit->id, 'from' => null, 'to' => $visit->status, 'scheduled_at' => $visit->scheduled_at?->toIso8601String()],
            ]);

            return $this->resource($lead->refresh());
        }, 3);
    }

    public function updateVisit(User $actor, int $id, int $visitId, array $data): array
    {
        return DB::transaction(function () use ($actor, $id, $visitId, $data) {
            $lead = $this->locked($actor, $id);
            $visit = LeadVisit::query()->where('lead_id', $lead->id)->whereKey($visitId)->lockForUpdate()->firstOrFail();
            abort_if(in_array($lead->status, ['DEAL', 'LOST'], true), 409, 'Lead terminal tidak dapat mengubah kunjungan.');
            $allowed = match ($visit->status) {
                'REQUESTED' => ['CONFIRMED', 'CANCELLED'],
                'CONFIRMED' => ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
                default => [],
            };
            abort_unless(in_array($data['status'], $allowed, true), 409, 'Perubahan status kunjungan tidak diizinkan.');
            $scheduled = $data['scheduled_at'] ?? $visit->scheduled_at;
            abort_if($data['status'] === 'CONFIRMED' && ! $scheduled, 422, 'Waktu wajib untuk kunjungan terkonfirmasi.');
            $scheduledTime = $scheduled ? CarbonImmutable::parse($scheduled) : null;
            if ($data['status'] === 'CONFIRMED') {
                abort_unless($scheduledTime?->isFuture(), 422, 'Jadwal konfirmasi harus di masa mendatang.');
                if ($visit->status === 'CONFIRMED') {
                    abort_if($visit->scheduled_at?->equalTo($scheduledTime), 409, 'Jadwal tidak berubah.');
                    abort_if(empty($data['reason']), 422, 'Alasan penjadwalan ulang wajib diisi.');
                }
            } else {
                // Attendance refers to the agreed appointment, never a replacement date.
                abort_if(isset($data['scheduled_at']) && ! $visit->scheduled_at?->equalTo($scheduledTime), 422, 'Ubah jadwal melalui status CONFIRMED terlebih dahulu.');
                abort_if(in_array($data['status'], ['COMPLETED', 'NO_SHOW'], true) && (! $scheduledTime || $scheduledTime->isFuture()), 422, 'Kehadiran hanya dicatat setelah waktu kunjungan.');
            }
            abort_if(in_array($data['status'], ['CANCELLED', 'NO_SHOW'], true) && empty($data['reason']), 422, 'Alasan wajib diisi.');
            $this->bump($lead, $data['version']);
            $from = $visit->status;
            $visit->forceFill([
                'status' => $data['status'], 'scheduled_at' => $scheduled,
                'was_confirmed' => $visit->was_confirmed || $data['status'] === 'CONFIRMED',
                'reason' => $data['reason'] ?? null, 'actor_id' => $actor->id, 'version' => $visit->version + 1,
            ])->save();
            LeadHistory::create([
                'lead_id' => $lead->id, 'actor_id' => $actor->id, 'type' => 'VISIT_CHANGED',
                'note' => $data['reason'] ?? null,
                'metadata' => ['visit_id' => $visit->id, 'from' => $from, 'to' => $visit->status, 'scheduled_at' => $visit->scheduled_at?->toIso8601String()],
            ]);

            return $this->resource($lead->refresh());
        }, 3);
    }

    public function akad(User $actor, int $id, array $data): array
    {
        abort_unless($actor->role === 'ADMIN', 403);

        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            abort_unless($actor->fresh()?->role === 'ADMIN', 403);
            abort_unless($lead->status === 'DEAL', 409, 'Konfirmasi akad hanya tersedia untuk lead DEAL.');
            $outcome = LeadOutcome::query()->where('lead_id', $lead->id)->lockForUpdate()->first();
            $confirmed = (bool) $data['confirmed'];
            abort_if(! $confirmed && ! $outcome?->akad_confirmed, 409, 'Akad belum dikonfirmasi.');
            if ($confirmed && $outcome?->akad_confirmed) {
                abort_if($outcome->akad_reference === $data['reference'] && $outcome->akad_occurred_at?->equalTo(CarbonImmutable::parse($data['occurred_at'])), 409, 'Konfirmasi akad tidak berubah.');
                abort_if(empty($data['reason']), 422, 'Alasan koreksi akad wajib diisi.');
            }
            $this->bump($lead, $data['version']);
            $wasConfirmed = (bool) ($outcome?->akad_confirmed ?? false);
            $outcome ??= new LeadOutcome(['lead_id' => $lead->id]);
            $outcome->forceFill([
                'akad_confirmed' => $confirmed,
                'akad_occurred_at' => $confirmed ? $data['occurred_at'] : null,
                'akad_reference' => $confirmed ? $data['reference'] : null,
                'akad_reason' => $data['reason'] ?? null,
                'akad_actor_id' => $actor->id,
                'akad_changed_at' => now(),
            ])->save();
            $type = ! $confirmed ? 'AKAD_REVOKED' : ($wasConfirmed ? 'AKAD_CORRECTED' : 'AKAD_CONFIRMED');
            LeadHistory::create([
                'lead_id' => $lead->id, 'actor_id' => $actor->id, 'type' => $type,
                'note' => $data['reason'] ?? null,
                'metadata' => ['confirmed' => $confirmed, 'occurred_at' => $confirmed ? $outcome->akad_occurred_at?->toIso8601String() : null, 'reference' => $confirmed ? $outcome->akad_reference : null],
            ]);

            return $this->resource($lead->refresh());
        }, 3);
    }

    public function attribution(User $actor, int $id, array $data): array
    {
        abort_unless($actor->role === 'ADMIN', 403);

        return DB::transaction(function () use ($actor, $id, $data) {
            $lead = $this->locked($actor, $id);
            abort_unless($actor->fresh()?->role === 'ADMIN', 403);
            $this->bump($lead, $data['version']);
            $now = now();
            LeadAttribution::create([
                'lead_id' => $lead->id,
                'first_source' => $data['source'], 'first_medium' => $data['medium'], 'first_campaign' => $data['campaign'],
                'first_content' => $data['content'] ?? null, 'first_term' => $data['term'] ?? null, 'first_captured_at' => $now,
                'last_source' => $data['source'], 'last_medium' => $data['medium'], 'last_campaign' => $data['campaign'],
                'last_content' => $data['content'] ?? null, 'last_term' => $data['term'] ?? null, 'last_captured_at' => $now,
                'method' => 'ADMIN_REPORTED', 'analytics_consent' => false, 'marketing_consent' => false,
                'privacy_notice_version' => 'internal-manual', 'captured_at' => $now,
            ]);
            LeadHistory::create([
                'lead_id' => $lead->id, 'actor_id' => $actor->id, 'type' => 'ATTRIBUTION_CORRECTED', 'note' => $data['reason'],
                'metadata' => ['source' => $data['source'], 'medium' => $data['medium'], 'campaign' => $data['campaign'], 'method' => 'ADMIN_REPORTED'],
            ]);

            return $this->resource($lead->refresh());
        }, 3);
    }

    private function locked(User $actor, int $id): Lead
    {
        $current = $actor->fresh();
        abort_unless($current?->is_active && in_array($current->role, ['ADMIN', 'MARKETING'], true), 403);
        $lead = Lead::query()->visibleTo($current)->whereKey($id)->lockForUpdate()->firstOrFail();
        abort_if($lead->anonymized_at, 409, 'Lead dianonimkan dan tidak dapat diubah.');

        return $lead;
    }

    private function bump(Lead $lead, int $version): void
    {
        $updated = Lead::query()->whereKey($lead->id)->where('version', $version)->update(['version' => DB::raw('version + 1'), 'updated_at' => now()]);
        abort_unless($updated === 1, 409, 'Data sudah berubah. Muat ulang sebelum melanjutkan.');
        $lead->refresh();
    }

    private function resource(Lead $lead, int $page = 1): array
    {
        $outcome = LeadOutcome::query()->where('lead_id', $lead->id)->first();
        $visits = LeadVisit::query()->where('lead_id', $lead->id)->orderByDesc('created_at')->orderByDesc('id')->paginate(50, ['*'], 'visits_page', $page);
        $actorIds = array_values(array_filter([$outcome?->qualification_actor_id, $outcome?->akad_actor_id, ...$visits->pluck('actor_id')->all()]));
        $actors = User::query()->whereIn('id', array_unique($actorIds))->pluck('name', 'id');
        $first = LeadAttribution::query()->where('lead_id', $lead->id)->whereNotNull('first_source')->orderBy('captured_at')->orderBy('id')->first();
        $last = LeadAttribution::query()->where('lead_id', $lead->id)->whereNotNull('last_source')->orderByDesc('captured_at')->orderByDesc('id')->first();

        return [
            'lead_id' => $lead->id,
            'lead_version' => $lead->version,
            'qualification' => $outcome?->qualification_changed_at ? [
                'qualified' => $outcome->qualified, 'reason' => $outcome->qualification_reason,
                'changed_at' => $outcome->qualification_changed_at->toIso8601String(),
                'actor' => ['id' => $outcome->qualification_actor_id, 'name' => $actors[$outcome->qualification_actor_id] ?? 'Akun terdahulu'],
            ] : null,
            'visits_meta' => ['current_page' => $visits->currentPage(), 'last_page' => $visits->lastPage(), 'total' => $visits->total()],
            'visits' => $visits->getCollection()->map(fn ($visit) => [
                'id' => $visit->id, 'status' => $visit->status, 'scheduled_at' => $visit->scheduled_at?->toIso8601String(),
                'reason' => $visit->reason, 'version' => $visit->version, 'changed_at' => $visit->updated_at?->toIso8601String(),
                'actor' => ['id' => $visit->actor_id, 'name' => $actors[$visit->actor_id] ?? 'Akun terdahulu'],
            ])->values(),
            'akad' => $outcome?->akad_changed_at ? [
                'confirmed' => $outcome->akad_confirmed, 'occurred_at' => $outcome->akad_occurred_at?->toIso8601String(),
                'reference' => $outcome->akad_reference, 'reason' => $outcome->akad_reason,
                'changed_at' => $outcome->akad_changed_at->toIso8601String(),
                'actor' => ['id' => $outcome->akad_actor_id, 'name' => $actors[$outcome->akad_actor_id] ?? 'Akun terdahulu'],
            ] : null,
            'attribution' => [
                'first_touch' => $first ? InquiryResource::touch($first, 'first') : null,
                'last_touch' => $last ? InquiryResource::touch($last, 'last') : null,
                'method' => $last?->method ?? $first?->method ?? 'UNKNOWN',
                'captured_at' => ($last?->captured_at ?? $first?->captured_at)?->toIso8601String(),
            ],
        ];
    }
}
