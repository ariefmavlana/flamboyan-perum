<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,100']);
        $query = UserNotification::query()->where('recipient_id', $request->user()->id);
        $unread = (clone $query)->whereNull('read_at')->count();
        $paginator = $query->orderByDesc('created_at')->orderByDesc('id')->paginate($request->integer('per_page', 20));

        return JsonResource::collection($paginator)->additional(['unread_count' => $unread]);
    }

    public function read(Request $request, string $id)
    {
        $notification = UserNotification::query()->where('recipient_id', $request->user()->id)->findOrFail($id);
        UserNotification::query()->whereKey($id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['data' => $notification->refresh()]);
    }
}
