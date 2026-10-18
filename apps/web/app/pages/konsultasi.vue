<script setup lang="ts">
import type { Property } from '#shared/types'
import type {
  InquiryOption,
  InquiryOptionsResponse,
  InquiryPurpose,
} from '#shared/growth-types'
import {
  freshIdempotencyKey,
  jakartaPreferenceToIso,
  normalizeWhatsappInput,
  submissionFingerprint,
  type InquirySubmission,
} from '#shared/utils/inquiries'
import { consultationLink, propertyUrl } from '#shared/utils/catalog'
import { canonicalUrl } from '#shared/utils/seo'
import { developmentPhotos } from '#shared/content/flamboyan-assets'

const actualFacade = developmentPhotos[0]!
const config = useRuntimeConfig()
const { whatsappNumber } = await useDevelopment()
const route = useRoute()
const slug = computed(() =>
  typeof route.query.properti === 'string' &&
  /^[a-z0-9-]{1,160}$/.test(route.query.properti)
    ? route.query.properti
    : '',
)
const { data, error, status, refresh } = await useAsyncData(
  'consultation-property',
  () =>
    slug.value
      ? $fetch<{ data: Property }>(
          `/api/v1/properties/${encodeURIComponent(slug.value)}`,
        )
      : Promise.resolve(null),
  { watch: [slug] },
)
const {
  data: optionsResponse,
  error: optionsError,
  status: optionsStatus,
  refresh: refreshOptions,
} = await useAsyncData('inquiry-options', () =>
  $fetch<InquiryOptionsResponse>('/api/v1/inquiries/options'),
)
const property = computed(() => data.value?.data)
const options = computed(() => optionsResponse.value?.data ?? [])
const formEnabled = computed(
  () =>
    optionsResponse.value?.meta.enabled === true && options.value.length > 0 &&
    !banjaran.value && (!slug.value || options.value.some((option) => option.canonical_path === `/properti/${slug.value}`)),
)
const banjaran = computed(
  () => !slug.value && route.query.kawasan === 'banjaran',
)
const flamboyan = computed(
  () => !slug.value && route.query.kawasan === 'bukit-flamboyan-indah-2',
)
const purposes = {
  kunjungan: 'Kunjungan rumah',
  ketersediaan: 'Ketersediaan hunian',
  pembiayaan: 'Informasi pembiayaan',
} as const
const purpose = ref<keyof typeof purposes>('ketersediaan')
watch(
  () => route.query.tujuan,
  (value) => {
    purpose.value =
      value === 'kunjungan' || value === 'pembiayaan' ? value : 'ketersediaan'
  },
  { immediate: true },
)
const question = ref('')
const ready = ref(false)
const form = reactive({
  name: '',
  whatsapp_number: '',
  property_id: 0,
  purpose: (route.query.tujuan === 'kunjungan'
    ? 'VISIT_REQUEST'
    : 'CONSULTATION') as InquiryPurpose,
  preferred_visit_at: '',
  message: '',
  marketing_opt_in: false,
})
const submitBusy = ref(false)
const submitMessage = ref('')
const receipt = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
let lastFingerprint = ''
let idempotencyKey = ''
let pendingAttributionToken: string | null = null
const trackedReceipts = new Set<string>()

