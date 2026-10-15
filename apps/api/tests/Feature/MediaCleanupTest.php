<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\DirectoryListing;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemOperator;
use Mockery;
use Tests\TestCase;

class MediaCleanupTest extends TestCase
{
    use RefreshDatabase;

    private function property(): Property
    {
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);

        return Property::create(['owner_id' => $owner->id, 'slug' => 'cleanup-test', 'title' => 'Properti Media', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bandung', 'address' => 'Alamat test', 'description' => 'Data pengujian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'DRAFT']);
    }

    private function object(string $path, string $bytes = 'asset', int $daysOld = 31): void
    {
        $disk = Storage::disk('media');
        $disk->put($path, $bytes);
        touch($disk->path($path), now()->subDays($daysOld)->timestamp);
        clearstatcache();
    }

    public function test_remote_orphans_have_a_read_only_object_and_byte_report_then_are_deleted_exactly(): void
    {
        Storage::fake('media');
        config(['filesystems.disks.media.driver' => 's3']);
        $paths = ['staging/'.Str::uuid().'.bin', 'ready/'.Str::uuid().'/640.webp', 'content-logos/'.Str::uuid().'.webp'];
        foreach ($paths as $path) {
            $this->object($path, '12345');
        }
        $recent = 'staging/'.Str::uuid().'.bin';
        $this->object($recent, 'recent', 29);
        $unknown = 'ready/'.Str::uuid().'/private-original.jpg';
        $this->object($unknown);
        $unmanaged = 'uploads/other-project.pdf';
        $this->object($unmanaged);

        $this->assertSame(0, Artisan::call('flamboyan:media-cleanup', ['--json' => true]));
        $report = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('dry_run', $report['mode']);
        $this->assertSame(3, $report['eligible_objects']);
        $this->assertSame(15, $report['eligible_bytes']);
        $this->assertSame(3, $report['eligible_orphan_objects']);
        $this->assertSame(0, $report['deleted_objects']);
        $this->assertEqualsCanonicalizing($paths, array_column($report['rows'], 'path'));
        Storage::disk('media')->assertExists($paths);

        $this->assertSame(0, Artisan::call('flamboyan:media-cleanup', ['--execute' => true, '--json' => true]));
        $report = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('execute', $report['mode']);
        $this->assertSame(3, $report['deleted_objects']);
        $this->assertSame(15, $report['deleted_bytes']);
        Storage::disk('media')->assertMissing($paths);
        Storage::disk('media')->assertExists([$recent, $unknown, $unmanaged]);
    }

    public function test_archived_purge_preserves_paths_shared_with_unpurged_draft_failed_and_processing_media(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $cover = 'ready/'.Str::uuid().'/640.webp';
        $failed = 'staging/'.Str::uuid().'.bin';
        $processing = 'staging/'.Str::uuid().'.bin';
        foreach ([$cover, $failed, $processing] as $path) {
            $this->object($path);
        }
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Draft', 'state' => 'READY', 'published' => false, 'variants' => ['640' => ['path' => $cover]]]);
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Retry', 'state' => 'FAILED', 'staging_path' => $failed]);
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Processing', 'state' => 'PROCESSING', 'staging_path' => $processing]);
        $archived = $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Archived shared source', 'state' => 'ARCHIVED', 'archived_at' => now()->subDays(31), 'staging_path' => $failed, 'variants' => ['640' => ['path' => $cover], '1280' => ['path' => $processing]]]);
        ActivityLog::create(['actor_id' => $property->owner_id, 'subject_type' => 'PROPERTY', 'subject_id' => $property->id, 'action' => 'MEDIA_ARCHIVED', 'changes' => ['media_id' => $archived->id]]);

        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();

        Storage::disk('media')->assertExists([$cover, $failed, $processing]);
        $this->assertNotNull($archived->fresh()->purged_at);
        $this->assertDatabaseCount('property_media', 4);
        $this->assertDatabaseHas('activity_logs', ['action' => 'MEDIA_ARCHIVED', 'subject_id' => $property->id]);
    }

    public function test_cleanup_preserves_current_cms_logos_even_when_unpublished_and_removes_retired_logos(): void
    {
        Storage::fake('media');
        config(['filesystems.disks.media.driver' => 's3']);
        $property = $this->property();
        $current = 'content-logos/'.Str::uuid().'.webp';
        $retired = 'content-logos/'.Str::uuid().'.webp';
        $this->object($current);
        $this->object($retired);
        SiteContent::create(['kind' => 'BANK_PARTNER', 'published' => false, 'payload' => ['name' => 'Bank test', '_logo' => ['path' => $current]], 'updated_by' => $property->owner_id]);
        $archived = $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Shared logo', 'state' => 'ARCHIVED', 'archived_at' => now()->subDays(31), 'variants' => ['640' => ['path' => $current]]]);

        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();

        Storage::disk('media')->assertExists($current);
        Storage::disk('media')->assertMissing($retired);
        $this->assertNotNull($archived->fresh()->purged_at);
        $this->assertDatabaseCount('site_contents', 1);
    }

    public function test_local_orphan_cleanup_uses_file_grace_and_never_removes_a_referenced_directory(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $directory = 'ready/'.Str::uuid();
        $current = $directory.'/640.webp';
        $orphan = $directory.'/1280.webp';
        $recent = $directory.'/1920.webp';
        $unknown = $directory.'/original.png';
        $this->object($current);
        $this->object($orphan);
        $this->object($recent, 'recent', 29);
        $this->object($unknown);
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Keep exact variant', 'state' => 'READY', 'variants' => ['640' => ['path' => $current]]]);

        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();

        Storage::disk('media')->assertExists([$current, $recent, $unknown]);
        Storage::disk('media')->assertMissing($orphan);
    }

    public function test_unknown_archived_paths_are_never_deleted_or_marked_purged(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $path = 'uploads/other-project.pdf';
        $this->object($path);
        $archived = $property->media()->create(['kind' => 'BROCHURE', 'alt' => 'Unsupported path', 'state' => 'ARCHIVED', 'archived_at' => now()->subDays(31), 'variants' => ['download' => ['path' => $path]]]);

        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();

        Storage::disk('media')->assertExists($path);
        $this->assertNull($archived->fresh()->purged_at);
    }

    public function test_archived_paths_and_staging_keep_the_full_grace_period_and_dry_run_changes_no_records(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $oldPath = 'ready/'.Str::uuid().'/brochure.pdf';
        $recentPath = 'staging/'.Str::uuid().'.bin';
        $this->object($oldPath);
        $this->object($recentPath);
        $old = $property->media()->create(['kind' => 'BROCHURE', 'alt' => 'Archived', 'state' => 'ARCHIVED', 'archived_at' => now()->subDays(31), 'variants' => ['download' => ['path' => $oldPath]]]);
        $recent = $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Within grace', 'state' => 'ARCHIVED', 'archived_at' => now()->subDays(29), 'staging_path' => $recentPath]);

        $this->artisan('flamboyan:media-cleanup')->assertSuccessful();
        Storage::disk('media')->assertExists([$oldPath, $recentPath]);
        $this->assertNull($old->fresh()->purged_at);
        $this->assertNull($recent->fresh()->purged_at);

        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();
        Storage::disk('media')->assertMissing($oldPath);
        Storage::disk('media')->assertExists($recentPath);
        $this->assertNotNull($old->fresh()->purged_at);
        $this->assertNull($recent->fresh()->purged_at);
    }

    public function test_remote_execution_refreshes_references_and_object_age_before_each_orphan_delete(): void
    {
        config(['filesystems.disks.media.driver' => 's3']);
        $property = $this->property();
        $first = 'ready/'.Str::uuid().'/640.webp';
        $newReference = 'ready/'.Str::uuid().'/1280.webp';
        $rewritten = 'staging/'.Str::uuid().'.bin';
        $old = now()->subDays(31)->timestamp;
        $driver = Mockery::mock(FilesystemOperator::class);
        $disk = Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('getDriver')->andReturn($driver);
        $driver->shouldReceive('listContents')->with('ready', true)->once()->andReturn(new DirectoryListing([new FileAttributes($first, 5, lastModified: $old), new FileAttributes($newReference, 5, lastModified: $old)]));
        $driver->shouldReceive('listContents')->with('staging', true)->once()->andReturn(new DirectoryListing([new FileAttributes($rewritten, 5, lastModified: $old)]));
        $driver->shouldReceive('listContents')->with('content-logos', true)->once()->andReturn(new DirectoryListing([]));
        $disk->shouldReceive('lastModified')->with($first)->once()->andReturn($old);
        $disk->shouldReceive('lastModified')->with($rewritten)->once()->andReturn(now()->timestamp);
        $disk->shouldReceive('delete')->with($first)->once()->andReturnUsing(function () use ($property, $newReference) {
            $property->media()->create(['kind' => 'PHOTO', 'alt' => 'New reference', 'state' => 'READY', 'variants' => ['1280' => ['path' => $newReference]]]);

            return true;
        });
        $disk->shouldNotReceive('delete')->with($newReference);
        $disk->shouldNotReceive('delete')->with($rewritten);
        $disk->shouldNotReceive('path');
        $disk->shouldNotReceive('deleteDirectory');
        Storage::shouldReceive('disk')->with('media')->andReturn($disk);

        $this->assertSame(0, Artisan::call('flamboyan:media-cleanup', ['--execute' => true, '--json' => true]));
        $report = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame(1, $report['deleted_objects']);
        $this->assertSame(5, $report['deleted_bytes']);
        $this->assertSame([$first], array_column($report['rows'], 'path'));
    }

    public function test_shared_archived_paths_are_counted_and_deleted_once_with_matching_dry_run(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $path = 'ready/'.Str::uuid().'/640.webp';
        $this->object($path, '12345');
        foreach (['First', 'Second'] as $alt) {
            $property->media()->create(['kind' => 'PHOTO', 'alt' => $alt, 'state' => 'ARCHIVED', 'archived_at' => now()->subDays(31), 'variants' => ['640' => ['path' => $path]]]);
        }

        $this->assertSame(0, Artisan::call('flamboyan:media-cleanup', ['--json' => true]));
        $preview = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame(2, $preview['eligible_archived_media']);
        $this->assertSame(1, $preview['eligible_objects']);
        $this->assertSame(5, $preview['eligible_bytes']);
        $this->assertSame(0, $preview['retained_shared_objects']);
        $this->assertSame(0, $property->media()->whereNotNull('purged_at')->count());
        Storage::disk('media')->assertExists($path);

        $this->assertSame(0, Artisan::call('flamboyan:media-cleanup', ['--execute' => true, '--json' => true]));
        $result = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame($preview['rows'], $result['rows']);
        $this->assertSame(1, $result['deleted_objects']);
        $this->assertSame(5, $result['deleted_bytes']);
        $this->assertSame(2, $result['purged_media']);
        $this->assertSame(2, $property->media()->whereNotNull('purged_at')->count());
        Storage::disk('media')->assertMissing($path);
    }
}
