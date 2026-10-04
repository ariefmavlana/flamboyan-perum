<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    protected $fillable = ['kind', 'payload', 'published', 'position', 'version', 'updated_by', 'verified_by', 'verified_at', 'effective_date', 'valid_until'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'published' => 'boolean', 'version' => 'integer', 'verified_at' => 'datetime'];
    }

    public function toArray(): array
    {
        $data = parent::toArray();
        $data['logo_uploaded'] = isset($this->payload['_logo']['path']);
        unset($data['payload']['_logo']);

        return $data;
    }

    public function publicData(): array
    {
        $keys = match ($this->kind) {
            'HERO' => ['title', 'description', 'eyebrow', 'property_id'],
            'TESTIMONIAL' => ['name', 'quote', 'context'],
            'BANK_PARTNER' => ['name', 'website'],
            'BANK_RATE' => ['bank', 'product', 'annual_rate', 'effective_date', 'valid_until', 'fixed_months', 'source_url'],
        };

        return ['id' => $this->id] + array_intersect_key($this->payload, array_flip($keys)) + ($this->kind === 'BANK_PARTNER' ? ['logo_url' => '/api/v1/content/'.$this->id.'/logo'] : []);
    }
}
