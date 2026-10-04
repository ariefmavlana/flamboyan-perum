<?php

/*
|--------------------------------------------------------------------------
| Serverless entry point when the Vercel project root is the repository root
|--------------------------------------------------------------------------
|
| The runtime expects PHP files inside an "api" directory, so this file reuses
| the canonical entry point in apps/api/api/index.php.
|
*/

require __DIR__.'/../apps/api/api/index.php';
