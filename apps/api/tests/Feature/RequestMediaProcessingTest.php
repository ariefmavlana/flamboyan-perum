<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RequestMediaProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_is_committed_then_processed_without_a_persistent_worker(): void
    {
        $this->withoutExceptionHandling();
        Storage::fake('media');
        config(['media.process_in_request' => true, 'queue.connections.database.connection' => null]);
        $actor = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create(['owner_id' => $actor->id, 'slug' => 'request-image', 'title' => 'Rumah taman', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bandung Timur', 'address' => 'Alamat ilustrasi', 'description' => 'Ilustrasi hunian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED']);
        $this->actingAs($actor);
        $level = DB::transactionLevel();
        $processingLevels = [];
        Event::listen(JobProcessing::class, function () use (&$processingLevels) {
            $processingLevels[] = DB::transactionLevel();
        });

        $response = $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Taman rumah', 'file' => UploadedFile::fake()->image('garden.png', 960, 640)]);

        $response->assertCreated()->assertJsonPath('data.state', 'READY');
        $this->assertSame([$level], $processingLevels);
        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseCount('failed_jobs', 0);
        $media = $property->media()->firstOrFail();
        foreach (['640', '1280', '1920'] as $variant) {
            Storage::disk('media')->assertExists($media->variants[$variant]['path']);
        }
    }

    public function test_brochure_processing_remains_fail_closed_without_a_scanner(): void
    {
        Storage::fake('media');
        config(['media.process_in_request' => true, 'media.scanner_binary' => '']);
        $actor = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create(['owner_id' => $actor->id, 'slug' => 'request-brochure', 'title' => 'Rumah taman', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bandung Timur', 'address' => 'Alamat ilustrasi', 'description' => 'Ilustrasi hunian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED']);
        $this->actingAs($actor);
        $file = UploadedFile::fake()->createWithContent('brochure.pdf', "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF");

        $this->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'BROCHURE', 'alt' => 'Brosur hunian', 'file' => $file])->assertCreated()->assertJsonPath('data.state', 'FAILED')->assertJsonPath('data.failure_code', 'SCANNER_UNAVAILABLE');
        $this->assertDatabaseCount('jobs', 0);
        Storage::disk('media')->assertExists($property->media()->firstOrFail()->staging_path);
    }

    public function test_pending_upload_can_resume_only_through_an_authorized_mutation(): void
    {
        Storage::fake('media');
        config(['media.process_in_request' => false]);
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $property = Property::create(['owner_id' => $owner->id, 'slug' => 'pending-image', 'title' => 'Rumah taman', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bandung Timur', 'address' => 'Alamat ilustrasi', 'description' => 'Ilustrasi hunian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'DRAFT']);
        $this->actingAs($owner)->postJson('/api/v1/internal/properties/'.$property->id.'/media', ['version' => 1, 'kind' => 'PHOTO', 'alt' => 'Taman rumah', 'file' => UploadedFile::fake()->image('garden.png', 960, 640)])->assertCreated()->assertJsonPath('data.state', 'PROCESSING');
        $uri = '/api/v1/internal/properties/'.$property->id.'/media/process';
        $this->postJson($uri)->assertConflict();
        config(['media.process_in_request' => true]);
        $other = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $this->actingAs($other)->postJson($uri)->assertNotFound();
        $this->assertDatabaseCount('jobs', 1);
        $this->actingAs($owner)->getJson('/api/v1/internal/properties/'.$property->id.'/media')->assertOk()->assertJsonPath('process_in_request', true)->assertJsonPath('data.0.state', 'PROCESSING');
        $this->assertDatabaseCount('jobs', 1);
        $this->postJson($uri)->assertNoContent();
        $this->assertSame('READY', $property->media()->firstOrFail()->state);
        $this->assertSame(2, $property->fresh()->version);
        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseCount('failed_jobs', 0);
    }
}
