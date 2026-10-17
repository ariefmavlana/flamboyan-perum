<?php

namespace App\Providers;

use App\Support\DeploymentIsolation;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('growth.preview_isolated')) {
            DeploymentIsolation::assertPreview(
                config('database.default'),
                (string) config('database.connections.pgsql.search_path'),
                (string) config('filesystems.disks.media.driver'),
                (string) config('filesystems.disks.media.root'),
            );
            // Parsing a connection configuration does not open its PDO socket.
            // A DB_URL query must not override the dedicated search_path.
            $effective = DB::connection()->getConfig('search_path');
            if ($effective !== config('database.connections.pgsql.search_path')) {
                throw new \InvalidArgumentException('DB_URL overrides the isolated preview schema.');
            }
        }
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('app.frontend_url'), '/').'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->email]));
        RateLimiter::for('recovery', fn (Request $request) => Limit::perMinute(5)->by(hash('sha256', mb_strtolower((string) $request->input('email')).'|'.$request->ip())));
        RateLimiter::for('public-api', fn (Request $request) => Limit::perMinute(120)->by(hash('sha256', (string) ($request->attributes->get('public_client_ip') ?? $request->ip()))));
        RateLimiter::for('analytics', fn (Request $request) => Limit::perMinute(60)->by(hash('sha256', (string) ($request->attributes->get('public_client_ip') ?? $request->ip()))));
        RateLimiter::for('inquiry-context', fn (Request $request) => Limit::perMinute(30)->by(hash('sha256', (string) ($request->attributes->get('public_client_ip') ?? $request->ip()))));
        RateLimiter::for('inquiry-submit', function (Request $request) {
            $ip = (string) ($request->attributes->get('public_client_ip') ?? $request->ip());
            $phone = preg_replace('/\D/', '', (string) $request->input('whatsapp_number'));
            $phone = str_starts_with($phone, '0') ? '62'.substr($phone, 1) : $phone;
            $secret = (string) config('app.key');

            return [
                Limit::perMinutes(10, 5)->by('ip:'.hash('sha256', $ip)),
                Limit::perDay(10)->by('contact:'.hash_hmac('sha256', $phone, $secret)),
            ];
        });
        RateLimiter::for('internal-api', fn (Request $request) => Limit::perMinute(120)->by((string) $request->user()?->id));
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by(hash('sha256', mb_strtolower((string) $request->input('email')).'|'.$request->ip())));
    }
}
