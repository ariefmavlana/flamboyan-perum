<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadOutcome extends Model
{
    protected $fillable = [
        'lead_id', 'qualified', 'qualification_reason', 'qualification_actor_id', 'qualification_changed_at',
        'akad_confirmed', 'akad_occurred_at', 'akad_reference', 'akad_reason', 'akad_actor_id', 'akad_changed_at',
    ];

    protected function casts(): array
    {
        return [
            'qualified' => 'boolean', 'qualification_changed_at' => 'datetime', 'akad_confirmed' => 'boolean',
            'akad_occurred_at' => 'datetime', 'akad_changed_at' => 'datetime',
        ];
    }
}
