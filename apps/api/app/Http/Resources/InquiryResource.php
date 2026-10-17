<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attribution = $this->resource->relationLoaded('attribution') ? $this->attribution : null;

        return [
            'id' => $this->id,
            'receipt' => $this->receipt,
            'property' => $this->whenLoaded('property', fn () => [
                'property_id' => $this->property->id,
                'title' => $this->property->title,
                'canonical_path' => '/properti/'.$this->property->slug,
            ]),
            'name' => $this->name,
            'whatsapp_number' => $this->whatsapp_number,
            'purpose' => $this->purpose,
            'preferred_visit_at' => $this->preferred_visit_at?->toIso8601String(),
            'message' => $this->message,
            'privacy_notice_version' => $this->privacy_notice_version,
            'marketing_opt_in' => $this->marketing_opt_in,
            'state' => $this->state,
            'version' => $this->version,
            'lead_id' => $this->lead_id,
            'attribution' => $attribution ? [
                'first_touch' => self::touch($attribution, 'first'),
                'last_touch' => self::touch($attribution, 'last'),
                'method' => $attribution->method,
                'captured_at' => $attribution->captured_at?->toIso8601String(),
            ] : null,
            'resolution_action' => $this->resolution_action,
            'resolution_reason' => $this->resolution_reason,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    public static function touch(object $attribution, string $prefix): ?array
    {
        $source = $attribution->{$prefix.'_source'};
        if ($source === null) {
            return null;
        }

        return [
            'source' => $source,
            'medium' => $attribution->{$prefix.'_medium'},
            'campaign' => $attribution->{$prefix.'_campaign'},
            'content' => $attribution->{$prefix.'_content'},
            'term' => $attribution->{$prefix.'_term'},
            'captured_at' => $attribution->{$prefix.'_captured_at'}?->toIso8601String(),
        ];
    }
}
