<script setup lang="ts">
import type {
  EditorialContent,
  InternalMedia,
  Paginated,
  RatePhase,
} from '#shared/types'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Konten publik', robots: 'noindex, nofollow' })
const api = useStaffApi()
const session = useStaffSession()
const results = ref<Paginated<EditorialContent> | null>(null)
const message = ref('')
const success = ref(false)
const busy = ref(false)
const selected = ref<EditorialContent | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const kind = ref<EditorialContent['kind']>('HERO')
const contentFilter = ref<EditorialContent['kind'] | ''>('')
const contentPurposes = [
  {
    kind: 'HERO' as const,
    title: 'Sorotan beranda',
    description: 'Judul, gambar pendamping, dan video YouTube beranda.',
  },
  {
    kind: 'DEVELOPMENT' as const,
    title: 'Kawasan & kontak',
    description: 'Alamat, fasilitas, dan nomor WhatsApp.',
  },
  {
    kind: 'BANK_RATE' as const,
    title: 'Referensi KPR',
    description: 'Suku bunga, masa berlaku, dan biaya bank.',
  },
  {
    kind: 'FINANCING_PROGRAM' as const,
    title: 'Pembiayaan BSI & BNI',
    description: 'Angsuran tetap dan informasi pembiayaan kawasan.',
  },
  {
    kind: 'TESTIMONIAL' as const,
    title: 'Cerita pembeli',
    description: 'Pengalaman pembeli yang sudah berizin.',
  },
  {
    kind: 'BANK_PARTNER' as const,
    title: 'Bank mitra',
    description: 'Logo dan kemitraan yang sudah dikonfirmasi.',
  },
]
async function selectContent(value: EditorialContent['kind'] | '') {
  contentFilter.value = value
  if (value) kind.value = value
  await load()
}
const form = reactive({
  published: false,
  position: 0,
  payload: {} as Record<string, string | number | null>,
})
const verified = ref(false)
const phases = ref<RatePhase[]>([])
watch(
  phases,
  () => {
    verified.value = false
  },
  { deep: true, flush: 'sync' },
)
function removePhase(index: number) {
  phases.value.splice(index, 1)
}
function addPhase() {
  phases.value.push({
    months: 12,
    annual_rate: Number(form.payload.annual_rate),
  })
}
const heroProperty = ref<number | null>(null)
const heroMediaId = ref<number | null>(null)
const bannerMediaIds = ref<number[]>([])
const bannerPhotoId = ref<number | null>(null)
const bannerPhotoOptions = computed(() =>
  heroMediaOptions.value.filter((item) => item.kind === 'PHOTO'),
)
function addBannerPhoto() {
  if (
    !bannerPhotoId.value ||
    bannerMediaIds.value.length >= 5 ||
    bannerMediaIds.value.includes(bannerPhotoId.value)
  )
    return
  bannerMediaIds.value.push(bannerPhotoId.value)
  bannerPhotoId.value = null
}
function moveBannerPhoto(index: number, direction: number) {
  const target = index + direction
  if (target < 0 || target >= bannerMediaIds.value.length) return
  const [id] = bannerMediaIds.value.splice(index, 1)
  bannerMediaIds.value.splice(target, 0, id!)
}
watch(
  bannerMediaIds,
  () => {
    verified.value = false
  },
  { deep: true, flush: 'sync' },
)
const heroMediaOptions = ref<InternalMedia[]>([])
const heroPropertyVersion = ref<number | null>(null)
const mediaLoading = ref(false)
const mediaError = ref('')
const logoFile = ref<File | null>(null)
const logoVerified = ref(false)
const logoInput = ref<HTMLInputElement | null>(null)
let mediaRequest = 0
async function loadHeroMedia(propertyId: number | null) {
  const request = ++mediaRequest
  heroMediaOptions.value = []
  mediaError.value = ''
  if (!propertyId) {
    heroPropertyVersion.value = null
    mediaLoading.value = false
    return
  }
  mediaLoading.value = true
  try {
    const property = await api.request<{ data: { version: number } }>(
      `/api/v1/internal/properties/${propertyId}`,
    )
    if (request === mediaRequest)
      heroPropertyVersion.value = property.data.version
    const media: InternalMedia[] = []
    let page = 1
    let lastPage = 1
    do {
      const result = await api.request<Paginated<InternalMedia>>(
        '/api/v1/internal/properties/' + propertyId + '/media?page=' + page,
      )
      media.push(...result.data)
      lastPage = result.meta.last_page
      page++
    } while (page <= lastPage && request === mediaRequest)
    if (request === mediaRequest)
      heroMediaOptions.value = media.filter(
        (item) =>
          item.state === 'READY' &&
          item.published &&
          (item.kind === 'PHOTO' || item.kind === 'VIDEO'),
      )
  } catch (error) {
    if (request === mediaRequest) mediaError.value = staffError(error)
  } finally {
    if (request === mediaRequest) mediaLoading.value = false
  }
}
async function uploadLogo() {
  if (!selected.value || !logoFile.value) return
  busy.value = true
  message.value = ''
  try {
    const body = new FormData()
    body.append('file', logoFile.value)
    body.append('version', String(selected.value.version))
    body.append('verified', logoVerified.value ? '1' : '0')
    const result = await api.request<{ data: EditorialContent }>(
      '/api/v1/internal/content/' + selected.value.id + '/logo',
      { method: 'POST', body },
    )
    selected.value = result.data
    logoFile.value = null
    logoVerified.value = false
    if (logoInput.value) logoInput.value.value = ''
    await load()
    message.value =
      'Logo tersimpan. Tinjau konten dan aktifkan Publikasikan untuk menampilkannya di beranda.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
const schemas = {
  HERO: [
    { key: 'title', label: 'Judul hero', type: 'text', max: 160 },
    {
      key: 'description',
      label: 'Deskripsi hero',
      type: 'textarea',
      max: 1000,
    },
    { key: 'eyebrow', label: 'Label hero', type: 'text', max: 100 },
    {
      key: 'video_url',
      label: 'Tautan YouTube beranda (opsional)',
      type: 'url',
      max: 2048,
      optional: true,
    },
    {
      key: 'video_title',
      label: 'Judul video beranda',
      type: 'text',
      max: 240,
      optional: true,
    },
    {
      key: 'video_autoplay',
      label: 'Pemutaran video beranda',
      type: 'select',
      max: 0,
      optional: true,
    },
  ],
  TESTIMONIAL: [
    { key: 'name', label: 'Nama publik berizin', type: 'text', max: 160 },
    {
      key: 'quote',
      label: 'Cerita pembeli berizin',
      type: 'textarea',
      max: 2000,
    },
    { key: 'context', label: 'Keterangan publik', type: 'text', max: 160 },
  ],
  BANK_PARTNER: [
    { key: 'name', label: 'Nama bank mitra', type: 'text', max: 120 },
    { key: 'website', label: 'Situs resmi bank HTTPS', type: 'url', max: 2048 },
  ],
  DEVELOPMENT: [
    {
      key: 'name',
      label: 'Nama kawasan / pengelola publik (termasuk halaman privasi)',
      type: 'text',
      max: 160,
    },
    { key: 'developer', label: 'Pengembang', type: 'text', max: 160 },
    { key: 'address', label: 'Alamat kawasan', type: 'text', max: 500 },
    {
      key: 'whatsapp',
      label: 'WhatsApp kunjungan (format 62…)',
      type: 'text',
      max: 15,
    },
    { key: 'website', label: 'Situs pengembang HTTPS', type: 'url', max: 2048 },
    {
      key: 'planned_units',
      label: 'Total rencana unit (bukan jumlah tersedia)',
      type: 'number',
      max: 100000,
    },
    { key: 'house_types', label: 'Jumlah tipe', type: 'number', max: 1000 },
    {
      key: 'facilities',
      label: 'Fasilitas kawasan (satu per baris)',
      type: 'textarea',
      max: 3000,
    },
    {
      key: 'nearby',
      label: 'Fasilitas sekitar (satu per baris, tanpa jarak perkiraan)',
      type: 'textarea',
      max: 3000,
    },
    { key: 'source_name', label: 'Dokumen sumber', type: 'text', max: 200 },
    {
      key: 'source_date',
      label: 'Tanggal dokumen sumber',
      type: 'date',
      max: 0,
    },
    {
      key: 'notes',
      label: 'Ketentuan kawasan / verifikasi fasilitas',
      type: 'textarea',
      max: 2000,
    },
  ],
  FINANCING_PROGRAM: [
    { key: 'bank', label: 'Bank (BSI atau BNI)', type: 'text', max: 3 },
    { key: 'product', label: 'Nama program', type: 'text', max: 160 },
    {
      key: 'house_types',
      label: 'Tipe rumah, pisahkan koma (wajib 36/60 untuk BSI Flat)',
      type: 'text',
      max: 100,
      optional: true,
    },
    { key: 'development_name', label: 'Nama kawasan', type: 'text', max: 160 },
    {
      key: 'price_idr',
      label: 'Harga rumah pada penawaran BSI (IDR)',
      type: 'number',
      max: 1000000000000,
    },
    {
      key: 'down_payment_idr',
      label: 'DP pada penawaran BSI (IDR)',
      type: 'number',
      max: 1000000000000,
    },
    {
      key: 'total_margin_idr',
      label: 'Total margin akad BSI (IDR, bukan persen)',
      type: 'number',
      max: 1000000000000,
    },
    {
      key: 'method',
      label: 'Jenis informasi pembiayaan',
      type: 'text',
      max: 30,
    },
    {
      key: 'monthly_idr',
      label: 'Angsuran tetap per bulan (IDR)',
      type: 'number',
      max: 1000000000000,
    },
    {
      key: 'tenor_months',
      label: 'Tenor angsuran tetap (bulan)',
      type: 'number',
      max: 360,
    },
    { key: 'source_name', label: 'Sumber informasi', type: 'text', max: 200 },
    {
      key: 'source_url',
      label: 'Tautan sumber bank HTTPS (bila tersedia)',
      type: 'url',
      max: 2048,
      optional: true,
    },
    {
      key: 'checked_date',
      label: 'Tanggal pemeriksaan sumber',
      type: 'date',
      max: 0,
    },
    {
      key: 'conditions',
      label: 'Cakupan tipe, syarat dan biaya',
      type: 'textarea',
      max: 2500,
    },
  ],
  BANK_RATE: [
    {
      key: 'min_principal_idr',
      label: 'Plafon minimum (IDR)',
      type: 'number',
      max: 1000000000000,
      optional: true,
    },
    {
      key: 'max_principal_idr',
      label: 'Plafon maksimum (IDR)',
      type: 'number',
      max: 1000000000000,
      optional: true,
    },
    {
      key: 'max_ltv_percent',
      label: 'LTV maksimum produk (%) — isi hanya dengan ketentuan bank',
      type: 'number',
      max: 100,
      optional: true,
    },
    { key: 'bank', label: 'Nama bank', type: 'text', max: 120 },
    { key: 'product', label: 'Nama produk', type: 'text', max: 160 },
    { key: 'annual_rate', label: 'Bunga tahunan (%)', type: 'number', max: 30 },
    {
      key: 'fixed_months',
      label: 'Masa fixed (bulan)',
      type: 'number',
      max: 360,
    },
    {
      key: 'effective_date',
      label: 'Tanggal mulai berlaku',
      type: 'date',
      max: 0,
    },
    {
      key: 'valid_until',
      label: 'Tanggal akhir berlaku',
      type: 'date',
      max: 0,
    },
    {
      key: 'source_url',
      label: 'Sumber resmi bank HTTPS',
      type: 'url',
      max: 2048,
    },
    {
      key: 'floating_rate',
      label: 'Floating saat diperiksa (%) — bukan jaminan masa depan',
      type: 'number',
      max: 30,
      optional: true,
    },
    {
      key: 'min_tenor_months',
      label: 'Tenor minimum (bulan)',
      type: 'number',
      max: 360,
      optional: true,
    },
    {
      key: 'max_tenor_months',
      label: 'Tenor maksimum (bulan)',
      type: 'number',
      max: 360,
      optional: true,
    },
    {
      key: 'checked_date',
      label: 'Tanggal pemeriksaan sumber bank',
      type: 'date',
      max: 0,
      optional: true,
    },
    {
      key: 'conditions',
      label:
        'Syarat produk, kelompok nasabah, plafon, pengembang dan biaya yang belum tercakup',
      type: 'textarea',
      max: 2500,
      optional: true,
    },
    {
      key: 'provision_percent',
      label: 'Provisi (% plafon)',
      type: 'number',
      max: 10,
      optional: true,
    },
    {
      key: 'admin_percent',
      label: 'Administrasi (% plafon)',
      type: 'number',
      max: 10,
      optional: true,
    },
    {
      key: 'admin_min_idr',
      label: 'Administrasi minimum / tetap (IDR)',
      type: 'number',
      max: 1000000000000,
      optional: true,
    },
    {
      key: 'admin_max_idr',
      label: 'Administrasi maksimum (IDR)',
      type: 'number',
      max: 1000000000000,
      optional: true,
    },
    {
      key: 'appraisal_min_idr',
      label: 'Appraisal minimum (IDR)',
      type: 'number',
      max: 1000000000000,
      optional: true,
    },
    {
      key: 'appraisal_max_idr',
      label: 'Appraisal maksimum (IDR)',
      type: 'number',
      max: 1000000000000,
      optional: true,
    },
  ],
} as const
const visibleSchema = computed(() =>
  schemas[kind.value].filter((field) => {
    if (kind.value !== 'FINANCING_PROGRAM') return true
    if (field.key === 'monthly_idr')
      return form.payload.method === 'FIXED_INSTALLMENT'
    if (field.key === 'tenor_months')
      return form.payload.method !== 'REFERENCE_ONLY'
    if (
      ['price_idr', 'down_payment_idr', 'total_margin_idr'].includes(field.key)
    )
      return form.payload.method === 'MURABAHAH_QUOTE'
    return true
  }),
)
watch(
  () => form.payload,
  () => {
    verified.value = false
  },
  { deep: true, flush: 'sync' },
)
watch(
  heroProperty,
  (propertyId) => {
    verified.value = false
    heroMediaId.value = null
    bannerMediaIds.value = []
    bannerPhotoId.value = null
    heroPropertyVersion.value = null
    void loadHeroMedia(propertyId)
  },
  { flush: 'sync' },
)
watch(heroMediaId, () => {
  verified.value = false
})
async function load(page = 1) {
  busy.value = true
  try {
    await session.refresh()
    if (session.account.value?.role !== 'ADMIN') {
      message.value = 'Halaman ini hanya untuk Admin.'
      return
    }
    results.value = await api.request(
      `/api/v1/internal/content?page=${page}${contentFilter.value ? '&kind=' + contentFilter.value : ''}`,
    )
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
function open(record?: EditorialContent) {
  selected.value = record ?? null
  kind.value = record?.kind ?? kind.value
  form.published = record?.published ?? false
  form.position = record?.position ?? 0
  phases.value = Array.isArray(record?.payload.phases)
    ? JSON.parse(JSON.stringify(record.payload.phases))
    : []
  form.payload = record
    ? (Object.fromEntries(
        Object.entries(record.payload).filter(
          ([key, value]) => key !== 'phases' && !Array.isArray(value),
        ),
      ) as Record<string, string | number | null>)
    : Object.fromEntries(
        schemas[kind.value].map((field) => [
          field.key,
          'optional' in field && field.optional
            ? ''
            : field.type === 'number'
              ? field.key === 'fixed_months'
                ? 36
                : 0
              : '',
        ]),
      )
  if (kind.value === 'FINANCING_PROGRAM')
    form.payload.house_types = Array.isArray(record?.payload.house_types)
      ? record.payload.house_types.join(', ')
      : ''
  heroProperty.value =
    typeof record?.payload.property_id === 'number'
      ? record.payload.property_id
      : null
  if (kind.value === 'FINANCING_PROGRAM' && !record) {
    form.payload.method = 'REFERENCE_ONLY'
    form.payload.development_name = 'Bukit Flamboyan Indah 2'
  }
  heroMediaId.value =
    typeof record?.payload.media_id === 'number'
      ? record.payload.media_id
      : null
  bannerMediaIds.value = Array.isArray(record?.payload.banner_media_ids)
    ? ([...record.payload.banner_media_ids] as number[])
    : []
  bannerPhotoId.value = null
  if (kind.value === 'HERO') {
    form.payload.video_autoplay =
      record?.payload.video_autoplay === false ? 0 : 1
    void loadHeroMedia(heroProperty.value)
  }
  logoFile.value = null
  logoVerified.value = false
  if (logoInput.value) logoInput.value.value = ''
  verified.value = false
  message.value = ''
  dialog.value?.showModal()
}
async function save() {
  busy.value = true
  try {
    const payload: EditorialContent['payload'] = {
      ...form.payload,
      ...(kind.value === 'HERO'
        ? {
            property_id: heroProperty.value,
            media_id: heroMediaId.value,
            banner_media_ids: bannerMediaIds.value,
          }
        : {}),
    }
    for (const field of schemas[kind.value]) {
      if (
        'optional' in field &&
        field.optional &&
        (payload[field.key] === '' ||
          payload[field.key] === undefined ||
          payload[field.key] === null)
      )
        Reflect.deleteProperty(payload, field.key)
      else if (field.type === 'number')
        payload[field.key] = Number(payload[field.key])
    }
    if (
      kind.value === 'FINANCING_PROGRAM' &&
      typeof payload.house_types === 'string'
    )
      payload.house_types = payload.house_types
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    if (kind.value === 'HERO') {
      payload.video_autoplay = Number(form.payload.video_autoplay) === 1
      if (!payload.video_url) {
        payload.video_url = null
        payload.video_title = null
      }
    }
    if (kind.value === 'BANK_RATE' && phases.value.length)
      payload.phases = phases.value
    if (kind.value === 'FINANCING_PROGRAM') {
      if (Array.isArray(payload.house_types) && !payload.house_types.length)
        delete payload.house_types
      if (payload.method !== 'MURABAHAH_QUOTE') {
        delete payload.price_idr
        delete payload.down_payment_idr
        delete payload.total_margin_idr
      }
      if (payload.method !== 'FIXED_INSTALLMENT') delete payload.monthly_idr
    }
    if (
      kind.value === 'FINANCING_PROGRAM' &&
      payload.method === 'REFERENCE_ONLY'
    ) {
      delete payload.monthly_idr
      delete payload.tenor_months
    }
    const result = await api.request<{ data: EditorialContent }>(
      `/api/v1/internal/content${selected.value ? `/${selected.value.id}` : ''}`,
      {
        method: selected.value ? 'PATCH' : 'POST',
        body: {
          kind: kind.value,
          published: form.published,
          position: form.position,
          payload,
          verified: verified.value,
          ...(selected.value ? { version: selected.value.version } : {}),
        },
      },
    )
    if (kind.value === 'BANK_PARTNER') selected.value = result.data
    else dialog.value?.close()
    await load()
    success.value = true
    message.value =
      kind.value === 'BANK_PARTNER' && !selected.value?.logo_uploaded
        ? 'Konten tersimpan. Unggah logo berizin di bawah, lalu publikasikan setelah ditinjau.'
        : 'Konten tersimpan.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(() => load())
</script>
<template>
  <section class="container section">
    <p class="eyebrow">ADMIN · KONTEN</p>
    <h1 class="page-title">Konten publik</h1>
    <p class="muted">
      Pilih bagian website yang ingin diperbarui. Simpan sebagai draf untuk
      ditinjau, lalu publikasikan ketika informasinya siap.
    </p>
    <p
      v-if="message && !dialog?.open"
      :role="success ? 'status' : 'alert'"
      :class="success ? 'success-notice' : 'error-text'"
    >
      {{ message }}
    </p>
    <template v-if="session.account.value?.role === 'ADMIN'"
      ><div class="content-purpose-grid" aria-label="Bagian konten website">
        <button
          v-for="purpose in contentPurposes"
          :key="purpose.kind"
          :aria-pressed="contentFilter === purpose.kind"
          :disabled="busy"
          @click="selectContent(purpose.kind)"
        >
          <strong>{{ purpose.title }}</strong
          ><span>{{ purpose.description }}</span>
        </button>
      </div>
      <div class="results-heading">
        <h2>
          {{
            contentPurposes.find((item) => item.kind === contentFilter)
              ?.title ?? 'Semua konten website'
          }}
        </h2>
        <button
          v-if="contentFilter"
          class="text-button"
          @click="selectContent('')"
        >
          Lihat semua bagian
        </button>
      </div>
      <div class="editor-actions">
        <label
          >Jenis konten baru<select v-model="kind">
            <option value="HERO">Sorotan beranda</option>
            <option value="TESTIMONIAL">Cerita pembeli</option>
            <option value="BANK_RATE">Referensi KPR</option>
            <option value="FINANCING_PROGRAM">Pembiayaan BSI & BNI</option>
            <option value="BANK_PARTNER">Bank mitra</option>
            <option value="DEVELOPMENT">Kawasan & kontak</option>
          </select></label
        ><button class="button" :disabled="busy" @click="open()">
          Tambah konten
        </button>
      </div>
      <div
        class="table-scroll responsive-records"
        role="region"
        aria-label="Tabel data, geser untuk melihat kolom lainnya"
        tabindex="0"
      >
        <table>
          <caption>
            Konten editorial, termasuk draf dan suku bunga kedaluwarsa
          </caption>
          <thead>
            <tr>
              <th>Jenis konten</th>
              <th>Judul / nama</th>
              <th>Publikasi</th>
              <th>Urutan</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in results?.data" :key="record.id">
              <td data-label="Jenis konten">
                {{
                  {
                    HERO: 'Sorotan beranda',
                    TESTIMONIAL: 'Cerita pembeli',
                    BANK_RATE: 'Referensi KPR',
                    FINANCING_PROGRAM: 'Pembiayaan BSI & BNI',
                    BANK_PARTNER: 'Bank mitra',
                    DEVELOPMENT: 'Kawasan & kontak',
                  }[record.kind]
                }}
              </td>
              <td data-label="Judul / nama">
                {{
                  record.payload.title ??
                  record.payload.name ??
                  record.payload.bank
                }}
              </td>
              <td data-label="Publikasi">
                <span class="badge">{{
                  record.published ? 'Publik' : 'Draf'
                }}</span>
              </td>
              <td data-label="Urutan">{{ record.position }}</td>
              <td data-label="Tindakan">
                <button class="button secondary" @click="open(record)">
                  Edit konten #{{ record.id }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="results && !results.data.length" class="notice">
        {{
          contentFilter
            ? 'Belum ada konten untuk bagian ini. Pilih “Lihat semua bagian” untuk melihat seluruh konten.'
            : 'Belum ada konten. Tidak ada cerita pembeli atau suku bunga yang dibuat otomatis.'
        }}
      </p>
      <nav
        v-if="results && results.meta.last_page > 1"
        class="pagination"
        aria-label="Halaman konten"
      >
        <button
          v-if="results.meta.current_page > 1"
          class="button secondary"
          @click="load(results.meta.current_page - 1)"
        >
          Sebelumnya</button
        ><span
          >{{ results.meta.current_page }}/{{ results.meta.last_page }}</span
        ><button
          v-if="results.meta.current_page < results.meta.last_page"
          class="button secondary"
          @click="load(results.meta.current_page + 1)"
        >
          Berikutnya
        </button>
      </nav></template
    >
    <dialog ref="dialog" class="editor-dialog" aria-labelledby="content-title">
      <h2 id="content-title">
        {{ selected ? 'Edit' : 'Tambah' }}
        {{ contentPurposes.find((item) => item.kind === kind)?.title }}
      </h2>
      <form @submit.prevent="save">
        <div class="form-grid">
          <label v-for="field in visibleSchema" :key="field.key"
            >{{ field.label
            }}<select
              v-if="kind === 'FINANCING_PROGRAM' && field.key === 'method'"
              v-model="form.payload.method"
            >
              <option value="FIXED_INSTALLMENT">Angsuran tetap</option>
              <option value="MURABAHAH_QUOTE">
                Penawaran BSI murabahah per tipe
              </option>
              <option value="REFERENCE_ONLY">
                Informasi bank — tarif belum dikonfirmasi
              </option></select
            ><select
              v-else-if="kind === 'HERO' && field.key === 'video_autoplay'"
              v-model="form.payload.video_autoplay"
            >
              <option :value="1">Otomatis tanpa suara · putar berulang</option>
              <option :value="0">
                Putar setelah dipilih pengunjung
              </option></select
            ><textarea
              v-else-if="field.type === 'textarea'"
              v-model="form.payload[field.key]"
              :required="!('optional' in field && field.optional)"
              :maxlength="field.max" /><NumberInput
              v-else-if="field.type === 'number'"
              v-model="form.payload[field.key]"
              :required="!('optional' in field && field.optional)"
              :max="field.max"
              :min="
                field.key === 'fixed_months' || field.key === 'monthly_idr'
                  ? 1
                  : field.key === 'tenor_months'
                    ? 12
                    : 0
              "
              :step="
                field.key === 'annual_rate' ||
                field.key.endsWith('_rate') ||
                field.key.endsWith('_percent')
                  ? '0.01'
                  : '1'
              " /><input
              v-else
              v-model="form.payload[field.key]"
              :required="!('optional' in field && field.optional)"
              :type="field.type"
              :maxlength="
                field.type === 'text' || field.type === 'url'
                  ? field.max
                  : undefined
              " /></label
          ><label
            >Urutan<NumberInput
              v-model.number="form.position"
              min="0"
              max="1000"
              step="1"
              required
          /></label>
        </div>
        <section v-if="kind === 'BANK_RATE'">
          <h3>Bunga fixed berjenjang (opsional)</h3>
          <p>
            Jumlah bulan tahapan harus sama dengan masa fixed. Bunga tahap
            pertama harus sama dengan bunga awal. Kosongkan untuk fixed satu
            tahap. Angka biaya yang kosong berarti belum diketahui, bukan
            gratis.
          </p>
          <div v-for="(phase, index) in phases" :key="index" class="form-grid">
            <label
              >Durasi tahap {{ index + 1 }} (bulan)<NumberInput
                v-model.number="phase.months"
                min="1"
                max="360"
                required
                @input="verified = false"
            /></label>
            <label
              >Bunga efektif tahap {{ index + 1 }} (% per tahun)<NumberInput
                v-model.number="phase.annual_rate"
                min="0"
                max="30"
                step="0.01"
                required
                @input="verified = false"
            /></label>
            <button
              type="button"
              class="button secondary"
              @click="removePhase(index)"
            >
              Hapus tahap {{ index + 1 }}
            </button>
          </div>
          <button
            type="button"
            class="button secondary"
            :disabled="phases.length >= 10"
            @click="addPhase"
          >
            Tambah tahap bunga
          </button>
        </section>
        <StaffPicker
          v-if="kind === 'HERO'"
          v-model="heroProperty"
          kind="property"
          :published-only="true"
          :required="false"
          label="Properti hero (opsional, properti publik saja)"
        />
        <template v-if="kind === 'HERO' && heroProperty">
          <label
            >Foto atau video hero<select
              v-model="heroMediaId"
              :disabled="mediaLoading || busy"
            >
              <option :value="null">Gunakan ilustrasi kawasan Flamboyan</option>
              <option
                v-if="
                  heroMediaId &&
                  !heroMediaOptions.some((item) => item.id === heroMediaId)
                "
                :value="heroMediaId"
                disabled
              >
                Media pilihan tidak tersedia — pilih ulang
              </option>
              <option
                v-for="item in heroMediaOptions"
                :key="item.id"
                :value="item.id"
              >
                {{ item.kind === 'VIDEO' ? 'Video YouTube' : 'Foto' }} ·
                {{ item.alt }}
              </option>
            </select></label
          >
          <p v-if="mediaLoading" role="status">Memuat media siap tayang…</p>
          <fieldset class="banner-photo-editor">
            <legend>Foto banner beranda · maksimal 5</legend>
            <p class="muted">
              Pilih beberapa foto dari properti di atas. Urutan pertama tampil
              saat halaman dibuka, lalu berganti otomatis. Jika daftar kosong,
              foto tunggal pilihan atau ilustrasi gerbang tetap digunakan. Video
              kawasan tetap tampil terpisah.
            </p>
            <ol v-if="bannerMediaIds.length">
              <li v-for="(id, index) in bannerMediaIds" :key="id">
                <span
                  >{{ index + 1 }}.
                  {{
                    bannerPhotoOptions.find((photo) => photo.id === id)?.alt ??
                    'Foto tidak tersedia — hapus atau pilih ulang'
                  }}</span
                >
                <div class="action-row">
                  <button
                    type="button"
                    class="button secondary"
                    :disabled="index === 0"
                    :aria-label="`Naikkan foto banner ${index + 1}`"
                    @click="moveBannerPhoto(index, -1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="button secondary"
                    :disabled="index === bannerMediaIds.length - 1"
                    :aria-label="`Turunkan foto banner ${index + 1}`"
                    @click="moveBannerPhoto(index, 1)"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="button secondary"
                    :aria-label="`Hapus foto banner ${index + 1}`"
                    @click="bannerMediaIds.splice(index, 1)"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            </ol>
            <label
              >Tambahkan foto banner<select
                v-model="bannerPhotoId"
                :disabled="
                  mediaLoading || bannerMediaIds.length >= 5 || !heroProperty
                "
              >
                <option :value="null">Pilih foto siap tayang</option>
                <option
                  v-for="photo in bannerPhotoOptions.filter(
                    (item) => !bannerMediaIds.includes(item.id),
                  )"
                  :key="photo.id"
                  :value="photo.id"
                >
                  {{ photo.alt }}
                </option>
              </select></label
            >
            <button
              type="button"
              class="button secondary"
              :disabled="!bannerPhotoId || bannerMediaIds.length >= 5"
              @click="addBannerPhoto"
            >
              Tambahkan ke banner
            </button>
          </fieldset>
          <p v-if="mediaError" role="alert">{{ mediaError }}</p>
          <button
            type="button"
            class="text-button"
            :disabled="mediaLoading"
            @click="loadHeroMedia(heroProperty)"
          >
            Perbarui pilihan gambar
          </button>
          <p class="muted">
            Hanya foto dan video siap yang diaktifkan untuk publik dari properti
            ini. Tambahkan gambar melalui panel Foto & media di bawah, lalu
            perbarui pilihan gambar. Tautan YouTube di atas dipakai untuk film
            kawasan; foto pilihan tampil sebagai banner yang tetap terlihat
            bersama video, serta pendamping saat video gagal dimuat. Video
            properti pilihan tetap didukung bila tautan beranda kosong.
          </p>
        </template>
        <p v-if="kind === 'HERO'" class="notice">
          Tempel tautan YouTube milik kawasan, termasuk waktu mulai bila
          diperlukan. Video tetap utuh dengan kontrol YouTube dan berulang;
          autoplay tanpa suara mengikuti izin browser. Pilih properti dan foto
          untuk banner beranda, atau gunakan ilustrasi kawasan yang sudah
          tersedia.
        </p>
        <p v-if="kind === 'BANK_PARTNER'" class="notice">
          Logo mitra hanya tampil setelah logo diunggah, izin kemitraan
          diverifikasi, dan konten dipublikasikan. Referensi suku bunga bukan
          bukti kemitraan.
        </p>
        <label class="checkbox-label"
          ><input v-model="form.published" type="checkbox" />
          Publikasikan</label
        ><label class="checkbox-label"
          ><input
            v-model="verified"
            type="checkbox"
            :required="form.published"
          />
          Saya telah memverifikasi sumber, kebenaran, dan izin publikasi konten
          ini.</label
        >
        <div class="editor-actions">
          <button class="button" :disabled="busy" type="submit">
            Simpan konten</button
          ><button
            class="button secondary"
            type="button"
            @click="dialog?.close()"
          >
            Tutup
          </button>
        </div>
        <p
          v-if="message"
          :role="success ? 'status' : 'alert'"
          :class="success ? 'success-notice' : 'error-text'"
        >
          {{ message }}
        </p>
      </form>
      <details
        v-if="kind === 'HERO' && heroProperty && heroPropertyVersion"
        class="section hero-media-upload"
      >
        <summary>Tambahkan foto & media beranda</summary>
        <p class="muted">
          Gambar disimpan di katalog properti pilihan. Setelah siap, pilih
          gambar pendamping pada formulir di atas dan simpan konten beranda.
        </p>
        <MediaManager
          :key="heroProperty"
          :property-id="heroProperty"
          :version="heroPropertyVersion"
          @version="
            (value) => {
              heroPropertyVersion = value
              void loadHeroMedia(heroProperty)
            }
          "
        />
      </details>
      <form
        v-if="kind === 'BANK_PARTNER' && selected"
        class="section"
        @submit.prevent="uploadLogo"
      >
        <h3>Logo bank mitra</h3>
        <p>
          {{
            selected.logo_uploaded
              ? 'Logo sudah diunggah. Unggahan baru mengganti logo sebelumnya.'
              : 'Belum ada logo. Konten tanpa logo tidak ditampilkan di beranda.'
          }}
        </p>
        <p class="muted">
          PNG, JPEG, atau WebP; maksimal 2 MiB / 4 megapiksel. Gunakan logo
          resmi dengan izin publikasi. Simpan perubahan nama dan situs sebelum
          mengganti logo.
        </p>
        <label
          >File logo bank<input
            ref="logoInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            :disabled="busy"
            @change="
              logoFile = ($event.target as HTMLInputElement).files?.[0] ?? null
            "
        /></label>
        <label class="checkbox-label"
          ><input
            v-model="logoVerified"
            type="checkbox"
            required
            :disabled="busy"
          />Saya telah memverifikasi izin logo dan hubungan kemitraan bank
          ini.</label
        >
        <button
          class="button secondary"
          :disabled="busy || !logoFile || !logoVerified"
        >
          Unggah logo bank
        </button>
        <p v-if="!logoFile || !logoVerified" class="muted">
          Pilih berkas dan centang verifikasi izin logo untuk mengaktifkan
          unggahan.
        </p>
      </form>
    </dialog>
  </section>
</template>
