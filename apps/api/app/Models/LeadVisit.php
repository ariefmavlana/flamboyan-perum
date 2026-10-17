<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadVisit extends Model
{
    protected $fillable = ['lead_id', 'scheduled_at', 'status', 'was_confirmed', 'reason', 'actor_id', 'version'];

    protected function casts(): array
    {
        return ['scheduled_at' => 'datetime', 'was_confirmed' => 'boolean', 'version' => 'integer'];
    }
}
