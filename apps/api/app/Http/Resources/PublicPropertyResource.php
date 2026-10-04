<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicPropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $media = $this->resource->relationLoaded('publicMedia') ? $this->publicMedia : collect($this->resource->relationLoaded('coverMedia') && $this->coverMedia ? [$this->coverMedia] : []);

        return array_merge($this->resource->only(['id', 'slug', 'title', 'house_type', 'condition', 'certificate', 'location', 'address', 'description', 'land_area', 'building_area', 'bedrooms', 'bathrooms', 'availability', 'featured']), ['price_idr' => $this->resource->publicPrice(), 'commercial' => $this->resource->publicCommercial(), 'media' => $media->map(fn ($item) => $item->publicData())->all()], $this->resource->relationLoaded('publicMedia') ? ['latitude' => $this->latitude, 'longitude' => $this->longitude, 'pois' => $this->pois ?? []] : []);
    }
}
