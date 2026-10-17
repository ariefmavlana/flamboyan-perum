<?php

namespace App\Support;

use InvalidArgumentException;

class DeploymentIsolation
{
    public static function previewRequired(string $platformEnvironment, string $appEnvironment, bool $isolated): bool
    {
        if ($platformEnvironment === 'preview' && $appEnvironment !== 'testing' && ! $isolated) {
            throw new InvalidArgumentException('Vercel preview requires explicit data isolation.');
        }

        return $isolated;
    }

    public static function assertPreview(string $driver, string $schema, string $mediaDriver, string $prefix): void
    {
        if ($driver !== 'pgsql' || ! preg_match('/^growth_preview_[a-z0-9_]+$/', $schema)
            || $mediaDriver !== 's3' || ! str_starts_with(self::mediaPrefix($prefix), 'growth-preview/')) {
            throw new InvalidArgumentException('Preview requires its dedicated PostgreSQL schema and private media prefix.');
        }
    }

    public static function databaseSchema(?string $value): string
    {
        $schema = $value === null || $value === '' ? 'public' : $value;
        if (! preg_match('/^[a-z][a-z0-9_]{0,62}$/', $schema)) {
            throw new InvalidArgumentException('DB_SCHEMA must be one lowercase PostgreSQL identifier.');
        }

        return $schema;
    }

    public static function mediaPrefix(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        if (strlen($value) > 128 || ! preg_match('#^[a-z0-9][a-z0-9_-]*(/[a-z0-9][a-z0-9_-]*)*/?$#', $value)) {
            throw new InvalidArgumentException('MEDIA_STORAGE_PREFIX must be a relative lowercase object prefix.');
        }

        return rtrim($value, '/');
    }
}
