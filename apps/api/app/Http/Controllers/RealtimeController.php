<?php

namespace App\Http\Controllers;

use App\Services\PusherDelivery;
use Illuminate\Http\Request;

class RealtimeController extends Controller
{
    public function configuration(PusherDelivery $provider)
    {
        return ['data' => ['enabled' => $provider->ready(), 'key' => $provider->ready() ? config('realtime.key') : null, 'cluster' => $provider->ready() ? config('realtime.cluster') : null]];
    }

    public function authorize(Request $request, PusherDelivery $provider)
    {
        $data = $request->validate(['socket_id' => 'required|string|max:64|regex:/^[0-9]+\.[0-9]+$/', 'channel_name' => 'required|string|max:100']);
        abort_unless($data['channel_name'] === 'private-users.'.$request->user()->id, 403);

        return ['auth' => $provider->authorize($data['socket_id'], $data['channel_name'])];
    }
}
