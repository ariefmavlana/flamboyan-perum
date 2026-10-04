<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Property extends Model
{
    public const PRICE_SQL = 'CASE WHEN offer_price_idr IS NOT NULL AND offer_start <= ? AND offer_end >= ? THEN offer_price_idr WHEN next_price_idr IS NOT NULL AND next_price_start <= ? THEN next_price_idr ELSE price_idr END';

    public static function priceDates(): array
    {
        return array_fill(0, 3, now('Asia/Jakarta')->toDateString());
    }

    public function publicPrice(): string
    {
        if ($this->getAttribute('current_price_idr') !== null) {
            return (string) $this->getAttribute('current_price_idr');
        }
        $today = now('Asia/Jakarta')->toDateString();
        if ($this->offer_price_idr !== null && $this->offer_start <= $today && $this->offer_end >= $today) {
            return (string) $this->offer_price_idr;
        }

        return (string) ($this->next_price_idr !== null && $this->next_price_start <= $today ? $this->next_price_idr : $this->price_idr);
    }

    public function publicCommercial(): ?array
    {
        if (! isset($this->commercial['_verified_at'])) {
            return null;
        }
        $today = now('Asia/Jakarta')->toDateString();
        $data = array_intersect_key($this->commercial, array_flip(['floors', 'lot_dimensions', 'planned_units', 'features', 'source_name', 'source_date', 'notes', 'fee_notes']));
        $data['normal_price_idr'] = (string) $this->price_idr;
        $data['offer_until'] = $this->offer_price_idr !== null && $this->offer_start <= $today && $this->offer_end >= $today ? $this->offer_end : null;
        $data['program_fee_idr'] = ($this->commercial['next_fee_start'] ?? '9999-12-31') <= $today ? ($this->commercial['next_fee_idr'] ?? null) : (($this->commercial['program_fee_start'] ?? $this->commercial['source_date'] ?? '9999-12-31') <= $today && ($this->commercial['program_fee_until'] ?? '') >= $today ? ($this->commercial['program_fee_idr'] ?? null) : null);
        $data['payment_plans'] = array_values(array_map(fn ($plan) => array_intersect_key($plan, array_flip(['title', 'kind', 'upfront_idr', 'months', 'monthly_idr', 'total_idr', 'valid_from', 'valid_until', 'quota', 'source_name', 'notes'])), array_filter($this->commercial['payment_plans'] ?? [], fn ($plan) => $plan['valid_from'] <= $today && $plan['valid_until'] >= $today)));

        return $data;
    }

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
        return ['price_idr' => 'string', 'offer_price_idr' => 'string', 'next_price_idr' => 'string', 'commercial' => 'array', 'land_area' => 'decimal:2', 'building_area' => 'decimal:2', 'featured' => 'boolean', 'version' => 'integer', 'latitude' => 'decimal:7', 'longitude' => 'decimal:7', 'pois' => 'array'];
    }
}
