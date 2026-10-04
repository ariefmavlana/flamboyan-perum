<?php

return [
    'enabled' => (bool) env('REALTIME_ENABLED', false),
    'app_id' => env('PUSHER_APP_ID', ''),
    'key' => env('PUSHER_APP_KEY', ''),
    'secret' => env('PUSHER_APP_SECRET', ''),
    'cluster' => env('PUSHER_APP_CLUSTER', 'ap1'),
];
