<script setup lang="ts">
import type { InternalMedia, PublicMedia, Paginated } from '#shared/types'
const props = defineProps<{ propertyId: number; version: number }>()
const emit = defineEmits<{ version: [value: number] }>()
const api = useStaffApi()
const items = ref<InternalMedia[]>([])
const page = ref(1)
const lastPage = ref(1)
const includeArchived = ref(false)
const kind = ref<PublicMedia['kind']>('PHOTO')
const alt = ref('')
const url = ref('')
const file = ref<File | null>(null)
const message = ref('')
const busy = ref(false)
const processInRequest = ref(false)
const polling = ref(false)
const input = ref<HTMLInputElement | null>(null)
const labels: Record<InternalMedia['state'], string> = {
  PROCESSING: 'Sedang diproses',
  READY: 'Siap',
  FAILED: 'Pemrosesan gagal',
  ARCHIVED: 'Diarsipkan',
}
const kinds: Record<PublicMedia['kind'], string> = {
  PHOTO: 'Foto',
  FLOOR_PLAN: 'Denah',
  MASTERPLAN: 'Masterplan kawasan',
  VIDEO: 'YouTube',
  TOUR: 'Virtual tour',
  BROCHURE: 'Brosur PDF',
}
const isLink = computed(() => kind.value === 'VIDEO' || kind.value === 'TOUR')
let poll: ReturnType<typeof setInterval> | undefined
async function load(background = false) {
  try {
    const result = await api.request<
      Paginated<InternalMedia> & { process_in_request: boolean }
    >(
      `/api/v1/internal/properties/${props.propertyId}/media?page=${page.value}&include_archived=${includeArchived.value ? '1' : '0'}`,
    )
    lastPage.value = result.meta.last_page
    processInRequest.value = result.process_in_request
    items.value = result.data.map((item) => {
      const current = background
        ? items.value.find((value) => value.id === item.id)
        : undefined
      return current
        ? {
            ...item,
            alt: current.alt,
            position: current.position,
            published: current.published,
          }
        : item
    })
  } catch (error) {
    message.value = staffError(error)
  }
}
function selectFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
function setPage(value: number) {
  page.value = value
  void load()
}
function toggleArchives() {
  page.value = 1
  void load()
}
async function add() {
  busy.value = true
  message.value = ''
  try {
    let body: Record<string, unknown> | FormData
    if (isLink.value)
      body = {
        version: props.version,
        kind: kind.value,
        alt: alt.value,
        url: url.value,
      }
    else {
      body = new FormData()
      body.append('version', String(props.version))
      body.append('kind', kind.value)
      body.append('alt', alt.value)
      if (file.value) body.append('file', file.value)
    }
    const result = await api.request<{ property_version: number }>(
      `/api/v1/internal/properties/${props.propertyId}/media`,
      { method: 'POST', body },
    )
    emit('version', result.property_version)
    alt.value = ''
    url.value = ''
    file.value = null
    if (input.value) input.value.value = ''
    await load()
    message.value =
      'Media tersimpan. Tinjau status dan tampilkan ke publik setelah siap.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
async function update(item: InternalMedia, changes: Record<string, unknown>) {
  busy.value = true
  try {
    const result = await api.request<{ property_version: number }>(
      `/api/v1/internal/properties/${props.propertyId}/media/${item.id}`,
      { method: 'PATCH', body: { version: props.version, ...changes } },
    )
    emit('version', result.property_version)
    await load()
    message.value = 'Media diperbarui.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  void load()
  poll = setInterval(async () => {
    if (
      busy.value ||
      polling.value ||
      !items.value.some((item) => item.state === 'PROCESSING')
    )
      return
    polling.value = true
    try {
      if (processInRequest.value)
        await api.request(
          `/api/v1/internal/properties/${props.propertyId}/media/process`,
          { method: 'POST' },
        )
      await load(true)
    } catch (error) {
      message.value = staffError(error)
    } finally {
      polling.value = false
    }
  }, 10000)
})
onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
})
watch(
  () => props.propertyId,
  () => {
    items.value = []
    page.value = 1
    void load()
  },
)
</script>
<template>
  <section class="section">
    <h3>Media properti</h3>
    <p class="muted">
      Maksimal 20 foto, 5 denah, 1 video, 1 tour dan 1 brosur aktif. Gambar
      JPEG, PNG, atau WebP maksimal 5 MiB / 40 megapiksel; PDF maksimal 10 MiB.
      Gambar diproses menjadi WebP tanpa metadata sumber; brosur menunggu
      pemindaian malware.
    </p>
    <p class="muted">
      Foto siap dengan urutan terkecil menjadi sampul katalog. Aktifkan pilihan
      tampil publik setelah meninjau foto dan deskripsinya. Denah diunggah
      terpisah agar mudah dikenali.
    </p>
    <p v-if="message" role="status">{{ message }}</p>
    <form @submit.prevent="add">
      <label
        >Jenis media<select v-model="kind">
          <option v-for="(label, value) in kinds" :key="value" :value="value">
            {{ label }}
          </option>
        </select></label
      ><label
        >Deskripsi gambar / media<input
          v-model="alt"
          required
          maxlength="240" /></label
      ><label v-if="isLink"
        >URL HTTPS<input
          v-model="url"
          required
          type="url"
          maxlength="2048" /></label
      ><label v-else
        >File media<input
          ref="input"
          type="file"
          required
          :accept="
            kind === 'BROCHURE'
              ? 'application/pdf'
              : 'image/jpeg,image/png,image/webp'
          "
          @change="selectFile"
      /></label>
      <p v-if="kind === 'VIDEO'" class="muted">
        Unggah video milik Anda ke YouTube, lalu tempel tautan
        youtube.com/watch?v=… atau youtu.be/…. File MP4 tidak diunggah langsung.
        Video dimuat setelah persetujuan pengunjung.
      </p>
      <p v-else-if="kind === 'TOUR'" class="muted">
        Gunakan tautan HTTPS dari penyedia virtual tour yang diizinkan pada
        konfigurasi platform.
      </p>
      <p v-else-if="kind === 'BROCHURE'" class="muted">
        Brosur hanya tersedia untuk pengunjung setelah pemindaian malware
        berhasil.
      </p>
      <button class="button secondary" :disabled="busy">Tambah media</button>
    </form>
    <button class="text-button" type="button" :disabled="busy" @click="load()">
      Muat ulang media
    </button>
    <p v-if="!items.length" class="muted">Belum ada media.</p>
    <label class="checkbox-label"
      ><input
        v-model="includeArchived"
        type="checkbox"
        @change="toggleArchives"
      />Sertakan media diarsipkan</label
    >
    <nav v-if="lastPage > 1" class="action-row" aria-label="Halaman media">
      <button type="button" :disabled="page === 1" @click="setPage(page - 1)">
        Sebelumnya</button
      ><span>{{ page }} / {{ lastPage }}</span
      ><button
        type="button"
        :disabled="page >= lastPage"
        @click="setPage(page + 1)"
      >
        Berikutnya
      </button>
    </nav>
    <article v-for="item in items" :key="item.id" class="media-editor">
      <p>
        <strong>{{ kinds[item.kind] }} · {{ item.alt }}</strong
        ><br />{{ labels[item.state] }}
      </p>
      <template v-if="item.state !== 'ARCHIVED'"
        ><img
          v-if="
            item.state === 'READY' &&
            (item.kind === 'PHOTO' ||
              item.kind === 'FLOOR_PLAN' ||
              item.kind === 'MASTERPLAN')
          "
          :src="`/api/v1/internal/media/${item.id}/640`"
          :alt="item.alt"
          width="240"
          height="160"
          loading="lazy"
        />
        <p v-if="item.failure_code === 'SCANNER_UNAVAILABLE'" class="muted">
          Pemindai brosur belum tersedia. Admin perlu mengonfigurasi scanner
          sebelum memproses ulang.
        </p>
        <p v-else-if="item.state === 'FAILED'" class="muted">
          File belum dapat dipublikasikan. Periksa file atau hubungi Admin.
        </p>
        <label
          >Deskripsi media<input v-model="item.alt" maxlength="240" /></label
        ><label
          >Urutan<input
            v-model.number="item.position"
            type="number"
            min="0"
            max="1000" /></label
        ><label class="checkbox-label"
          ><input v-model="item.published" type="checkbox" />Tampilkan saat
          properti published dan media siap</label
        >
        <div class="action-row">
          <button
            class="button secondary"
            :disabled="busy || !item.alt.trim()"
            @click="
              update(item, {
                alt: item.alt,
                position: item.position,
                published: item.published,
              })
            "
          >
            Simpan media</button
          ><button
            v-if="item.state === 'FAILED'"
            class="text-button"
            :disabled="busy"
            @click="update(item, { retry: true })"
          >
            Proses ulang</button
          ><button
            class="text-button"
            :disabled="busy"
            @click="update(item, { archived: true })"
          >
            Arsipkan media
          </button>
        </div></template
      >
    </article>
  </section>
</template>
