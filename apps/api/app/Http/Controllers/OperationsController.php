<?php

namespace App\Http\Controllers;

use App\Services\OperationalHealth;
use Illuminate\Http\Request;

class OperationsController extends Controller
{
    public function readiness(OperationalHealth $health)
    {
        $ready = $health->snapshot()['ready'];

        return response()->json(['status' => $ready ? 'ready' : 'not_ready'], $ready ? 200 : 503)->header('Cache-Control', 'no-store, private');
    }

    public function metrics(Request $request, OperationalHealth $health)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);

        return ['data' => $health->snapshot()];
    }
}
