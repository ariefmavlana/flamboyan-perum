<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class)->select(['id', 'title', 'slug']);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_marketing_id')->select(['id', 'name']);
    }

    protected $fillable = ['name', 'whatsapp_number', 'property_id', 'assigned_marketing_id'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'assigned_at' => 'datetime', 'first_followed_up_at' => 'datetime', 'anonymized_at' => 'datetime'];
    }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->role !== 'ADMIN') {
            $query->where('assigned_marketing_id', $user->id);
        }
    }
}
