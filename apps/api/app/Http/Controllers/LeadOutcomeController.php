<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Services\LeadOutcomeWorkflow;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LeadOutcomeController extends Controller
{
    public function __construct(private LeadOutcomeWorkflow $workflow) {}

    public function show(Request $request, int $id)
    {
        $data = $request->validate(['visits_page' => 'sometimes|integer|min:1|max:100000']);

        return ['data' => $this->workflow->show($request->user(), $id, (int) ($data['visits_page'] ?? 1))];
    }

    public function qualification(Request $request, int $id)
    {
        Lead::query()->visibleTo($request->user())->findOrFail($id);
        $data = $request->validate(['version' => 'required|integer|min:1', 'qualified' => 'required|boolean', 'reason' => 'required|string|max:1000']);

        return ['data' => $this->workflow->qualification($request->user(), $id, $data)];
    }

    public function createVisit(Request $request, int $id)
    {
        Lead::query()->visibleTo($request->user())->findOrFail($id);
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'scheduled_at' => 'nullable|date|after:now|before_or_equal:+180 days',
            'status' => ['required', Rule::in(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])],
            'reason' => 'nullable|string|max:1000',
        ]);

        return response()->json(['data' => $this->workflow->createVisit($request->user(), $id, $data)], 201);
    }

    public function updateVisit(Request $request, int $id, int $visitId)
    {
        Lead::query()->visibleTo($request->user())->findOrFail($id);
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'scheduled_at' => 'nullable|date|before_or_equal:+180 days',
            'status' => ['required', Rule::in(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])],
            'reason' => 'nullable|string|max:1000',
        ]);

        return ['data' => $this->workflow->updateVisit($request->user(), $id, $visitId, $data)];
    }

    public function akad(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate([
            'version' => 'required|integer|min:1', 'confirmed' => 'required|boolean',
            'occurred_at' => 'required_if:confirmed,true|nullable|date|before_or_equal:now',
            'reference' => ['required_if:confirmed,true', 'nullable', 'string', 'max:120', 'regex:/^[A-Za-z0-9][A-Za-z0-9 ._\/-]{1,119}$/'],
            'reason' => 'required_if:confirmed,false|nullable|string|max:1000',
        ]);
        if (! empty($data['reference']) && preg_match('/@|\d{7}/', $data['reference'])) {
            throw ValidationException::withMessages(['reference' => 'Referensi tidak boleh memuat data pribadi.']);
        }

        return ['data' => $this->workflow->akad($request->user(), $id, $data)];
    }

    public function attribution(Request $request, int $id)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'source' => ['required', 'string', 'max:120', 'regex:/^[a-z][a-z0-9_-]{0,119}$/'],
            'medium' => ['required', 'string', 'max:120', 'regex:/^[a-z][a-z0-9_-]{0,119}$/'],
            'campaign' => ['required', 'string', 'max:120', 'regex:/^[a-z][a-z0-9_-]{0,119}$/'],
            'content' => ['nullable', 'string', 'max:120', 'regex:/^[a-z][a-z0-9_-]{0,119}$/'],
            'term' => ['nullable', 'string', 'max:120', 'regex:/^[\p{L}\p{N} _.,\/-]+$/u'],
            'reason' => 'required|string|max:1000',
        ]);
        foreach (['source', 'medium', 'campaign', 'content', 'term'] as $field) {
            if (isset($data[$field]) && preg_match('/@|\d{7}/', $data[$field])) {
                throw ValidationException::withMessages([$field => 'Nilai tidak boleh memuat data pribadi.']);
            }
        }

        return ['data' => $this->workflow->attribution($request->user(), $id, $data)];
    }
}
