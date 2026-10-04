<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AnalyticsController extends Controller
{
    public function store(Request $request)
    {
        abort_unless(config('privacy.analytics_enabled'), 503);
        abort_if(array_diff(array_keys($request->all()), ['property_id', 'event']), 422, 'Field tidak diizinkan.');
        $data = $request->validate(['property_id' => 'required|integer|min:1', 'event' => ['required', Rule::in(['property_view', 'whatsapp_click'])]]);
        Property::query()->where('publication', 'PUBLISHED')->findOrFail($data['property_id']);
        $key = ['property_id' => $data['property_id'], 'day' => now('Asia/Jakarta')->toDateString(), 'event' => $data['event']];
        DB::transaction(function () use ($key) {
            DB::table('property_event_totals')->insertOrIgnore(array_merge($key, ['total' => 0]));
            DB::table('property_event_totals')->where($key)->increment('total');
        }, 3);

        return response()->json(['accepted' => true], 202);
    }
}
