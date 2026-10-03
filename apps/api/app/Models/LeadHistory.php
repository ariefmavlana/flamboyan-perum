<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadHistory extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['lead_id', 'actor_id', 'type', 'from_status', 'to_status', 'from_assignee', 'to_assignee', 'note'];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id')->select(['id', 'name']);
    }

    public function previousAssignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_assignee')->select(['id', 'name']);
    }

    public function nextAssignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_assignee')->select(['id', 'name']);
    }
}
