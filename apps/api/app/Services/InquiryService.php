<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\LeadHistory;
use App\Models\LeadInquiry;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InquiryService
{
    public function __construct(private GrowthGate $gate) {}

    public function createAttributionToken(array $data): array
    {
        try {
            $ready = $this->gate->ready();
        } catch (QueryException) {
            abort(503, 'Form konsultasi sementara tidak tersedia.');
        }
        abort_unless($ready && config('growth.attribution_enabled'), 503, 'Form konsultasi belum tersedia.');
        $now = now();
        $expires = $now->copy()->addMinutes(config('growth.attribution_ttl_minutes'));
        $payload = [
            'first_touch' => $data['first_touch'],
            'last_touch' => $data['last_touch'],
            'consent' => $data['consent'],
            'issued_at' => $now->timestamp,
            'expires_at' => $expires->timestamp,
            'method' => 'CLIENT_REPORTED',
        ];

        return ['token' => Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR)), 'expires_at' => $expires->toIso8601String()];
    }

    public function intake(array $data, string $idempotencyKey): LeadInquiry
    {
        try {
            $ready = $this->gate->ready();
        } catch (QueryException) {
            abort(503, 'Form konsultasi sementara tidak tersedia.');
        }
        abort_unless($ready, 503, 'Form konsultasi belum tersedia.');
        $keyHash = hash('sha256', $idempotencyKey);
        $payloadHash = hash_hmac('sha256', $this->canonicalJson($data), (string) config('app.key'));
        $existing = LeadInquiry::query()->where('idempotency_key_hash', $keyHash)->first();
        if ($existing) {
            abort_unless(hash_equals($existing->payload_hash, $payloadHash), 409, 'Permintaan tidak dapat diproses dengan kunci tersebut.');

            return $existing;
        }
        $attribution = $this->decodeAttribution($data['attribution_token'] ?? null);
        unset($data['attribution_token']);

        try {
            return DB::transaction(function () use ($data, $attribution, $keyHash, $payloadHash) {
                $existing = LeadInquiry::query()->where('idempotency_key_hash', $keyHash)->lockForUpdate()->first();
                if ($existing) {
                    abort_unless(hash_equals($existing->payload_hash, $payloadHash), 409, 'Permintaan tidak dapat diproses dengan kunci tersebut.');

                    return $existing;
                }
                $eligible = $this->gate->properties(true);
                abort_unless($eligible->has((int) $data['property_id']), 422, 'Pilihan properti tidak tersedia.');
                $inquiry = LeadInquiry::create(array_merge($data, [
                    'receipt' => (string) Str::uuid(),
                    'idempotency_key_hash' => $keyHash,
                    'payload_hash' => $payloadHash,
                ]));
                LeadAttribution::create(array_merge([
                    'inquiry_id' => $inquiry->id,
                    'method' => 'UNKNOWN',
                    'privacy_notice_version' => $inquiry->privacy_notice_version,
                ], $attribution));

                return $inquiry;
            }, 3);
        } catch (UniqueConstraintViolationException) {
            $existing = LeadInquiry::query()->where('idempotency_key_hash', $keyHash)->first();
            abort_unless($existing && hash_equals($existing->payload_hash, $payloadHash), 409, 'Permintaan tidak dapat diproses dengan kunci tersebut.');

            return $existing;
        } catch (QueryException) {
            abort(503, 'Form konsultasi sementara tidak tersedia.');
        }
    }

    public function resolve(User $actor, int $id, array $data): LeadInquiry
    {
        abort_unless($actor->role === 'ADMIN', 403);

        try {
            return DB::transaction(function () use ($actor, $id, $data) {
                $current = User::query()->whereKey($actor->id)->lockForUpdate()->first();
                abort_unless($current?->is_active && $current->role === 'ADMIN', 403);
                $inquiry = LeadInquiry::query()->whereKey($id)->lockForUpdate()->firstOrFail();
                if ($inquiry->state !== 'PENDING') {
                    $sameLead = ($data['lead_id'] ?? null) === null || (int) $data['lead_id'] === (int) $inquiry->lead_id;
                    $sameReason = (string) ($data['reason'] ?? '') === (string) ($inquiry->resolution_reason ?? '');
                    if ($inquiry->resolution_action === $data['action'] && $sameLead && $sameReason) {
                        return $inquiry;
                    }
                    abort(409, 'Permintaan telah diselesaikan.');
                }
                abort_unless($inquiry->version === (int) $data['version'], 409, 'Data sudah berubah. Muat ulang sebelum melanjutkan.');

                $lead = match ($data['action']) {
                    'ACCEPT_NEW' => $this->createLead($current, $inquiry),
                    'LINK_EXISTING' => $this->existingLead($inquiry, (int) $data['lead_id']),
                    'REJECT_SPAM' => null,
                };
                if ($lead) {
                    LeadHistory::create([
                        'lead_id' => $lead->id,
                        'actor_id' => $current->id,
                        'type' => 'INQUIRY_LINKED',
                        'metadata' => ['inquiry_id' => $inquiry->id, 'receipt' => $inquiry->receipt, 'action' => $data['action']],
                    ]);
                    $inquiry->attribution()->update(['lead_id' => $lead->id]);
                }
                $updated = LeadInquiry::query()->whereKey($inquiry->id)->where('version', $data['version'])->where('state', 'PENDING')->update([
                    'lead_id' => $lead?->id,
                    'state' => $data['action'] === 'REJECT_SPAM' ? 'REJECTED_SPAM' : 'RESOLVED',
                    'resolution_action' => $data['action'],
                    'resolution_reason' => $data['reason'] ?? null,
                    'resolved_by' => $current->id,
                    'resolved_at' => now(),
                    'version' => DB::raw('version + 1'),
                    'updated_at' => now(),
                ]);
                abort_unless($updated === 1, 409, 'Data sudah berubah. Muat ulang sebelum melanjutkan.');

                return $inquiry->refresh();
            }, 3);
        } catch (UniqueConstraintViolationException) {
            abort(409, 'Lead sudah tercatat. Tautkan permintaan ke lead existing.');
        }
    }

    private function createLead(User $actor, LeadInquiry $inquiry): Lead
    {
        $lead = Lead::create([
            'name' => $inquiry->name,
            'whatsapp_number' => $inquiry->whatsapp_number,
            'property_id' => $inquiry->property_id,
        ])->refresh();
        LeadHistory::create(['lead_id' => $lead->id, 'actor_id' => $actor->id, 'type' => 'CREATED', 'to_status' => $lead->status]);

        return $lead;
    }

    private function existingLead(LeadInquiry $inquiry, int $leadId): Lead
    {
        $lead = Lead::query()->whereKey($leadId)->lockForUpdate()->firstOrFail();
        abort_unless($lead->property_id === $inquiry->property_id && hash_equals((string) $lead->whatsapp_number, (string) $inquiry->whatsapp_number), 422, 'Lead target harus memiliki nomor dan properti yang sama.');
        abort_if($lead->anonymized_at, 409, 'Lead target telah dianonimkan.');
        $updated = Lead::query()->whereKey($lead->id)->where('version', $lead->version)
            ->update(['version' => DB::raw('version + 1'), 'updated_at' => now()]);
        abort_unless($updated === 1, 409, 'Lead sudah berubah. Muat ulang sebelum melanjutkan.');

        return $lead->refresh();
    }

    private function decodeAttribution(?string $token): array
    {
        if ($token === null) {
            return [];
        }
        abort_unless(config('growth.attribution_enabled'), 422, 'Konteks atribusi tidak dapat digunakan.');
        try {
            $payload = json_decode(Crypt::decryptString($token), true, 16, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            abort(422, 'Konteks atribusi tidak valid.');
        }
        abort_unless(($payload['method'] ?? null) === 'CLIENT_REPORTED' && is_int($payload['expires_at'] ?? null) && $payload['expires_at'] >= now()->timestamp, 422, 'Konteks atribusi tidak valid atau kedaluwarsa.');
        $first = $payload['first_touch'] ?? [];
        $last = $payload['last_touch'] ?? [];
        $consent = $payload['consent'] ?? [];

        return [
            'first_source' => $first['source'] ?? null, 'first_medium' => $first['medium'] ?? null,
            'first_campaign' => $first['campaign'] ?? null, 'first_content' => $first['content'] ?? null,
            'first_term' => $first['term'] ?? null, 'first_captured_at' => $first['captured_at'] ?? null,
            'last_source' => $last['source'] ?? null, 'last_medium' => $last['medium'] ?? null,
            'last_campaign' => $last['campaign'] ?? null, 'last_content' => $last['content'] ?? null,
            'last_term' => $last['term'] ?? null, 'last_captured_at' => $last['captured_at'] ?? null,
            'method' => 'CLIENT_REPORTED', 'analytics_consent' => (bool) ($consent['analytics'] ?? false),
            'marketing_consent' => (bool) ($consent['marketing'] ?? false),
            'consent_version' => (string) ($consent['version'] ?? ''),
            'consent_decided_at' => $consent['decided_at'] ?? null, 'captured_at' => now(),
        ];
    }

    private function canonicalJson(array $data): string
    {
        ksort($data);

        return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
}
