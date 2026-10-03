<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyMedia extends Model
{
    protected $table = 'property_media';

    protected $guarded = ['id'];

    protected $hidden = ['staging_path', 'variants'];

    protected function casts(): array
    {
        return ['published' => 'boolean', 'position' => 'integer', 'variants' => 'array', 'archived_at' => 'datetime', 'purged_at' => 'datetime'];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function publicData(): array
    {
        return array_merge($this->only(['id', 'kind', 'alt', 'position', 'url', 'width', 'height']), [
            'sources' => collect($this->variants ?? [])->map(fn ($variant, $key) => ['url' => '/media/'.$this->id.'/'.$key, 'width' => $variant['width'] ?? null, 'height' => $variant['height'] ?? null])->values()->all(),
        ]);
    }
}
