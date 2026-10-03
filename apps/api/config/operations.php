<?php

return [
    'proxy_secret' => env('API_PROXY_SECRET', ''),
    'hosts' => array_filter(array_map('trim', explode(',', env('TRUSTED_HOSTS', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost')))),
    'trusted_proxies' => array_filter(array_map('trim', explode(',', env('TRUSTED_PROXY_IPS', '')))),
    'backup_marker' => storage_path('app/ops/backup-status.json'),
];
