<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicPropertyResource;
use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\SiteContent;
use App\Models\User;
use App\Services\ContentLogo;
use App\Support\FinancingContent;
use App\Support\MediaDisk;
use App\Support\YouTubeUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ContentController extends Controller
{
    public function publicIndex()
    {
        $query = SiteContent::query()->where('published', true)->whereNotNull('verified_at')->orderBy('position')->orderBy('id');
        $hero = (clone $query)->where('kind', 'HERO')->first();
        $heroData = $hero?->publicData();
        if ($heroData) {
            $heroData['media'] = null;
            $heroData['property'] = null;
        }
        if ($heroData && $heroData['property_id']) {
            $property = Property::query()->with('coverMedia')->where('publication', 'PUBLISHED')->find($heroData['property_id']);
            $heroData['property'] = $property ? (new PublicPropertyResource($property))->resolve() : null;
            $heroData['property_id'] = $property?->id;
            $mediaId = $hero->payload['media_id'] ?? null;
            $media = $property && $mediaId ? $property->publicMedia()->whereIn('kind', ['PHOTO', 'VIDEO'])->whereKey($mediaId)->first() : null;
            $heroData['media'] = $media?->publicData();
        }
        $today = now('Asia/Jakarta')->toDateString();

        $programs = (clone $query)->where('kind', 'FINANCING_PROGRAM')->limit(10)->get()->filter(fn ($item) => ($item->payload['method'] ?? null) !== 'FIXED_INSTALLMENT' || (($item->payload['bank'] ?? null) === 'BSI' && ($item->payload['house_types'] ?? []) === ['36/60']))->map->publicData()->values();

        return ['data' => ['development' => (clone $query)->where('kind', 'DEVELOPMENT')->first()?->publicData(), 'hero' => $heroData, 'financing_programs' => $programs, 'bank_partners' => (clone $query)->where('kind', 'BANK_PARTNER')->limit(50)->get()->filter(fn ($item) => isset($item->payload['_logo']['path']) && Storage::disk('media')->exists($item->payload['_logo']['path']))->map->publicData()->values(), 'testimonials' => (clone $query)->where('kind', 'TESTIMONIAL')->limit(12)->get()->map->publicData(), 'bank_rates' => (clone $query)->where('kind', 'BANK_RATE')->whereDate('effective_date', '<=', $today)->whereDate('valid_until', '>=', $today)->limit(50)->get()->map->publicData()]];
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['kind' => ['sometimes', Rule::in(['HERO', 'TESTIMONIAL', 'BANK_RATE', 'BANK_PARTNER', 'DEVELOPMENT', 'FINANCING_PROGRAM'])], 'page' => 'sometimes|integer|min:1']);

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

    public function uploadLogo(Request $request, int $id, ContentLogo $logos)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['version' => 'required|integer|min:1', 'verified' => 'required|accepted', 'file' => 'required|file|max:2048']);

        return ['data' => $logos->upload($request->user(), $id, $data['version'], $request->file('file'))];
    }

    public function publicLogo(int $id)
    {
        $record = SiteContent::query()->whereKey($id)->where('kind', 'BANK_PARTNER')->where('published', true)->whereNotNull('verified_at')->firstOrFail();
        $path = $record->payload['_logo']['path'] ?? null;
        abort_unless($path && Storage::disk('media')->exists($path), 404);

        return MediaDisk::fileResponse($path, ['Content-Type' => 'image/webp', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'no-store', 'Content-Security-Policy' => "default-src 'none'; sandbox"]);
    }

    private function save(Request $request, ?int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['kind' => ['required', Rule::in(['HERO', 'TESTIMONIAL', 'BANK_RATE', 'BANK_PARTNER', 'DEVELOPMENT', 'FINANCING_PROGRAM'])], 'published' => 'required|boolean', 'position' => 'required|integer|between:0,1000', 'verified' => 'sometimes|boolean', 'version' => $id ? 'required|integer|min:1' : 'prohibited', 'payload' => 'required|array']);
        $rules = match ($data['kind']) {
            'HERO' => ['payload' => 'array:title,description,eyebrow,property_id,media_id,video_url,video_title,video_autoplay', 'payload.title' => 'required|string|max:160', 'payload.description' => 'required|string|max:1000', 'payload.eyebrow' => 'required|string|max:100', 'payload.property_id' => ['present', 'nullable', 'integer', Rule::exists('properties', 'id')], 'payload.media_id' => 'sometimes|nullable|integer|min:1', 'payload.video_url' => 'sometimes|nullable|url:https|max:2048', 'payload.video_title' => 'required_with:payload.video_url|nullable|string|max:240', 'payload.video_autoplay' => 'sometimes|boolean'],
            'BANK_PARTNER' => ['payload' => 'array:name,website', 'payload.name' => 'required|string|max:120', 'payload.website' => 'required|url:https|max:2048'],
            'TESTIMONIAL' => ['payload' => 'array:name,quote,context', 'payload.name' => 'required|string|max:160', 'payload.quote' => 'required|string|max:2000', 'payload.context' => 'required|string|max:160'],
            'BANK_RATE' => FinancingContent::rules(),
            'FINANCING_PROGRAM' => [
                'payload' => 'array:bank,product,development_name,method,house_types,monthly_idr,tenor_months,price_idr,down_payment_idr,total_margin_idr,source_name,source_url,checked_date,conditions',
                'payload.bank' => ['required', Rule::in(['BSI', 'BNI'])],
                'payload.product' => 'required|string|max:160',
                'payload.development_name' => 'required|in:Bukit Flamboyan Indah 2',
                'payload.method' => 'required|in:FIXED_INSTALLMENT,REFERENCE_ONLY,MURABAHAH_QUOTE',
                'payload.house_types' => 'required_if:payload.method,FIXED_INSTALLMENT,MURABAHAH_QUOTE|array|min:1|max:5',
                'payload.house_types.*' => ['required', 'distinct', Rule::in(['36/60', '36/90', '56/90', '62/70', '69/80'])],
                'payload.monthly_idr' => 'required_if:payload.method,FIXED_INSTALLMENT|prohibited_unless:payload.method,FIXED_INSTALLMENT|integer|between:1,1000000000000',
                'payload.tenor_months' => 'required_if:payload.method,FIXED_INSTALLMENT,MURABAHAH_QUOTE|prohibited_if:payload.method,REFERENCE_ONLY|integer|between:12,360|multiple_of:12',
                'payload.price_idr' => 'required_if:payload.method,MURABAHAH_QUOTE|prohibited_unless:payload.method,MURABAHAH_QUOTE|integer|between:1,1000000000000',
                'payload.down_payment_idr' => 'required_if:payload.method,MURABAHAH_QUOTE|prohibited_unless:payload.method,MURABAHAH_QUOTE|integer|min:0|lt:payload.price_idr',
                'payload.total_margin_idr' => 'required_if:payload.method,MURABAHAH_QUOTE|prohibited_unless:payload.method,MURABAHAH_QUOTE|integer|between:0,1000000000000',
                'payload.source_name' => 'required|string|max:200',
                'payload.source_url' => 'sometimes|required|url:https|max:2048',
                'payload.checked_date' => 'required|date_format:Y-m-d|before_or_equal:'.now('Asia/Jakarta')->toDateString(),
                'payload.conditions' => 'required|string|max:2500',
            ],
            'DEVELOPMENT' => ['payload' => 'array:name,developer,address,whatsapp,website,planned_units,house_types,facilities,nearby,source_name,source_date,notes', 'payload.name' => 'required|string|max:160', 'payload.developer' => 'required|string|max:160', 'payload.address' => 'required|string|max:500', 'payload.whatsapp' => 'required|regex:/^62[0-9]{8,13}$/', 'payload.website' => 'required|url:https|max:2048', 'payload.planned_units' => 'required|integer|between:1,100000', 'payload.house_types' => 'required|integer|between:1,1000', 'payload.facilities' => 'required|string|max:3000', 'payload.nearby' => 'required|string|max:3000', 'payload.source_name' => 'required|string|max:200', 'payload.source_date' => 'required|date_format:Y-m-d|before_or_equal:'.now('Asia/Jakarta')->toDateString(), 'payload.notes' => 'required|string|max:2000'],
        };
        $payload = $request->validate($rules)['payload'];
        if ($data['kind'] === 'HERO' && ! empty($payload['video_url'])) {
            $payload['video_url'] = YouTubeUrl::embed($payload['video_url'], 'payload.video_url');
        }
        if ($data['kind'] === 'HERO' && isset($payload['video_autoplay'])) {
            $payload['video_autoplay'] = (bool) $payload['video_autoplay'];
        }
        if ($data['kind'] === 'BANK_RATE') {
            FinancingContent::validate($payload);
            $payload = FinancingContent::normalize($payload);
        }
        if ($data['kind'] === 'FINANCING_PROGRAM' && $payload['method'] === 'MURABAHAH_QUOTE') {
            if ($payload['bank'] !== 'BSI' || count($payload['house_types']) !== 1) {
                throw ValidationException::withMessages(['payload.house_types' => 'Penawaran murabahah BSI harus memuat tepat satu tipe rumah.']);
            }
            foreach (['price_idr', 'down_payment_idr', 'total_margin_idr', 'tenor_months'] as $field) {
                $payload[$field] = (int) $payload[$field];
            }
        }
        if ($data['kind'] === 'FINANCING_PROGRAM' && $payload['method'] === 'FIXED_INSTALLMENT') {
            if ($payload['bank'] !== 'BSI' || $payload['house_types'] !== ['36/60']) {
                throw ValidationException::withMessages(['payload.house_types' => 'Program angsuran tetap BSI hanya berlaku untuk tipe 36/60.']);
            }
            $payload['monthly_idr'] = (int) $payload['monthly_idr'];
            $payload['tenor_months'] = (int) $payload['tenor_months'];
        }
        if ($data['published']) {
            $request->validate(['verified' => 'required|accepted']);
        }

        return DB::transaction(function () use ($request, $id, $data, $payload) {
            $actor = User::query()->whereKey($request->user()->id)->lockForUpdate()->first();
            abort_unless($actor?->is_active && $actor->role === 'ADMIN', 403);
            $record = $id ? SiteContent::query()->whereKey($id)->lockForUpdate()->firstOrFail() : null;
            abort_if($record && $record->kind !== $data['kind'], 422, 'Jenis konten tidak dapat diganti.');
            $verified = (bool) ($data['verified'] ?? false);
            if ($data['kind'] === 'HERO' && ($payload['media_id'] ?? null)) {
                $property = Property::query()->whereKey($payload['property_id'])->where('publication', 'PUBLISHED')->lockForUpdate()->first();
                $media = $property?->publicMedia()->whereIn('kind', ['PHOTO', 'VIDEO'])->whereKey($payload['media_id'])->lockForUpdate()->first();
                if (! $media) {
                    throw ValidationException::withMessages(['payload.media_id' => 'Pilih foto atau video siap dan ditampilkan dari properti yang dipublikasikan.']);
                }
            }
            if ($data['kind'] === 'BANK_PARTNER' && isset($record?->payload['_logo'])) {
                $payload['_logo'] = $record->payload['_logo'];
            }
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
