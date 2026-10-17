<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LeadInquiry extends Model
{
    protected $fillable = [
        'receipt', 'idempotency_key_hash', 'payload_hash', 'property_id', 'lead_id', 'name',
        'whatsapp_number', 'purpose', 'preferred_visit_at', 'message', 'privacy_notice_version',
        'marketing_opt_in', 'state', 'version', 'resolution_action', 'resolution_reason',
        'resolved_by', 'resolved_at', 'anonymized_at',
    ];

    protected $hidden = ['idempotency_key_hash', 'payload_hash'];

    protected function casts(): array
    {
        return [
            'preferred_visit_at' => 'datetime', 'marketing_opt_in' => 'boolean', 'version' => 'integer',
            'resolved_at' => 'datetime', 'anonymized_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class)->select(['id', 'title', 'slug']);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function attribution(): HasOne
    {
        return $this->hasOne(LeadAttribution::class, 'inquiry_id');
    }
}
