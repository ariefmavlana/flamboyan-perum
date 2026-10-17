<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class LeadReport
{
    public function build(CarbonImmutable $from, CarbonImmutable $to, ?int $marketingId): array
    {
        $query = DB::table('leads')->where('leads.created_at', '>=', $from->utc())->where('leads.created_at', '<', $to->addDay()->utc());
        if ($marketingId) {
            $query->where('leads.assigned_marketing_id', $marketingId);
        }
        // One bounded SQL result is a consistent snapshot; no N+1/contact fields.
        $rows = (clone $query)->select(['status', 'assigned_marketing_id', 'assigned_at', 'first_followed_up_at'])->selectSub(DB::table('lead_histories')->select('actor_id')->whereColumn('lead_id', 'leads.id')->where('type', 'STATUS_CHANGED')->where('to_status', 'FOLLOWED_UP')->orderBy('created_at')->orderBy('id')->limit(1), 'first_actor')->limit(50001)->get();
        abort_if($rows->count() > 50000, 422, 'Persempit rentang cohort menjadi maksimal 50.000 lead.');
        $statuses = array_fill_keys(array_map(fn ($case) => $case->value, LeadStatus::cases()), 0);
        $assignees = $actors = $durations = [];
        $pending = ['unassigned' => 0, 'under_1_day' => 0, '1_to_7_days' => 0, 'over_7_days' => 0];
        $notFollowed = $invalid = 0;
        foreach ($rows as $row) {
            $statuses[$row->status]++;
            $key = $row->assigned_marketing_id ?? 0;
            $assignees[$key] ??= ['user_id' => $key ?: null, 'lead_count' => 0, 'deals' => 0];
            $assignees[$key]['lead_count']++;
            $assignees[$key]['deals'] += $row->status === 'DEAL' ? 1 : 0;
            if (! $row->first_followed_up_at) {
                $notFollowed++;
                if (! $row->assigned_at) {
                    $pending['unassigned']++;
                } else {
                    $age = max(0, CarbonImmutable::parse($row->assigned_at, 'UTC')->diffInSeconds(now()));
                    $pending[$age < 86400 ? 'under_1_day' : ($age <= 604800 ? '1_to_7_days' : 'over_7_days')]++;
                }
            } else {
                if ($row->first_actor) {
                    $actors[$row->first_actor] = ($actors[$row->first_actor] ?? 0) + 1;
                }
                if ($row->assigned_at) {
                    $seconds = CarbonImmutable::parse($row->assigned_at, 'UTC')->diffInSeconds(CarbonImmutable::parse($row->first_followed_up_at, 'UTC'));
                    if ($seconds >= 0) {
                        $durations[] = (int) $seconds;
                    } else {
                        $invalid++;
                    }
                } else {
                    $invalid++;
                }
            }
        }
        sort($durations, SORT_NUMERIC);
        $count = count($durations);
        $median = $count ? ($durations[intdiv($count - 1, 2)] + $durations[intdiv($count, 2)]) / 2 : null;
        $names = User::query()->whereIn('id', array_unique(array_merge(array_keys($assignees), array_keys($actors))))->pluck('name', 'id');
        ksort($assignees);
        ksort($actors);
        $size = $rows->count();
        $funnel = DB::table('property_event_totals')->whereBetween('day', [$from->toDateString(), $to->toDateString()])->select('event')->selectRaw('SUM(total) as total')->groupBy('event')->pluck('total', 'event');

        $inquiries = DB::table('lead_inquiries')->where('lead_inquiries.created_at', '>=', $from->utc())->where('lead_inquiries.created_at', '<', $to->addDay()->utc());
        if ($marketingId) {
            $inquiries->join('leads', 'leads.id', '=', 'lead_inquiries.lead_id')->where('leads.assigned_marketing_id', $marketingId);
        }
        $inquiryCounts = (clone $inquiries)->select('lead_inquiries.state')->selectRaw('COUNT(*) as aggregate')->groupBy('lead_inquiries.state')->pluck('aggregate', 'state');
        $linkedInquiryLeads = (clone $inquiries)->whereNotNull('lead_inquiries.lead_id')->distinct()->count('lead_inquiries.lead_id');
        $cohortLeadIds = (clone $query)->select('leads.id');
        $qualified = DB::table('lead_outcomes')->whereIn('lead_id', clone $cohortLeadIds)->where('qualified', true)->count();
        $akad = DB::table('lead_outcomes')->whereIn('lead_id', clone $cohortLeadIds)->where('akad_confirmed', true)->count();
        $deals = $statuses['DEAL'];
        $visitCounts = DB::table('lead_visits')->whereIn('lead_id', clone $cohortLeadIds)->select('status')->selectRaw('COUNT(DISTINCT lead_id) as aggregate')->groupBy('status')->pluck('aggregate', 'status');
        // A lead belongs to exactly one current last-known source group. Repeated
        // inquiries and attribution corrections must not multiply conversions.
        $campaignRows = (clone $query)->leftJoin('lead_attributions as acquisition', function ($join) {
            $join->on('acquisition.lead_id', '=', 'leads.id')->whereRaw('acquisition.id = (SELECT MAX(latest.id) FROM lead_attributions AS latest WHERE latest.lead_id = leads.id AND latest.last_source IS NOT NULL)');
        })->leftJoin('lead_outcomes as outcome', 'outcome.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(acquisition.last_source, 'UNKNOWN') as source")
            ->selectRaw("COALESCE(acquisition.last_medium, 'UNKNOWN') as medium")
            ->selectRaw("COALESCE(acquisition.last_campaign, 'UNKNOWN') as campaign")
            ->selectRaw("COALESCE(acquisition.method, 'UNKNOWN') as method")
            ->selectRaw('COUNT(*) as valid_leads')
            ->selectRaw('SUM(CASE WHEN outcome.qualified = TRUE THEN 1 ELSE 0 END) as qualified')
            ->selectRaw('SUM(CASE WHEN outcome.akad_confirmed = TRUE THEN 1 ELSE 0 END) as akad')
            ->groupBy('acquisition.last_source', 'acquisition.last_medium', 'acquisition.last_campaign', 'acquisition.method')
            ->orderByDesc('valid_leads')->limit(101)->get();
        abort_if($campaignRows->count() > 100, 422, 'Persempit periode menjadi maksimal 100 kelompok sumber kampanye.');

        $growth = [
            'cohort' => 'lead_created_at',
            'inquiry_cohort' => 'inquiry_created_at',
            'inquiries' => [
                'total' => (int) array_sum($inquiryCounts->all()),
                'pending' => (int) ($inquiryCounts['PENDING'] ?? 0),
                'resolved' => (int) ($inquiryCounts['RESOLVED'] ?? 0),
                'rejected_spam' => (int) ($inquiryCounts['REJECTED_SPAM'] ?? 0),
                'expired' => (int) ($inquiryCounts['EXPIRED'] ?? 0),
            ],
            'valid_leads_unique' => $size,
            'linked_inquiry_leads_unique' => $linkedInquiryLeads,
            'unknown_source_unique' => (int) $campaignRows->where('source', 'UNKNOWN')->sum('valid_leads'),
            'qualified_unique' => $qualified,
            'visits_confirmed_unique' => DB::table('lead_visits')->whereIn('lead_id', clone $cohortLeadIds)->where('was_confirmed', true)->distinct()->count('lead_id'),
            'visits_completed_unique' => (int) ($visitCounts['COMPLETED'] ?? 0),
            'deals_unique' => $deals,
            'akad_confirmed_unique' => $akad,
            'campaigns' => $campaignRows->map(fn ($row) => ['source' => $row->source, 'medium' => $row->medium, 'campaign' => $row->campaign, 'method' => $row->method, 'valid_leads_unique' => (int) $row->valid_leads, 'qualified_unique' => (int) $row->qualified, 'akad_confirmed_unique' => (int) $row->akad])->values(),
            'costs' => ['available' => false, 'cpl_idr' => null, 'cpql_idr' => null, 'reason' => 'Belanja iklan belum diimpor ke CRM.'],
        ];

        return ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'timezone' => 'Asia/Jakarta', 'as_of' => now()->toIso8601String(), 'cohort_size' => $size, 'statuses' => $statuses, 'conversion_percent' => $size ? round($statuses['DEAL'] / $size * 100, 2) : 0, 'follow_up' => ['completed' => $count, 'median_seconds' => $median, 'not_followed_up' => $notFollowed, 'invalid_timing_count' => $invalid, 'pending_age' => $pending], 'current_assignees' => array_values(array_map(fn ($item) => array_merge($item, ['name' => $item['user_id'] ? ($names[$item['user_id']] ?? 'Akun terdahulu') : 'Belum ditugaskan', 'conversion_percent' => round($item['deals'] / $item['lead_count'] * 100, 2)]), $assignees)), 'first_follow_up_actors' => array_map(fn ($id, $total) => ['user_id' => (int) $id, 'name' => $names[$id] ?? 'Akun terdahulu', 'completed' => $total], array_keys($actors), array_values($actors)), 'funnel' => ['enabled' => (bool) config('privacy.analytics_enabled'), 'property_view' => (int) ($funnel['property_view'] ?? 0), 'whatsapp_click' => (int) ($funnel['whatsapp_click'] ?? 0), 'scope' => 'All public properties; anonymous event counts, not unique people or CRM attribution'], 'growth' => $growth];
    }
}
