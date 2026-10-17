<?php

$propertyIds = array_values(array_unique(array_filter(array_map(
    fn ($value) => filter_var(trim($value), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
    explode(',', (string) env('GROWTH_PROPERTY_IDS', ''))
))));

return [
    'preview_isolated' => (bool) env('GROWTH_PREVIEW_ISOLATED', false),
    'inquiries_enabled' => (bool) env('GROWTH_INQUIRIES_ENABLED', false),
    'attribution_enabled' => (bool) env('GROWTH_ATTRIBUTION_ENABLED', false),
    'property_ids' => $propertyIds,
    'privacy_notice_version' => (string) env('GROWTH_PRIVACY_NOTICE_VERSION', ''),
    'privacy_notice_approved' => (bool) env('GROWTH_PRIVACY_NOTICE_APPROVED', false),
    'privacy_notice_url' => (string) env('GROWTH_PRIVACY_NOTICE_URL', ''),
    'service_hours_notice' => (string) env('GROWTH_SERVICE_HOURS_NOTICE', ''),
    'attribution_ttl_minutes' => max(5, min(43200, (int) env('GROWTH_ATTRIBUTION_TTL_MINUTES', 1440))),
    'retention_approved' => (bool) env('GROWTH_RETENTION_APPROVED', false),
    'retention_policy_reference' => (string) env('GROWTH_RETENTION_POLICY_REFERENCE', ''),
    'pending_retention_days' => max(1, (int) env('GROWTH_PENDING_RETENTION_DAYS', 30)),
    'spam_retention_days' => max(1, (int) env('GROWTH_SPAM_RETENTION_DAYS', 7)),
    'resolved_retention_days' => max(1, (int) env('GROWTH_RESOLVED_RETENTION_DAYS', 90)),
];
