<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommercialController extends Controller
{
    public function update(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate([
            'version' => 'required|integer|min:1', 'verified' => 'required|accepted',
            'offer_price_idr' => 'present|nullable|integer|between:1,1000000000000',
            'offer_start' => 'present|nullable|date_format:Y-m-d|required_with:offer_price_idr',
            'offer_end' => 'present|nullable|date_format:Y-m-d|required_with:offer_price_idr|after_or_equal:offer_start',
            'next_price_idr' => 'present|nullable|integer|between:1,1000000000000',
            'next_price_start' => 'present|nullable|date_format:Y-m-d|required_with:next_price_idr',
            'commercial' => 'required|array:floors,lot_dimensions,planned_units,features,source_name,source_date,notes,program_fee_idr,program_fee_start,program_fee_until,next_fee_idr,next_fee_start,fee_notes,payment_plans',
            'commercial.floors' => 'required|integer|between:1,20',
            'commercial.lot_dimensions' => 'required|string|max:80',
            'commercial.planned_units' => 'required|integer|between:1,100000',
            'commercial.features' => 'present|array|max:20', 'commercial.features.*' => 'required|string|max:200',
            'commercial.source_name' => 'required|string|max:200', 'commercial.source_date' => 'required|date_format:Y-m-d|before_or_equal:'.now('Asia/Jakarta')->toDateString(),
            'commercial.notes' => 'required|string|max:2000', 'commercial.fee_notes' => 'required|string|max:1500',
            'commercial.program_fee_idr' => 'present|nullable|integer|between:0,1000000000000',
            'commercial.program_fee_start' => 'present|nullable|date_format:Y-m-d|required_with:commercial.program_fee_idr',
            'commercial.program_fee_until' => 'present|nullable|date_format:Y-m-d|required_with:commercial.program_fee_idr|after_or_equal:commercial.program_fee_start',
            'commercial.next_fee_idr' => 'present|nullable|integer|between:0,1000000000000',
            'commercial.next_fee_start' => 'present|nullable|date_format:Y-m-d|required_with:commercial.next_fee_idr',
            'commercial.payment_plans' => 'present|array|max:8',
            'commercial.payment_plans.*' => 'array:title,kind,upfront_idr,months,monthly_idr,total_idr,valid_from,valid_until,quota,source_name,notes',
            'commercial.payment_plans.*.title' => 'required|string|max:120',
            'commercial.payment_plans.*.kind' => 'required|in:CASH,INSTALLMENT',
            'commercial.payment_plans.*.upfront_idr' => 'required|integer|between:0,1000000000000',
            'commercial.payment_plans.*.months' => 'required|integer|between:0,360',
            'commercial.payment_plans.*.monthly_idr' => 'required|integer|between:0,1000000000000',
            'commercial.payment_plans.*.total_idr' => 'required|integer|between:1,1000000000000',
            'commercial.payment_plans.*.valid_from' => 'required|date_format:Y-m-d',
            'commercial.payment_plans.*.valid_until' => 'required|date_format:Y-m-d|after_or_equal:commercial.payment_plans.*.valid_from',
            'commercial.payment_plans.*.quota' => 'required|integer|between:1,100000',
            'commercial.payment_plans.*.source_name' => 'required|string|max:200',
            'commercial.payment_plans.*.notes' => 'required|string|max:1000',
        ]);
        if (($data['next_price_idr'] !== null && $data['offer_price_idr'] !== null && $data['next_price_start'] <= $data['offer_end']) || ($data['commercial']['next_fee_idr'] !== null && $data['commercial']['program_fee_idr'] !== null && $data['commercial']['next_fee_start'] <= $data['commercial']['program_fee_until'])) {
            throw ValidationException::withMessages(['next_price_start' => 'Periode berikutnya harus dimulai setelah program berakhir.']);
        }
        foreach ($data['commercial']['payment_plans'] as $index => $plan) {
            if ((int) $plan['upfront_idr'] + (int) $plan['months'] * (int) $plan['monthly_idr'] !== (int) $plan['total_idr'] || ($plan['kind'] === 'CASH' && ($plan['months'] != 0 || $plan['monthly_idr'] != 0)) || ($plan['kind'] === 'INSTALLMENT' && $plan['months'] < 1)) {
                throw ValidationException::withMessages(["commercial.payment_plans.$index.total_idr" => 'Total harus sama dengan pembayaran awal + jumlah bulan × angsuran.']);
            }
        }

        return DB::transaction(function () use ($request, $id, $data) {
            $actor = User::query()->whereKey($request->user()->id)->lockForUpdate()->first();
            abort_unless($actor?->is_active && $actor->role === 'ADMIN', 403);
            $property = Property::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            $data['commercial']['_verified_at'] = now()->toIso8601String();
            $version = $data['version'];
            unset($data['version'], $data['verified']);
            $data['commercial'] = json_encode($data['commercial'], JSON_THROW_ON_ERROR);
            $count = Property::query()->whereKey($id)->where('version', $version)->update($data + ['version' => DB::raw('version + 1'), 'updated_at' => now()]);
            abort_unless($count === 1, 409, 'Data berubah. Muat ulang dan tinjau sumber kembali.');
            ActivityLog::create(['actor_id' => $actor->id, 'subject_type' => 'PROPERTY', 'subject_id' => $id, 'action' => 'COMMERCIAL_UPDATED', 'changes' => ['fields' => array_keys($data), 'source_name' => $property->fresh()->commercial['source_name']]]);

            return ['data' => $property->refresh()->load('owner')];
        }, 3);
    }
}
