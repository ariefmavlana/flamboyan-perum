<?php

use App\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;

Route::get('/media/{mediaId}/{variant}', [MediaController::class, 'publicFile'])->whereNumber('mediaId')->where('variant', '640|1280|1920|download')->middleware('throttle:public-api');
