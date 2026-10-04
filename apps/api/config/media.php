<?php

return [
    'process_in_request' => env('MEDIA_PROCESS_IN_REQUEST', false),
    'scanner_binary' => env('MEDIA_SCANNER_BINARY', ''),
    'tour_hosts' => array_filter(array_map('trim', explode(',', env('MEDIA_TOUR_HOSTS', 'my.matterport.com')))),
    'queue' => 'media',
];
