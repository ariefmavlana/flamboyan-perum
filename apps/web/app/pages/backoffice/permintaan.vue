<script setup lang="ts">
import type {
  InquiryPage,
  InquiryResolutionAction,
  InternalInquiry,
} from '#shared/growth-types'

definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Permintaan masuk', robots: 'noindex, nofollow' })

const api = useStaffApi()
const session = useStaffSession()
const results = ref<InquiryPage | null>(null)
const selected = ref<InternalInquiry | null>(null)
const drawer = ref<HTMLDialogElement | null>(null)
const state = ref('PENDING')
const busy = ref(false)
const loading = ref(false)
const message = ref('')
const success = ref(false)
const resolution = reactive({
  action: 'ACCEPT_NEW' as InquiryResolutionAction,
  lead_id: '',
  reason: '',
})

const stateLabels: Record<string, string> = {
  PENDING: 'Menunggu tinjauan',
  ACCEPTED: 'Diterima sebagai lead baru',
  LINKED: 'Ditautkan ke lead',
  REJECTED_SPAM: 'Ditolak sebagai spam',
  RESOLVED: 'Sudah ditangani',
}
const actionLabels: Record<InquiryResolutionAction, string> = {
  ACCEPT_NEW: 'Terima sebagai calon pembeli baru',
  LINK_EXISTING: 'Tautkan ke calon pembeli existing',
  REJECT_SPAM: 'Tolak sebagai spam',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

async function load(page = 1) {
  loading.value = true
  message.value = ''
  try {
    await session.refresh()
    if (session.account.value?.role !== 'ADMIN') {
      results.value = null
      message.value = 'Permintaan masuk hanya dapat ditinjau oleh Admin.'
      return
    }
    const query = new URLSearchParams({ page: String(page) })
    if (state.value) query.set('state', state.value)
    results.value = await api.request<InquiryPage>(
      `/api/v1/internal/inquiries?${query}`,
    )
  } catch (error) {
    results.value = null
    message.value = staffError(error)
  } finally {
    loading.value = false
  }
}

function open(item: InternalInquiry) {
  selected.value = item
  resolution.action = 'ACCEPT_NEW'
  resolution.lead_id = ''
  resolution.reason = ''
  message.value = ''
  success.value = false
  drawer.value?.showModal()
}

async function resolveInquiry() {
  if (!selected.value || busy.value) return
  busy.value = true
  message.value = ''
  success.value = false
  try {
    const payload: Record<string, unknown> = {
      version: selected.value.version,
      action: resolution.action,
      reason: resolution.reason.trim(),
    }
    if (resolution.action === 'LINK_EXISTING')
      payload.lead_id = Number(resolution.lead_id)
    const response = await api.request<{ data: InternalInquiry }>(
      `/api/v1/internal/inquiries/${selected.value.id}/resolve`,
      { method: 'POST', body: payload },
    )
    selected.value = response.data
    message.value = 'Permintaan berhasil ditangani dan histori tersimpan.'
    success.value = true
    await load(results.value?.meta.current_page ?? 1)
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409) {
      drawer.value?.close()
      await load(results.value?.meta.current_page ?? 1)
    }
    message.value = staffError(error)
    success.value = false
  } finally {
    busy.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <section class="container section">
    <p class="eyebrow">ADMIN · INTAKE</p>
    <h1>Permintaan masuk</h1>
    <p class="muted">
      Tinjau formulir konsultasi BFI2 sebelum membuat atau menautkan calon
      pembeli. Form yang diterima belum otomatis menjadi lead valid atau jadwal
      kunjungan.
    </p>
    <form class="action-row" @submit.prevent="load(1)">
      <label
        >Status<select v-model="state">
          <option value="">Semua status</option>
          <option value="PENDING">Menunggu tinjauan</option>
          <option value="RESOLVED">Sudah ditangani</option>
          <option value="REJECTED_SPAM">Spam</option>
        </select></label
      >
      <button class="button secondary" :disabled="loading">
        {{ loading ? 'Memuat…' : 'Terapkan filter' }}
      </button>
    </form>
    <p v-if="message && !selected" class="error-text" role="alert">
      {{ message }}
    </p>
    <p v-if="results" class="muted" role="status">
      {{ results.meta.total }} permintaan · Halaman
      {{ results.meta.current_page }} dari {{ results.meta.last_page }}
    </p>
    <div
      class="table-scroll responsive-records"
      role="region"
      aria-label="Daftar permintaan konsultasi"
      tabindex="0"
      :aria-busy="loading"
    >
      <table>
        <caption class="sr-only">
          Permintaan formulir publik yang dapat ditinjau Admin
        </caption>
        <thead>
          <tr>
            <th>Kontak</th>
            <th>Tipe & tujuan</th>
            <th>Diterima</th>
            <th>Status</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in results?.data" :key="item.id">
            <td data-label="Kontak">
              <strong>{{ item.name }}</strong
              ><br /><span class="muted">+{{ item.whatsapp_number }}</span>
            </td>
            <td data-label="Tipe & tujuan">
              {{ item.property?.title ?? 'Properti terdahulu' }}<br /><span class="muted">{{
                item.purpose === 'VISIT_REQUEST'
                  ? 'Permintaan kunjungan'
                  : 'Konsultasi'
              }}</span>
            </td>
            <td data-label="Diterima">{{ formatDate(item.created_at) }}</td>
            <td data-label="Status">
              <span class="badge">{{
                stateLabels[item.state] ?? item.state
              }}</span>
            </td>
            <td data-label="Tindakan">
              <button class="text-button" type="button" @click="open(item)">
                Tinjau →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="results && !results.data.length" class="notice">
        Tidak ada permintaan pada filter ini.
      </p>
    </div>
    <nav
      v-if="results && results.meta.last_page > 1"
      class="pagination"
      aria-label="Halaman permintaan"
    >
      <button
        v-if="results.meta.current_page > 1"
        :disabled="loading"
        @click="load(results.meta.current_page - 1)"
      >
        Sebelumnya
      </button>
      <span
        >{{ results.meta.current_page }} / {{ results.meta.last_page }}</span
      >
      <button
        v-if="results.meta.current_page < results.meta.last_page"
        :disabled="loading"
        @click="load(results.meta.current_page + 1)"
      >
        Berikutnya
      </button>
    </nav>

    <dialog
      ref="drawer"
      class="history-drawer"
      aria-labelledby="inquiry-title"
      @close="selected = null"
    >
      <template v-if="selected">
        <div class="section-heading">
          <div>
            <p class="eyebrow">PERMINTAAN #{{ selected.id }}</p>
            <h2 id="inquiry-title">{{ selected.name }}</h2>
          </div>
          <button
            class="button secondary"
            type="button"
            @click="drawer?.close()"
          >
            Tutup
          </button>
        </div>
        <dl class="inquiry-detail-grid">
          <div>
            <dt>WhatsApp</dt>
            <dd>+{{ selected.whatsapp_number }}</dd>
          </div>
          <div>
            <dt>Rumah</dt>
            <dd>{{ selected.property?.title ?? 'Properti terdahulu' }}</dd>
          </div>
          <div>
            <dt>Tujuan</dt>
            <dd>
              {{
                selected.purpose === 'VISIT_REQUEST'
                  ? 'Permintaan kunjungan'
                  : 'Konsultasi'
              }}
            </dd>
          </div>
          <div>
            <dt>Waktu pilihan</dt>
            <dd>{{ formatDate(selected.preferred_visit_at) }}</dd>
          </div>
          <div>
            <dt>Promo</dt>
            <dd>
              {{ selected.marketing_opt_in ? 'Bersedia' : 'Tidak bersedia' }}
            </dd>
          </div>
          <div>
            <dt>Notice</dt>
            <dd>{{ selected.privacy_notice_version }}</dd>
          </div>
        </dl>
        <div class="notice">
          <strong>Pesan</strong>
          <p>{{ selected.message || 'Tidak ada pesan tambahan.' }}</p>
        </div>
        <p
          v-if="message"
          :class="success ? 'success-notice' : 'error-text'"
          :role="success ? 'status' : 'alert'"
        >
          {{ message }}
        </p>
        <form
          v-if="selected.state === 'PENDING'"
          @submit.prevent="resolveInquiry"
        >
          <label
            >Keputusan<select v-model="resolution.action">
              <option
                v-for="(label, action) in actionLabels"
                :key="action"
                :value="action"
              >
                {{ label }}
              </option>
            </select></label
          >
          <label v-if="resolution.action === 'LINK_EXISTING'"
            >ID calon pembeli existing<input
              v-model="resolution.lead_id"
              type="number"
              min="1"
              required
              inputmode="numeric"
          /></label>
          <label
            >Alasan keputusan<textarea
              v-model="resolution.reason"
              required
              maxlength="1000"
              rows="4"
              placeholder="Catat dasar pemeriksaan agar keputusan dapat diaudit."
            />
          </label>
          <p class="muted">
            ACCEPT_NEW tetap mengikuti deduplikasi nomor + properti di backend.
            Konflik versi akan memuat ulang daftar tanpa menimpa keputusan staf
            lain.
          </p>
          <button class="button" :disabled="busy">
            {{ busy ? 'Menyimpan…' : 'Simpan keputusan' }}
          </button>
        </form>
        <div v-else class="notice">
          <p>
            Permintaan ini sudah ditangani:
            {{
              selected.resolution_action
                ? actionLabels[selected.resolution_action]
                : stateLabels[selected.state]
            }}.
          </p>
          <p v-if="selected.resolution_reason">
            Alasan: {{ selected.resolution_reason }}
          </p>
          <NuxtLink
            v-if="selected.lead_id"
            :to="{
              path: '/backoffice/hasil',
              query: { lead: selected.lead_id },
            }"
            class="text-link"
            >Buka hasil calon pembeli #{{ selected.lead_id }}<AppIcon name="arrow" /></NuxtLink
          >
        </div>
      </template>
    </dialog>
  </section>
</template>
