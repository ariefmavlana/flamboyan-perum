<?php

return [
    'analytics_enabled' => (bool) env('ANALYTICS_ENABLED', false),
    'retention_approved' => (bool) env('RETENTION_APPROVED', false),
    'policy_reference' => env('RETENTION_POLICY_REFERENCE', ''),
    'months' => (int) env('LEAD_RETENTION_MONTHS', 24),
];
