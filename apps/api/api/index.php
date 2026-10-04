<?php

/*
|--------------------------------------------------------------------------
| Serverless entry point for the Laravel API on Vercel (vercel-php runtime)
|--------------------------------------------------------------------------
|
| The runtime builds a self-contained function from this file: it runs
| `composer install --no-dev` at build time and mounts the result read-only,
| so nothing here may write into the bundle. See docs/vercel-demo-deployment.md.
|
*/

require __DIR__.'/../public/index.php';
