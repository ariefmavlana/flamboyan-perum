<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Services\LeadReport;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportController extends Controller
{
    public function index(Request $request, LeadReport $report)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['from' => 'sometimes|required|date_format:Y-m-d', 'to' => 'sometimes|required|date_format:Y-m-d', 'marketing_id' => 'sometimes|integer|min:1']);
        $to = isset($data['to']) ? CarbonImmutable::createFromFormat('!Y-m-d', $data['to'], 'Asia/Jakarta') : CarbonImmutable::now('Asia/Jakarta')->startOfDay();
        $from = isset($data['from']) ? CarbonImmutable::createFromFormat('!Y-m-d', $data['from'], 'Asia/Jakarta') : $to->subDays(29);
        abort_unless($from <= $to && $from->diffInDays($to) <= 365, 422, 'Rentang laporan maksimal 366 hari dan tanggal akhir tidak sebelum awal.');

        return ['data' => $report->build($from, $to, $data['marketing_id'] ?? null)];
    }

    public function privacy(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $request->validate(['page' => 'sometimes|integer|min:1']);

        return JsonResource::collection(Lead::query()->whereNull('anonymized_at')->whereIn('status', ['DEAL', 'LOST'])->where('updated_at', '<=', now()->subMonthsNoOverflow(max(1, (int) config('privacy.months'))))->select(['id', 'property_id', 'status', 'version', 'updated_at'])->orderBy('updated_at')->orderBy('id')->paginate(20))->additional(['policy_approved' => (bool) config('privacy.retention_approved'), 'retention_months' => max(1, (int) config('privacy.months'))]);
    }
}
