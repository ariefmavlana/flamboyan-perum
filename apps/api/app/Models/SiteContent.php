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
            'DEVELOPMENT' => ['name', 'developer', 'address', 'whatsapp', 'website', 'planned_units', 'house_types', 'facilities', 'nearby', 'source_name', 'source_date', 'notes'],
            'HERO' => ['title', 'description', 'eyebrow', 'property_id'],
            'TESTIMONIAL' => ['name', 'quote', 'context'],
            'BANK_PARTNER' => ['name', 'website'],
            'BANK_RATE' => ['bank', 'product', 'annual_rate', 'effective_date', 'valid_until', 'fixed_months', 'source_url', 'floating_rate', 'min_tenor_months', 'max_tenor_months', 'checked_date', 'conditions', 'phases', 'provision_percent', 'admin_percent', 'admin_min_idr', 'admin_max_idr', 'appraisal_min_idr', 'appraisal_max_idr', 'min_principal_idr', 'max_principal_idr', 'max_ltv_percent'],
        };

        $payload = array_intersect_key($this->payload, array_flip($keys));
        if ($this->kind === 'BANK_RATE' && isset($payload['phases'])) {
            $payload['phases'] = array_map(fn ($phase) => array_intersect_key($phase, array_flip(['months', 'annual_rate'])), $payload['phases']);
        }

        return ['id' => $this->id] + $payload + ($this->kind === 'BANK_PARTNER' ? ['logo_url' => '/api/v1/content/'.$this->id.'/logo'] : []);
    }
}
