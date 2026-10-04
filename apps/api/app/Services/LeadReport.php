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
        $query = DB::table('leads')->where('created_at', '>=', $from->utc())->where('created_at', '<', $to->addDay()->utc());
        if ($marketingId) {
            $query->where('assigned_marketing_id', $marketingId);
        }
        // One bounded SQL result is a consistent snapshot; no N+1/contact fields.
        $rows = $query->select(['status', 'assigned_marketing_id', 'assigned_at', 'first_followed_up_at'])->selectSub(DB::table('lead_histories')->select('actor_id')->whereColumn('lead_id', 'leads.id')->where('type', 'STATUS_CHANGED')->where('to_status', 'FOLLOWED_UP')->orderBy('created_at')->orderBy('id')->limit(1), 'first_actor')->limit(50001)->get();
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

        return ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'timezone' => 'Asia/Jakarta', 'as_of' => now()->toIso8601String(), 'cohort_size' => $size, 'statuses' => $statuses, 'conversion_percent' => $size ? round($statuses['DEAL'] / $size * 100, 2) : 0, 'follow_up' => ['completed' => $count, 'median_seconds' => $median, 'not_followed_up' => $notFollowed, 'invalid_timing_count' => $invalid, 'pending_age' => $pending], 'current_assignees' => array_values(array_map(fn ($item) => array_merge($item, ['name' => $item['user_id'] ? ($names[$item['user_id']] ?? 'Akun terdahulu') : 'Belum ditugaskan', 'conversion_percent' => round($item['deals'] / $item['lead_count'] * 100, 2)]), $assignees)), 'first_follow_up_actors' => array_map(fn ($id, $total) => ['user_id' => (int) $id, 'name' => $names[$id] ?? 'Akun terdahulu', 'completed' => $total], array_keys($actors), array_values($actors)), 'funnel' => ['enabled' => (bool) config('privacy.analytics_enabled'), 'property_view' => (int) ($funnel['property_view'] ?? 0), 'whatsapp_click' => (int) ($funnel['whatsapp_click'] ?? 0), 'scope' => 'All public properties; anonymous event counts, not unique people or CRM attribution']];
    }
}
