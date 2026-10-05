<script setup lang="ts">
import type {
  Lead,
  LeadHistory,
  LeadStatus,
  Paginated,
  User,
} from '#shared/types'
import {
  leadLabels as labels,
  leadTransitions as transitions,
  nextLeadAction,
  workQueues,
} from '#shared/utils/leads'
import type { LeadSummary, WorkQueue } from '#shared/utils/leads'
const api = useStaffApi()
definePageMeta({ layout: 'backoffice' })
const search = ref('')
const filterStatus = ref('')
const assigneeFilter = ref<number | null>(null)
const unassigned = ref(false)
const work = ref<WorkQueue | ''>('')
const summary = ref<LeadSummary | null>(null)
const summaryError = ref('')
const visibleQueues = computed(() =>
  workQueues.filter((queue) => !queue.admin || user.value?.role === 'ADMIN'),
)
const activeQueue = computed(() =>
  workQueues.find((queue) => queue.key === work.value),
)
const hasFilters = computed(
  () =>
    !!(
      search.value ||
      filterStatus.value ||
      work.value ||
      assigneeFilter.value ||
      unassigned.value
    ),
)
const createDialog = ref<HTMLDialogElement | null>(null)
const leadForm = reactive({
  name: '',
  whatsapp_number: '',
  property_id: null as number | null,
})
const marketingId = ref<number | null>(null)
const assignReason = ref('')
const contact = reactive({ name: '', whatsapp_number: '', reason: '' })
const eventLabels: Record<string, string> = {
  CREATED: 'Lead dicatat',
  ASSIGNED: 'Penugasan',
  REASSIGNED: 'Pengalihan penugasan',
  STATUS_CHANGED: 'Perubahan status',
  NOTE_ADDED: 'Catatan ditambahkan',
  CONTACT_UPDATED: 'Koreksi kontak',
  ANONYMIZED: 'Kontak dianonimkan',
}
const user = ref<User | null>(null)
const leads = ref<Paginated<Lead> | null>(null)
const inbox = useNotificationInbox()
const notices = inbox.notices
const route = useRoute()
const selected = ref<Lead | null>(null)
const history = ref<Paginated<LeadHistory> | null>(null)
const historyLoading = ref(false)
const historyError = ref('')
const nextStatus = ref<LeadStatus>('FOLLOWED_UP')
const note = ref('')
const message = ref('')
const success = ref(false)
const busy = ref(false)
const loading = ref(true)
const drawer = ref<HTMLDialogElement | null>(null)
const notificationDetails = ref<HTMLDetailsElement | null>(null)
const date = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
useSeoMeta({ title: 'CRM — Flamboyan Perum', robots: 'noindex, nofollow' })
let listRequest = 0

