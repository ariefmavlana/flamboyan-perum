<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CommercialController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\RealtimeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

Route::prefix('v1')->group(function () {
    Route::post('analytics', [AnalyticsController::class, 'store'])->middleware('throttle:analytics')->withoutMiddleware(EnsureFrontendRequestsAreStateful::class);
    Route::middleware('throttle:public-api')->group(function () {
        Route::get('content', [ContentController::class, 'publicIndex']);
        Route::get('content/{id}/logo', [ContentController::class, 'publicLogo'])->whereNumber('id');
        Route::get('compare', [EvaluationController::class, 'compare']);
        Route::get('sitemap', [EvaluationController::class, 'sitemap']);
        Route::get('properties', [PropertyController::class, 'index']);
        Route::get('properties/{slug}', [PropertyController::class, 'show']);
    });
    Route::middleware(['auth:sanctum', 'active', 'throttle:internal-api'])->group(function () {
        Route::get('me', fn (Request $request) => ['data' => $request->user()->only(['id', 'name', 'email', 'role', 'is_active', 'version', 'email_verified_at'])]);
        Route::get('realtime', [RealtimeController::class, 'configuration']);
        Route::post('realtime/auth', [RealtimeController::class, 'authorize']);
        Route::patch('me', [UserController::class, 'profile']);
        Route::get('internal/users', [UserController::class, 'index']);
        Route::post('internal/users', [UserController::class, 'store']);
        Route::patch('internal/users/{id}', [UserController::class, 'update'])->whereNumber('id');
        Route::get('internal/audit', [UserController::class, 'audit']);
        Route::get('internal/reports', [ReportController::class, 'index']);
        Route::get('internal/privacy', [ReportController::class, 'privacy']);
        Route::get('internal/operations', [OperationsController::class, 'metrics']);
        Route::get('internal/content', [ContentController::class, 'index']);
        Route::post('internal/content', [ContentController::class, 'store']);
        Route::post('internal/content/{id}/logo', [ContentController::class, 'uploadLogo'])->whereNumber('id');
        Route::patch('internal/content/{id}', [ContentController::class, 'update'])->whereNumber('id');
        Route::patch('internal/properties/{id}/location', [EvaluationController::class, 'location'])->whereNumber('id');
        Route::patch('internal/properties/{id}/commercial', [CommercialController::class, 'update'])->whereNumber('id');
        Route::get('internal/properties', [PropertyController::class, 'internalIndex']);
        Route::post('internal/properties', [PropertyController::class, 'store']);
        Route::get('internal/properties/{id}/media', [MediaController::class, 'index'])->whereNumber('id');
        Route::post('internal/properties/{id}/media', [MediaController::class, 'store'])->whereNumber('id');
        Route::post('internal/properties/{id}/media/process', [MediaController::class, 'processPending'])->whereNumber('id');
        Route::patch('internal/properties/{id}/media/{mediaId}', [MediaController::class, 'update'])->whereNumber(['id', 'mediaId']);
        Route::get('internal/media/{mediaId}/{variant}', [MediaController::class, 'internalFile'])->whereNumber('mediaId')->where('variant', '640|1280|1920|download');
        Route::get('internal/properties/{id}', [PropertyController::class, 'internalShow'])->whereNumber('id');
        Route::post('internal/properties/{id}/owner', [PropertyController::class, 'transferOwner'])->whereNumber('id');
        Route::patch('internal/properties/{id}', [PropertyController::class, 'update'])->whereNumber('id');
        Route::get('leads', [LeadController::class, 'index']);
        Route::get('leads/summary', [LeadController::class, 'summary']);
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
