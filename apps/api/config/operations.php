<?php

$hosts = array_filter(array_map('trim', explode(',', env('TRUSTED_HOSTS', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost'))));
foreach ([env('VERCEL_URL'), env('VERCEL_BRANCH_URL')] as $host) {
    if (is_string($host) && preg_match('/^[a-z0-9-]+\.vercel\.app$/', $host)) {
        $hosts[] = $host;
    }
}

return [
    'proxy_secret' => env('API_PROXY_SECRET', ''),
    'hosts' => array_values(array_unique($hosts)),
    'trusted_proxies' => array_filter(array_map('trim', explode(',', env('TRUSTED_PROXY_IPS', '')))),
    'backup_marker' => storage_path('app/ops/backup-status.json'),
];
