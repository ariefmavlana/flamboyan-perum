<?php

namespace Tests\Feature;

use App\Jobs\ProcessPropertyMedia;
use App\Models\Property;
use App\Models\User;
use App\Services\MediaProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UnpublishedMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploaded_photos_stay_private_after_processing_until_explicit_publication(): void
    {
        Storage::fake('media');
        Queue::fake();
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);
        $this->actingAs($owner);
        $property = Property::create(['owner_id' => $owner->id, 'slug' => 'staged-media', 'title' => 'Rumah contoh', 'house_type' => '36/60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bandung', 'address' => 'Alamat pengujian', 'description' => 'Data pengujian', 'price_idr' => 500000000, 'land_area' => 60, 'building_area' => 36, 'bedrooms' => 2, 'bathrooms' => 1, 'publication' => 'PUBLISHED']);
        $path = '/api/v1/internal/properties/'.$property->id.'/media';
        $this->getJson($path)->assertOk()->assertJsonPath('supports_unpublished_uploads', true);
        $alt = 'Ilustrasi desain untuk ditinjau [BFI2:house-36-60-photo-01]';
        $response = $this->postJson($path, ['version' => 1, 'kind' => 'PHOTO', 'alt' => $alt, 'published' => false, 'file' => UploadedFile::fake()->image('staged.jpg', 800, 600)])
            ->assertCreated()->assertJsonPath('data.published', false);
        $id = $response->json('data.id');
        (new ProcessPropertyMedia($id))->handle(app(MediaProcessor::class));
        $this->get('/media/'.$id.'/640')->assertNotFound();
        $this->getJson('/api/v1/properties/staged-media')->assertJsonCount(0, 'data.media');
        $this->getJson($path)->assertJsonPath('data.0.state', 'READY')->assertJsonPath('data.0.published', false)->assertJsonPath('data.0.alt', $alt);

        $this->patchJson($path.'/'.$id, ['version' => 2, 'published' => true])->assertOk();
        $this->get('/media/'.$id.'/640')->assertOk();
        $this->getJson('/api/v1/properties/staged-media')->assertJsonPath('data.media.0.id', $id)->assertJsonPath('data.media.0.alt', 'Ilustrasi desain untuk ditinjau');
    }
}
