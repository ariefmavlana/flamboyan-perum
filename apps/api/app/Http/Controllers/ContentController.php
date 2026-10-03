<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicPropertyResource;
use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ContentController extends Controller
{
    public function publicIndex()
    {
        $query = SiteContent::query()->where('published', true)->whereNotNull('verified_at')->orderBy('position')->orderBy('id');
        $hero = (clone $query)->where('kind', 'HERO')->first();
        $heroData = $hero?->publicData();
        if ($heroData && $heroData['property_id']) {
            $property = Property::query()->with('coverMedia')->where('publication', 'PUBLISHED')->find($heroData['property_id']);
            $heroData['property'] = $property ? (new PublicPropertyResource($property))->resolve() : null;
            $heroData['property_id'] = $property?->id;
        }
        $today = now('Asia/Jakarta')->toDateString();

        return ['data' => ['hero' => $heroData, 'testimonials' => (clone $query)->where('kind', 'TESTIMONIAL')->limit(12)->get()->map->publicData(), 'bank_rates' => (clone $query)->where('kind', 'BANK_RATE')->whereDate('effective_date', '<=', $today)->whereDate('valid_until', '>=', $today)->limit(50)->get()->map->publicData()]];
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['kind' => ['sometimes', Rule::in(['HERO', 'TESTIMONIAL', 'BANK_RATE'])], 'page' => 'sometimes|integer|min:1']);

        return JsonResource::collection(SiteContent::query()->when(isset($data['kind']), fn ($q) => $q->where('kind', $data['kind']))->orderBy('kind')->orderBy('position')->orderBy('id')->paginate(20));
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(Request $request, int $id)
    {
        return $this->save($request, $id);
    }

    private function save(Request $request, ?int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['kind' => ['required', Rule::in(['HERO', 'TESTIMONIAL', 'BANK_RATE'])], 'published' => 'required|boolean', 'position' => 'required|integer|between:0,1000', 'verified' => 'sometimes|boolean', 'version' => $id ? 'required|integer|min:1' : 'prohibited', 'payload' => 'required|array']);
        $rules = match ($data['kind']) {
            'HERO' => ['payload' => 'array:title,description,eyebrow,property_id', 'payload.title' => 'required|string|max:160', 'payload.description' => 'required|string|max:1000', 'payload.eyebrow' => 'required|string|max:100', 'payload.property_id' => ['present', 'nullable', 'integer', Rule::exists('properties', 'id')]],
            'TESTIMONIAL' => ['payload' => 'array:name,quote,context', 'payload.name' => 'required|string|max:160', 'payload.quote' => 'required|string|max:2000', 'payload.context' => 'required|string|max:160'],
            'BANK_RATE' => ['payload' => 'array:bank,product,annual_rate,effective_date,valid_until,fixed_months,source_url', 'payload.bank' => 'required|string|max:120', 'payload.product' => 'required|string|max:160', 'payload.annual_rate' => 'required|numeric|between:0,30', 'payload.effective_date' => 'required|date_format:Y-m-d', 'payload.valid_until' => 'required|date_format:Y-m-d|after_or_equal:payload.effective_date', 'payload.fixed_months' => 'required|integer|between:1,360', 'payload.source_url' => 'required|url:https|max:2048'],
        };
        $payload = $request->validate($rules)['payload'];
        if ($data['published']) {
            $request->validate(['verified' => 'required|accepted']);
        }

        return DB::transaction(function () use ($request, $id, $data, $payload) {
            $actor = User::query()->whereKey($request->user()->id)->lockForUpdate()->first();
            abort_unless($actor?->is_active && $actor->role === 'ADMIN', 403);
            $record = $id ? SiteContent::query()->whereKey($id)->lockForUpdate()->firstOrFail() : null;
            abort_if($record && $record->kind !== $data['kind'], 422, 'Jenis konten tidak dapat diganti.');
            $verified = (bool) ($data['verified'] ?? false);
            $fields = ['kind' => $data['kind'], 'payload' => $payload, 'published' => $data['published'], 'position' => $data['position'], 'updated_by' => $actor->id, 'verified_by' => $verified ? $actor->id : null, 'verified_at' => $verified ? now() : null, 'effective_date' => $payload['effective_date'] ?? null, 'valid_until' => $payload['valid_until'] ?? null];
            if ($record) {
                $count = SiteContent::query()->whereKey($id)->where('version', $data['version'])->update(array_merge($fields, ['payload' => json_encode($payload, JSON_THROW_ON_ERROR), 'version' => DB::raw('version + 1'), 'updated_at' => now()]));
                abort_unless($count === 1, 409, 'Konten berubah. Muat ulang dan tinjau kembali.');
                $record->refresh();
            } else {
                $record = SiteContent::create($fields);
            }
            ActivityLog::create(['actor_id' => $actor->id, 'subject_type' => 'CONTENT', 'subject_id' => $record->id, 'action' => $id ? 'UPDATED' : 'CREATED', 'changes' => ['kind' => $record->kind, 'published' => $record->published, 'verified' => $verified]]);

            return response()->json(['data' => $record->refresh()], $id ? 200 : 201);
        }, 3);
    }
}
