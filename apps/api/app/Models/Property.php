<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $fillable = ['owner_id', 'slug', 'title', 'house_type', 'condition', 'certificate', 'location', 'address', 'description', 'price_idr', 'land_area', 'building_area', 'bedrooms', 'bathrooms', 'publication', 'availability', 'featured'];

    protected function casts(): array
    {
        return ['price_idr' => 'string', 'land_area' => 'decimal:2', 'building_area' => 'decimal:2', 'featured' => 'boolean', 'version' => 'integer'];
    }
}
