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

// Vercel invokes /api/index.php even when the public request is /api/v1/...
// Keep Symfony from treating /api as a mount point and removing that prefix.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require __DIR__.'/../public/index.php';
