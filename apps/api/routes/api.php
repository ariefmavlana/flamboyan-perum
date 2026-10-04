<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:public-api')->group(function () {
        Route::get('properties', [PropertyController::class, 'index']);
        Route::get('properties/{slug}', [PropertyController::class, 'show']);
    });
    Route::middleware(['auth:sanctum', 'active', 'throttle:internal-api'])->group(function () {
        Route::get('me', fn (Request $request) => ['data' => $request->user()->only(['id', 'name', 'email', 'role', 'is_active', 'version', 'email_verified_at'])]);
        Route::patch('me', [UserController::class, 'profile']);
        Route::get('internal/users', [UserController::class, 'index']);
        Route::post('internal/users', [UserController::class, 'store']);
        Route::patch('internal/users/{id}', [UserController::class, 'update'])->whereNumber('id');
        Route::get('internal/audit', [UserController::class, 'audit']);
        Route::get('internal/properties', [PropertyController::class, 'internalIndex']);
        Route::post('internal/properties', [PropertyController::class, 'store']);
        Route::get('internal/properties/{id}/media', [MediaController::class, 'index'])->whereNumber('id');
        Route::post('internal/properties/{id}/media', [MediaController::class, 'store'])->whereNumber('id');
        Route::patch('internal/properties/{id}/media/{mediaId}', [MediaController::class, 'update'])->whereNumber(['id', 'mediaId']);
        Route::get('internal/media/{mediaId}/{variant}', [MediaController::class, 'internalFile'])->whereNumber('mediaId')->where('variant', '640|1280|1920|download');
        Route::get('internal/properties/{id}', [PropertyController::class, 'internalShow'])->whereNumber('id');
        Route::post('internal/properties/{id}/owner', [PropertyController::class, 'transferOwner'])->whereNumber('id');
        Route::patch('internal/properties/{id}', [PropertyController::class, 'update'])->whereNumber('id');
        Route::get('leads', [LeadController::class, 'index']);
        Route::post('leads', [LeadController::class, 'store']);
        Route::get('leads/{id}', [LeadController::class, 'show'])->whereNumber('id');
        Route::patch('leads/{id}/contact', [LeadController::class, 'contact'])->whereNumber('id');
        Route::post('leads/{id}/assignment', [LeadController::class, 'assign'])->whereNumber('id');
        Route::patch('leads/{id}/status', [LeadController::class, 'status'])->whereNumber('id');
        Route::post('leads/{id}/notes', [LeadController::class, 'note'])->whereNumber('id');
        Route::get('leads/{id}/history', [LeadController::class, 'history'])->whereNumber('id');
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'read']);
    });
});
