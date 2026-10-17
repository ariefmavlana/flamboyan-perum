<?php

namespace App\Console\Commands;

use App\Models\LeadAttribution;
use App\Models\LeadInquiry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupGrowthInquiries extends Command
{
    protected $signature = 'flamboyan:growth-cleanup {--execute : Apply the approved retention policy}';

    protected $description = 'Report or anonymize inquiry PII after approved retention windows';

    public function handle(): int
    {
        if ($this->option('execute') && (! config('growth.retention_approved') || ! preg_match('/^[A-Z0-9][A-Z0-9_-]{2,79}$/', (string) config('growth.retention_policy_reference')))) {
            $this->error('Growth retention policy is not approved or has no valid reference.');

            return self::FAILURE;
        }
        $pendingBefore = now()->subDays(config('growth.pending_retention_days'));
        $spamBefore = now()->subDays(config('growth.spam_retention_days'));
        $resolvedBefore = now()->subDays(config('growth.resolved_retention_days'));
        $pending = LeadInquiry::query()->where('state', 'PENDING')->whereNull('anonymized_at')->where('created_at', '<=', $pendingBefore)->count();
        $spam = LeadInquiry::query()->where('state', 'REJECTED_SPAM')->whereNull('anonymized_at')->where('resolved_at', '<=', $spamBefore)->count();
        $linked = LeadInquiry::query()->where('state', 'RESOLVED')->whereNull('anonymized_at')->where(fn ($query) => $query->where('resolved_at', '<=', $resolvedBefore)->orWhereHas('lead', fn ($lead) => $lead->whereNotNull('anonymized_at')))->count();
        $this->line("Candidates: pending={$pending}, spam={$spam}, resolved_expired_or_anonymized={$linked}");
        if (! $this->option('execute')) {
            $this->info('Dry run only; pass --execute after reviewing the approved policy.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($pendingBefore, $spamBefore, $resolvedBefore) {
            $clear = ['name' => null, 'whatsapp_number' => null, 'message' => null, 'preferred_visit_at' => null, 'resolution_reason' => null, 'anonymized_at' => now(), 'updated_at' => now()];
            LeadInquiry::query()->where('state', 'PENDING')->whereNull('anonymized_at')->where('created_at', '<=', $pendingBefore)
                ->update(array_merge($clear, ['state' => 'EXPIRED', 'version' => DB::raw('version + 1')]));
            LeadInquiry::query()->where('state', 'REJECTED_SPAM')->whereNull('anonymized_at')->where('resolved_at', '<=', $spamBefore)
                ->update(array_merge($clear, ['resolution_reason' => null, 'version' => DB::raw('version + 1')]));
            LeadAttribution::query()->whereIn('inquiry_id', LeadInquiry::query()->whereNotNull('anonymized_at')->select('id'))
                ->update(['first_term' => null, 'last_term' => null, 'first_content' => null, 'last_content' => null]);
            LeadInquiry::query()->where('state', 'RESOLVED')->whereNull('anonymized_at')->where(fn ($query) => $query->where('resolved_at', '<=', $resolvedBefore)->orWhereHas('lead', fn ($lead) => $lead->whereNotNull('anonymized_at')))
                ->update(array_merge($clear, ['resolution_reason' => null, 'version' => DB::raw('version + 1')]));
        }, 3);
        $this->info('Approved inquiry retention cleanup completed; idempotency tombstones and audit-safe metadata were retained.');

        return self::SUCCESS;
    }
}
