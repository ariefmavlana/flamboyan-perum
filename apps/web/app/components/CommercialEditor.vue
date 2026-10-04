<script setup lang="ts">
import type { InternalProperty, PaymentPlan } from '#shared/types'
const props = defineProps<{ property: InternalProperty }>()
const emit = defineEmits<{ saved: [property: InternalProperty] }>()
const api = useStaffApi()
const busy = ref(false)
const message = ref('')
const verified = ref(false)
const form = reactive({
  floors: 1,
  lot_dimensions: '',
  planned_units: 1,
  features: '',
  source_name: '',
  source_date: '',
  notes: '',
  fee_notes: '',
  offer_price_idr: '',
  offer_start: '',
  offer_end: '',
  next_price_idr: '',
  next_price_start: '',
  program_fee_idr: '',
  program_fee_start: '',
  program_fee_until: '',
  next_fee_idr: '',
  next_fee_start: '',
})
const plans = ref<PaymentPlan[]>([])
watch(
  () => props.property,
  (p) => {
    const c = p.commercial
    Object.assign(form, {
      floors: c?.floors ?? 1,
      lot_dimensions: c?.lot_dimensions ?? '',
      planned_units: c?.planned_units ?? 1,
      features: c?.features.join('\n') ?? '',
      source_name: c?.source_name ?? '',
      source_date: c?.source_date ?? '',
      notes: c?.notes ?? '',
      fee_notes: c?.fee_notes ?? '',
      offer_price_idr: p.offer_price_idr ?? '',
      offer_start: p.offer_start ?? '',
      offer_end: p.offer_end ?? '',
      next_price_idr: p.next_price_idr ?? '',
      next_price_start: p.next_price_start ?? '',
      program_fee_idr:
        c?.program_fee_idr === null || c?.program_fee_idr === undefined
          ? ''
          : String(c.program_fee_idr),
      program_fee_until: c?.program_fee_until ?? '',
      program_fee_start: c?.program_fee_start ?? c?.source_date ?? '',
      next_fee_idr:
        c?.next_fee_idr === null || c?.next_fee_idr === undefined
          ? ''
          : String(c.next_fee_idr),
      next_fee_start: c?.next_fee_start ?? '',
    })
    plans.value = JSON.parse(JSON.stringify(c?.payment_plans ?? []))
    verified.value = false
  },
  { immediate: true },
)
watch(
  [form, plans],
  () => {
    verified.value = false
  },
  { deep: true, flush: 'sync' },
)
const money = (v: string) => (v === '' ? null : Number(v))
async function save() {
  busy.value = true
  message.value = ''
  try {
    const result = await api.request<{ data: InternalProperty }>(
      `/api/v1/internal/properties/${props.property.id}/commercial`,
      {
        method: 'PATCH',
        body: {
          version: props.property.version,
          verified: verified.value,
          offer_price_idr: money(form.offer_price_idr),
          offer_start: form.offer_start || null,
          offer_end: form.offer_end || null,
          next_price_idr: money(form.next_price_idr),
          next_price_start: form.next_price_start || null,
          commercial: {
            floors: form.floors,
            lot_dimensions: form.lot_dimensions,
            planned_units: form.planned_units,
            features: form.features
              .split('\n')
              .map((v) => v.trim())
              .filter(Boolean),
            source_name: form.source_name,
            source_date: form.source_date,
            notes: form.notes,
            fee_notes: form.fee_notes,
            program_fee_idr: money(form.program_fee_idr),
            program_fee_start: form.program_fee_start || null,
            program_fee_until: form.program_fee_until || null,
            next_fee_idr: money(form.next_fee_idr),
            next_fee_start: form.next_fee_start || null,
            payment_plans: plans.value,
          },
        },
      },
    )
    emit('saved', result.data)
    message.value = 'Spesifikasi dan periode pembayaran tersimpan.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
function addPlan() {
  plans.value.push({
    title: '',
    kind: 'INSTALLMENT',
    upfront_idr: 0,
    months: 12,
    monthly_idr: 0,
    total_idr: 1,
    valid_from: '',
    valid_until: '',
    quota: 1,
    source_name: '',
    notes: '',
  })
}
</script>
<template>
  <form class="section" @submit.prevent="save">
    <h3>Spesifikasi, harga & pembayaran</h3>
    <p>
      Harga dasar pada form properti dipakai di luar periode program. Rencana
      unit bukan stok tersedia. Periode memakai tanggal Asia/Jakarta; penawaran
      lama otomatis tidak ditampilkan.
    </p>
    <div class="form-grid">
      <label
        >Lantai<input
          v-model.number="form.floors"
          type="number"
          min="1"
          max="20"
          required
      /></label>
      <label
        >Dimensi kavling<input
          v-model="form.lot_dimensions"
          maxlength="80"
          required
      /></label>
      <label
        >Rencana jumlah unit tipe<input
          v-model.number="form.planned_units"
          type="number"
          min="1"
          max="100000"
          required
      /></label>
      <label
        >Harga program (IDR, opsional)<input
          v-model="form.offer_price_idr"
          type="number"
          min="1"
          max="1000000000000"
          step="1"
      /></label>
      <label
        >Program mulai<input
          v-model="form.offer_start"
          type="date"
          :required="!!form.offer_price_idr"
      /></label>
      <label
        >Program terakhir berlaku<input
          v-model="form.offer_end"
          type="date"
          :required="!!form.offer_price_idr"
      /></label>
      <label
        >Harga berikutnya (IDR, opsional)<input
          v-model="form.next_price_idr"
          type="number"
          min="1"
          max="1000000000000"
          step="1"
      /></label>
      <label
        >Harga berikutnya mulai<input
          v-model="form.next_price_start"
          type="date"
          :required="!!form.next_price_idr"
      /></label>
      <label
        >Biaya program developer (IDR, opsional)<input
          v-model="form.program_fee_idr"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
      /></label>
      <label
        >Biaya program terakhir berlaku<input
          v-model="form.program_fee_until"
          type="date"
          :required="form.program_fee_idr !== ''"
      /></label>
      <label
        >Biaya program mulai berlaku<input
          v-model="form.program_fee_start"
          type="date"
          :required="form.program_fee_idr !== ''"
      /></label>
      <label
        >Biaya berikutnya (IDR, opsional)<input
          v-model="form.next_fee_idr"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
      /></label>
      <label
        >Biaya berikutnya mulai<input
          v-model="form.next_fee_start"
          type="date"
          :required="form.next_fee_idr !== ''"
      /></label>
      <label
        >Nama dokumen sumber<input
          v-model="form.source_name"
          maxlength="200"
          required
      /></label>
      <label
        >Tanggal sumber<input v-model="form.source_date" type="date" required
      /></label>
    </div>
    <label
      >Fitur rumah (satu per baris)<textarea
        v-model="form.features"
        maxlength="4000"
        rows="4"
      />
    </label>
    <label
      >Ketentuan biaya developer<textarea
        v-model="form.fee_notes"
        maxlength="1500"
        required
      />
    </label>
    <label
      >Catatan harga / sumber / ketersediaan<textarea
        v-model="form.notes"
        maxlength="2000"
        required
      />
    </label>
    <h4>Cash & cicilan developer</h4>
    <p>
      Terpisah dari bunga dan persetujuan KPR bank. Total harus cocok dengan
      pembayaran awal + jumlah bulan × angsuran.
    </p>
    <fieldset v-for="(plan, index) in plans" :key="index" class="section">
      <legend>Skema {{ index + 1 }}</legend>
      <div class="form-grid">
        <label
          >Judul<input v-model="plan.title" maxlength="120" required
        /></label>
        <label
          >Jenis<select v-model="plan.kind">
            <option value="CASH">Cash</option>
            <option value="INSTALLMENT">Cicilan developer</option>
          </select></label
        >
        <label
          v-for="field in [
            'upfront_idr',
            'months',
            'monthly_idr',
            'total_idr',
            'quota',
          ] as const"
          :key="field"
          >{{
            {
              upfront_idr: 'Pembayaran awal (IDR)',
              months: 'Jumlah bulan',
              monthly_idr: 'Angsuran per bulan (IDR)',
              total_idr: 'Total pembayaran (IDR)',
              quota: 'Kuota program',
            }[field]
          }}<input
            v-model.number="plan[field]"
            type="number"
            min="0"
            :max="
              field === 'months'
                ? 360
                : field === 'quota'
                  ? 100000
                  : 1000000000000
            "
            step="1"
            required
        /></label>
        <label
          >Mulai berlaku<input v-model="plan.valid_from" type="date" required
        /></label>
        <label
          >Terakhir berlaku<input
            v-model="plan.valid_until"
            type="date"
            required
        /></label>
        <label
          >Dokumen sumber<input
            v-model="plan.source_name"
            maxlength="200"
            required
        /></label>
      </div>
      <label
        >Ketentuan<textarea v-model="plan.notes" maxlength="1000" required />
      </label>
      <button
        class="button secondary"
        type="button"
        @click="plans.splice(index, 1)"
      >
        Hapus skema {{ index + 1 }}
      </button>
    </fieldset>
    <button
      class="button secondary"
      type="button"
      :disabled="plans.length >= 8"
      @click="addPlan"
    >
      Tambah skema pembayaran
    </button>
    <label class="checkbox-label"
      ><input v-model="verified" type="checkbox" required />Saya telah
      mencocokkan spesifikasi, periode, angka, dan ketentuan dengan dokumen
      developer.</label
    >
    <button class="button" :disabled="busy || !verified">
      Simpan spesifikasi & pembayaran
    </button>
    <p v-if="message" role="status">{{ message }}</p>
  </form>
</template>
