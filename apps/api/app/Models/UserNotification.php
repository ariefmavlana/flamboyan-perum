<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = ['recipient_id', 'lead_id', 'history_id', 'kind'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }
}
