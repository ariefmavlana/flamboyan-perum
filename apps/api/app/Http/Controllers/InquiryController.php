<?php

namespace App\Http\Controllers;

use App\Http\Resources\InquiryResource;
use App\Models\LeadInquiry;
use App\Services\GrowthGate;
use App\Services\InquiryService;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InquiryController extends Controller
{
    public function __construct(private InquiryService $service, private GrowthGate $gate) {}

    public function options()
    {
        try {
            $properties = $this->gate->properties();
        } catch (QueryException) {
            abort(503, 'Pilihan konsultasi sementara tidak tersedia.');
        }
        $enabled = $properties->count() === 5;

        return [
            'data' => $enabled ? $properties->sortBy(fn ($property) => array_search($property->id, config('growth.property_ids'), true))->values()->map(fn ($property) => [
                'property_id' => $property->id,
                'title' => $property->title,
                'canonical_path' => '/properti/'.$property->slug,
            ]) : [],
            'meta' => [
                'enabled' => $enabled,
                'disabled_reason' => $enabled ? null : 'Form konsultasi belum tersedia.',
                'privacy_notice_version' => $enabled ? config('growth.privacy_notice_version') : null,
                'privacy_notice_url' => $enabled ? config('growth.privacy_notice_url') : null,
                'service_hours_notice' => $enabled ? config('growth.service_hours_notice') : null,
                'attribution_context_enabled' => $enabled && (bool) config('growth.attribution_enabled'),
            ],
        ];
    }

    public function context(Request $request)
    {
        if (array_diff(array_keys($request->all()), ['first_touch', 'last_touch', 'consent'])) {
            throw ValidationException::withMessages(['request' => 'Permintaan memuat field yang tidak diizinkan.']);
        }
        $rules = [];
        foreach (['first_touch', 'last_touch'] as $touch) {
            $rules[$touch] = 'required|array:source,medium,campaign,content,term,captured_at';
            foreach (['source', 'medium', 'campaign'] as $field) {
                $rules[$touch.'.'.$field] = ['required', 'string', 'max:120', 'regex:/^[a-z][a-z0-9_-]{0,119}$/'];
            }
            foreach (['content', 'term'] as $field) {
                $rules[$touch.'.'.$field] = ['nullable', 'string', 'max:120', $field === 'term'
                    ? 'regex:~^[\p{L}\p{N}][\p{L}\p{N} _./-]{0,119}$~u'
                    : 'regex:/^[a-z][a-z0-9_-]{0,119}$/'];
            }
            $rules[$touch.'.captured_at'] = 'required|date';
        }
        $rules['consent'] = 'required|array:analytics,marketing,decided_at,version';
        $rules['consent.analytics'] = 'required|boolean';
        $rules['consent.marketing'] = 'required|boolean';
        $rules['consent.decided_at'] = 'required|date';
        $rules['consent.version'] = ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/'];
        $data = $request->validate($rules);
        if (! $data['consent']['analytics'] && ! $data['consent']['marketing']) {
            throw ValidationException::withMessages(['consent' => 'Konteks atribusi hanya dibuat setelah consent yang sesuai.']);
        }
        $now = CarbonImmutable::now();
        foreach (['first_touch', 'last_touch'] as $touch) {
            $captured = CarbonImmutable::parse($data[$touch]['captured_at']);
            if ($captured->gt($now->addMinute()) || $captured->lt($now->subDays(30))) {
                throw ValidationException::withMessages([$touch.'.captured_at' => 'Waktu konteks atribusi tidak valid.']);
            }
            $data[$touch]['captured_at'] = $captured->utc()->toIso8601String();
            foreach (['source', 'medium', 'campaign', 'content', 'term'] as $field) {
                if (isset($data[$touch][$field]) && preg_match('/@|(?:\+?\d[\s().-]*){8,}/', $data[$touch][$field])) {
                    throw ValidationException::withMessages([$touch.'.'.$field => 'Nilai tidak boleh memuat data pribadi.']);
                }
            }
        }
        $decided = CarbonImmutable::parse($data['consent']['decided_at']);
        if ($decided->gt($now->addMinute()) || $decided->lt($now->subDays(180))) {
            throw ValidationException::withMessages(['consent.decided_at' => 'Waktu keputusan consent tidak valid.']);
        }
        $data['consent']['decided_at'] = $decided->utc()->toIso8601String();
        if (CarbonImmutable::parse($data['last_touch']['captured_at'])->lt(CarbonImmutable::parse($data['first_touch']['captured_at']))) {
            throw ValidationException::withMessages(['last_touch.captured_at' => 'Urutan waktu konteks atribusi tidak valid.']);
        }

        return response()->json(['data' => $this->service->createAttributionToken($data)], 201);
    }

    public function store(Request $request)
    {
        $allowed = ['name', 'whatsapp_number', 'property_id', 'purpose', 'preferred_visit_at', 'message', 'privacy_notice_version', 'marketing_opt_in', 'attribution_token'];
        if (array_diff(array_keys($request->all()), $allowed)) {
            throw ValidationException::withMessages(['request' => 'Permintaan memuat field yang tidak diizinkan.']);
        }
        $this->normalizePhone($request);
        $data = $request->validate([
            'name' => 'required|string|max:160',
            'whatsapp_number' => 'required|string|regex:/^[1-9][0-9]{7,14}$/',
            'property_id' => 'required|integer|min:1',
            'purpose' => ['required', Rule::in(['CONSULTATION', 'VISIT_REQUEST'])],
            'preferred_visit_at' => 'nullable|date|after:now|before_or_equal:+90 days',
            'message' => 'nullable|string|max:1000',
            'privacy_notice_version' => ['required', Rule::in([(string) config('growth.privacy_notice_version')])],
            'marketing_opt_in' => 'sometimes|boolean',
            'attribution_token' => 'nullable|string|max:4096',
        ]);
        foreach (['name', 'message'] as $field) {
            if (isset($data[$field]) && preg_match('/[<>\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $data[$field])) {
                throw ValidationException::withMessages([$field => 'Gunakan teks biasa tanpa markup atau karakter kontrol.']);
            }
            if (isset($data[$field])) {
                $data[$field] = trim($data[$field]);
            }
        }
        $data['marketing_opt_in'] = (bool) ($data['marketing_opt_in'] ?? false);
        $key = (string) $request->header('Idempotency-Key');
        if (! preg_match('/^[A-Za-z0-9_-]{22,200}$/', $key)) {
            throw ValidationException::withMessages(['idempotency_key' => 'Idempotency-Key wajib berupa token acak minimal 128 bit.']);
        }
        $inquiry = $this->service->intake($data, $key);

        return response()->json(['accepted' => true, 'receipt' => $inquiry->receipt], 202);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate([
            'page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,100',
            'state' => ['sometimes', Rule::in(['PENDING', 'RESOLVED', 'REJECTED_SPAM', 'EXPIRED'])],
        ]);
        $query = LeadInquiry::query()->with(['property', 'attribution']);
        if (isset($data['state'])) {
            $query->where('state', $data['state']);
        }

        return InquiryResource::collection($query->orderByDesc('created_at')->orderByDesc('id')->paginate($data['per_page'] ?? 20));
    }

    public function resolve(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'action' => ['required', Rule::in(['ACCEPT_NEW', 'LINK_EXISTING', 'REJECT_SPAM'])],
            'lead_id' => 'required_if:action,LINK_EXISTING|prohibited_unless:action,LINK_EXISTING|integer|min:1',
            'reason' => 'required_if:action,REJECT_SPAM|nullable|string|max:1000',
        ]);
        $inquiry = $this->service->resolve($request->user(), $id, $data)->load(['property', 'attribution', 'lead']);

        return [
            'data' => (new InquiryResource($inquiry))->resolve($request),
            'lead' => $inquiry->lead ? ['id' => $inquiry->lead->id, 'version' => $inquiry->lead->version, 'status' => $inquiry->lead->status] : null,
        ];
    }

    private function normalizePhone(Request $request): void
    {
        $raw = $request->input('whatsapp_number');
        if (is_string($raw) && preg_match('/^[+0-9\s()\-]+$/', $raw)) {
            $number = preg_replace('/\D/', '', $raw);
            $request->merge(['whatsapp_number' => str_starts_with($number, '0') ? '62'.substr($number, 1) : $number]);
        }
    }
}
