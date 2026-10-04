<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicPropertyResource;
use App\Models\Property;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PropertyController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'q' => 'sometimes|string|max:100', 'page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,48',
            'sort' => ['sometimes', Rule::in(['newest', 'price_asc', 'price_desc', 'land_asc', 'land_desc', 'building_asc', 'building_desc'])],
            'min_price' => 'sometimes|integer|min:0|max:1000000000000', 'max_price' => 'sometimes|integer|min:0|max:1000000000000',
            'min_land_area' => 'sometimes|numeric|min:0|max:1000000', 'max_land_area' => 'sometimes|numeric|min:0|max:1000000',
            'min_building_area' => 'sometimes|numeric|min:0|max:1000000', 'max_building_area' => 'sometimes|numeric|min:0|max:1000000',
            'bedrooms' => 'sometimes|integer|between:0,50', 'bathrooms' => 'sometimes|integer|between:1,50',
            'condition' => ['sometimes', Rule::in(['NEW', 'RESALE'])], 'certificate' => 'sometimes|string|max:80',
            'location' => 'sometimes|string|max:160', 'availability' => ['sometimes', Rule::in(['AVAILABLE', 'BOOKED', 'SOLD_OUT'])], 'featured' => 'sometimes|boolean',
        ]);
        $query = Property::query()->where('publication', 'PUBLISHED');
        if (! empty($data['q'])) {
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($data['q'])).'%';
            $query->where(fn ($q) => $q->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("LOWER(location) LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("LOWER(address) LIKE ? ESCAPE '!'", [$pattern]));
        }
        foreach (['condition', 'certificate', 'location', 'availability', 'featured'] as $field) {
            if (array_key_exists($field, $data)) {
                $query->where($field, $data[$field]);
            }
        }
        foreach (['price' => 'price_idr', 'land_area' => 'land_area', 'building_area' => 'building_area'] as $param => $column) {
            if (isset($data['min_'.$param], $data['max_'.$param]) && $data['min_'.$param] > $data['max_'.$param]) {
                throw ValidationException::withMessages(['max_'.$param => 'Batas maksimum harus lebih besar dari minimum.']);
            }
            foreach (['min' => '>=', 'max' => '<='] as $bound => $operator) {
                if (isset($data[$bound.'_'.$param])) {
                    $query->where($column, $operator, $data[$bound.'_'.$param]);
                }
            }
        }
        foreach (['bedrooms', 'bathrooms'] as $field) {
            if (isset($data[$field])) {
                $query->where($field, '>=', $data[$field]);
            }
        }
        [$column, $direction] = match ($data['sort'] ?? 'newest') {
            'price_asc' => ['price_idr', 'asc'], 'price_desc' => ['price_idr', 'desc'],
            'land_asc' => ['land_area', 'asc'], 'land_desc' => ['land_area', 'desc'],
            'building_asc' => ['building_area', 'asc'], 'building_desc' => ['building_area', 'desc'],
            default => ['created_at', 'desc'],
        };

        return PublicPropertyResource::collection($query->orderBy($column, $direction)->orderBy('id', $direction)->paginate($data['per_page'] ?? 12)->withQueryString());
    }

    public function show(string $slug): PublicPropertyResource
    {
        return new PublicPropertyResource(Property::query()->where('publication', 'PUBLISHED')->where('slug', $slug)->firstOrFail());
    }

    public function internalIndex(Request $request)
    {
        $request->validate(['page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,48']);
        $query = Property::query();
        if ($request->user()->role !== 'ADMIN') {
            $query->where('owner_id', $request->user()->id);
        }

        return JsonResource::collection($query->orderByDesc('id')->paginate($request->integer('per_page', 12)));
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(false));
        if ($request->user()->role === 'ADMIN') {
            $owner = $request->validate(['owner_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'MARKETING')->where('is_active', true)]]);
            $data['owner_id'] = $owner['owner_id'];
        } else {
            abort_if($request->has('owner_id') && $request->integer('owner_id') !== $request->user()->id, 403);
            $data['owner_id'] = $request->user()->id;
        }
        try {
            return response()->json(['data' => Property::create($data)->refresh()], 201);
        } catch (UniqueConstraintViolationException $exception) {
            abort(409, 'Slug properti sudah digunakan.');
        }
    }

    public function update(Request $request, int $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $query = Property::query()->whereKey($id);
            if ($request->user()->role !== 'ADMIN') {
                $query->where('owner_id', $request->user()->id);
            }
            $property = (clone $query)->lockForUpdate()->firstOrFail();
            $data = $request->validate(array_merge($this->rules(true), ['version' => 'required|integer|min:1', 'slug' => 'prohibited', 'owner_id' => 'prohibited']));
            $version = $data['version'];
            unset($data['version']);
            $count = $query->where('version', $version)->update(array_merge($data, ['version' => DB::raw('version + 1'), 'updated_at' => now()]));
            abort_unless($count === 1, 409, 'Data sudah berubah. Muat ulang sebelum melanjutkan.');

            return response()->json(['data' => $property->refresh()]);
        }, 3);
    }

    private function rules(bool $partial): array
    {
        $prefix = $partial ? 'sometimes|required|' : 'required|';
        $rules = [
            'title' => $prefix.'string|max:160', 'house_type' => $prefix.'string|max:80',
            'condition' => [$partial ? 'sometimes' : 'required', Rule::in(['NEW', 'RESALE'])],
            'certificate' => $prefix.'string|max:80', 'location' => $prefix.'string|max:160',
            'address' => $prefix.'string|max:500', 'description' => $prefix.'string|max:10000',
            'price_idr' => $prefix.'integer|between:1,1000000000000', 'land_area' => $prefix.'numeric|decimal:0,2|min:0.01|max:1000000',
            'building_area' => $prefix.'numeric|decimal:0,2|min:0.01|max:1000000', 'bedrooms' => $prefix.'integer|between:0,50', 'bathrooms' => $prefix.'integer|between:1,50',
            'publication' => ['sometimes', Rule::in(['DRAFT', 'PUBLISHED', 'ARCHIVED'])],
            'availability' => ['sometimes', Rule::in(['AVAILABLE', 'BOOKED', 'SOLD_OUT'])], 'featured' => 'sometimes|boolean',
        ];
        if (! $partial) {
            $rules['slug'] = 'required|string|max:160|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
        }

        return $rules;
    }
}
