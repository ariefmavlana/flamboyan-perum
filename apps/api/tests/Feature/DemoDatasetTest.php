<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Property;
use App\Models\PropertyMedia;
use App\Models\SiteContent;
use App\Models\User;
use App\Services\MediaProcessor;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DemoDatasetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['demo.password' => 'Generated-dataset-test-only', 'demo.properties' => 6, 'demo.leads' => 12, 'demo.marketing' => 2, 'demo.media' => false, 'realtime.enabled' => false]);
        Storage::fake('media');
    }

    public function test_generated_database_data_has_real_workflows_and_api_edits_persist(): void
    {
        $this->seed(DemoSeeder::class);
        $this->assertDatabaseCount('properties', 6);
        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('leads', 12);
        $this->assertDatabaseCount('site_contents', 7);
        $this->assertSame(6, Lead::distinct()->count('status'));
        $this->assertSame(6, Property::distinct()->count('slug'));
        $this->assertGreaterThan(1, Property::distinct()->count('price_idr'));
        $this->assertGreaterThan(12, DB::table('lead_histories')->count());
        $this->assertGreaterThan(0, DB::table('user_notifications')->count());
        $this->assertSame(0, DB::table('jobs')->where('queue', 'notifications')->count());
        $admin = User::where('role', 'ADMIN')->firstOrFail();
        $this->assertTrue(Hash::check('Generated-dataset-test-only', $admin->password));
        $property = Property::where('publication', 'PUBLISHED')->firstOrFail();
        $original = $this->getJson('/api/v1/properties/'.$property->slug)->assertOk()->json('data');
        $this->actingAs($admin)->patchJson('/api/v1/internal/properties/'.$property->id, ['version' => $property->version, 'title' => 'Demo diubah melalui API', 'price_idr' => 975000000])->assertOk();
        $this->getJson('/api/v1/properties/'.$property->slug)->assertOk()->assertJsonPath('data.title', 'Demo diubah melalui API')->assertJsonPath('data.price_idr', '975000000')->assertJsonMissingPath('data.owner_id');
        $this->assertSame('Demo diubah melalui API', $property->fresh()->title);
        $this->assertNotSame('Demo diubah melalui API', $original['title']);
        $this->getJson('/api/v1/internal/reports')->assertOk()->assertJsonPath('data.cohort_size', 12);
    }

    public function test_existing_domain_data_is_never_overwritten_on_second_seed(): void
    {
        $this->seed(DemoSeeder::class);
        $before = Property::orderBy('id')->get()->toJson();
        try {
            (new DemoSeeder)->run();
            $this->fail('Second seed must refuse existing data');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('database domain kosong', $error->getMessage());
        }
        $this->assertSame($before, Property::orderBy('id')->get()->toJson());
        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('leads', 12);
    }

    public function test_media_is_generated_and_processed_by_native_pipeline(): void
    {
        config(['demo.media' => true]);
        $this->seed(DemoSeeder::class);
        $this->assertDatabaseCount('property_media', 12);
        $this->assertDatabaseCount('jobs', 12);
        $hashes = PropertyMedia::where('kind', 'PHOTO')->get()->map(fn ($media) => hash('sha256', Storage::disk('media')->get($media->staging_path)));
        $this->assertSame(6, $hashes->unique()->count());
        foreach (PropertyMedia::all() as $media) {
            app(MediaProcessor::class)->process($media->id);
        }
        $this->assertSame(12, PropertyMedia::where('state', 'READY')->count());
        $property = Property::where('publication', 'PUBLISHED')->firstOrFail();
        $resource = $this->getJson('/api/v1/properties/'.$property->slug)->assertOk()->assertJsonCount(2, 'data.media');
        $this->get($resource->json('data.media.0.sources.0.url'))->assertOk()->assertHeader('Content-Type', 'image/webp');
    }

    public function test_late_seed_failure_rolls_back_rows_jobs_files_and_clock(): void
    {
        $this->freezeTime();
        $before = now()->toIso8601String();
        config(['demo.media' => true, 'realtime.enabled' => true]);
        SiteContent::creating(fn () => throw new \RuntimeException('Seed fault injection'));
        try {
            try {
                (new DemoSeeder)->run();
                $this->fail('Fault must abort seed');
            } catch (\RuntimeException $error) {
                $this->assertSame('Seed fault injection', $error->getMessage());
            }
            foreach (['users', 'properties', 'leads', 'lead_histories', 'property_media', 'user_notifications', 'jobs', 'activity_logs'] as $table) {
                $this->assertDatabaseCount($table, 0);
            }
            $this->assertSame([], Storage::disk('media')->allFiles());
            $this->assertSame($before, now()->toIso8601String());
            $this->assertTrue(config('realtime.enabled'));
        } finally {
            SiteContent::flushEventListeners();
        }
    }

    public function test_invalid_count_password_and_staging_are_rejected_before_writes(): void
    {
        foreach ([['demo.properties' => 101], ['demo.leads' => 0], ['demo.marketing' => 11], ['app.env' => 'staging']] as $invalid) {
            config(['demo.properties' => 6, 'demo.leads' => 12, 'demo.marketing' => 2, 'app.env' => 'testing']);
            config($invalid);
            try {
                (new DemoSeeder)->run();
                $this->fail('Invalid configuration must abort');
            } catch (\RuntimeException) {
                $this->assertDatabaseCount('users', 0);
            }
        }
        config(['app.env' => 'testing']);
        config(['demo.password' => 'short']);
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }
}