onMounted(() => {
  ready.value = true
})
watch(
  [options, slug],
  ([available, propertySlug]) => {
    if (!available.length) return
    const matched = propertySlug
      ? available.find((option) =>
          option.canonical_path
            .replace(/\/+$/, '')
            .endsWith(`/${propertySlug}`),
        )
      : undefined
    if (matched) form.property_id = matched.property_id
    else if (!available.some((item) => item.property_id === form.property_id))
      form.property_id = available[0]!.property_id
  },
  { immediate: true },
)
const selectedOption = computed<InquiryOption | undefined>(() =>
  options.value.find((item) => item.property_id === form.property_id),
)
const contextUrl = computed(() =>
  property.value
    ? propertyUrl(config.public.siteUrl, property.value.slug)
    : canonicalUrl(
        String(config.public.siteUrl),
        banjaran.value
          ? '/perumahan/banjaran'
          : flamboyan.value
            ? '/perumahan/bukit-flamboyan-indah-2'
            : '/properti',
      ),
)
const handoff = computed(() => {
  if (
    slug.value &&
    (!property.value || error.value || status.value === 'pending')
  )
    return null
  const link = consultationLink(
    whatsappNumber.value,
    purposes[purpose.value],
    property.value?.title ??
      (formEnabled.value ? selectedOption.value?.title : undefined) ??
      (banjaran.value
        ? 'Rencana hunian Banjaran — Flamboyan'
        : flamboyan.value
          ? 'Bukit Flamboyan Indah 2'
          : ''),
    contextUrl.value,
  )
  if (!link) return null
  const url = new URL(link)
  const detail = question.value.trim()
  if (detail)
    url.searchParams.set(
      'text',
      `${url.searchParams.get('text')}\n\nPertanyaan saya: ${detail}`,
    )
  return url.href
})

function firstError(field: string) {
  return fieldErrors.value[field]?.[0]
}
function buildSubmission(attributionToken: string | null): InquirySubmission {
  const preferred =
    form.purpose === 'VISIT_REQUEST' && form.preferred_visit_at
      ? jakartaPreferenceToIso(form.preferred_visit_at)
      : null
  return {
    name: form.name.trim(),
    whatsapp_number: normalizeWhatsappInput(form.whatsapp_number),
    property_id: form.property_id,
    purpose: form.purpose,
    ...(preferred ? { preferred_visit_at: preferred } : {}),
    ...(form.message.trim() ? { message: form.message.trim() } : {}),
    privacy_notice_version:
      optionsResponse.value?.meta.privacy_notice_version ?? '',
    marketing_opt_in: form.marketing_opt_in,
    ...(attributionToken ? { attribution_token: attributionToken } : {}),
  }
}
async function submitInquiry() {
  if (!formEnabled.value || submitBusy.value) return
  submitBusy.value = true
  submitMessage.value = ''
  fieldErrors.value = {}
  try {
    const fingerprint = submissionFingerprint(buildSubmission(null))
    if (!idempotencyKey || fingerprint !== lastFingerprint) {
      try {
        pendingAttributionToken =
          await useAcquisitionContext().submissionAttribution()
      } catch {
        pendingAttributionToken = null
      }
      idempotencyKey = freshIdempotencyKey()
      lastFingerprint = fingerprint
    }
    const body = buildSubmission(pendingAttributionToken)
    const response = await $fetch.raw<{ accepted: true; receipt: string }>(
      '/api/v1/inquiries',
      {
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': idempotencyKey },
      },
    )
    const result = response._data
    if (response.status !== 202 || result?.accepted !== true || typeof result.receipt !== 'string' || !result.receipt)
      throw new Error('Receipt belum terkonfirmasi.')
    receipt.value = result.receipt
    if (!trackedReceipts.has(result.receipt)) {
      trackedReceipts.add(result.receipt)
      tracking.track('inquiry_submitted', { property_id: body.property_id, page_type: 'consultation', lead_channel: 'website_form' })
    }
    submitMessage.value =
      'Permintaan sudah diterima. Admin akan meninjau kebutuhan dan menghubungi Anda; waktu kunjungan masih perlu dikonfirmasi.'
  } catch (caught) {
    const apiError = caught as {
      statusCode?: number
      data?: { errors?: Record<string, string[]> }
    }
    fieldErrors.value = apiError.data?.errors ?? (apiError.data as { data?: { errors?: Record<string, string[]> } })?.data?.errors ?? {}
    await nextTick()
    document.querySelector<HTMLElement>('.inquiry-form [aria-invalid="true"]')?.focus()
    submitMessage.value =
      apiError.statusCode === 409
        ? 'Isi permintaan berubah setelah percobaan sebelumnya. Periksa kembali lalu kirim ulang.'
        : apiError.statusCode === 422
          ? 'Periksa kembali isian yang ditandai.'
          : apiError.statusCode === 429
            ? 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.'
            : 'Permintaan belum tersimpan. Isian tetap ada dan Anda dapat mencoba lagi atau memakai WhatsApp.'
    if (apiError.statusCode === 409) {
      idempotencyKey = ''
      pendingAttributionToken = null
    }
  } finally {
    submitBusy.value = false
  }
}
function startAnother() {
  receipt.value = ''
  submitMessage.value = ''
  fieldErrors.value = {}
  idempotencyKey = ''
  lastFingerprint = ''
  pendingAttributionToken = null
}
const analytics = usePropertyAnalytics()
const tracking = useAnalytics()
function record() {
  if (property.value) analytics.record(property.value.id, 'whatsapp_click')
  tracking.track('click_whatsapp', {
    property_id: property.value?.id,
    property_type: property.value?.house_type,
    page_type: 'consultation',
    lead_channel: 'whatsapp',
  })
}
useSeoMeta({
  title: 'Konsultasi hunian & kunjungan',
  description:
    'Kirim permintaan konsultasi Bukit Flamboyan Indah 2 atau lanjutkan percakapan bersama Admin melalui WhatsApp.',
  robots: () =>
    route.query.properti || route.query.tujuan || route.query.kawasan
      ? 'noindex, follow'
      : 'index, follow',
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl(String(config.public.siteUrl), '/konsultasi'),
    },
  ],
})
</script>

