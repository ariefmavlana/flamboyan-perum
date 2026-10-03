<?php

use App\Models\User;
use App\Services\LeadReport;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Synthetic isolated local acceptance fixture; never a production seeder.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$driver = config('database.default');
$database = (string) config('database.connections.'.$driver.'.database');
$fixture = realpath(__DIR__.'/../../../../.tools/acceptance-load.sqlite');
$sqlite = $driver === 'sqlite' && $fixture !== false && realpath($database) === $fixture;
$postgres = $driver === 'pgsql' && $database === 'flamboyan_load_acceptance' && config('database.connections.pgsql.host') === '127.0.0.1' && (string) config('database.connections.pgsql.port') === '54329';
if (! app()->environment('local') || (! $sqlite && ! $postgres)) {
    throw new RuntimeException('Use only explicitly isolated local acceptance databases.');
}
if (DB::table('properties')->exists()) {
    throw new RuntimeException('Fixture must be empty; no overwrite/drop is performed.');
}
$owner = User::forceCreate(['name' => 'Synthetic Load Owner', 'email' => 'load-owner@example.test', 'password' => bin2hex(random_bytes(32)), 'role' => 'MARKETING', 'is_active' => false]);
$time = now()->subDays(10)->toDateTimeString();
DB::transaction(function () use ($owner, $time) {
    for ($start = 1; $start <= 10000; $start += 500) {
        $batch = [];
        for ($id = $start; $id < $start + 500; $id++) {
            $batch[] = ['id' => $id, 'owner_id' => $owner->id, 'slug' => 'load-fixture-'.$id, 'title' => 'Load Fixture '.$id, 'house_type' => '60', 'condition' => 'NEW', 'certificate' => 'SHM', 'location' => 'Synthetic fixture', 'address' => 'Synthetic fixture only', 'description' => 'Local load acceptance; not a real offer.', 'price_idr' => 800000000 + $id * 1000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED', 'availability' => 'AVAILABLE', 'featured' => false, 'version' => 1, 'created_at' => $time, 'updated_at' => $time];
        }
        DB::table('properties')->insert($batch);
    }
    $statuses = ['NEW_LEAD', 'FOLLOWED_UP', 'SURVEY_LOKASI', 'PEMBERKASAN_KPR', 'DEAL', 'LOST'];
    for ($start = 1; $start <= 50000; $start += 500) {
        $leads = $history = [];
        for ($id = $start; $id < $start + 500; $id++) {
            $followed = ! in_array($statuses[$id % 6], ['NEW_LEAD', 'LOST'], true);
            $leads[] = ['id' => $id, 'name' => 'Synthetic Contact '.$id, 'whatsapp_number' => '6284'.str_pad((string) $id, 8, '0', STR_PAD_LEFT), 'property_id' => ($id - 1) % 10000 + 1, 'assigned_marketing_id' => $owner->id, 'status' => $statuses[$id % 6], 'version' => 1, 'assigned_at' => $time, 'first_followed_up_at' => $followed ? CarbonImmutable::parse($time, 'UTC')->addHours(2)->toDateTimeString() : null, 'created_at' => $time, 'updated_at' => $time];
            if ($followed) {
                $history[] = ['lead_id' => $id, 'actor_id' => $owner->id, 'type' => 'STATUS_CHANGED', 'to_status' => 'FOLLOWED_UP', 'created_at' => $time];
            }
        }
        DB::table('leads')->insert($leads);
        if ($history) {
            DB::table('lead_histories')->insert($history);
        }
    }
});
$started = hrtime(true);
$report = app(LeadReport::class)->build(CarbonImmutable::now('Asia/Jakarta')->subDays(29)->startOfDay(), CarbonImmutable::now('Asia/Jakarta')->startOfDay(), null);
echo json_encode(['properties' => DB::table('properties')->count(), 'leads' => DB::table('leads')->count(), 'report_cohort' => $report['cohort_size'], 'report_ms' => round((hrtime(true) - $started) / 1000000, 2), 'report_median_seconds' => $report['follow_up']['median_seconds']], JSON_THROW_ON_ERROR).PHP_EOL;
