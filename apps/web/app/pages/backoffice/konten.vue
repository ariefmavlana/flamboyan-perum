<script setup lang="ts">
import type { EditorialContent, Paginated } from '#shared/types'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Konten publik — Flamboyan', robots: 'noindex, nofollow' })
const api = useStaffApi()
const session = useStaffSession()
const results = ref<Paginated<EditorialContent> | null>(null)
const message = ref('')
const busy = ref(false)
const selected = ref<EditorialContent | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const kind = ref<EditorialContent['kind']>('HERO')
const form = reactive({
  published: false,
  position: 0,
  payload: {} as EditorialContent['payload'],
})
const verified = ref(false)
const heroProperty = ref<number | null>(null)
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
  ],
  TESTIMONIAL: [
    { key: 'name', label: 'Nama publik berizin', type: 'text', max: 160 },
    { key: 'quote', label: 'Testimonial berizin', type: 'textarea', max: 2000 },
    { key: 'context', label: 'Keterangan publik', type: 'text', max: 160 },
  ],
  BANK_RATE: [
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
    { key: 'source_url', label: 'Sumber bank HTTPS', type: 'url', max: 2048 },
  ],
} as const
watch(
  () => form.payload,
  () => {
    verified.value = false
  },
  { deep: true, flush: 'sync' },
)
watch(heroProperty, () => {
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
    results.value = await api.request(`/api/v1/internal/content?page=${page}`)
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
  form.payload = record
    ? JSON.parse(JSON.stringify(record.payload))
    : Object.fromEntries(
        schemas[kind.value].map((field) => [
          field.key,
          field.type === 'number'
            ? field.key === 'fixed_months'
              ? 36
              : 0
            : '',
        ]),
      )
  heroProperty.value =
    typeof record?.payload.property_id === 'number'
      ? record.payload.property_id
      : null
  verified.value = false
  message.value = ''
  dialog.value?.showModal()
}
async function save() {
  busy.value = true
  try {
    const payload: EditorialContent['payload'] = {
      ...form.payload,
      ...(kind.value === 'HERO' ? { property_id: heroProperty.value } : {}),
    }
    for (const field of schemas[kind.value])
      if (field.type === 'number')
        payload[field.key] = Number(payload[field.key])
    await api.request(
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
    dialog.value?.close()
    await load()
    message.value = 'Konten tersimpan.'
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
    <p class="eyebrow">EDITORIAL ADMIN</p>
    <h1 class="page-title">Konten publik.</h1>
    <p>
      Publikasikan hanya konten benar, berizin, dan telah ditinjau. Bank adalah
      referensi rate, bukan klaim kemitraan. Hero publik pertama mengikuti
      urutan lalu ID.
    </p>
    <p v-if="message" role="status">{{ message }}</p>
    <template v-if="session.account.value?.role === 'ADMIN'"
      ><div class="editor-actions">
        <label
          >Jenis konten baru<select v-model="kind">
            <option value="HERO">Hero</option>
            <option value="TESTIMONIAL">Testimonial</option>
            <option value="BANK_RATE">Rate bank</option>
          </select></label
        ><button class="button" :disabled="busy" @click="open()">
          Tambah konten
        </button>
      </div>
      <div
        class="table-scroll"
        role="region"
        aria-label="Tabel data, geser untuk melihat kolom lainnya"
        tabindex="0"
      >
        <table>
          <caption>
            Konten editorial, termasuk draft dan rate kedaluwarsa
          </caption>
          <thead>
            <tr>
              <th>Jenis</th>
              <th>Judul / nama</th>
              <th>Publikasi</th>
              <th>Urutan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in results?.data" :key="record.id">
              <td>
                {{
                  {
                    HERO: 'Sorotan beranda',
                    TESTIMONIAL: 'Testimonial',
                    BANK_RATE: 'Referensi bank',
                  }[record.kind]
                }}
              </td>
              <td>
                {{
                  record.payload.title ??
                  record.payload.name ??
                  record.payload.bank
                }}
              </td>
              <td>{{ record.published ? 'Publik' : 'Draft' }}</td>
              <td>{{ record.position }}</td>
              <td>
                <button class="button secondary" @click="open(record)">
                  Edit konten #{{ record.id }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="results && !results.data.length" class="notice">
        Belum ada konten. Tidak ada testimonial atau rate yang dibuat otomatis.
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
      <h2 id="content-title">{{ selected ? 'Edit' : 'Tambah' }} {{ kind }}</h2>
      <form @submit.prevent="save">
        <div class="form-grid">
          <label v-for="field in schemas[kind]" :key="field.key"
            >{{ field.label
            }}<textarea
              v-if="field.type === 'textarea'"
              v-model="form.payload[field.key]"
              required
              :maxlength="field.max" /><input
              v-else
              v-model="form.payload[field.key]"
              required
              :type="field.type"
              :maxlength="
                field.type === 'text' || field.type === 'url'
                  ? field.max
                  : undefined
              "
              :max="field.type === 'number' ? field.max : undefined"
              :min="
                field.key === 'fixed_months'
                  ? 1
                  : field.type === 'number'
                    ? 0
                    : undefined
              "
              :step="
                field.key === 'annual_rate'
                  ? '0.01'
                  : field.type === 'number'
                    ? '1'
                    : undefined
              " /></label
          ><label
            >Urutan<input
              v-model.number="form.position"
              type="number"
              min="0"
              max="1000"
              step="1"
              required
          /></label>
        </div>
        <StaffPicker
          v-if="kind === 'HERO'"
          v-model="heroProperty"
          kind="property"
          :required="false"
          label="Properti hero (opsional, foto published saja)"
        /><label class="checkbox-label"
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
        <p v-if="message" role="alert">{{ message }}</p>
      </form>
    </dialog>
  </section>
</template>
