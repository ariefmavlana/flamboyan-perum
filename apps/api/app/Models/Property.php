<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Property extends Model
{
    public function media(): HasMany
    {
        return $this->hasMany(PropertyMedia::class)->orderBy('position')->orderBy('id');
    }

    public function publicMedia(): HasMany
    {
        return $this->media()->where('state', 'READY')->where('published', true);
    }

    public function coverMedia(): HasOne
    {
        return $this->hasOne(PropertyMedia::class)->ofMany(['position' => 'min', 'id' => 'min'], fn ($query) => $query->where('kind', 'PHOTO')->where('state', 'READY')->where('published', true));
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id')->select(['id', 'name']);
    }

    protected $fillable = ['owner_id', 'slug', 'title', 'house_type', 'condition', 'certificate', 'location', 'address', 'description', 'price_idr', 'land_area', 'building_area', 'bedrooms', 'bathrooms', 'publication', 'availability', 'featured'];

    protected function casts(): array
    {
        return ['price_idr' => 'string', 'land_area' => 'decimal:2', 'building_area' => 'decimal:2', 'featured' => 'boolean', 'version' => 'integer'];
    }
}
