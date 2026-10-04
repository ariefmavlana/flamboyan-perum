<script setup lang="ts">
import type { PublicContent } from '#shared/types'
import { simulateMortgage } from '#shared/utils/mortgage'
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
const years = ref(20)
const annualRate = ref(8)
const floating = ref(false)
const fixedMonths = ref(36)
const floatingRate = ref(12)
const bankId = ref('')
const result = computed(() => {
  const inputs = [
    downPayment.value,
    years.value,
    annualRate.value,
    ...(floating.value ? [fixedMonths.value, floatingRate.value] : []),
  ]
  if (
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
      floating.value
        ? {
            afterMonths: Number(fixedMonths.value),
            annualRate: Number(floatingRate.value),
          }
        : undefined,
    )
  } catch {
    return null
  }
})
const rows = computed(
  () => result.value?.schedule.filter((row) => row.month % 12 === 0) ?? [],
)
const selected = computed(() =>
  data.value?.data.bank_rates.find((rate) => String(rate.id) === bankId.value),
)
function selectBank() {
  const rate = selected.value
  if (!rate) return
  annualRate.value = Number(rate.annual_rate)
  fixedMonths.value = rate.fixed_months
  floating.value = rate.fixed_months < Number(years.value) * 12
}
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
      >. Rate floating tetap asumsi Anda, konfirmasi syarat langsung ke bank.
    </p>
    <div class="form-grid">
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
          min="1"
          max="30"
          step="1"
      /></label>
      <label
        >Bunga tahunan fixed (%)<input
          v-model.number="annualRate"
          :disabled="!interactive"
          type="number"
          min="0"
          max="30"
          step="0.01"
      /></label>
      <label class="checkbox-label"
        ><input v-model="floating" :disabled="!interactive" type="checkbox" />
        Skenario fixed lalu floating</label
      >
      <template v-if="floating"
        ><label
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
      singkat dari tenor.
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
        <div v-if="floating">
          <dt>Cicilan setelah fixed / bulan</dt>
          <dd>{{ formatIdr(result.schedule[fixedMonths]?.payment ?? 0) }}</dd>
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
      <p class="muted">
        Hijau: pokok. Kuning: bunga. Floating adalah skenario tetap setelah
        reset, bukan prediksi perubahan suku bunga.
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
