<?php

return [
    'scanner_binary' => env('MEDIA_SCANNER_BINARY', ''),
    'tour_hosts' => array_filter(array_map('trim', explode(',', env('MEDIA_TOUR_HOSTS', 'my.matterport.com')))),
    'queue' => 'media',
];
