<script setup lang="ts">
import type { PublicContent } from '#shared/types'
import { simulateMortgage, estimateBankFees } from '#shared/utils/mortgage'
import { formatIdr } from '#shared/utils/catalog'
const props = defineProps<{ price: string }>()
const interactive = ref(false)
onMounted(() => {
  interactive.value = true
})
const { data, error: rateError } = await useFetch<{ data: PublicContent }>(
  '/api/v1/content',
)
const downPayment = ref(Math.round(Number(props.price) * 0.2))
const appraisalValue = ref(Number(props.price))
const years = ref(20)
const annualRate = ref(8)
const floating = ref(false)
const fixedMonths = ref(36)
const floatingRate = ref(12)
const bankId = ref('')
const selected = computed(() =>
  data.value?.data.bank_rates.find((rate) => String(rate.id) === bankId.value),
)
const tenorValid = computed(
  () =>
    !selected.value ||
    (years.value * 12 >= (selected.value.min_tenor_months ?? 12) &&
      years.value * 12 <= (selected.value.max_tenor_months ?? 360)),
)
const rateChanges = computed(() => {
  if (!selected.value) return []
  const phases = selected.value.phases ?? [
    {
      months: selected.value.fixed_months,
      annual_rate: selected.value.annual_rate,
    },
  ]
  let elapsed = 0
  const changes: { afterMonths: number; annualRate: number }[] = []
  for (const [index, phase] of phases.entries()) {
    if (index > 0 && elapsed < years.value * 12)
      changes.push({ afterMonths: elapsed, annualRate: phase.annual_rate })
    elapsed += phase.months
  }
  if (elapsed < years.value * 12)
    changes.push({ afterMonths: elapsed, annualRate: floatingRate.value })
  return changes
})
const result = computed(() => {
  const principal = Number(props.price) - Number(downPayment.value)
  const bank = selected.value
  if (
    bank &&
    (principal < (bank.min_principal_idr ?? 0) ||
      principal > (bank.max_principal_idr ?? 1e12) ||
      (bank.max_ltv_percent !== undefined &&
        (!Number.isFinite(appraisalValue.value) ||
          appraisalValue.value <= 0 ||
          principal > (appraisalValue.value * bank.max_ltv_percent) / 100)))
  )
    return null
  const inputs = [
    downPayment.value,
    years.value,
    annualRate.value,
    ...(floating.value ? [fixedMonths.value, floatingRate.value] : []),
  ]
  if (
    !tenorValid.value ||
    !inputs.every(
      (value) => typeof value === 'number' && Number.isFinite(value),
    )
  )
    return null
  try {
    return simulateMortgage(
      Number(props.price),
      Number(downPayment.value),
      Number(years.value),
      Number(annualRate.value),
      floating.value && !selected.value
        ? {
            afterMonths: Number(fixedMonths.value),
            annualRate: Number(floatingRate.value),
          }
        : undefined,
      rateChanges.value,
    )
  } catch {
    return null
  }
})
const rows = computed(
  () => result.value?.schedule.filter((row) => row.month % 12 === 0) ?? [],
)
function selectBank() {
  const rate = selected.value
  if (!rate) {
    floating.value = false
    return
  }
  years.value = Math.max(
    Math.ceil((rate.min_tenor_months ?? 12) / 12),
    Math.min(years.value, Math.floor((rate.max_tenor_months ?? 360) / 12)),
  )
  annualRate.value = Number(rate.annual_rate)
  floatingRate.value = rate.floating_rate ?? 12
  fixedMonths.value = rate.fixed_months
  floating.value = rate.fixed_months < Number(years.value) * 12
}
const fees = computed(() =>
  result.value && selected.value && result.value.principal > 0
    ? estimateBankFees(result.value.principal, {
        provision_percent: selected.value.provision_percent,
        admin_percent: selected.value.admin_percent,
        admin_min_idr: selected.value.admin_min_idr,
        admin_max_idr: selected.value.admin_max_idr,
        appraisal_min_idr: selected.value.appraisal_min_idr,
        appraisal_max_idr: selected.value.appraisal_max_idr,
      })
    : null,
)
const yearlyChart = computed(() =>
  rows.value.map((row) => {
    const yearRows = result.value!.schedule.slice(row.month - 12, row.month)
    const principal = yearRows.reduce((sum, item) => sum + item.principal, 0)
    const interest = yearRows.reduce((sum, item) => sum + item.interest, 0)
    return {
      year: row.month / 12,
      principal,
      interest,
      fraction:
        principal + interest ? (principal / (principal + interest)) * 100 : 100,
    }
  }),
)
</script>
<template>
  <section class="mortgage-panel" aria-labelledby="kpr-title">
    <p class="eyebrow">RENCANA PEMBIAYAAN</p>
    <h2 id="kpr-title">Simulasi KPR</h2>
    <p class="muted">
      Estimasi anuitas, bukan penawaran atau persetujuan bank. Angka awal adalah
      asumsi simulasi. Biaya provisi, administrasi, asuransi, pajak, dan biaya
      transaksi lainnya belum termasuk.
    </p>
    <p v-if="rateError" class="notice">
      Referensi rate belum dapat dimuat; simulasi manual tetap tersedia.
    </p>
    <label
      >Referensi bank<select
        v-model="bankId"
        :disabled="!interactive"
        @change="selectBank"
      >
        <option value="">Asumsi manual</option>
        <option
          v-for="rate in data?.data.bank_rates"
          :key="rate.id"
          :value="String(rate.id)"
        >
          {{ rate.bank }} · {{ rate.product }} · {{ rate.annual_rate }}%
        </option>
      </select></label
    >
    <p v-if="selected" class="muted">
      Berlaku {{ selected.effective_date }}–{{ selected.valid_until }}, fixed
      {{ selected.fixed_months }} bulan.
      <a :href="selected.source_url" target="_blank" rel="noopener noreferrer"
        >Lihat sumber bank ↗</a
      >. Floating setelah masa fixed merupakan skenario, bukan kepastian bunga
      masa depan.
      <span v-if="selected.checked_date"
        >Diperiksa {{ selected.checked_date }}.</span
      >
      <span v-if="selected.min_tenor_months">
        Tenor minimum {{ selected.min_tenor_months / 12 }} tahun.</span
      >
      <span v-if="selected.max_tenor_months">
        Maksimum {{ selected.max_tenor_months / 12 }} tahun.</span
      >
    </p>
    <p v-if="selected?.conditions" class="notice">{{ selected.conditions }}</p>
    <ul v-if="selected?.phases?.length" class="muted">
      <li v-for="(phase, index) in selected.phases" :key="index">
        Tahap {{ index + 1 }}: {{ phase.months }} bulan ·
        {{ phase.annual_rate }}% efektif per tahun.
      </li>
    </ul>
    <p class="muted">
      Uang muka dihitung terhadap harga. Plafon bank dapat berbeda karena
      penilaian agunan dan kemampuan bayar. Batas LTV mengikuti ketentuan BI
      yang berlaku dan kebijakan bank; ini tidak menjamin pembiayaan tanpa DP.
      Tanda jadi, DP, dan biaya transaksi merupakan komponen berbeda.
      <a
        href="https://www.bi.go.id/id/fungsi-utama/stabilitas-sistem-keuangan/instrumen-makroprudensial/default.aspx"
        target="_blank"
        rel="noopener noreferrer"
        >Ketentuan LTV/FTV BI ↗</a
      >
    </p>
    <div class="form-grid">
      <label v-if="selected?.max_ltv_percent !== undefined"
        >Asumsi nilai appraisal agunan (IDR)<input
          v-model.number="appraisalValue"
          :disabled="!interactive"
          type="number"
          min="1"
          max="1000000000000"
          step="1"
      /></label>
      <label
        >Uang muka (IDR)<input
          v-model.number="downPayment"
          :disabled="!interactive"
          type="number"
          min="0"
          :max="price"
          step="1"
      /></label>
      <label
        >Tenor (tahun)<input
          v-model.number="years"
          :disabled="!interactive"
          type="number"
          :min="Math.ceil((selected?.min_tenor_months ?? 12) / 12)"
          :max="Math.floor((selected?.max_tenor_months ?? 360) / 12)"
          step="1"
      /></label>
      <label
        >Bunga efektif tahunan awal (%)<input
          v-model.number="annualRate"
          :disabled="!interactive || !!selected"
          type="number"
          min="0"
          max="30"
          step="0.01"
      /></label>
      <label v-if="!selected" class="checkbox-label"
        ><input v-model="floating" :disabled="!interactive" type="checkbox" />
        Skenario fixed lalu floating</label
      >
      <template
        v-if="floating || (selected && selected.fixed_months < years * 12)"
        ><label v-if="!selected"
          >Masa fixed (bulan)<input
            v-model.number="fixedMonths"
            :disabled="!interactive"
            type="number"
            min="1"
            :max="years * 12 - 1"
            step="1" /></label
        ><label
          >Asumsi bunga floating (%)<input
            v-model.number="floatingRate"
            :disabled="!interactive"
            type="number"
            min="0"
            max="30"
            step="0.01" /></label
      ></template>
    </div>
    <p v-if="!result" class="error-text" role="alert">
      Periksa uang muka, tenor, rate, dan masa fixed. Masa fixed harus lebih
      singkat dari tenor. Referensi bank harus memenuhi batas tenor dan plafon
      produknya.
      <template v-if="selected?.min_principal_idr">
        Plafon minimum {{ formatIdr(selected.min_principal_idr) }}.</template
      >
      <template v-if="selected?.max_ltv_percent">
        LTV maksimum produk {{ selected.max_ltv_percent }}% terhadap asumsi
        appraisal, bukan hasil penilaian bank.</template
      >
    </p>
    <template v-else>
      <dl class="spec-list" aria-live="polite">
        <div>
          <dt>Pokok pinjaman</dt>
          <dd>{{ formatIdr(result.principal) }}</dd>
        </div>
        <div>
          <dt>Cicilan awal / bulan</dt>
          <dd>{{ formatIdr(result.monthlyPayment) }}</dd>
        </div>
        <div
          v-for="change in selected
            ? rateChanges
            : floating
              ? [{ afterMonths: fixedMonths, annualRate: floatingRate }]
              : []"
          :key="change.afterMonths"
        >
          <dt>
            Cicilan mulai bulan {{ change.afterMonths + 1 }} / bulan ·
            {{ change.annualRate }}%{{
              selected && change.afterMonths < selected.fixed_months
                ? ''
                : ' (skenario floating)'
            }}
          </dt>
          <dd>
            {{ formatIdr(result.schedule[change.afterMonths]?.payment ?? 0) }}
          </dd>
        </div>
        <div>
          <dt>Total bunga estimasi</dt>
          <dd>{{ formatIdr(result.totalInterest) }}</dd>
        </div>
        <div>
          <dt>Total angsuran estimasi</dt>
          <dd>{{ formatIdr(result.totalPayment) }}</dd>
        </div>
      </dl>
      <h3>Komposisi angsuran per tahun</h3>
      <div v-if="fees" class="section">
        <h3>Komponen biaya bank yang diketahui</h3>
        <dl class="spec-list">
          <div v-if="fees.provision !== null">
            <dt>Provisi</dt>
            <dd>{{ formatIdr(fees.provision) }}</dd>
          </div>
          <div v-if="fees.administration !== null">
            <dt>Administrasi</dt>
            <dd>{{ formatIdr(fees.administration) }}</dd>
          </div>
          <div v-if="fees.appraisalMin !== null && fees.appraisalMax !== null">
            <dt>Appraisal</dt>
            <dd>
              {{ formatIdr(fees.appraisalMin) }}–{{
                formatIdr(fees.appraisalMax)
              }}
            </dd>
          </div>
        </dl>
        <p class="muted">
          Belum mencakup asuransi jiwa/kebakaran, notaris, pengikatan agunan,
          pajak, dan biaya lainnya. Nilai kosong belum diketahui. Program biaya
          developer dikonfirmasi cakupannya agar biaya tidak dihitung dua kali.
        </p>
      </div>
      <div class="mortgage-legend" aria-label="Legenda grafik">
        <span><i class="principal-swatch" aria-hidden="true" />Pokok</span
        ><span><i class="interest-swatch" aria-hidden="true" />Bunga</span>
      </div>
      <p class="muted">
        Floating adalah skenario tetap setelah reset, bukan prediksi perubahan
        suku bunga.
      </p>
      <ol class="mortgage-chart" aria-label="Grafik pokok dan bunga">
        <li v-for="year in yearlyChart" :key="year.year">
          <span>Tahun {{ year.year }}</span>
          <div
            class="mortgage-bar"
            role="img"
            :aria-label="`Pokok ${formatIdr(year.principal)}, bunga ${formatIdr(year.interest)}`"
          >
            <span :style="{ width: `${year.fraction}%` }" />
          </div>
          <span>{{ formatIdr(year.interest) }} bunga</span>
        </li>
      </ol>
      <details>
        <summary>
          Jadwal angsuran bulanan ({{ result.schedule.length }} bulan)
        </summary>
        <div
          class="table-scroll"
          role="region"
          aria-label="Tabel data, geser untuk melihat kolom lainnya"
          tabindex="0"
        >
          <table>
            <caption>
              Angsuran, pokok, bunga, dan sisa pinjaman; tampilan dibulatkan ke
              rupiah.
            </caption>
            <thead>
              <tr>
                <th>Bulan</th>
                <th>Angsuran</th>
                <th>Pokok</th>
                <th>Bunga</th>
                <th>Sisa</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.schedule" :key="row.month">
                <td>{{ row.month }}</td>
                <td>{{ formatIdr(row.payment) }}</td>
                <td>{{ formatIdr(row.principal) }}</td>
                <td>{{ formatIdr(row.interest) }}</td>
                <td>{{ formatIdr(row.balance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
  </section>
</template>
