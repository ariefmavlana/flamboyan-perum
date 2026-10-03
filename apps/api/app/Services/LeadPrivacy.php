<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LeadPrivacy
{
    public function anonymize(User $actor, int $id, int $version, string $requestReference, bool $retention): void
    {
        abort_unless(config('privacy.retention_approved') && preg_match('/^[A-Z0-9][A-Z0-9_-]{2,79}$/', (string) config('privacy.policy_reference')), 503, 'Kebijakan privasi belum disahkan.');
        abort_unless(preg_match('/^[A-Z0-9][A-Z0-9_-]{2,79}$/', $requestReference), 422, 'Gunakan referensi kasus tanpa data pribadi.');
        DB::transaction(function () use ($actor, $id, $version, $requestReference, $retention) {
            $current = User::query()->whereKey($actor->id)->lockForUpdate()->first();
            abort_unless($current?->is_active && $current->role === 'ADMIN', 403);
            abort_unless(hash_equals((string) $actor->password, (string) $current->password) && hash_equals((string) $actor->remember_token, (string) $current->remember_token), 403, 'Identitas Admin telah berubah.');
            $lead = Lead::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($lead->version === $version && ! $lead->anonymized_at && in_array($lead->status, ['DEAL', 'LOST'], true), 409, 'Lead harus terminal, belum dianonimkan, dan versi terbaru.');
            abort_if($retention && $lead->updated_at->gt(now()->subMonthsNoOverflow(max(1, (int) config('privacy.months')))), 409, 'Retensi belum jatuh tempo.');
            $updated = Lead::query()->whereKey($id)->where('version', $version)->update(['name' => 'Lead dianonimkan #'.$id, 'whatsapp_number' => null, 'anonymized_at' => now(), 'version' => DB::raw('version + 1'), 'updated_at' => now()]);
            abort_unless($updated === 1, 409);
            LeadHistory::query()->where('lead_id', $id)->update(['note' => null, 'redacted_at' => now()]);
            ActivityLog::query()->where('subject_type', 'LEAD')->where('subject_id', $id)->update(['changes' => null, 'reason' => null]);
            LeadHistory::create(['lead_id' => $id, 'actor_id' => $current->id, 'type' => 'ANONYMIZED']);
            ActivityLog::create(['actor_id' => $current->id, 'subject_type' => 'LEAD', 'subject_id' => $id, 'action' => 'ANONYMIZED', 'changes' => ['contact_removed' => true, 'notes_redacted' => true, 'policy_reference' => config('privacy.policy_reference'), 'retention' => $retention], 'reason' => $requestReference]);
        }, 3);
    }
}
