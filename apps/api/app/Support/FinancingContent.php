<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class FinancingContent
{
    public static function rules(): array
    {
        return [
            'payload' => 'array:bank,product,annual_rate,effective_date,valid_until,fixed_months,source_url,floating_rate,min_tenor_months,max_tenor_months,checked_date,conditions,phases,provision_percent,admin_percent,admin_min_idr,admin_max_idr,appraisal_min_idr,appraisal_max_idr,min_principal_idr,max_principal_idr,max_ltv_percent',
            'payload.bank' => 'required|string|max:120', 'payload.product' => 'required|string|max:160',
            'payload.annual_rate' => 'required|numeric|between:0,30',
            'payload.effective_date' => 'required|date_format:Y-m-d', 'payload.valid_until' => 'required|date_format:Y-m-d|after_or_equal:payload.effective_date',
            'payload.fixed_months' => 'required|integer|between:1,360', 'payload.source_url' => 'required|url:https|max:2048',
            'payload.floating_rate' => 'sometimes|required|numeric|between:0,30',
            'payload.min_tenor_months' => 'sometimes|required|integer|between:12,360',
            'payload.max_tenor_months' => 'sometimes|required|integer|between:12,360',
            'payload.checked_date' => 'sometimes|required|date_format:Y-m-d|before_or_equal:'.now('Asia/Jakarta')->toDateString(),
            'payload.conditions' => 'sometimes|required|string|max:2500',
            'payload.min_principal_idr' => 'sometimes|required|integer|between:0,1000000000000',
            'payload.max_principal_idr' => 'sometimes|required|integer|between:1,1000000000000',
            'payload.max_ltv_percent' => 'sometimes|required|numeric|between:0.01,100',
            'payload.phases' => 'sometimes|array|min:1|max:10', 'payload.phases.*' => 'array:months,annual_rate',
            'payload.phases.*.months' => 'required|integer|between:1,360', 'payload.phases.*.annual_rate' => 'required|numeric|between:0,30',
            'payload.provision_percent' => 'sometimes|required|numeric|between:0,10',
            'payload.admin_percent' => 'sometimes|required|numeric|between:0,10',
            'payload.admin_min_idr' => 'sometimes|required|integer|between:0,1000000000000',
            'payload.admin_max_idr' => 'sometimes|required|integer|between:0,1000000000000',
            'payload.appraisal_min_idr' => 'sometimes|required|integer|between:0,1000000000000',
            'payload.appraisal_max_idr' => 'sometimes|required|integer|between:0,1000000000000',
        ];
    }

    public static function validate(array $payload): void
    {
        foreach ([['min_tenor_months', 'max_tenor_months'], ['min_principal_idr', 'max_principal_idr'], ['admin_min_idr', 'admin_max_idr'], ['appraisal_min_idr', 'appraisal_max_idr']] as [$min, $max]) {
            if (isset($payload[$min], $payload[$max]) && $payload[$min] > $payload[$max]) {
                throw ValidationException::withMessages(['payload.'.$max => 'Batas maksimum harus lebih besar atau sama dengan minimum.']);
            }
        }
        $phases = $payload['phases'] ?? null;
        if ($phases && (array_sum(array_column($phases, 'months')) !== (int) $payload['fixed_months'] || (float) $phases[0]['annual_rate'] !== (float) $payload['annual_rate'])) {
            throw ValidationException::withMessages(['payload.phases' => 'Jumlah bulan tahapan harus sama dengan masa fixed dan bunga pertama harus sama dengan bunga awal.']);
        }
        if (isset($payload['max_tenor_months']) && $payload['fixed_months'] > $payload['max_tenor_months']) {
            throw ValidationException::withMessages(['payload.fixed_months' => 'Masa fixed tidak boleh melebihi tenor maksimum.']);
        }
    }

    public static function normalize(array $payload): array
    {
        foreach (['annual_rate', 'floating_rate', 'provision_percent', 'admin_percent', 'max_ltv_percent'] as $field) {
            if (isset($payload[$field])) {
                $payload[$field] = (float) $payload[$field];
            }
        }
        foreach (['fixed_months', 'min_tenor_months', 'max_tenor_months', 'admin_min_idr', 'admin_max_idr', 'appraisal_min_idr', 'appraisal_max_idr', 'min_principal_idr', 'max_principal_idr'] as $field) {
            if (isset($payload[$field])) {
                $payload[$field] = (int) $payload[$field];
            }
        }
        if (isset($payload['phases'])) {
            $payload['phases'] = array_map(fn ($phase) => ['months' => (int) $phase['months'], 'annual_rate' => (float) $phase['annual_rate']], $payload['phases']);
        }

        return $payload;
    }
}
