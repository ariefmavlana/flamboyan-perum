<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\AccountOperations;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private AccountOperations $accounts) {}

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['q' => 'sometimes|string|max:100', 'role' => ['sometimes', Rule::in(['ADMIN', 'MARKETING'])], 'is_active' => 'sometimes|boolean', 'page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,100']);
        $query = User::query();
        if (! empty($data['q'])) {
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($data['q'])).'%';
            $query->where(fn ($q) => $q->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("LOWER(email) LIKE ? ESCAPE '!'", [$pattern]));
        }
        foreach (['role', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $query->where($field, $data[$field]);
            }
        }

        return JsonResource::collection($query->select(['id', 'name', 'email', 'role', 'is_active', 'version', 'email_verified_at'])->orderBy('id')->paginate($data['per_page'] ?? 20));
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['name' => 'required|string|max:160', 'email' => 'required|email:rfc|max:254', 'role' => ['required', Rule::in(['ADMIN', 'MARKETING'])], 'password' => 'required|string|min:12|max:1024|confirmed', 'identity_verified' => 'sometimes|boolean']);

        return response()->json(['data' => $this->accounts->create($request->user(), $data)], 201);
    }

    public function update(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['version' => 'required|integer|min:1', 'name' => 'sometimes|required|string|max:160', 'email' => 'sometimes|required|email:rfc|max:254', 'role' => ['sometimes', 'required', Rule::in(['ADMIN', 'MARKETING'])], 'is_active' => 'sometimes|required|boolean', 'identity_verified' => 'sometimes|boolean']);
        $user = $this->accounts->update($request->user(), $id, $data);
        if ($id === $request->user()->id && $request->hasSession() && $request->hasAny(['email', 'role', 'is_active'])) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return ['data' => $user];
    }

    public function profile(Request $request)
    {
        $data = $request->validate(['version' => 'required|integer|min:1', 'name' => 'sometimes|required|string|max:160', 'role' => 'prohibited', 'email' => 'prohibited', 'is_active' => 'prohibited', 'password' => 'sometimes|required|string|min:12|max:1024|confirmed', 'current_password' => 'required_with:password|current_password:web']);
        $user = $this->accounts->update($request->user(), $request->user()->id, $data, true);
        if ($request->has('password') && $request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return ['data' => $user];
    }

    public function audit(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['subject_type' => ['sometimes', Rule::in(['USER', 'PROPERTY', 'CONTENT', 'PRIVACY'])], 'subject_id' => 'sometimes|integer|min:1', 'page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,100']);
        $query = ActivityLog::query()->with('actor');
        foreach (['subject_type', 'subject_id'] as $field) {
            if (isset($data[$field])) {
                $query->where($field, $data[$field]);
            }
        }

        return JsonResource::collection($query->orderByDesc('id')->paginate($data['per_page'] ?? 20));
    }
}