async function loadSummary() {
  summaryError.value = ''
  try {
    summary.value = (
      await api.request<{ data: LeadSummary }>('/api/v1/leads/summary')
    ).data
  } catch {
    summary.value = null
    summaryError.value =
      'Ringkasan belum dapat dimuat. Daftar tetap dapat digunakan.'
  }
}
function readFilters() {
  search.value = typeof route.query.q === 'string' ? route.query.q : ''
  filterStatus.value =
    typeof route.query.status === 'string' && route.query.status in labels
      ? route.query.status
      : ''
  work.value =
    workQueues.find((queue) => queue.key === route.query.work)?.key ?? ''
  unassigned.value = route.query.unassigned === '1'
  const id = Number(route.query.assigned_marketing_id)
  assigneeFilter.value = Number.isSafeInteger(id) && id > 0 ? id : null
}
async function applyFilters(page = 1) {
  await navigateTo({
    path: '/backoffice',
    query: {
      ...(search.value ? { q: search.value } : {}),
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
      ...(work.value ? { work: work.value } : {}),
      ...(assigneeFilter.value
        ? { assigned_marketing_id: String(assigneeFilter.value) }
        : {}),
      ...(unassigned.value ? { unassigned: '1' } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
    },
  })
}
async function chooseQueue(queue: WorkQueue | '' = '', status = '') {
  search.value = ''
  filterStatus.value = status
  assigneeFilter.value = null
  unassigned.value = false
  work.value = queue
  await applyFilters()
}

async function load(page = 1) {
  const request = ++listRequest
  loading.value = true
  try {
    user.value = (await api.request<{ data: User }>('/api/v1/me')).data
    const results = await Promise.all([
      api.request<Paginated<Lead>>(
        `/api/v1/leads?${new URLSearchParams({ page: String(page), ...(search.value ? { q: search.value } : {}), ...(filterStatus.value ? { status: filterStatus.value } : {}), ...(work.value ? { work: work.value } : {}), ...(assigneeFilter.value ? { assigned_marketing_id: String(assigneeFilter.value) } : {}), ...(unassigned.value ? { unassigned: '1' } : {}) })}`,
      ),
      inbox.refresh(),
      loadSummary(),
    ])
    if (request === listRequest) leads.value = results[0]
  } catch (error: unknown) {
    if (request !== listRequest) return
    success.value = false
    if ((error as { statusCode?: number }).statusCode === 401)
      await navigateTo('/login')
    else {
      leads.value = null
      message.value = 'Data belum dapat dimuat. Periksa akses atau coba lagi.'
    }
  } finally {
    if (request === listRequest) loading.value = false
  }
}
async function openLead(lead: Lead) {
  selected.value = lead
  note.value = ''
  message.value = ''
  success.value = false
  history.value = null
  nextStatus.value = transitions[lead.status][0] ?? lead.status
  marketingId.value = null
  assignReason.value = ''
  Object.assign(contact, {
    name: lead.name,
    whatsapp_number: lead.whatsapp_number ?? '',
    reason: '',
  })
  drawer.value?.showModal()
  await loadHistory()
}
async function createLead() {
  busy.value = true
  success.value = false
  try {
    const created = await api.request<{ data: Lead }>('/api/v1/leads', {
      method: 'POST',
      body: { ...leadForm },
    })
    createDialog.value?.close()
    Object.assign(leadForm, {
      name: '',
      whatsapp_number: '',
      property_id: null,
    })
    await load()
    await openNoticeLead(created.data.id)
    success.value = true
    message.value =
      'Calon pembeli berhasil dicatat. Pilih Marketing penanggung jawab di bawah.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
function clearAssigneeFilter() {
  assigneeFilter.value = null
  void applyFilters()
}
function openCreateLead() {
  message.value = ''
  createDialog.value?.showModal()
}
async function adminMutation(kind: 'assignment' | 'contact') {
  if (!selected.value) return
  busy.value = true
  success.value = false
  try {
    const result = await api.request<{ data: Lead }>(
      `/api/v1/leads/${selected.value.id}/${kind}`,
      {
        method: kind === 'assignment' ? 'POST' : 'PATCH',
        body: {
          version: selected.value.version,
          ...(kind === 'assignment'
            ? {
                marketing_id: marketingId.value,
                reason: assignReason.value || undefined,
              }
            : { ...contact }),
        },
      },
    )
    selected.value = (
      await api.request<{ data: Lead }>(`/api/v1/leads/${result.data.id}`)
    ).data
    marketingId.value = null
    assignReason.value = ''
    contact.reason = ''
    await Promise.all([
      load(leads.value?.meta.current_page ?? 1),
      loadHistory(),
    ])
    success.value = true
    message.value =
      kind === 'assignment'
        ? 'Penugasan tersimpan. Calon pembeli kini tersedia di ruang kerja Marketing yang dipilih.'
        : 'Koreksi kontak tersimpan.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
async function loadHistory(page = 1) {
  if (!selected.value) return
  const leadId = selected.value.id
  historyLoading.value = true
  historyError.value = ''
  try {
    const result = await api.request<Paginated<LeadHistory>>(
      `/api/v1/leads/${leadId}/history?page=${page}`,
    )
    if (selected.value?.id !== leadId) return
    history.value =
      page === 1 || !history.value
        ? result
        : {
            ...result,
            data: [
              ...history.value.data,
              ...result.data.filter(
                (event) =>
                  !history.value?.data.some(
                    (existing) => existing.id === event.id,
                  ),
              ),
            ],
          }
  } catch {
    if (selected.value?.id === leadId)
      historyError.value = 'Riwayat belum dapat dimuat. Coba lagi.'
  } finally {
    if (selected.value?.id === leadId) historyLoading.value = false
  }
}
async function mutate(kind: 'status' | 'notes') {
  if (!selected.value) return
  busy.value = true
  message.value = ''
  success.value = false
  try {
    const updated = await api.request<{ data: Lead }>(
      `/api/v1/leads/${selected.value.id}/${kind}`,
      {
        method: kind === 'status' ? 'PATCH' : 'POST',
        body: {
          version: selected.value.version,
          note: note.value || undefined,
          ...(kind === 'status' ? { status: nextStatus.value } : {}),
        },
      },
    )
    selected.value = { ...selected.value, ...updated.data }
    note.value = ''
    nextStatus.value =
      transitions[updated.data.status][0] ?? updated.data.status
    await Promise.all([
      load(leads.value?.meta.current_page ?? 1),
      loadHistory(),
    ])
    success.value = true
    message.value =
      kind === 'status'
        ? 'Tahap pembelian diperbarui.'
        : 'Catatan ditambahkan ke riwayat.'
  } catch (error: unknown) {
    message.value =
      (error as { statusCode?: number }).statusCode === 409
        ? 'Data sudah berubah atau tindakan tidak diizinkan. Tutup panel dan muat ulang data.'
        : 'Perubahan belum tersimpan. Periksa catatan dan akses Anda.'
  } finally {
    busy.value = false
  }
}
async function readNotice(id: string) {
  try {
    await inbox.read(id)
  } catch {
    message.value = 'Notifikasi belum dapat diperbarui.'
  }
}
async function openNoticeLead(id: number) {
  try {
    if (drawer.value?.open) drawer.value.close()
    const response = await api.request<{ data: Lead }>(`/api/v1/leads/${id}`)
    await openLead(response.data)
  } catch {
    message.value =
      'Lead tidak tersedia atau penugasannya telah berubah. Muat ulang daftar.'
  }
}
watch(
  () => [
    route.query.q,
    route.query.status,
    route.query.work,
    route.query.assigned_marketing_id,
    route.query.unassigned,
    route.query.page,
  ],
  () => {
    readFilters()
    if (user.value) void load(Math.max(1, Number(route.query.page) || 1))
  },
)
watch(
  () => route.query.lead,
  (id) => {
    if (typeof id === 'string' && /^[1-9]\d*$/.test(id) && user.value)
      void openNoticeLead(Number(id))
  },
)
onMounted(async () => {
  readFilters()
  await load(Math.max(1, Number(route.query.page) || 1))
  const id = route.query.lead
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id) && user.value)
    await openNoticeLead(Number(id))
  if (route.hash === '#notifications' && notificationDetails.value)
    notificationDetails.value.open = true
})
watch(
  () => route.hash,
  (hash) => {
    if (hash === '#notifications' && notificationDetails.value)
      notificationDetails.value.open = true
  },
)
</script>

<template>
  <section class="container section crm-workspace">
    <div class="section-heading">
      <div>
        <p class="eyebrow">
          {{
            user?.role === 'ADMIN'
              ? 'PANTAU TIM & PENJUALAN'
              : 'RUANG KERJA MARKETING'
          }}
        </p>
        <h1 class="page-title">
          {{ user?.role === 'ADMIN' ? 'Calon pembeli' : 'Calon pembeli Anda' }}
        </h1>
        <p class="muted">
          {{
            user?.role === 'ADMIN'
              ? 'Catat percakapan masuk, tugaskan Marketing, dan pantau perkembangannya.'
              : 'Lihat penugasan Anda, hubungi calon pembeli, lalu catat langkah berikutnya.'
          }}
        </p>
      </div>

      <button
        v-if="user?.role === 'ADMIN'"
        class="button"
        @click="openCreateLead"
      >
        Catat lead baru
      </button>
    </div>
    <p
      v-if="message && !selected"
      :role="success ? 'status' : 'alert'"
      :class="success ? 'success-notice' : 'error-text'"
    >
      {{ message }}
    </p>
    <p v-if="loading" role="status">Memuat workspace…</p>
    <div class="work-overview" aria-label="Prioritas pekerjaan">
      <div class="results-heading compact">
        <h2>Mulai dari sini</h2>
        <span v-if="summary" class="muted"
          >{{ summary.active }} proses aktif · seluruh
          {{ user?.role === 'ADMIN' ? 'tim' : 'penugasan Anda' }}</span
        >
      </div>
      <p v-if="summaryError" role="status">
        {{ summaryError }}
        <button class="text-button" @click="loadSummary">Coba lagi</button>
      </p>
      <div class="work-queue-grid">
        <button
          v-for="queue in visibleQueues"
          :key="queue.key"
          class="work-queue"
          :aria-pressed="work === queue.key"
          :disabled="loading"
          @click="chooseQueue(queue.key)"
        >
          <span>{{ queue.label }}</span
          ><strong>{{ summary?.work[queue.key] ?? '—' }}</strong>
          <small>{{ queue.hint }} <span aria-hidden="true">↗</span></small>
        </button>
      </div>
    </div>
    <details class="workflow-help">
      <summary>Bagaimana alur calon pembeli bekerja?</summary>
      <ol class="workflow-steps">
        <li>
          <strong>01 · Catat & tugaskan</strong
          ><span
            >Admin mencatat kontak dari WhatsApp dan memilih Marketing.</span
          >
        </li>
        <li>
          <strong>02 · Hubungi & survei</strong
          ><span
            >Marketing menghubungi pembeli, menyepakati kunjungan, dan mencatat
            hasilnya.</span
          >
        </li>
        <li>
          <strong>03 · Dokumen & hasil</strong
          ><span
            >Lanjutkan pemberkasan, lalu tandai pembelian selesai atau tidak
            dilanjutkan.</span
          >
        </li>
      </ol>
    </details>
    <div class="section-heading list-heading">
      <div>
        <p class="eyebrow">DAFTAR KERJA</p>
        <h2>
          {{
            activeQueue?.label ??
            (filterStatus
              ? labels[filterStatus as LeadStatus]
              : 'Semua calon pembeli')
          }}
        </h2>
      </div>
      <button v-if="hasFilters" class="text-button" @click="chooseQueue()">
        Hapus semua filter
      </button>
    </div>
    <div class="stage-filters" aria-label="Filter tahap pembelian">
      <button :aria-pressed="!filterStatus && !work" @click="chooseQueue()">
        Semua <span>{{ summary?.total ?? '—' }}</span>
      </button>
      <button
        v-for="(label, state) in labels"
        :key="state"
        :aria-pressed="filterStatus === state && !work"
        @click="chooseQueue('', state)"
      >
        {{ label }} <span>{{ summary?.statuses[state] ?? '—' }}</span>
      </button>
    </div>
    <form class="action-row" @submit.prevent="applyFilters()">
      <label
        >Cari nama / nomor / properti<input
          v-model="search"
          maxlength="100" /></label
      ><label
        >Status<select v-model="filterStatus" @change="work = ''">
          <option value="">Semua status</option>
          <option v-for="(label, state) in labels" :key="state" :value="state">
            {{ label }}
          </option>
        </select></label
      ><label v-if="user?.role === 'ADMIN'" class="checkbox-label"
        ><input v-model="unassigned" type="checkbox" />Belum ditugaskan</label
      ><button class="button secondary" :disabled="loading">
        Terapkan pencarian
      </button>
    </form>
    <details v-if="user?.role === 'ADMIN'">
      <summary>Filter Marketing</summary>
      <StaffPicker
        v-model="assigneeFilter"
        kind="marketing"
        label="Marketing filter"
      />
      <div class="action-row">
        <button class="button secondary" @click="applyFilters()">
          Terapkan Marketing</button
        ><button class="text-button" @click="clearAssigneeFilter">
          Semua Marketing
        </button>
      </div>
    </details>

    <div class="results-heading compact">
      <p v-if="leads" class="muted" role="status">
        {{ leads.meta.total }} calon pembeli{{
          hasFilters ? ' sesuai filter' : ''
        }}
        · Halaman {{ leads.meta.current_page }} dari {{ leads.meta.last_page }}
      </p>
      <button class="text-button" @click="load(leads?.meta.current_page ?? 1)">
        Muat ulang data ↻
      </button>
    </div>
    <div class="crm-results" :aria-busy="loading">
      <div
        class="table-scroll responsive-records"
        role="region"
        aria-label="Tabel data, geser untuk melihat kolom lainnya"
        tabindex="0"
      >
        <table>
          <caption class="sr-only">
            Daftar lead sesuai hak akses Anda
          </caption>
          <thead>
            <tr>
              <th>Nama / WhatsApp</th>
              <th>Properti</th>
              <th>Penanggung jawab</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in leads?.data" :key="lead.id">
              <td data-label="Calon pembeli">
                <strong>{{ lead.name }}</strong
                ><br /><span class="muted">{{
                  lead.whatsapp_number
                    ? `+${lead.whatsapp_number}`
                    : 'Kontak dianonimkan'
                }}</span>
              </td>
              <td data-label="Properti">
                {{ lead.property?.title ?? `#${lead.property_id}` }}
              </td>
              <td data-label="Penanggung jawab">
                <span :class="{ 'unassigned-label': !lead.assignee }">{{
                  lead.assignee?.name ?? 'Belum ditugaskan'
                }}</span>
              </td>
              <td data-label="Tahap">
                <span class="badge" :data-state="lead.status">{{
                  labels[lead.status]
                }}</span>
              </td>
              <td data-label="Langkah berikutnya">
                <small class="next-action-label">{{
                  nextLeadAction(lead)
                }}</small>
                <button class="text-button" @click="openLead(lead)">
                  Buka detail →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="leads && !leads.data.length" class="notice">
          {{
            hasFilters
              ? 'Tidak ada calon pembeli sesuai filter. Pilih tahap lain atau hapus filter.'
              : 'Belum ada calon pembeli. ' +
                (user?.role === 'ADMIN'
                  ? 'Mulai dengan mencatat percakapan dari WhatsApp.'
                  : 'Penugasan dari Admin akan tampil di sini.')
          }}
        </p>
        <nav
          v-if="leads && leads.meta.last_page > 1"
          class="pagination"
          aria-label="Halaman lead"
        >
          <button
            v-if="leads.meta.current_page > 1"
            :disabled="loading"
            @click="applyFilters(leads.meta.current_page - 1)"
          >
            Sebelumnya</button
          ><span
            >{{ leads.meta.current_page }} / {{ leads.meta.last_page }}</span
          ><button
            v-if="leads.meta.current_page < leads.meta.last_page"
            :disabled="loading"
            @click="applyFilters(leads.meta.current_page + 1)"
          >
            Berikutnya
          </button>
        </nav>
      </div>
      <details
        id="notifications"
        ref="notificationDetails"
        class="notifications notification-history"
      >
        <summary>
          Notifikasi & aktivitas
          <span class="badge"
            >{{ notices?.unread_count ?? 0 }} belum dibaca</span
          >
        </summary>
        <h2>
          Notifikasi
          <span class="badge"
            >{{ notices?.unread_count ?? 0 }} belum dibaca</span
          >
        </h2>
        <p class="muted">
          Pantau penugasan dan perubahan status lead. Pembaruan tetap berjalan
          secara berkala.
        </p>
        <button
          class="button secondary"
          @click="
            inbox.refresh(1).catch(() => {
              message = 'Notifikasi belum dapat dimuat.'
            })
          "
        >
          Muat ulang notifikasi
        </button>
        <ul>
          <li v-for="notice in notices?.data" :key="notice.id">
            <NuxtLink
              :to="{ path: '/backoffice', query: { lead: notice.lead_id } }"
            >
              {{
                notice.kind === 'LEAD_ASSIGNED'
                  ? 'Penugasan lead'
                  : 'Perubahan status lead'
              }}
              #{{ notice.lead_id }}
            </NuxtLink>
            <p class="muted">{{ date(notice.created_at) }}</p>
            <button
              v-if="!notice.read_at"
              class="text-button"
              @click="readNotice(notice.id)"
            >
              Tandai dibaca</button
            ><span v-else class="muted">Dibaca</span>
          </li>
        </ul>
        <p v-if="!notices?.data.length" class="muted">Belum ada notifikasi.</p>
        <nav
          v-if="notices && notices.meta.last_page > 1"
          class="pagination"
          aria-label="Halaman notifikasi"
        >
          <button
            v-if="notices.meta.current_page > 1"
            @click="
              inbox.refresh(notices.meta.current_page - 1).catch(() => {
                message = 'Notifikasi belum dapat dimuat.'
              })
            "
          >
            Sebelumnya</button
          ><span
            >{{ notices.meta.current_page }}/{{ notices.meta.last_page }}</span
          ><button
            v-if="notices.meta.current_page < notices.meta.last_page"
            @click="
              inbox.refresh(notices.meta.current_page + 1).catch(() => {
                message = 'Notifikasi belum dapat dimuat.'
              })
            "
          >
            Berikutnya
          </button>
        </nav>
      </details>
    </div>
    <dialog
      ref="drawer"
      class="history-drawer"
      aria-labelledby="history-title"
      @close="selected = null"
    >
      <template v-if="selected"
        ><div class="section-heading">
          <h2 id="history-title">{{ selected.name }}</h2>
          <button class="button secondary" @click="drawer?.close()">
            Tutup
          </button>
        </div>
        <p class="badge" :data-state="selected.status">
          {{ labels[selected.status] }}
        </p>
        <p>
          {{ selected.property?.title }} ·
          {{ selected.assignee?.name ?? 'Belum ditugaskan' }}
        </p>
        <div class="next-action-panel">
          <p class="eyebrow">LANGKAH BERIKUTNYA</p>
          <h3>{{ nextLeadAction(selected) }}</h3>
          <p
            v-if="
              transitions[selected.status].length && !selected.anonymized_at
            "
          >
            {{
              !selected.assigned_marketing_id
                ? 'Pilih satu Marketing sebagai penanggung jawab. Setelah ditugaskan, calon pembeli muncul di ruang kerjanya.'
                : 'Catat hasil percakapan atau kunjungan, kemudian perbarui tahap ketika langkah tersebut sudah dilakukan.'
            }}
          </p>
          <p v-else>
            Proses ini sudah ditutup. Riwayat tetap tersedia untuk ditinjau.
          </p>
          <a
            v-if="
              selected.whatsapp_number &&
              !selected.anonymized_at &&
              transitions[selected.status].length
            "
            class="button secondary"
            :href="'https://wa.me/' + selected.whatsapp_number"
            target="_blank"
            rel="noopener noreferrer"
            >Buka WhatsApp ↗</a
          >
        </div>
        <p
          v-if="message"
          :role="success ? 'status' : 'alert'"
          :class="success ? 'success-notice' : 'error-text'"
        >
          {{ message }}
        </p>
        <details
          v-if="
            user?.role === 'ADMIN' &&
            transitions[selected.status].length &&
            !selected.anonymized_at
          "
          :open="!selected.assigned_marketing_id"
        >
          <summary>Penanggung jawab Marketing</summary>
          <form @submit.prevent="adminMutation('assignment')">
            <StaffPicker
              v-model="marketingId"
              kind="marketing"
              label="Marketing penerima"
            /><label
              >Alasan pengalihan<textarea
                v-model="assignReason"
                :required="!!selected.assigned_marketing_id"
                maxlength="2000"
              /></label
            ><button class="button secondary" :disabled="busy || !marketingId">
              Simpan penugasan
            </button>
          </form>
        </details>
        <details v-if="user?.role === 'ADMIN' && !selected.anonymized_at">
          <summary>Koreksi kontak</summary>
          <form @submit.prevent="adminMutation('contact')">
            <label
              >Nama kontak<input
                v-model="contact.name"
                required
                maxlength="160" /></label
            ><label
              >WhatsApp kontak<input
                v-model="contact.whatsapp_number"
                required
                type="tel"
                maxlength="30" /></label
            ><label
              >Alasan koreksi<textarea
                v-model="contact.reason"
                required
                maxlength="2000"
              /></label
            ><button class="button secondary" :disabled="busy">
              Simpan koreksi
            </button>
          </form>
        </details>
        <h3 v-if="!selected.anonymized_at" class="drawer-section-title">
          Catat perkembangan
        </h3>
        <label
          v-if="transitions[selected.status].length && !selected.anonymized_at"
          >Tahap berikutnya<select v-model="nextStatus">
            <option
              v-for="state in transitions[selected.status]"
              :key="state"
              :value="state"
            >
              {{ labels[state] }}
            </option>
          </select></label
        ><label v-if="!selected.anonymized_at"
          >Catatan / alasan<textarea v-model="note" rows="3" maxlength="2000" />
        </label>
        <p
          v-if="nextStatus === 'LOST' && transitions[selected.status].length"
          class="muted"
        >
          Alasan wajib diisi sebelum menutup proses. Tahap yang sudah ditutup
          tidak dapat dibuka kembali.
        </p>
        <div class="action-row">
          <button
            v-if="
              transitions[selected.status].length && !selected.anonymized_at
            "
            class="button"
            :disabled="busy || (nextStatus === 'LOST' && !note.trim())"
            @click="mutate('status')"
          >
            Simpan status</button
          ><button
            v-if="!selected.anonymized_at"
            class="button secondary"
            :disabled="busy || !note.trim()"
            @click="mutate('notes')"
          >
            Tambah catatan
          </button>
        </div>
        <h3>Histori aktivitas</h3>
        <p v-if="historyLoading" role="status">Memuat riwayat…</p>
        <p v-if="historyError" role="alert">
          {{ historyError }}
          <button class="text-button" @click="loadHistory()">
            Muat ulang riwayat
          </button>
        </p>
        <ol class="timeline">
          <li v-for="event in history?.data" :key="event.id">
            <time>{{ date(event.created_at) }}</time>
            <p>
              <strong>{{ event.actor.name }}</strong> ·
              {{ eventLabels[event.type] ?? event.type }}
            </p>
            <p v-if="event.to_status">
              {{ event.from_status ? labels[event.from_status] + ' → ' : ''
              }}{{ labels[event.to_status] }}
            </p>
            <p v-if="event.note">{{ event.note }}</p>
            <p v-else-if="event.redacted_at" class="muted">
              Catatan direduksi melalui prosedur privasi.
            </p>
            <p v-if="event.next_assignee">
              {{
                event.previous_assignee
                  ? event.previous_assignee.name + ' → '
                  : ''
              }}{{ event.next_assignee.name }}
            </p>
          </li>
        </ol>
        <p v-if="history && !history.data.length" class="muted">
          Belum ada histori.
        </p>
        <button
          v-if="history && history.meta.current_page < history.meta.last_page"
          class="text-button"
          :disabled="historyLoading"
          @click="loadHistory(history.meta.current_page + 1)"
        >
          Histori lebih lama →
        </button></template
      >
    </dialog>
    <dialog
      ref="createDialog"
      class="history-drawer"
      aria-labelledby="create-lead-title"
    >
      <div class="section-heading">
        <h2 id="create-lead-title">Catat lead baru</h2>
        <button class="button secondary" @click="createDialog?.close()">
          Tutup
        </button>
      </div>
      <p v-if="message" role="alert">{{ message }}</p>
      <form @submit.prevent="createLead">
        <label
          >Nama calon pembeli<input
            v-model="leadForm.name"
            required
            maxlength="160"
            autocomplete="off" /></label
        ><label
          >Nomor WhatsApp<input
            v-model="leadForm.whatsapp_number"
            required
            type="tel"
            maxlength="30"
            autocomplete="off" /></label
        ><StaffPicker
          v-model="leadForm.property_id"
          kind="property"
          label="Properti yang diminati"
        />
        <p class="muted">
          Nomor dan properti yang sama hanya dicatat sekali. Klik WhatsApp
          publik belum berarti lead tercatat.
        </p>
        <button class="button" :disabled="busy || !leadForm.property_id">
          Simpan lead
        </button>
      </form>
    </dialog>
  </section>
</template>
