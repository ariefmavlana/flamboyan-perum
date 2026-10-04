<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicPropertyResource;
use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EvaluationController extends Controller
{
    public function compare(Request $request)
    {
        $data = $request->validate(['ids' => 'required|array|min:1|max:3', 'ids.*' => 'required|integer|min:1']);
        $ids = array_values(array_unique(array_map('intval', $data['ids'])));
        $properties = Property::query()->with('coverMedia')->where('publication', 'PUBLISHED')->whereIn('id', $ids)->get()->keyBy('id');
        $visible = collect($ids)->filter(fn ($id) => $properties->has($id))->map(fn ($id) => $properties[$id])->values();

        return ['data' => PublicPropertyResource::collection($visible)->resolve(), 'missing' => array_values(array_diff($ids, $properties->keys()->all()))];
    }

    public function sitemap(Request $request)
    {
        $request->validate(['page' => 'sometimes|integer|between:1,10000']);

        return Property::query()->where('publication', 'PUBLISHED')->select(['slug', 'updated_at'])->orderBy('id')->paginate(1000);
    }

    public function location(Request $request, int $id)
    {
        $data = $request->validate(['version' => 'required|integer|min:1', 'latitude' => 'present|nullable|numeric|between:-90,90', 'longitude' => 'present|nullable|numeric|between:-180,180', 'pois' => 'present|array|max:20', 'pois.*' => 'array:name,category,distance_m,source_url,source_date', 'pois.*.name' => 'required|string|max:160', 'pois.*.category' => ['required', Rule::in(['TRANSPORT', 'EDUCATION', 'HEALTH', 'SHOPPING', 'OTHER'])], 'pois.*.distance_m' => 'required|integer|between:0,1000000', 'pois.*.source_url' => 'required|url:https|max:2048', 'pois.*.source_date' => 'required|date_format:Y-m-d|before_or_equal:'.now('Asia/Jakarta')->toDateString()]);
        if (($data['latitude'] === null) !== ($data['longitude'] === null)) {
            throw ValidationException::withMessages(['latitude' => 'Isi kedua koordinat atau kosongkan keduanya.']);
        }

        return DB::transaction(function () use ($request, $id, $data) {
            $property = Property::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            $actor = User::query()->whereKey($request->user()->id)->lockForUpdate()->first();
            abort_unless($actor?->is_active && in_array($actor->role, ['ADMIN', 'MARKETING'], true), 403);
            abort_if($actor->role !== 'ADMIN' && $property->owner_id !== $actor->id, 404);
            $count = Property::query()->whereKey($id)->where('version', $data['version'])->update(['latitude' => $data['latitude'], 'longitude' => $data['longitude'], 'pois' => json_encode($data['pois'], JSON_THROW_ON_ERROR), 'version' => DB::raw('version + 1'), 'updated_at' => now()]);
            abort_unless($count === 1, 409, 'Data berubah. Muat ulang sebelum melanjutkan.');
            ActivityLog::create(['actor_id' => $actor->id, 'subject_type' => 'PROPERTY', 'subject_id' => $id, 'action' => 'LOCATION_UPDATED', 'changes' => ['poi_count' => count($data['pois']), 'has_coordinates' => $data['latitude'] !== null]]);

            return ['data' => $property->refresh()->load('owner')];
        }, 3);
    }
}
