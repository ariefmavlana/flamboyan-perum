<?php

$origins = [];
foreach ([env('FRONTEND_URL', ''), env('APP_URL', '')] as $value) {
    foreach (explode(',', (string) $value) as $origin) {
        $origin = rtrim(trim($origin), '/');
        if ($origin !== '') {
            $origins[] = $origin;
        }
    }
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_values(array_unique($origins)),
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Accept',
        'Content-Type',
        'X-Requested-With',
        'X-XSRF-TOKEN',
        'X-Flamboyan-Proxy-Signature',
        'X-Flamboyan-Client-IP',
        'X-Flamboyan-Proxy-Time',
    ],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
