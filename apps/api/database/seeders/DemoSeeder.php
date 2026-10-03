<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use App\Services\LeadWorkflow;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing']) || ! in_array(config('app.env'), ['local', 'testing'], true)) {
            throw new \RuntimeException('Demo seed dilarang di luar local/testing.');
        }
        $password = (string) env('DEMO_PASSWORD', '');
        if (strlen($password) < 12) {
            throw new \RuntimeException('DEMO_PASSWORD minimal 12 karakter harus diberikan secara eksplisit.');
        }
        DB::transaction(function () use ($password) {
            $admin = User::firstOrNew(['email' => 'admin@example.test']);
            $admin->forceFill(['name' => 'Admin Demo', 'role' => 'ADMIN', 'is_active' => true, 'password' => $password])->save();
            $marketing = User::firstOrNew(['email' => 'marketing@example.test']);
            $marketing->forceFill(['name' => 'Marketing Demo', 'role' => 'MARKETING', 'is_active' => true, 'password' => $password])->save();
            $property = Property::firstOrCreate(['slug' => 'rumah-taman-demo'], [
                'owner_id' => $marketing->id, 'title' => 'Rumah Taman — Demo', 'house_type' => 'Tipe 60', 'condition' => 'NEW', 'certificate' => 'SHM (contoh)',
                'location' => 'Bogor (contoh)', 'address' => 'Alamat contoh untuk pengujian', 'description' => 'Data demonstrasi, bukan penawaran properti nyata. Rumah dengan tiga kamar dan halaman untuk membantu pengujian katalog.',
                'price_idr' => 850000000, 'land_area' => 90, 'building_area' => 60, 'bedrooms' => 3, 'bathrooms' => 2, 'publication' => 'PUBLISHED', 'availability' => 'AVAILABLE', 'featured' => true,
            ]);
            if (! Lead::where('property_id', $property->id)->where('whatsapp_number', '628000000000')->exists()) {
                $workflow = app(LeadWorkflow::class);
                $lead = $workflow->create($admin, ['name' => 'Prospek Demo', 'whatsapp_number' => '628000000000', 'property_id' => $property->id]);
                $workflow->assign($admin, $lead->id, ['marketing_id' => $marketing->id, 'version' => 1, 'reason' => 'Assignment demo']);
            }
        });
    }
}
