<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadAttribution extends Model
{
    protected $fillable = [
        'inquiry_id', 'lead_id', 'first_source', 'first_medium', 'first_campaign', 'first_content',
        'first_term', 'first_captured_at', 'last_source', 'last_medium', 'last_campaign',
        'last_content', 'last_term', 'last_captured_at', 'method', 'analytics_consent',
        'marketing_consent', 'privacy_notice_version', 'captured_at', 'consent_version', 'consent_decided_at',
    ];

    protected function casts(): array
    {
        return [
            'analytics_consent' => 'boolean', 'marketing_consent' => 'boolean',
            'first_captured_at' => 'datetime', 'last_captured_at' => 'datetime', 'captured_at' => 'datetime',
            'consent_decided_at' => 'datetime',
        ];
    }
}
