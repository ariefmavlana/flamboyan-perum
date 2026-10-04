<script setup lang="ts">
import type { InternalProperty, Paginated } from '#shared/types'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Katalog tim — Flamboyan', robots: 'noindex, nofollow' })
const api = useStaffApi()
const session = useStaffSession()
const results = ref<Paginated<InternalProperty> | null>(null)
const q = ref('')
const publication = ref('')
const message = ref('')
const busy = ref(false)
const selected = ref<InternalProperty | null>(null)
const editor = ref<HTMLDialogElement | null>(null)
const ownerId = ref<number | null>(null)
const newOwner = ref<number | null>(null)
const reason = ref('')
const blank = () => ({
  slug: '',
  title: '',
  house_type: '',
  condition: 'NEW' as InternalProperty['condition'],
  certificate: '',
  location: '',
  address: '',
  description: '',
  price_idr: '',
  land_area: '',
  building_area: '',
  bedrooms: 0,
  bathrooms: 1,
  publication: 'DRAFT' as InternalProperty['publication'],
  availability: 'AVAILABLE' as InternalProperty['availability'],
  featured: false,
})
const form = reactive(blank())
async function load(page = 1) {
  busy.value = true
  try {
    await session.refresh()
    const query = new URLSearchParams({
      page: String(page),
      ...(q.value ? { q: q.value } : {}),
      ...(publication.value ? { publication: publication.value } : {}),
    })
    results.value = await api.request(`/api/v1/internal/properties?${query}`)
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
function open(property?: InternalProperty) {
  selected.value = property ?? null
  Object.assign(
    form,
    blank(),
    property
      ? Object.fromEntries(
          Object.keys(blank()).map((key) => [
            key,
            property[key as keyof InternalProperty],
          ]),
        )
      : {},
  )
  ownerId.value = property?.owner_id ?? null
  newOwner.value = null
  reason.value = ''
  message.value = ''
  editor.value?.showModal()
}
async function save() {
  busy.value = true
  try {
    const { slug, ...fields } = form
    const response = await api.request<{ data: InternalProperty }>(
      `/api/v1/internal/properties${selected.value ? `/${selected.value.id}` : ''}`,
      {
        method: selected.value ? 'PATCH' : 'POST',
        body: {
          ...fields,
          ...(selected.value
            ? { version: selected.value.version }
            : {
                slug,
                ...(session.account.value?.role === 'ADMIN'
                  ? { owner_id: ownerId.value }
                  : {}),
              }),
        },
      },
    )
    selected.value = response.data
    editor.value?.close()
    await load()
    message.value = 'Properti tersimpan.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
async function transfer() {
  if (!selected.value) return
  busy.value = true
  try {
    const response = await api.request<{ data: InternalProperty }>(
      `/api/v1/internal/properties/${selected.value.id}/owner`,
      {
        method: 'POST',
        body: {
          version: selected.value.version,
          owner_id: newOwner.value,
          reason: reason.value,
        },
      },
    )
    selected.value = response.data
    ownerId.value = response.data.owner_id
    newOwner.value = null
    reason.value = ''
    await load()
    message.value = 'Kepemilikan dialihkan.'
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
    <div class="section-heading">
      <div>
        <p class="eyebrow">KATALOG TIM</p>
        <h1>Kelola properti</h1>
      </div>
      <button class="button" :disabled="!session.account.value" @click="open()">
        Tambah properti
      </button>
    </div>
    <form class="action-row" @submit.prevent="load()">
      <label>Cari properti<input v-model="q" maxlength="100" /></label
      ><label
        >Publikasi<select v-model="publication">
          <option value="">Semua publikasi</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Arsip</option>
        </select></label
      ><button class="button secondary" :disabled="busy">
        Cari / muat ulang
      </button>
    </form>
    <p v-if="message && !editor?.open" role="status">{{ message }}</p>
    <p v-if="busy" role="status">Memproses…</p>
    <div class="table-scroll">
      <table>
        <caption class="sr-only">
          Katalog sesuai hak akses Anda
        </caption>
        <thead>
          <tr>
            <th>Properti</th>
            <th>Pemilik</th>
            <th>Publikasi / ketersediaan</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="property in results?.data" :key="property.id">
            <td>
              <strong>{{ property.title }}</strong
              ><br />{{ property.location }} ·
              {{
                new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  maximumFractionDigits: 0,
                }).format(Number(property.price_idr))
              }}
            </td>
            <td>{{ property.owner?.name }}</td>
            <td>{{ property.publication }} / {{ property.availability }}</td>
            <td>
              <button class="text-button" @click="open(property)">
                Edit properti</button
              ><NuxtLink
                v-if="property.publication === 'PUBLISHED'"
                :to="`/properti/${property.slug}`"
                >Lihat publik</NuxtLink
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="results && !results.data.length" class="notice">
      Tidak ada properti sesuai pilihan.
    </p>
    <nav
      v-if="results && results.meta.last_page > 1"
      class="pagination"
      aria-label="Halaman katalog"
    >
      <button
        :disabled="busy || results.meta.current_page === 1"
        @click="load(results.meta.current_page - 1)"
      >
        Sebelumnya</button
      ><span
        >{{ results.meta.current_page }} / {{ results.meta.last_page }}</span
      ><button
        :disabled="busy || results.meta.current_page === results.meta.last_page"
        @click="load(results.meta.current_page + 1)"
      >
        Berikutnya
      </button>
    </nav>
    <dialog
      ref="editor"
      class="history-drawer"
      aria-labelledby="property-editor-title"
      @close="selected = null"
    >
      <div class="section-heading">
        <h2 id="property-editor-title">
          {{ selected ? 'Edit properti' : 'Tambah properti' }}
        </h2>
        <button class="button secondary" @click="editor?.close()">Tutup</button>
      </div>
      <p v-if="message" role="alert">{{ message }}</p>
      <form @submit.prevent="save">
        <div class="form-grid">
          <label
            >Judul<input v-model="form.title" required maxlength="160" /></label
          ><label v-if="!selected"
            >Slug URL<input
              v-model="form.slug"
              required
              maxlength="160"
              pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label
          ><label
            >Tipe rumah<input
              v-model="form.house_type"
              required
              maxlength="80" /></label
          ><label
            >Kondisi<select v-model="form.condition">
              <option value="NEW">Baru</option>
              <option value="RESALE">Bekas</option>
            </select></label
          ><label
            >Sertifikat<input
              v-model="form.certificate"
              required
              maxlength="80" /></label
          ><label
            >Lokasi<input
              v-model="form.location"
              required
              maxlength="160" /></label
          ><label
            >Harga (Rp)<input
              v-model="form.price_idr"
              type="number"
              required
              min="1"
              max="1000000000000"
              step="1" /></label
          ><label
            >Luas tanah (m²)<input
              v-model="form.land_area"
              type="number"
              required
              min="0.01"
              max="1000000"
              step="0.01" /></label
          ><label
            >Luas bangunan (m²)<input
              v-model="form.building_area"
              type="number"
              required
              min="0.01"
              max="1000000"
              step="0.01" /></label
          ><label
            >Kamar tidur<input
              v-model.number="form.bedrooms"
              type="number"
              required
              min="0"
              max="50" /></label
          ><label
            >Kamar mandi<input
              v-model.number="form.bathrooms"
              type="number"
              required
              min="1"
              max="50" /></label
          ><label
            >Publikasi<select v-model="form.publication">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Arsip</option>
            </select></label
          ><label
            >Ketersediaan<select v-model="form.availability">
              <option value="AVAILABLE">Tersedia</option>
              <option value="BOOKED">Booked</option>
              <option value="SOLD_OUT">Sold out</option>
            </select></label
          >
        </div>
        <label
          >Alamat<textarea
            v-model="form.address"
            required
            maxlength="500"
          /></label
        ><label
          >Deskripsi<textarea
            v-model="form.description"
            required
            maxlength="10000"
            rows="5"
          /></label
        ><label class="checkbox-label"
          ><input v-model="form.featured" type="checkbox" />Tampilkan sebagai
          pilihan unggulan ketika published</label
        ><StaffPicker
          v-if="session.account.value?.role === 'ADMIN' && !selected"
          v-model="ownerId"
          kind="marketing"
          label="Pemilik properti"
        />
        <p v-if="selected" class="muted">
          Slug URL tetap. Gunakan publikasi Arsip untuk menutup properti tanpa
          menghapus histori.
        </p>
        <button class="button" :disabled="busy">Simpan properti</button>
      </form>
      <MediaManager
        v-if="selected"
        :key="selected.id"
        :property-id="selected.id"
        :version="selected.version"
        @version="selected.version = $event"
      />
      <form
        v-if="selected && session.account.value?.role === 'ADMIN'"
        class="section"
        @submit.prevent="transfer"
      >
        <h3>Alihkan kepemilikan</h3>
        <p>Pemilik sekarang: {{ selected.owner?.name }}</p>
        <StaffPicker
          v-model="newOwner"
          kind="marketing"
          label="Pemilik baru"
        /><label
          >Alasan transfer<textarea
            v-model="reason"
            required
            maxlength="2000"
          /></label
        ><button class="button secondary" :disabled="busy || !newOwner">
          Alihkan pemilik
        </button>
      </form>
    </dialog>
  </section>
</template>
