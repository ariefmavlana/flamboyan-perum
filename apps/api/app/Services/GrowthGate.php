<?php

namespace App\Services;

use App\Models\Property;
use Illuminate\Support\Collection;

class GrowthGate
{
    public function configured(): bool
    {
        return config('growth.inquiries_enabled')
            && config('growth.privacy_notice_approved')
            && config('growth.retention_approved')
            && preg_match('/^[A-Z0-9][A-Z0-9_-]{2,79}$/', (string) config('growth.retention_policy_reference')) === 1
            && count(config('growth.property_ids', [])) === 5
            && preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/', (string) config('growth.privacy_notice_version')) === 1
            && preg_match('#^/[a-z0-9]+(?:[/-][a-z0-9]+)*$#', (string) config('growth.privacy_notice_url')) === 1;
    }

    public function properties(bool $lock = false): Collection
    {
        if (! $this->configured()) {
            return collect();
        }
        $query = Property::query()->whereIn('id', config('growth.property_ids'))->where('publication', 'PUBLISHED');
        if ($lock) {
            $query->lockForUpdate();
        }

        $properties = $query->select(['id', 'title', 'slug'])->get()->keyBy('id');

        return $properties->count() === 5 ? $properties : collect();
    }

    public function ready(): bool
    {
        return $this->properties()->count() === 5;
    }
}