<template>
  <section class="container section consultation-layout">
    <div class="editorial-page-heading">
      <p class="eyebrow">KONSULTASI BUKIT FLAMBOYAN INDAH 2</p>
      <h1>Mulai dari<br />percakapan.</h1>
      <p>
        Kirim permintaan agar Admin dapat meninjau kebutuhan Anda, atau hubungi
        WhatsApp langsung. Keduanya tetap tersedia sebagai pilihan terpisah.
      </p>
      <ol class="consultation-steps">
        <li>
          <span>01</span>
          <div>
            <h3>Pilih tipe rumah</h3>
            <p>
              Pilihan formulir berasal dari katalog BFI2 yang sedang
              dipublikasikan.
            </p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <h3>Kirim kebutuhan</h3>
            <p>
              Admin menerima permintaan untuk ditinjau sebelum menjadi calon
              pembeli yang valid.
            </p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <h3>Konfirmasi berikutnya</h3>
            <p>
              Waktu kunjungan dan ketersediaan unit dikonfirmasi langsung oleh
              Admin.
            </p>
          </div>
        </li>
      </ol>
      <figure class="consultation-image">
        <img
          v-if="!banjaran"
          :src="actualFacade.src"
          :srcset="
            actualFacade.sources
              .map((source) => `${source.url} ${source.width}w`)
              .join(', ')
          "
          sizes="(max-width: 760px) 100vw, 50vw"
          :width="actualFacade.width"
          :height="actualFacade.height"
          loading="lazy"
          :alt="actualFacade.alt"
        />
        <img
          v-else
          src="/images/editorial-garden-960.webp"
          width="960"
          height="640"
          loading="lazy"
          alt="Foto inspirasi hunian tropis, bukan lokasi atau rancangan final Banjaran."
        />
        <figcaption v-if="!banjaran">{{ actualFacade.caption }}</figcaption>
        <figcaption v-else>
          Foto inspirasi, bukan lokasi proyek · Sergei Bezzubov / Unsplash.
        </figcaption>
      </figure>
    </div>

    <div class="consultation-panel">
      <p class="eyebrow">PERMINTAAN ANDA</p>
      <h2>Konsultasi atau kunjungan?</h2>
      <div v-if="slug && status === 'pending'" role="status" class="notice">
        Memuat pilihan rumah…
      </div>
      <div v-else-if="slug && error" role="alert" class="notice">
        <p>
          Informasi rumah pada tautan belum dapat dimuat. Anda tetap dapat
          memilih tipe dari formulir atau WhatsApp.
        </p>
        <button class="button secondary" type="button" @click="refresh()">
          Coba lagi
        </button>
      </div>
      <div v-else-if="property" class="consultation-property">
        <span class="muted">Rumah pilihan</span>
        <h3>{{ property.title }}</h3>
        <p>{{ property.location }}</p>
        <NuxtLink class="text-link" :to="`/properti/${property.slug}`"
          >Lihat kembali rumah<AppIcon name="arrow" /></NuxtLink
        >
      </div>
      <div v-else-if="banjaran" class="consultation-property">
        <span class="muted">Kawasan yang Anda minati</span>
        <h3>Banjaran · hunian mendatang</h3>
        <p>
          Form permintaan saat ini khusus Bukit Flamboyan Indah 2. Untuk rencana
          Banjaran, gunakan WhatsApp tanpa klaim jadwal atau harga.
        </p>
      </div>

      <div v-if="optionsStatus === 'pending'" class="notice" role="status">
        Menyiapkan formulir aman…
      </div>
      <div v-else-if="optionsError" class="notice" role="alert">
        <p>
          Form permintaan belum dapat dimuat. Anda masih dapat berkonsultasi
          melalui WhatsApp.
        </p>
        <button
          class="button secondary"
          type="button"
          @click="refreshOptions()"
        >
          Coba muat lagi
        </button>
      </div>
      <div v-else-if="!formEnabled" class="notice" role="status">
        Form permintaan sedang tidak tersedia. Gunakan WhatsApp Admin untuk
        melanjutkan.
      </div>
      <div v-else-if="receipt" class="inquiry-receipt" role="status">
        <p class="eyebrow">PERMINTAAN DITERIMA</p>
        <h3>Terima kasih, permintaan Anda sudah tersimpan.</h3>
        <p>{{ submitMessage }}</p>
        <p class="muted">
          Kode penerimaan: <strong>{{ receipt }}</strong
          >. Kode ini bukan nomor pemesanan atau konfirmasi kunjungan.
        </p>
        <button class="button secondary" type="button" @click="startAnother">
          Kirim permintaan lain
        </button>
      </div>
      <form v-else class="inquiry-form" @submit.prevent="submitInquiry">
        <label
          >Nama lengkap<input
            v-model="form.name"
            name="name"
            required
            maxlength="160"
            autocomplete="name"
            :aria-invalid="!!firstError('name')"
            :aria-describedby="firstError('name') ? 'inquiry-name-error' : undefined"
          /><small v-if="firstError('name')" id="inquiry-name-error" class="error-text">{{
            firstError('name')
          }}</small></label
        >
        <label
          >Nomor WhatsApp<input
            v-model="form.whatsapp_number"
            name="whatsapp_number"
            required
            type="tel"
            inputmode="tel"
            maxlength="30"
            autocomplete="tel"
            placeholder="Contoh: 081234567890"
            :aria-invalid="!!firstError('whatsapp_number')"
            :aria-describedby="firstError('whatsapp_number') ? 'inquiry-phone-error' : undefined"
          /><small v-if="firstError('whatsapp_number')" id="inquiry-phone-error" class="error-text">{{
            firstError('whatsapp_number')
          }}</small></label
        >
        <label
          >Tipe rumah yang diminati<select
            v-model.number="form.property_id"
            name="property_id"
            required
            :aria-invalid="!!firstError('property_id')"
            :aria-describedby="firstError('property_id') ? 'inquiry-property-error' : undefined"
          >
            <option
              v-for="option in options"
              :key="option.property_id"
              :value="option.property_id"
            >
              {{ option.title }}
            </option></select
          ><small v-if="firstError('property_id')" id="inquiry-property-error" class="error-text">{{
            firstError('property_id')
          }}</small></label
        >
        <fieldset class="inquiry-purpose">
          <legend>Tujuan permintaan</legend>
          <label
            ><input v-model="form.purpose" type="radio" value="CONSULTATION" />
            Konsultasi informasi</label
          ><label
            ><input v-model="form.purpose" type="radio" value="VISIT_REQUEST" />
            Meminta kunjungan</label
          >
        </fieldset>
        <label v-if="form.purpose === 'VISIT_REQUEST'"
          >Pilihan waktu kunjungan <span class="muted">(opsional)</span
          ><input
            v-model="form.preferred_visit_at"
            name="preferred_visit_at"
            type="datetime-local"
            :aria-invalid="!!firstError('preferred_visit_at')"
            aria-describedby="inquiry-visit-help inquiry-visit-error"
          /><small
            id="inquiry-visit-help"
            >Waktu memakai WIB (Asia/Jakarta) dan masih menunggu konfirmasi
            Admin.</small
          ><small v-if="firstError('preferred_visit_at')" id="inquiry-visit-error" class="error-text">{{
            firstError('preferred_visit_at')
          }}</small></label
        >
        <label
          >Pesan singkat <span class="muted">(opsional)</span
          ><textarea
            v-model="form.message"
            name="message"
            rows="4"
            maxlength="1000"
            :aria-invalid="!!firstError('message')"
            aria-describedby="inquiry-message-help inquiry-message-error"
            placeholder="Ceritakan kebutuhan rumah atau waktu yang ingin dibicarakan."
          /><small
            id="inquiry-message-help"
            >Jangan masukkan NIK, dokumen, slip gaji, atau data finansial
            rinci.</small
          ><small v-if="firstError('message')" id="inquiry-message-error" class="error-text">{{
            firstError('message')
          }}</small></label
        >
        <label class="checkbox-label inquiry-opt-in"
          ><input v-model="form.marketing_opt_in" type="checkbox" />Saya
          bersedia menerima informasi promo Flamboyan. Pilihan ini opsional dan
          tidak memengaruhi permintaan konsultasi.</label
        >
        <p class="muted consultation-note">
          Dengan mengirim, Anda meminta Admin memproses data kontak untuk
          menanggapi kebutuhan ini sesuai
          <a :href="optionsResponse?.meta.privacy_notice_url || '/privasi'"
            >informasi privasi</a
          >
          versi {{ optionsResponse?.meta.privacy_notice_version }}. Persetujuan
          promo terpisah dari pilihan cookie.
        </p>
        <p v-if="optionsResponse?.meta.service_hours_notice" class="notice">
          {{ optionsResponse.meta.service_hours_notice }}
        </p>
        <p v-if="submitMessage" class="error-text" role="alert">
          {{ submitMessage }}
        </p>
        <button class="button full" :disabled="submitBusy">
          {{ submitBusy ? 'Menyimpan…' : 'Kirim permintaan' }}
        </button>
      </form>

      <div class="consultation-wa-fallback">
        <p class="eyebrow">ATAU WHATSAPP LANGSUNG</p>
        <label
          >Topik WhatsApp<select v-model="purpose" :disabled="!ready">
            <option
              v-for="(label, value) in purposes"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select></label
        >
        <label
          >Pertanyaan WhatsApp <span class="muted">(opsional)</span
          ><textarea
            v-model="question"
            :disabled="!ready"
            maxlength="600"
            rows="3"
            placeholder="Pesan ini hanya disiapkan di perangkat Anda."
          />
        </label>
        <a
          v-if="handoff && ready"
          :href="handoff"
          class="button secondary full"
          target="_blank"
          rel="noopener noreferrer"
          @click="record"
          >Lanjutkan ke WhatsApp<AppIcon name="whatsapp" /></a
        >
        <button
          v-else-if="handoff"
          class="button secondary full"
          type="button"
          disabled
        >
          Lanjutkan ke WhatsApp<AppIcon name="whatsapp" />
        </button>
        <p v-else class="notice" role="status">
          Kontak konsultasi belum tersedia.
        </p>
      </div>
      <NuxtLink class="text-link consultation-back" to="/properti"
        >Masih ingin melihat pilihan? Jelajahi hunian<AppIcon name="arrow" /></NuxtLink
      >
    </div>
  </section>
</template>
