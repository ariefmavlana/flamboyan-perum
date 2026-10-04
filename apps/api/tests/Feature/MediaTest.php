<?php

namespace Tests\Feature;

use App\Jobs\ProcessPropertyMedia;
use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\PropertyMedia;
use App\Models\User;
use App\Services\MalwareScanner;
use App\Services\MediaProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    private function property(): Property
    {
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $this->actingAs($owner);

        return Property::create(['owner_id' => $owner->id, 'slug' => 'media-test', 'title' => 'Properti Media', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bogor', 'address' => 'Alamat test', 'description' => 'Data pengujian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED']);
    }

    public function test_images_are_private_until_decoded_reencoded_and_published(): void
    {
        Storage::fake('media');
        Queue::fake();
        $property = $this->property();
        $response = $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Tampak depan', 'file' => UploadedFile::fake()->image('unsafe-name.jpg', 1200, 800)]);
        $response->assertCreated()->assertJsonPath('data.state', 'PROCESSING')->assertJsonPath('property_version', 2);
        $media = PropertyMedia::findOrFail($response->json('data.id'));
        Queue::assertPushed(ProcessPropertyMedia::class);
        $this->get('/media/'.$media->id.'/640')->assertNotFound();
        (new ProcessPropertyMedia($media->id))->handle(app(MediaProcessor::class));
        $this->assertSame('READY', $media->fresh()->state);
        $this->get('/media/'.$media->id.'/640')->assertOk()->assertHeader('Content-Type', 'image/webp')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->getJson('/api/v1/properties/media-test')->assertJsonPath('data.media.0.alt', 'Tampak depan')->assertJsonMissingPath('data.media.0.staging_path')->assertJsonMissingPath('data.media.0.owner_id');
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/media/'.$media->id, ['version' => 2, 'archived' => true])->assertOk()->assertJsonPath('property_version', 3);
        $this->get('/media/'.$media->id.'/640')->assertNotFound();
    }

    public function test_spoofed_svg_and_oversized_uploads_are_rejected_without_version_change(): void
    {
        Storage::fake('media');
        Queue::fake();
        $property = $this->property();
        foreach ([UploadedFile::fake()->createWithContent('fake.jpg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), UploadedFile::fake()->create('huge.jpg', 5121, 'image/jpeg')] as $file) {
            $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Test', 'file' => $file])->assertUnprocessable();
        }
        $this->assertSame(1, $property->fresh()->version);
        $this->assertDatabaseCount('property_media', 0);
    }

    public function test_media_mutations_are_scoped_versioned_and_links_are_allowlisted(): void
    {
        $property = $this->property();
        $other = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $this->actingAs($other)->getJson('/api/v1/internal/properties/'.$property->id.'/media')->assertNotFound();
        $this->actingAs(User::findOrFail($property->owner_id));
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'VIDEO', 'alt' => 'Video', 'url' => 'https://youtube.com.evil.test/watch?v=abcdefghijk'])->assertUnprocessable();
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'VIDEO', 'alt' => 'Video', 'url' => 'https://youtu.be/abcdefghijk'])->assertCreated()->assertJsonPath('data.url', 'https://www.youtube-nocookie.com/embed/abcdefghijk');
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'TOUR', 'alt' => 'Tour', 'url' => 'https://my.matterport.com/show/?m=abcdefghijk'])->assertConflict();
        $this->assertSame(2, $property->fresh()->version);
    }

    public function test_tour_links_are_public_only_while_media_and_property_are_published(): void
    {
        $property = $this->property();
        $uri = '/api/v1/internal/properties/'.$property->id.'/media';
        $this->postJson($uri, ['version' => 1, 'kind' => 'TOUR', 'alt' => 'Tour', 'url' => 'https://my.matterport.com.evil.test/show/?m=abcdefghijk'])->assertUnprocessable();
        $this->postJson($uri, ['version' => 1, 'kind' => 'TOUR', 'alt' => 'Tour', 'url' => 'https://user:pass@my.matterport.com/show/?m=abcdefghijk'])->assertUnprocessable();
        $created = $this->postJson($uri, ['version' => 1, 'kind' => 'TOUR', 'alt' => 'Tour', 'url' => 'https://my.matterport.com/show/?m=abcdefghijk'])->assertCreated()->assertJsonPath('data.state', 'READY');
        $media = PropertyMedia::findOrFail($created->json('data.id'));
        $this->getJson('/api/v1/properties/media-test')->assertJsonPath('data.media.0.url', 'https://my.matterport.com/show/?m=abcdefghijk')->assertJsonMissingPath('data.media.0.property_id')->assertJsonMissingPath('data.media.0.staging_path');
        $media->update(['published' => false]);
        $this->getJson('/api/v1/properties/media-test')->assertJsonCount(0, 'data.media');
        $media->update(['published' => true]);
        $property->update(['publication' => 'DRAFT']);
        $this->getJson('/api/v1/properties/media-test')->assertNotFound();
        $property->update(['publication' => 'PUBLISHED']);
        $media->update(['state' => 'ARCHIVED']);
        $this->getJson('/api/v1/properties/media-test')->assertJsonCount(0, 'data.media');
    }

    public function test_brochures_fail_closed_when_scanner_is_unconfigured(): void
    {
        Storage::fake('media');
        Queue::fake();
        config(['media.scanner_binary' => '']);
        $property = $this->property();
        $response = $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'BROCHURE', 'alt' => 'Brosur properti', 'file' => UploadedFile::fake()->createWithContent('brosur.pdf', "%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF")]);
        $response->assertCreated();
        $media = PropertyMedia::findOrFail($response->json('data.id'));
        (new ProcessPropertyMedia($media->id))->handle(app(MediaProcessor::class));
        $this->assertSame('FAILED', $media->fresh()->state);
        $this->get('/media/'.$media->id.'/download')->assertNotFound();
    }

    public function test_reencoding_removes_source_metadata_and_processing_is_idempotent(): void
    {
        Storage::fake('media');
        Queue::fake();
        $property = $this->property();
        $original = UploadedFile::fake()->image('photo.jpg', 100, 80);
        $jpeg = file_get_contents($original->getRealPath());
        $metadata = "Exif\0\0PRIVATE_EXIF_LOCATION";
        $jpeg = substr($jpeg, 0, 2)."\xff\xe1".pack('n', strlen($metadata) + 2).$metadata.substr($jpeg, 2);
        $response = $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Tanpa metadata', 'file' => UploadedFile::fake()->createWithContent('photo.jpg', $jpeg)])->assertCreated();
        $media = PropertyMedia::findOrFail($response->json('data.id'));
        $job = new ProcessPropertyMedia($media->id);
        $job->handle(app(MediaProcessor::class));
        $first = $media->fresh()->variants;
        foreach ($first as $variant) {
            $this->assertStringNotContainsString('PRIVATE_EXIF_LOCATION', Storage::disk('media')->get($variant['path']));
        }
        $job->handle(app(MediaProcessor::class));
        $this->assertSame($first, $media->fresh()->variants);
        $property->update(['publication' => 'DRAFT']);
        $this->get('/media/'.$media->id.'/640')->assertNotFound();
        $this->getJson('/api/v1/internal/media/'.$media->id.'/640')->assertOk();
    }

    public function test_upload_audit_failure_removes_staging_and_rolls_back_version(): void
    {
        Storage::fake('media');
        Queue::fake();
        $property = $this->property();
        ActivityLog::creating(fn () => throw new \RuntimeException('Injected media audit failure'));
        try {
            $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Fail', 'file' => UploadedFile::fake()->image('photo.jpg')])->assertStatus(500);
            $this->assertSame(1, $property->fresh()->version);
            $this->assertSame([], Storage::disk('media')->allFiles());
            $this->assertDatabaseCount('property_media', 0);
            Queue::assertNothingPushed();
        } finally {
            ActivityLog::flushEventListeners();
        }
    }

    public function test_database_jobs_are_durable_and_cleanup_respects_grace_and_dry_run(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $response = $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Durable', 'file' => UploadedFile::fake()->image('photo.jpg')])->assertCreated();
        $this->assertDatabaseCount('jobs', 1);
        $media = PropertyMedia::findOrFail($response->json('data.id'));
        $path = $media->staging_path;
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/media/'.$media->id, ['version' => 2, 'archived' => true])->assertOk();
        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();
        Storage::disk('media')->assertExists($path);
        $this->travel(31)->days();
        $this->artisan('flamboyan:media-cleanup')->assertSuccessful();
        Storage::disk('media')->assertExists($path);
        $this->artisan('flamboyan:media-cleanup', ['--execute' => true])->assertSuccessful();
        Storage::disk('media')->assertMissing($path);
        $this->assertNotNull($media->fresh()->purged_at);
        $this->assertDatabaseHas('activity_logs', ['subject_id' => $property->id, 'action' => 'MEDIA_ARCHIVED']);
    }

    public function test_brochure_scanner_clean_and_unsafe_contracts_are_enforced(): void
    {
        Storage::fake('media');
        Queue::fake();
        $property = $this->property();
        $response = $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'BROCHURE', 'alt' => 'Brosur', 'file' => UploadedFile::fake()->createWithContent('test.pdf', "%PDF-1.7\n%%EOF")])->assertCreated();
        $media = PropertyMedia::findOrFail($response->json('data.id'));
        $scanner = $this->mock(MalwareScanner::class);
        $scanner->shouldReceive('inspect')->once()->andReturn('UNSAFE_FILE');
        (new ProcessPropertyMedia($media->id))->handle(new MediaProcessor($scanner));
        $this->assertSame('FAILED', $media->fresh()->state);
        $this->get('/media/'.$media->id.'/download')->assertNotFound();
        $this->patchJson('/api/v1/internal/properties/'.$property->id.'/media/'.$media->id, ['version' => 2, 'retry' => true])->assertOk();
        $scanner->shouldReceive('inspect')->once()->andReturn('CLEAN');
        (new ProcessPropertyMedia($media->id))->handle(new MediaProcessor($scanner));
        $this->get('/media/'.$media->id.'/download')->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertHeader('Content-Disposition', 'attachment; filename=brosur-properti.pdf')->assertHeader('X-Content-Type-Options', 'nosniff');
        // Mock proves the contract, not actual antivirus effectiveness or PDF validity.
    }

    public function test_image_limit_and_internal_pagination_are_bounded_and_recovery_is_explicit(): void
    {
        Storage::fake('media');
        Queue::fake();
        $property = $this->property();
        for ($index = 0; $index < 20; $index++) {
            $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Limit test', 'state' => 'PROCESSING', 'updated_at' => now()->subMinutes(16)]);
        }
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Overflow', 'file' => UploadedFile::fake()->image('photo.jpg')])->assertConflict();
        $this->assertSame([], Storage::disk('media')->allFiles());
        $this->getJson('/api/v1/internal/properties/'.$property->id.'/media?per_page=5')->assertJsonCount(5, 'data')->assertJsonPath('meta.last_page', 4);
        $this->getJson('/api/v1/internal/properties/'.$property->id.'/media?per_page=1000')->assertUnprocessable();
        $this->artisan('flamboyan:media-recover')->assertSuccessful();
        Queue::assertNothingPushed();
        $this->artisan('flamboyan:media-recover', ['--execute' => true])->assertSuccessful();
        Queue::assertPushed(ProcessPropertyMedia::class, 20);
    }

    public function test_queue_failure_rolls_back_the_upload_and_does_not_block_the_next_attempt(): void
    {
        Storage::fake('media');
        $property = $this->property();
        $manager = Queue::getFacadeRoot();
        Queue::partialMock()->shouldReceive('connection')->with('database')->andThrow(new \RuntimeException('Injected queue insert failure'));
        try {
            $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Failed queue', 'file' => UploadedFile::fake()->image('photo.jpg')])->assertStatus(500);
        } finally {
            Queue::swap($manager);
        }
        $this->assertDatabaseCount('property_media', 0);
        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseCount('activity_logs', 0);
        $this->assertSame(1, $property->fresh()->version);
        $this->assertSame([], Storage::disk('media')->allFiles());
        $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Next attempt', 'file' => UploadedFile::fake()->image('photo.jpg')])->assertCreated();
        $this->assertDatabaseCount('jobs', 1);
    }

    public function test_listing_only_loads_a_stable_ready_photo_cover_while_detail_has_full_media(): void
    {
        $property = $this->property();
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Later photo', 'state' => 'READY', 'position' => 10]);
        $cover = $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Cover', 'state' => 'READY', 'position' => 5]);
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Same position later id', 'state' => 'READY', 'position' => 5]);
        $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Failed private source', 'state' => 'FAILED', 'position' => 0]);
        $property->media()->create(['kind' => 'VIDEO', 'alt' => 'Video', 'state' => 'READY', 'position' => 0, 'url' => 'https://www.youtube-nocookie.com/embed/abcdefghijk']);
        $this->getJson('/api/v1/properties')->assertJsonCount(1, 'data.0.media')->assertJsonPath('data.0.media.0.id', $cover->id);
        $this->getJson('/api/v1/properties/media-test')->assertJsonCount(4, 'data.media')->assertJsonMissingPath('data.media.0.staging_path');
    }
}
