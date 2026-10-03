<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = ['name', 'whatsapp_number', 'property_id', 'assigned_marketing_id'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'assigned_at' => 'datetime', 'first_followed_up_at' => 'datetime'];
    }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->role !== 'ADMIN') {
            $query->where('assigned_marketing_id', $user->id);
        }
    }
}
