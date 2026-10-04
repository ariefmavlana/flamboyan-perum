<?php

/*
|--------------------------------------------------------------------------
| View Storage Paths
|--------------------------------------------------------------------------
|
| Blade views that ship with the package are not published because the API
| only serves JSON and file responses. Publishing the framework config keeps
| the originals in vendor/laravel/framework/config for reference.
|
*/

return [

    'paths' => [
        resource_path('views'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compiled View Path
    |--------------------------------------------------------------------------
    |
    | This option determines where all the compiled Blade templates will be
    | stored for your application. Serverless deployments (Vercel) mount the
    | bundle read-only, so VIEW_COMPILED_PATH must point to a writable temp
    | directory there.
    |
    */

    'compiled' => env(
        'VIEW_COMPILED_PATH',
        realpath(storage_path('framework/views'))
    ),

];
