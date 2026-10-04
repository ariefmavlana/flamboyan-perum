<?php

namespace Database\Seeders;

use App\Enums\LeadStatus;
use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\SiteContent;
use App\Models\User;
use App\Services\LeadWorkflow;
use App\Services\MediaOperations;
use Carbon\CarbonImmutable;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing']) || ! in_array(config('app.env'), ['local', 'testing'], true)) {
            throw new \RuntimeException('Demo seed dilarang di luar local/testing.');
        }
        $password = (string) config('demo.password', '');
        if (strlen($password) < 12) {
            throw new \RuntimeException('DEMO_PASSWORD minimal 12 karakter harus diberikan secara eksplisit.');
        }
        $properties = $this->count('properties', 6, 100);
        $leads = $this->count('leads', 6, 500);
        $marketing = $this->count('marketing', 1, 10);
        if (config('demo.media') && (! function_exists('imagepng') || ! function_exists('imagewebp'))) {
            throw new \RuntimeException('GD PNG/WebP diperlukan untuk media demo.');
        }
        $clock = Date::getTestNow();
        $realtime = config('realtime.enabled');
        $paths = [];
        try {
            config(['realtime.enabled' => false]);
            DB::transaction(function () use ($password, $properties, $leads, $marketing, &$paths) {
                foreach (['users', 'properties', 'leads', 'site_contents', 'property_media', 'activity_logs', 'user_notifications', 'jobs'] as $table) {
                    if (DB::table($table)->exists()) {
                        throw new \RuntimeException('Demo seed membutuhkan database domain kosong; data yang ada tidak diubah.');
                    }
                }
                $faker = Factory::create('id_ID');
                $now = CarbonImmutable::instance(now())->utc();
                $admin = User::forceCreate(['email' => 'admin@example.test', 'name' => 'Admin Demo '.$faker->firstName(), 'role' => 'ADMIN', 'is_active' => true, 'email_verified_at' => $now, 'password' => $password]);
                $team = collect();
                for ($i = 0; $i < $marketing; $i++) {
                    $team->push(User::forceCreate(['email' => ($i === 0 ? 'marketing' : 'marketing-'.($i + 1)).'@example.test', 'name' => 'Marketing Demo '.$faker->name(), 'role' => 'MARKETING', 'is_active' => true, 'email_verified_at' => $now, 'password' => $password]));
                }
                $catalog = collect();
                for ($i = 0; $i < $properties; $i++) {
                    $area = $faker->randomFloat(2, 72, 300);
                    $building = $faker->randomFloat(2, 36, min(180, $area));
                    $property = Property::create(['owner_id' => $team[$i % $marketing]->id, 'slug' => 'demo-'.Str::lower(Str::random(16)), 'title' => 'Rumah Demo '.$faker->streetName().' '.Str::upper(Str::random(4)), 'house_type' => 'Tipe '.(int) $building, 'condition' => $faker->randomElement(['NEW', 'RESALE']), 'certificate' => $faker->randomElement(['SHM', 'HGB']).' (demo)', 'location' => 'Bandung Timur (demo)', 'address' => 'Bandung Timur — alamat ilustrasi demo; titik lokasi belum diverifikasi.', 'description' => 'DATA DEMO — bukan penawaran properti nyata. '.$faker->paragraph(3), 'price_idr' => $faker->numberBetween(500, 3000) * 1000000, 'land_area' => $area, 'building_area' => $building, 'bedrooms' => $faker->numberBetween(2, 5), 'bathrooms' => $faker->numberBetween(1, 3), 'publication' => $i % 6 === 4 ? 'DRAFT' : ($i % 6 === 5 ? 'ARCHIVED' : 'PUBLISHED'), 'availability' => ['AVAILABLE', 'BOOKED', 'SOLD_OUT'][$i % 3], 'featured' => $i % 3 === 0]);
                    ActivityLog::create(['actor_id' => $admin->id, 'subject_type' => 'PROPERTY', 'subject_id' => $property->id, 'action' => 'CREATED', 'changes' => ['demo' => true]]);
                    $catalog->push($property);
                    if (config('demo.media')) {
                        foreach (['PHOTO', 'FLOOR_PLAN'] as $kind) {
                            $file = $this->illustration($kind);
                            try {
                                $result = app(MediaOperations::class)->create($admin, $property->id, ['version' => $property->fresh()->version, 'kind' => $kind, 'alt' => 'Ilustrasi sintetis '.$kind.' — '.$property->title], new UploadedFile($file, 'demo.png', 'image/png', null, true));
                                $paths[] = $result['data']->staging_path;
                            } finally {
                                @unlink($file);
                            }
                        }
                    }
                }
                $workflow = app(LeadWorkflow::class);
                $phones = [];
                for ($i = 0; $i < $leads; $i++) {
                    Date::setTestNow($now->subDays($faker->numberBetween(2, 28))->subMinutes($faker->numberBetween(1, 1440)));
                    do {
                        $phone = '628000'.str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT);
                    } while (isset($phones[$phone]));
                    $phones[$phone] = true;
                    $lead = $workflow->create($admin, ['name' => 'Prospek Demo '.$faker->name(), 'whatsapp_number' => $phone, 'property_id' => $catalog->random()->id]);
                    $target = LeadStatus::cases()[$i % 6];
                    if ($target === LeadStatus::NewLead && $i % 12 === 0) {
                        continue;
                    }
                    $actor = $team->random();
                    Date::setTestNow(now()->addMinutes($faker->numberBetween(15, 180)));
                    $lead = $workflow->assign($admin, $lead->id, ['marketing_id' => $actor->id, 'version' => $lead->version, 'reason' => 'Penugasan dataset demo']);
                    foreach ([LeadStatus::FollowedUp, LeadStatus::Survey, LeadStatus::Documentation, LeadStatus::Deal] as $stage) {
                        if ($target === LeadStatus::NewLead || $target === LeadStatus::Lost) {
                            break;
                        }
                        Date::setTestNow(now()->addMinutes($faker->numberBetween(30, 240)));
                        $lead = $workflow->transition($actor, $lead->id, ['status' => $stage->value, 'version' => $lead->version, 'note' => 'Skenario demo '.$faker->sentence()]);
                        if ($stage === $target) {
                            break;
                        }
                    }
                    if ($target === LeadStatus::Lost) {
                        Date::setTestNow(now()->addHour());
                        $lead = $workflow->transition($actor, $lead->id, ['status' => $target->value, 'version' => $lead->version, 'note' => 'Alasan demo: '.$faker->sentence()]);
                    }
                    $workflow->addNote($actor, $lead->id, ['version' => $lead->version, 'note' => 'Catatan sintetis: '.$faker->sentence()]);
                }
                Date::setTestNow($now);
                $this->content($admin, 'HERO', ['title' => 'Jelajahi rumah demo '.$faker->city(), 'description' => 'Dataset sintetis yang dapat dikelola melalui aplikasi. Bukan penawaran nyata. '.$faker->sentence(), 'eyebrow' => 'DEMO · DATA SINTETIS', 'property_id' => $catalog->firstWhere('publication', 'PUBLISHED')->id]);
                for ($i = 0; $i < 3; $i++) {
                    $this->content($admin, 'TESTIMONIAL', ['name' => 'Persona Demo '.$faker->name(), 'quote' => 'Contoh sintetis, bukan testimonial pelanggan. '.$faker->sentence(), 'context' => 'DEMO — tidak mewakili pengalaman pelanggan']);
                    $this->content($admin, 'BANK_RATE', ['bank' => 'Bank Simulasi Demo '.Str::upper(Str::random(4)), 'product' => 'Skenario sintetis, bukan produk bank', 'annual_rate' => $faker->randomFloat(2, 4, 12), 'effective_date' => $now->subDays(3)->toDateString(), 'valid_until' => $now->addDays(30)->toDateString(), 'fixed_months' => $faker->numberBetween(1, 5) * 12, 'source_url' => 'https://example.com/?demo='.Str::lower(Str::random(12))]);
                }
            });
        } catch (\Throwable $error) {
            foreach ($paths as $path) {
                Storage::disk('media')->delete($path);
            }
            throw $error;
        } finally {
            Date::setTestNow($clock);
            config(['realtime.enabled' => $realtime]);
        }
    }

    private function count(string $key, int $min, int $max): int
    {
        $value = filter_var(config('demo.'.$key), FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]);
        if ($value === false) {
            throw new \RuntimeException('Batas DEMO_'.$key.' harus '.$min.'..'.$max.'.');
        }

        return $value;
    }

    private function content(User $admin, string $kind, array $payload): void
    {
        $content = SiteContent::create(['kind' => $kind, 'payload' => $payload, 'published' => true, 'position' => SiteContent::where('kind', $kind)->count(), 'verified_by' => $admin->id, 'verified_at' => now(), 'updated_by' => $admin->id, 'effective_date' => $payload['effective_date'] ?? null, 'valid_until' => $payload['valid_until'] ?? null]);
        ActivityLog::create(['actor_id' => $admin->id, 'subject_type' => 'CONTENT', 'subject_id' => $content->id, 'action' => 'CREATED', 'changes' => ['demo' => true, 'kind' => $kind]]);
    }

    private function illustration(string $kind): string
    {
        $path = tempnam(sys_get_temp_dir(), 'flamboyan-demo-');
        $image = imagecreatetruecolor(960, 640);
        try {
            $background = imagecolorallocate($image, random_int(220, 245), random_int(220, 245), random_int(220, 245));
            $ink = imagecolorallocate($image, random_int(20, 70), random_int(45, 95), random_int(60, 110));
            imagefill($image, 0, 0, $background);
            if ($kind === 'PHOTO') {
                $width = random_int(400, 680);
                imagefilledrectangle($image, 150, 240, 150 + $width, 520, $ink);
                imagefilledpolygon($image, [120, 240, 150 + (int) ($width / 2), random_int(90, 170), 180 + $width, 240], $ink);
                for ($x = 220; $x < 150 + $width - 80; $x += 130) {
                    imagefilledrectangle($image, $x, 310, $x + 70, 400, $background);
                }
            } else {
                imagerectangle($image, 140, 120, 820, 530, $ink);
                for ($x = 300; $x < 820; $x += random_int(130, 180)) {
                    imageline($image, $x, 120, $x, 530, $ink);
                }
                imageline($image, 140, random_int(270, 340), 820, 320, $ink);
            }
            imagestring($image, 5, 30, 590, 'DEMO - ILUSTRASI SINTETIS '.strtoupper(Str::random(10)), $ink);
            if (! imagepng($image, $path)) {
                throw new \RuntimeException('Gagal membuat ilustrasi demo.');
            }

            return $path;
        } catch (\Throwable $error) {
            @unlink($path);
            throw $error;
        } finally {
            unset($image);
        }
    }
}
