<?php

namespace Tests\Unit;

use App\Support\DeploymentIsolation;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class DeploymentIsolationTest extends TestCase
{
    #[DataProvider('unisolatedRuntimeEnvironments')]
    public function test_vercel_preview_runtime_requires_explicit_isolation(string $environment): void
    {
        $this->expectException(InvalidArgumentException::class);
        DeploymentIsolation::previewRequired('preview', $environment, false);
    }

    public static function unisolatedRuntimeEnvironments(): array
    {
        return [['production'], ['staging'], ['local']];
    }

    public function test_isolated_preview_is_asserted_but_build_tests_can_use_sqlite(): void
    {
        $this->assertTrue(DeploymentIsolation::previewRequired('preview', 'staging', true));
        $this->assertTrue(DeploymentIsolation::previewRequired('preview', 'testing', true));
        $this->assertFalse(DeploymentIsolation::previewRequired('preview', 'testing', false));
        $this->assertFalse(DeploymentIsolation::previewRequired('production', 'production', false));
        $this->assertFalse(DeploymentIsolation::previewRequired('', 'local', false));
    }

    public function test_single_custom_schema_is_preserved_without_public_fallback(): void
    {
        $this->assertSame('growth_preview_pr44', DeploymentIsolation::databaseSchema('growth_preview_pr44'));
        $this->assertSame('public', DeploymentIsolation::databaseSchema(null));
        $this->assertSame('growth-preview/pr44', DeploymentIsolation::mediaPrefix('growth-preview/pr44/'));
    }

    #[DataProvider('invalidSchemas')]
    public function test_invalid_schema_fails_closed(string $schema): void
    {
        $this->expectException(InvalidArgumentException::class);
        DeploymentIsolation::databaseSchema($schema);
    }

    public static function invalidSchemas(): array
    {
        return [['public,growth_preview'], ['public growth_preview'], ['Public'], ['growth-preview'], ['1preview'], [str_repeat('a', 64)]];
    }

    public function test_unsafe_media_prefix_fails_closed(): void
    {
        $this->expectException(InvalidArgumentException::class);
        DeploymentIsolation::mediaPrefix('../production');
    }

    public function test_preview_cannot_use_public_schema_or_unprefixed_media(): void
    {
        DeploymentIsolation::assertPreview('pgsql', 'growth_preview_20261017', 's3', 'growth-preview/20261017');
        $this->expectException(InvalidArgumentException::class);
        DeploymentIsolation::assertPreview('pgsql', 'public', 's3', 'growth-preview/20261017');
    }
}
