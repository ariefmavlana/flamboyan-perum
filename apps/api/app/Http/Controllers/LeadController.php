<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Services\LeadWorkflow;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function __construct(private LeadWorkflow $workflow) {}

    public function index(Request $request)
    {
        $data = $request->validate(['page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,100', 'q' => 'sometimes|string|max:100', 'assigned_marketing_id' => 'sometimes|integer|min:1', 'unassigned' => 'sometimes|boolean', 'status' => ['sometimes', Rule::enum(LeadStatus::class)]]);
        $query = Lead::query()->visibleTo($request->user())->with(['property', 'assignee']);
        if (! empty($data['q'])) {
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($data['q'])).'%';
            $query->where(fn ($q) => $q->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("whatsapp_number LIKE ? ESCAPE '!'", [$pattern])->orWhereHas('property', fn ($p) => $p->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", [$pattern])));
        }
        if (isset($data['assigned_marketing_id'])) {
            $query->where('assigned_marketing_id', $data['assigned_marketing_id']);
        }
        if ($data['unassigned'] ?? false) {
            $query->whereNull('assigned_marketing_id');
        }
        if (isset($data['status'])) {
            $query->where('status', $data['status']);
        }

        return JsonResource::collection($query->orderByDesc('id')->paginate($data['per_page'] ?? 20));
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $this->normalizePhone($request);
        $data = $request->validate(['name' => 'required|string|max:160', 'whatsapp_number' => 'required|string|regex:/^[1-9][0-9]{7,14}$/', 'property_id' => ['required', 'integer', Rule::exists('properties', 'id')]]);

        return response()->json(['data' => $this->workflow->create($request->user(), $data)], 201);
    }

    public function show(Request $request, int $id)
    {
        return ['data' => Lead::query()->visibleTo($request->user())->with(['property', 'assignee'])->findOrFail($id)];
    }

    public function contact(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $this->normalizePhone($request);
        $data = $request->validate(['version' => 'required|integer|min:1', 'name' => 'required|string|max:160', 'whatsapp_number' => 'required|string|regex:/^[1-9][0-9]{7,14}$/', 'reason' => 'required|string|max:2000']);

        return ['data' => $this->workflow->correctContact($request->user(), $id, $data)];
    }

    private function normalizePhone(Request $request): void
    {
        $raw = $request->input('whatsapp_number');
        if (is_string($raw) && preg_match('/^[+0-9\s()\-]+$/', $raw)) {
            $number = preg_replace('/\D/', '', $raw);
            $request->merge(['whatsapp_number' => str_starts_with($number, '0') ? '62'.substr($number, 1) : $number]);
        }
    }

    public function assign(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate(['version' => 'required|integer|min:1', 'marketing_id' => 'required|integer', 'reason' => 'nullable|string|max:2000']);

        return response()->json(['data' => $this->workflow->assign($request->user(), $id, $data)]);
    }

    public function status(Request $request, int $id)
    {
        Lead::query()->visibleTo($request->user())->findOrFail($id);
        $data = $request->validate(['version' => 'required|integer|min:1', 'status' => ['required', Rule::enum(LeadStatus::class)], 'note' => 'required_if:status,LOST|nullable|string|max:2000']);

        return response()->json(['data' => $this->workflow->transition($request->user(), $id, $data)]);
    }

    public function note(Request $request, int $id)
    {
        Lead::query()->visibleTo($request->user())->findOrFail($id);
        $data = $request->validate(['version' => 'required|integer|min:1', 'note' => 'required|string|max:2000']);

        return response()->json(['data' => $this->workflow->addNote($request->user(), $id, $data)]);
    }

    public function history(Request $request, int $id)
    {
        Lead::query()->visibleTo($request->user())->findOrFail($id);
        $request->validate(['page' => 'sometimes|integer|min:1', 'per_page' => 'sometimes|integer|between:1,100']);

        return JsonResource::collection(LeadHistory::query()->where('lead_id', $id)->with(['actor', 'previousAssignee', 'nextAssignee'])->orderByDesc('created_at')->orderByDesc('id')->paginate($request->integer('per_page', 50)));
    }
}
