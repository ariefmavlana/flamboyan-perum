<script setup lang="ts">
import type { PublicContent } from '#shared/types'
import {
  simulateMortgage,
  simulateMurabahah,
  estimateBankFees,
} from '#shared/utils/mortgage'
import { formatIdr, whatsappLink } from '#shared/utils/catalog'
import { siteOrigin } from '#shared/utils/seo'
import {
  formatDate,
  formatDateRange,
  formatNumber,
  formatPercent,
} from '#shared/utils/format'
const props = defineProps<{
  price: string
  propertyId?: number
  houseType?: string
}>()
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
const annualRate = ref<number | ''>('')
const bank = ref<'BNI' | 'BSI'>('BNI')
const config = useRuntimeConfig()
const route = useRoute()
const { whatsappNumber } = await useDevelopment()
const helpLink = computed(() =>
  whatsappLink(
    whatsappNumber.value,
    `penawaran KPR ${bank.value} untuk rumah tipe ${props.houseType ?? ''}. Mohon rincian DP, tenor, ${bank.value === 'BSI' ? 'total margin akad' : 'bunga efektif dan skenario floating'}, serta biaya`,
    siteOrigin(String(config.public.siteUrl)) + route.path,
  ),
)
const financingSteps = computed(() => [
  {
    title: 'Harga sudah sesuai rumah',
    text: `Harga ${formatIdr(props.price)} diambil dari tipe yang sedang Anda lihat, sehingga tidak perlu diketik ulang.`,
  },
  {
    title: 'Isi DP dan lama pembiayaan',
    text: 'Ketik uang muka dalam rupiah; titik ribuan muncul otomatis, misalnya 1.000.000. Tenor diisi dalam tahun; 1 tahun sama dengan 12 bulan. DP awal 20% dapat diubah.',
  },
  {
    title:
      bank.value === 'BNI'
        ? 'Gunakan bunga efektif BNI'
        : 'Gunakan total margin BSI',
    text:
      bank.value === 'BNI'
        ? 'Ambil bunga efektif tahunan dari penawaran BNI. Jika bunga berubah setelah fixed, isi asumsi floating. Referensi yang tersedia dapat dipilih pada form.'
        : 'Isi total margin akad dalam rupiah dari penawaran BSI, bukan persentase bunga. Penawaran tersimpan hanya tersedia bila tipe dan harga rumah cocok.',
  },
  {
    title: 'Tinjau hasil dan biaya',
    text: 'Angsuran diperbarui saat isian lengkap dan valid. Bandingkan pokok, angsuran dan total pembayaran, kemudian konfirmasikan biaya serta jadwal final kepada bank.',
  },
])
const downPaymentText = computed(() =>
  typeof downPayment.value === 'number' && Number.isFinite(downPayment.value)
    ? formatIdr(downPayment.value)
    : 'Belum diisi',
)
function trackFinancingHelp() {
  tracking.track('click_whatsapp', {
    property_id: props.propertyId,
    page_type: 'property',
    lead_channel: 'whatsapp',
  })
}
const totalMargin = ref<number | ''>('')
const bsiQuoteId = ref('')
const bsiQuotes = computed(
  () =>
    data.value?.data.financing_programs?.filter(
      (program) =>
        program.method === 'MURABAHAH_QUOTE' &&
        program.bank === 'BSI' &&
        program.house_types?.includes(props.houseType ?? '') &&
        program.price_idr === Number(props.price),
    ) ?? [],
)
const bsiQuote = computed(() =>
  bsiQuotes.value.find((program) => String(program.id) === bsiQuoteId.value),
)
watch([bank, bsiQuote], () => {
  totalMargin.value = ''
  const quote = bsiQuote.value
  if (bank.value === 'BSI' && quote?.method === 'MURABAHAH_QUOTE') {
    downPayment.value = quote.down_payment_idr
    years.value = quote.tenor_months / 12
    totalMargin.value = quote.total_margin_idr
  }
})
const bsiResult = computed(() => {
  if (
    totalMargin.value === '' ||
    typeof downPayment.value !== 'number' ||
    typeof years.value !== 'number'
  )
    return null
  try {
    return simulateMurabahah(
      Number(props.price),
      Number(downPayment.value),
      Number(years.value),
      totalMargin.value,
    )
  } catch {
    return null
  }
})
watch(
  () => props.price,
  (price) => {
    downPayment.value = Math.round(Number(price) * 0.2)
    appraisalValue.value = Number(price)
    totalMargin.value = ''
  },
)
const floating = ref(false)
const fixedMonths = ref(36)
const floatingRate = ref<number | ''>('')
const bankId = ref('')
const bankRates = computed(
  () =>
    data.value?.data.bank_rates.filter(
      (rate) => rate.bank.toUpperCase() === 'BNI',
    ) ?? [],
)
const selected = computed(() =>
  bankRates.value.find((rate) => String(rate.id) === bankId.value),
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
    changes.push({
      afterMonths: elapsed,
      annualRate: Number(floatingRate.value),
    })
  return changes
})
const result = computed(() => {
  if (
    bank.value !== 'BNI' ||
    annualRate.value === '' ||
    (selected.value &&
      selected.value.fixed_months < years.value * 12 &&
      floatingRate.value === '')
  )
    return null
  const principal = Number(props.price) - Number(downPayment.value)
  const terms = selected.value
  if (
    terms &&
    (principal < (terms.min_principal_idr ?? 0) ||
      principal > (terms.max_principal_idr ?? 1e12) ||
      (terms.max_ltv_percent !== undefined &&
        (!Number.isFinite(appraisalValue.value) ||
          appraisalValue.value <= 0 ||
          principal > (appraisalValue.value * terms.max_ltv_percent) / 100)))
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
const tracking = useAnalytics()
const interacted = ref(false)
watch(
  [
    downPayment,
    appraisalValue,
    years,
    annualRate,
    floating,
    fixedMonths,
    floatingRate,
    bankId,
  ],
  () => {
    interacted.value = true
  },
)
watch(result, (value) => {
  if (!value || !interacted.value) return
  tracking.track(
    'calculate_mortgage',
    {
      property_id: props.propertyId,
      page_type: 'property',
      content_group: 'kpr',
    },
    { once: true },
  )
})
function selectBank() {
  const rate = selected.value
  if (!rate) {
    annualRate.value = ''
    floatingRate.value = ''
    floating.value = false
    return
  }
  years.value = Math.max(
    Math.ceil((rate.min_tenor_months ?? 12) / 12),
    Math.min(years.value, Math.floor((rate.max_tenor_months ?? 360) / 12)),
  )
  annualRate.value = Number(rate.annual_rate)
  floatingRate.value = rate.floating_rate ?? ''
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
    <FinancingPrograms
      :programs="data?.data.financing_programs ?? []"
      :house-type="houseType"
      :price="price"
    />
    <p class="eyebrow">RENCANA PEMBIAYAAN</p>
    <h2 id="kpr-title">Simulasi KPR BNI & BSI</h2>
    <details class="mortgage-guide" open>
      <summary>Cara mengisi simulasi KPR</summary>
      <ol class="mortgage-guide-steps">
        <li v-for="step in financingSteps" :key="step.title">
          <strong>{{ step.title }}</strong>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </details>
    <p class="muted">
      Harga rumah {{ formatIdr(price) }}. DP awal 20% dapat diubah sesuai
      penawaran. Masukkan parameter penawaran bank; simulasi bukan persetujuan
      pembiayaan. Biaya provisi, administrasi, asuransi, pajak, dan biaya
      transaksi lainnya belum termasuk.
    </p>
    <p v-if="rateError" class="notice">
      Referensi suku bunga belum dapat dimuat. Masukkan parameter penawaran bank
      Anda.
    </p>
    <label
      >Bank rekanan<select v-model="bank" :disabled="!interactive">
        <option value="BNI">BNI Griya</option>
        <option value="BSI">BSI Griya · Murabahah</option>
      </select></label
    >
    <div class="mortgage-input-summary">
      <div>
        <span>Harga tipe {{ houseType }}</span
        ><strong>{{ formatIdr(price) }}</strong>
      </div>
      <div>
        <span>Uang muka yang Anda isi</span
        ><strong>{{ downPaymentText }}</strong>
      </div>
      <div>
        <span>Jangka waktu</span
        ><strong
          >{{ years || '—' }} tahun<span v-if="years">
            · {{ Math.round(years * 12) }} bulan</span
          ></strong
        >
      </div>
    </div>
    <p id="mortgage-dp-help" class="mortgage-field-help">
      Titik ribuan ditambahkan otomatis, misalnya 1.000.000 untuk satu juta
      rupiah. DP tidak boleh melebihi harga rumah. Tanda jadi dan biaya
      transaksi dikonfirmasi terpisah.
    </p>
    <p id="mortgage-terms-help" class="mortgage-field-help">
      Isi tenor sesuai penawaran bank.
      {{
        bank === 'BSI'
          ? 'Total margin adalah jumlah rupiah untuk seluruh akad; jangan memasukkan persentase atau nominal angsuran bulanan.'
          : 'Bunga diisi sebagai persentase efektif per tahun; gunakan koma untuk desimal, misalnya 8,5. Bukan bunga flat atau nominal rupiah.'
      }}
    </p>
    <template v-if="bank === 'BSI'">
      <p class="muted">
        Perhitungan murabahah angsuran sama: (harga rumah − DP + total margin
        akad) ÷ jumlah bulan. Masukkan total margin rupiah dari penawaran BSI
        untuk harga, DP dan tenor ini. Skema berjenjang dan MMQ memerlukan
        jadwal bank tersendiri.
      </p>
      <label v-if="bsiQuotes.length"
        >Penawaran BSI<select v-model="bsiQuoteId" :disabled="!interactive">
          <option value="">Isi sesuai penawaran Anda</option>
          <option
            v-for="quote in bsiQuotes"
            :key="quote.id"
            :value="String(quote.id)"
          >
            {{ quote.product }}
          </option>
        </select></label
      >
      <p v-if="bsiQuote" class="muted">
        DP, tenor dan margin mengikuti penawaran Admin untuk harga rumah ini.
        Pilih “Isi sesuai penawaran Anda” untuk menghitung skenario lain.
      </p>
      <div class="form-grid">
        <label
          >Uang muka (IDR)<NumberInput
            v-model.number="downPayment"
            aria-describedby="mortgage-dp-help"
            :disabled="!interactive || !!bsiQuote"
            min="0"
            :max="price"
            step="1"
        /></label>
        <label
          >Tenor (tahun)<NumberInput
            v-model.number="years"
            aria-describedby="mortgage-terms-help"
            :disabled="!interactive || !!bsiQuote"
            min="1"
            max="30"
            step="1"
        /></label>
        <label
          >Total margin akad BSI (IDR)<NumberInput
            v-model.number="totalMargin"
            aria-describedby="mortgage-terms-help"
            :disabled="!interactive || !!bsiQuote"
            min="0"
            max="1000000000000"
            step="1"
        /></label>
      </div>
      <dl v-if="bsiResult" class="spec-list" aria-live="polite">
        <div>
          <dt>Pokok pembiayaan</dt>
          <dd>{{ formatIdr(bsiResult.principal) }}</dd>
        </div>
        <div>
          <dt>Angsuran per bulan</dt>
          <dd>{{ formatIdr(bsiResult.monthlyPayment) }}</dd>
        </div>
        <div>
          <dt>Total margin akad</dt>
          <dd>{{ formatIdr(bsiResult.totalMargin) }}</dd>
        </div>
        <div>
          <dt>Total angsuran</dt>
          <dd>{{ formatIdr(bsiResult.totalPayment) }}</dd>
        </div>
      </dl>
      <p v-else class="notice" role="status">
        Isi DP, tenor dan total margin sesuai penawaran BSI untuk menghitung
        angsuran.
      </p>
      <p class="muted">
        Pembulatan dan jadwal final mengikuti akad. Biaya yang dibiayai bank
        harus tercantum dalam penawaran; belum termasuk dalam perhitungan harga
        dikurangi DP ini.
        <a
          href="https://www.bankbsi.co.id/produk&amp;layanan/produk/bsi-griya"
          target="_blank"
          rel="noopener noreferrer"
          >BSI Griya<AppIcon name="external" /></a
        >
      </p>
    </template>
    <template v-else>
      <label
        >Referensi penawaran BNI<select
          v-model="bankId"
          :disabled="!interactive"
          @change="selectBank"
        >
          <option value="">Isi bunga sesuai penawaran BNI</option>
          <option
            v-for="rate in bankRates"
            :key="rate.id"
            :value="String(rate.id)"
          >
            {{ rate.bank }} · {{ rate.product }} ·
            {{ formatPercent(rate.annual_rate) }}
          </option>
        </select></label
      >
      <p v-if="selected" class="muted">
        Berlaku
        {{ formatDateRange(selected.effective_date, selected.valid_until) }},
        masa fixed {{ selected.fixed_months }} bulan.
        <a :href="selected.source_url" target="_blank" rel="noopener noreferrer"
          >Lihat sumber bank<AppIcon name="external" /></a
        >. Floating setelah masa fixed merupakan skenario, bukan kepastian bunga
        masa depan.
        <span v-if="selected.checked_date"
          >Diperiksa {{ formatDate(selected.checked_date) }}.</span
        >
        <span v-if="selected.min_tenor_months">
          Tenor minimum
          {{ formatNumber(selected.min_tenor_months / 12) }} tahun.</span
        >
        <span v-if="selected.max_tenor_months">
          Maksimum
          {{ formatNumber(selected.max_tenor_months / 12) }} tahun.</span
        >
      </p>
      <p v-if="selected?.conditions" class="notice">
        {{ selected.conditions }}
      </p>
      <ul v-if="selected?.phases?.length" class="muted">
        <li v-for="(phase, index) in selected.phases" :key="index">
          Tahap {{ index + 1 }}: {{ phase.months }} bulan ·
          {{ formatPercent(phase.annual_rate) }} efektif per tahun.
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
          >Ketentuan LTV/FTV BI<AppIcon name="external" /></a
        >
      </p>
      <div class="form-grid">
        <label v-if="selected?.max_ltv_percent !== undefined"
          >Asumsi nilai penilaian agunan (IDR)<NumberInput
            v-model.number="appraisalValue"
            :disabled="!interactive"
            min="1"
            max="1000000000000"
            step="1"
        /></label>
        <label
          >Uang muka (IDR)<NumberInput
            v-model.number="downPayment"
            aria-describedby="mortgage-dp-help"
            :disabled="!interactive"
            min="0"
            :max="price"
            step="1"
        /></label>
        <label
          >Tenor (tahun)<NumberInput
            v-model.number="years"
            aria-describedby="mortgage-terms-help"
            :disabled="!interactive"
            :min="Math.ceil((selected?.min_tenor_months ?? 12) / 12)"
            :max="Math.floor((selected?.max_tenor_months ?? 360) / 12)"
            step="1"
        /></label>
        <label
          >Bunga efektif tahunan awal (%)<NumberInput
            v-model.number="annualRate"
            aria-describedby="mortgage-terms-help"
            :disabled="!interactive || !!selected"
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
            >Masa fixed (bulan)<NumberInput
              v-model.number="fixedMonths"
              :disabled="!interactive"
              min="1"
              :max="years * 12 - 1"
              step="1" /></label
          ><label
            >Asumsi bunga floating (%)<NumberInput
              v-model.number="floatingRate"
              :disabled="!interactive"
              min="0"
              max="30"
              step="0.01" /></label
        ></template>
      </div>
      <p
        v-if="!result"
        :class="annualRate === '' ? 'notice' : 'error-text'"
        :role="annualRate === '' ? 'status' : 'alert'"
      >
        Isi uang muka, tenor dan bunga sesuai penawaran BNI. Untuk masa fixed
        yang lebih singkat dari tenor, isi juga skenario floating. Periksa
        seluruh nilai. Masa fixed harus lebih singkat dari tenor. Referensi bank
        harus memenuhi batas tenor dan plafon produknya.
        <template v-if="selected?.min_principal_idr">
          Plafon minimum {{ formatIdr(selected.min_principal_idr) }}.</template
        >
        <template v-if="selected?.max_ltv_percent">
          LTV maksimum produk
          {{ formatPercent(selected.max_ltv_percent) }} terhadap asumsi nilai
          agunan, bukan hasil penilaian bank.</template
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
              {{ formatPercent(Number(change.annualRate))
              }}{{
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
            <div
              v-if="fees.appraisalMin !== null && fees.appraisalMax !== null"
            >
              <dt>Penilaian agunan</dt>
              <dd>
                {{ formatIdr(fees.appraisalMin) }}–{{
                  formatIdr(fees.appraisalMax)
                }}
              </dd>
            </div>
          </dl>
          <p class="muted">
            Belum mencakup asuransi jiwa/kebakaran, notaris, pengikatan agunan,
            pajak, dan biaya lainnya. Nilai kosong belum diketahui. Program
            biaya pengembang dikonfirmasi cakupannya agar biaya tidak dihitung
            dua kali.
          </p>
        </div>
        <div class="mortgage-legend" aria-label="Legenda grafik">
          <span><i class="principal-swatch" aria-hidden="true" />Pokok</span
          ><span><i class="interest-swatch" aria-hidden="true" />Bunga</span>
        </div>
        <p class="muted">
          Masa floating adalah asumsi tetap setelah reset, bukan prediksi
          perubahan suku bunga.
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
                Angsuran, pokok, bunga, dan sisa pinjaman; tampilan dibulatkan
                ke rupiah.
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
    </template>
    <div class="mortgage-contact">
      <div>
        <h3>Belum memiliki penawaran bank?</h3>
        <p>
          Minta rincian {{ bank }} untuk tipe {{ houseType }} melalui Admin. Isi
          parameter setelah penawarannya dikonfirmasi; nilai kosong bukan
          berarti gratis.
        </p>
      </div>
      <a
        v-if="helpLink"
        :href="helpLink"
        class="button whatsapp-button"
        target="_blank"
        rel="noopener noreferrer"
        @click="trackFinancingHelp"
        ><AppIcon name="whatsapp" />Minta rincian {{ bank }}<AppIcon name="external" /></a
      >
    </div>
  </section>
</template>
