<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\PropertyMedia;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EditorialAssetsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true]);
        $this->actingAs($admin);

        return $admin;
    }

    private function property(): Property
    {
        $owner = User::factory()->create(['role' => 'MARKETING', 'is_active' => true]);

        return Property::create(['owner_id' => $owner->id, 'slug' => 'editorial-'.uniqid(), 'title' => 'Properti Editorial', 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Bandung Timur', 'address' => 'Alamat test', 'description' => 'Data pengujian', 'price_idr' => 900000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED']);
    }

    private function hero(Property $property, ?int $mediaId = null): array
    {
        return ['kind' => 'HERO', 'published' => true, 'position' => 0, 'verified' => true, 'payload' => ['title' => 'Hero', 'description' => 'Deskripsi', 'eyebrow' => 'Bandung Timur', 'property_id' => $property->id, 'media_id' => $mediaId]];
    }

    private function partner(): array
    {
        return ['kind' => 'BANK_PARTNER', 'published' => true, 'verified' => true, 'position' => 0, 'payload' => ['name' => 'Bank fixture', 'website' => 'https://bank.example.test']];
    }

    public function test_hero_selects_safe_media_and_revokes_it_without_falling_back(): void
    {
        $this->admin();
        $property = $this->property();
        $cover = $property->media()->create(['kind' => 'PHOTO', 'alt' => 'Cover', 'state' => 'READY', 'published' => true, 'position' => 0]);
        $video = $property->media()->create(['kind' => 'VIDEO', 'alt' => 'Video', 'state' => 'READY', 'published' => true, 'url' => 'https://www.youtube-nocookie.com/embed/abcdefghijk']);
        $hero = $this->postJson('/api/v1/internal/content', $this->hero($property, $video->id))->assertCreated();
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.media.id', $video->id)->assertJsonMissingPath('data.hero.media.property_id')->assertJsonMissingPath('data.hero.media.staging_path')->assertJsonMissingPath('data.hero.media_id');
        $video->update(['published' => false]);
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.media', null);
        $this->patchJson('/api/v1/internal/content/'.$hero->json('data.id'), $this->hero($property) + ['version' => 1])->assertOk();
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.media', null);
        $this->patchJson('/api/v1/internal/content/'.$hero->json('data.id'), $this->hero($property, $cover->id) + ['version' => 2])->assertOk();
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.media.id', $cover->id);
        $cover->update(['state' => 'ARCHIVED']);
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.media', null);
        $property->update(['publication' => 'DRAFT']);
        $this->getJson('/api/v1/content')->assertJsonPath('data.hero.media', null)->assertJsonPath('data.hero.property_id', null);
    }

    public function test_hero_selection_rejects_wrong_property_kind_state_and_publication(): void
    {
        $this->admin();
        $property = $this->property();
        $other = $this->property();
        foreach ([['kind' => 'PHOTO', 'state' => 'READY', 'published' => true, 'property_id' => $other->id], ['kind' => 'TOUR', 'state' => 'READY', 'published' => true], ['kind' => 'PHOTO', 'state' => 'PROCESSING', 'published' => true], ['kind' => 'PHOTO', 'state' => 'READY', 'published' => false], ['kind' => 'PHOTO', 'state' => 'ARCHIVED', 'published' => true]] as $fields) {
            $media = PropertyMedia::create($fields + ['alt' => 'Fixture', 'property_id' => $property->id]);
            $this->postJson('/api/v1/internal/content', $this->hero($property, $media->id))->assertUnprocessable();
        }
        $media = $property->media()->create(['kind' => 'PHOTO', 'state' => 'READY', 'published' => true, 'alt' => 'Draft property']);
        $property->update(['publication' => 'DRAFT']);
        $this->postJson('/api/v1/internal/content', $this->hero($property, $media->id))->assertUnprocessable();
        $this->assertDatabaseCount('site_contents', 0);
    }

    public function test_partner_logo_is_sanitized_versioned_private_and_revocable(): void
    {
        Storage::fake('media');
        $this->admin();
        $record = $this->postJson('/api/v1/internal/content', $this->partner())->assertCreated()->json('data');
        $id = $record['id'];
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.bank_partners');
        $upload = ['version' => 1, 'verified' => true, 'file' => UploadedFile::fake()->image('logo.png', 600, 200)];
        $result = $this->postJson('/api/v1/internal/content/'.$id.'/logo', $upload)->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.logo_uploaded', true)->assertJsonMissingPath('data.payload._logo');
        $this->getJson('/api/v1/content')->assertJsonPath('data.bank_partners.0.logo_url', '/api/v1/content/'.$id.'/logo')->assertJsonMissingPath('data.bank_partners.0._logo')->assertJsonMissingPath('data.bank_partners.0.updated_by');
        $secret = str_repeat('l', 64);
        config(['operations.proxy_secret' => $secret]);
        $time = (string) now()->timestamp;
        $path = '/api/v1/content/'.$id.'/logo';
        $signature = hash_hmac('sha256', "GET\n".$path."\n".$time."\n203.0.113.20", $secret);
        $response = $this->get($path, ['X-Flamboyan-Client-IP' => '203.0.113.20', 'X-Flamboyan-Proxy-Time' => $time, 'X-Flamboyan-Proxy-Signature' => $signature])->assertOk()->assertHeader('Content-Type', 'image/webp')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->postJson('/api/v1/internal/content/'.$id.'/logo', $upload)->assertConflict();
        $this->assertCount(1, Storage::disk('media')->allFiles('content-logos'));
        $this->patchJson('/api/v1/internal/content/'.$id, $this->partner() + ['version' => 2])->assertOk()->assertJsonPath('data.logo_uploaded', true);
        $this->get('/api/v1/content/'.$id.'/logo')->assertOk();
        $update = $this->partner();
        $update['published'] = false;
        $this->patchJson('/api/v1/internal/content/'.$id, $update + ['version' => 3])->assertOk();
        $this->get('/api/v1/content/'.$id.'/logo')->assertNotFound();
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.bank_partners');
    }

    public function test_logo_replacement_strips_metadata_and_preserves_old_private_file_for_rollback(): void
    {
        Storage::fake('media');
        $this->admin();
        $record = $this->postJson('/api/v1/internal/content', $this->partner())->assertCreated()->json('data');
        $uri = '/api/v1/internal/content/'.$record['id'].'/logo';
        $sourceFile = UploadedFile::fake()->image('logo.jpg', 100, 100);
        $jpeg = file_get_contents($sourceFile->getRealPath());
        $comment = 'Private EXIF-like identifying metadata';
        $jpeg = substr($jpeg, 0, 2)."\xFF\xFE".pack('n', strlen($comment) + 2).$comment.substr($jpeg, 2);
        $this->postJson($uri, ['version' => 1, 'verified' => true, 'file' => UploadedFile::fake()->createWithContent('logo.jpg', $jpeg)])->assertOk();
        $firstPath = SiteContent::findOrFail($record['id'])->payload['_logo']['path'];
        $this->assertStringNotContainsString($comment, Storage::disk('media')->get($firstPath));
        $this->postJson($uri, ['version' => 2, 'verified' => true, 'file' => UploadedFile::fake()->image('replacement.png')])->assertOk()->assertJsonPath('data.version', 3);
        $current = SiteContent::findOrFail($record['id']);
        $this->assertNotSame($firstPath, $current->payload['_logo']['path']);
        Storage::disk('media')->assertExists($firstPath);
        $this->assertCount(2, Storage::disk('media')->allFiles('content-logos'));
        $current->update(['verified_at' => null]);
        $this->get('/api/v1/content/'.$record['id'].'/logo')->assertNotFound();
        $this->getJson('/api/v1/content')->assertJsonCount(0, 'data.bank_partners');
    }

    public function test_logo_validation_role_attestation_and_audit_failure_preserve_state_and_files(): void
    {
        Storage::fake('media');
        $admin = $this->admin();
        $id = $this->postJson('/api/v1/internal/content', $this->partner())->assertCreated()->json('data.id');
        $uri = '/api/v1/internal/content/'.$id.'/logo';
        $this->actingAs(User::factory()->create(['role' => 'MARKETING', 'is_active' => true]));
        $this->postJson($uri, ['version' => 1, 'verified' => true, 'file' => UploadedFile::fake()->image('logo.png')])->assertForbidden();
        $this->actingAs($admin);
        $this->postJson($uri, ['version' => 1, 'file' => UploadedFile::fake()->image('logo.png')])->assertUnprocessable();
        foreach ([UploadedFile::fake()->createWithContent('logo.png', '<svg></svg>'), UploadedFile::fake()->image('huge.png', 2100, 2100), UploadedFile::fake()->create('large.png', 2049, 'image/png')] as $file) {
            $this->postJson($uri, ['version' => 1, 'verified' => true, 'file' => $file])->assertUnprocessable();
        }
        ActivityLog::creating(fn () => throw new \RuntimeException('audit unavailable'));
        try {
            $this->postJson($uri, ['version' => 1, 'verified' => true, 'file' => UploadedFile::fake()->image('logo.png')])->assertStatus(500);
            $this->assertSame(1, SiteContent::findOrFail($id)->version);
            $this->assertCount(0, Storage::disk('media')->allFiles('content-logos'));
        } finally {
            ActivityLog::flushEventListeners();
        }
        $payload = $this->partner();
        $payload['payload']['_logo'] = ['path' => '/etc/passwd'];
        $this->patchJson('/api/v1/internal/content/'.$id, $payload + ['version' => 1])->assertUnprocessable();
    }
}
