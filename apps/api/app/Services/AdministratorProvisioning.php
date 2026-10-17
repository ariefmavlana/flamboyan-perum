<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdministratorProvisioning
{
    private const LOCK_NAMESPACE = 1179405665;

    private const LOCK_KEY = 1094994510;

    public function transaction(Closure $operation): mixed
    {
        return DB::transaction(function () use ($operation) {
            $connection = DB::connection();

            match ($connection->getDriverName()) {
                'pgsql' => $connection->select('select pg_advisory_xact_lock(?, ?)', [self::LOCK_NAMESPACE, self::LOCK_KEY]),
                'sqlite' => $connection->statement('update users set updated_at = updated_at where 0 = 1'),
                default => throw new RuntimeException('Driver database tidak mendukung provisioning Administrator yang aman.'),
            };

            return $operation();
        }, 3);
    }
}
