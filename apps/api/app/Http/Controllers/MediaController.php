<?php

namespace App\Http\Controllers;

use App\Models\PropertyMedia;
use App\Services\MediaOperations;
use App\Support\MediaDisk;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MediaController extends Controller
{
    public function __construct(private MediaOperations $operations) {}

    public function index(Request $request, int $id)
    {
        $property = $this->operations->scoped($request->user(), $id);
        $data = $request->validate(['page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,50', 'include_archived' => 'sometimes|boolean']);
        $query = $property->media();
        if (! ($data['include_archived'] ?? false)) {
            $query->where('state', '!=', 'ARCHIVED');
        }

        return JsonResource::collection($query->paginate($data['per_page'] ?? 20))->additional(['property_version' => $property->version, 'process_in_request' => (bool) config('media.process_in_request')]);
    }

    public function processPending(Request $request, int $id)
    {
        $this->operations->processPending($request->user(), $id);

        return response()->noContent();
    }

    public function store(Request $request, int $id)
    {
        $this->operations->scoped($request->user(), $id);
        $data = $request->validate(['version' => 'required|integer|min:1', 'kind' => ['required', Rule::in(['PHOTO', 'FLOOR_PLAN', 'MASTERPLAN', 'VIDEO', 'TOUR', 'BROCHURE'])], 'alt' => 'required|string|max:240', 'file' => 'required_if:kind,PHOTO,FLOOR_PLAN,MASTERPLAN,BROCHURE|prohibited_if:kind,VIDEO,TOUR|file|max:10240', 'url' => 'required_if:kind,VIDEO,TOUR|prohibited_if:kind,PHOTO,FLOOR_PLAN,MASTERPLAN,BROCHURE|string|max:2048|url:https']);

        return response()->json($this->operations->create($request->user(), $id, $data, $request->file('file')), 201);
    }

    public function update(Request $request, int $id, int $mediaId)
    {
        $this->operations->scoped($request->user(), $id);
        $data = $request->validate(['version' => 'required|integer|min:1', 'alt' => 'sometimes|required|string|max:240', 'position' => 'sometimes|required|integer|between:0,1000', 'published' => 'sometimes|required|boolean', 'archived' => 'sometimes|boolean', 'retry' => 'sometimes|boolean']);

        return $this->operations->update($request->user(), $id, $mediaId, $data);
    }

    public function publicFile(int $mediaId, string $variant)
    {
        $media = PropertyMedia::query()->whereKey($mediaId)->where('state', 'READY')->where('published', true)->whereHas('property', fn ($query) => $query->where('publication', 'PUBLISHED'))->firstOrFail();

        return $this->file($media, $variant);
    }

    public function internalFile(Request $request, int $mediaId, string $variant)
    {
        $media = PropertyMedia::query()->whereKey($mediaId)->where('state', 'READY')->firstOrFail();
        $this->operations->scoped($request->user(), $media->property_id);

        return $this->file($media, $variant);
    }

    private function file(PropertyMedia $media, string $variant)
    {
        $source = $media->variants[$variant] ?? null;
        abort_unless($source && Storage::disk('media')->exists($source['path']), 404);
        $headers = ['Content-Type' => $source['mime'], 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'no-store', 'Content-Security-Policy' => "default-src 'none'; sandbox"];
        if ($media->kind === 'BROCHURE') {
            return MediaDisk::downloadResponse($source['path'], 'brosur-properti.pdf', $headers);
        }

        return MediaDisk::fileResponse($source['path'], $headers);
    }
}
