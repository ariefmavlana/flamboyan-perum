<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RecoveryController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::post('/auth/forgot-password', [RecoveryController::class, 'forgot'])->middleware('throttle:recovery');
Route::post('/auth/reset-password', [RecoveryController::class, 'reset'])->middleware('throttle:recovery');
