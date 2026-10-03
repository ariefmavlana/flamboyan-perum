<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PropertyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:public-api')->group(function () {
        Route::get('properties', [PropertyController::class, 'index']);
        Route::get('properties/{slug}', [PropertyController::class, 'show']);
    });
    Route::middleware(['auth:sanctum', 'active', 'throttle:internal-api'])->group(function () {
        Route::get('me', fn (Request $request) => ['data' => $request->user()->only(['id', 'name', 'role'])]);
        Route::get('internal/properties', [PropertyController::class, 'internalIndex']);
        Route::post('internal/properties', [PropertyController::class, 'store']);
        Route::patch('internal/properties/{id}', [PropertyController::class, 'update'])->whereNumber('id');
        Route::get('leads', [LeadController::class, 'index']);
        Route::post('leads', [LeadController::class, 'store']);
        Route::post('leads/{id}/assignment', [LeadController::class, 'assign'])->whereNumber('id');
        Route::patch('leads/{id}/status', [LeadController::class, 'status'])->whereNumber('id');
        Route::post('leads/{id}/notes', [LeadController::class, 'note'])->whereNumber('id');
        Route::get('leads/{id}/history', [LeadController::class, 'history'])->whereNumber('id');
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'read']);
    });
});
