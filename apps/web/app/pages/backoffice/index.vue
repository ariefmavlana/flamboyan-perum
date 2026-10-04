<script setup lang="ts">
import type {
  Lead,
  LeadHistory,
  LeadStatus,
  Paginated,
  User,
} from '#shared/types'
const api = useStaffApi()
definePageMeta({ layout: 'backoffice' })
const search = ref('')
const filterStatus = ref('')
const assigneeFilter = ref<number | null>(null)
const unassigned = ref(false)
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
const nextStatus = ref<LeadStatus>('FOLLOWED_UP')
const note = ref('')
const message = ref('')
const busy = ref(false)
const loading = ref(true)
const drawer = ref<HTMLDialogElement | null>(null)
const labels: Record<LeadStatus, string> = {
  NEW_LEAD: 'Lead baru',
  FOLLOWED_UP: 'Sudah dihubungi',
  SURVEY_LOKASI: 'Survey lokasi',
  PEMBERKASAN_KPR: 'Pemberkasan / KPR',
  DEAL: 'Deal',
  LOST: 'Lost',
}
const transitions: Record<LeadStatus, LeadStatus[]> = {
  NEW_LEAD: ['FOLLOWED_UP', 'LOST'],
  FOLLOWED_UP: ['SURVEY_LOKASI', 'LOST'],
  SURVEY_LOKASI: ['PEMBERKASAN_KPR', 'LOST'],
  PEMBERKASAN_KPR: ['DEAL', 'LOST'],
  DEAL: [],
  LOST: [],
}
const date = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
useSeoMeta({ title: 'CRM — Flamboyan Perum', robots: 'noindex, nofollow' })

async function load(page = 1) {
  loading.value = true
  try {
    user.value = (await api.request<{ data: User }>('/api/v1/me')).data
    const results = await Promise.all([
      api.request<Paginated<Lead>>(
        `/api/v1/leads?${new URLSearchParams({ page: String(page), ...(search.value ? { q: search.value } : {}), ...(filterStatus.value ? { status: filterStatus.value } : {}), ...(assigneeFilter.value ? { assigned_marketing_id: String(assigneeFilter.value) } : {}), ...(unassigned.value ? { unassigned: '1' } : {}) })}`,
      ),
      inbox.refresh(),
    ])
    leads.value = results[0]
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 401)
      await navigateTo('/login')
    else
      message.value = 'Data belum dapat dimuat. Periksa akses atau coba lagi.'
  } finally {
    loading.value = false
  }
}
async function openLead(lead: Lead) {
  selected.value = lead
  note.value = ''
  message.value = ''
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
  try {
    await api.request('/api/v1/leads', {
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
    message.value = 'Lead dicatat. Pilih lead untuk menugaskan Marketing.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
function clearAssigneeFilter() {
  assigneeFilter.value = null
  void load()
}
function openCreateLead() {
  message.value = ''
  createDialog.value?.showModal()
}
async function adminMutation(kind: 'assignment' | 'contact') {
  if (!selected.value) return
  busy.value = true
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
    message.value = 'Perubahan tersimpan.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
async function loadHistory(page = 1) {
  if (!selected.value) return
  try {
    history.value = await api.request<Paginated<LeadHistory>>(
      `/api/v1/leads/${selected.value.id}/history?page=${page}`,
    )
  } catch {
    message.value = 'Histori belum dapat dimuat.'
  }
}
async function mutate(kind: 'status' | 'notes') {
  if (!selected.value) return
  busy.value = true
  message.value = ''
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
    selected.value = updated.data
    note.value = ''
    nextStatus.value =
      transitions[updated.data.status][0] ?? updated.data.status
    await Promise.all([
      load(leads.value?.meta.current_page ?? 1),
      loadHistory(),
    ])
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
  () => route.query.lead,
  (id) => {
    if (typeof id === 'string' && /^[1-9]\d*$/.test(id) && user.value)
      void openNoticeLead(Number(id))
  },
)
onMounted(async () => {
  await load()
  const id = route.query.lead
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id) && user.value)
    await openNoticeLead(Number(id))
})
</script>

<template>
  <section class="container section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">
          WORKSPACE · {{ user?.role === 'ADMIN' ? 'ADMIN' : 'MARKETING' }}
        </p>
        <h1 class="page-title">Kelola calon pembeli.</h1>
        <p v-if="user" class="muted">{{ user.name }}</p>
      </div>

      <button
        v-if="user?.role === 'ADMIN'"
        class="button"
        @click="openCreateLead"
      >
        Catat lead baru
      </button>
    </div>
    <p v-if="message && !selected" role="alert" class="error-text">
      {{ message }}
    </p>
    <p v-if="loading" role="status">Memuat workspace…</p>
    <form class="action-row" @submit.prevent="load()">
      <label
        >Cari nama / nomor / properti<input
          v-model="search"
          maxlength="100" /></label
      ><label
        >Status<select v-model="filterStatus">
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
        <button class="button secondary" @click="load()">
          Terapkan Marketing</button
        ><button class="text-button" @click="clearAssigneeFilter">
          Semua Marketing
        </button>
      </div>
    </details>

    <button class="text-button" @click="load(leads?.meta.current_page ?? 1)">
      Muat ulang data ↻
    </button>
    <p v-if="leads" class="muted">
      {{ leads.meta.total }} lead sesuai filter saat ini
    </p>
    <div class="workspace-grid">
      <div
        class="table-scroll"
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
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in leads?.data" :key="lead.id">
              <td>
                <strong>{{ lead.name }}</strong
                ><br /><span class="muted">{{
                  lead.whatsapp_number
                    ? `+${lead.whatsapp_number}`
                    : 'Kontak dianonimkan'
                }}</span>
              </td>
              <td>
                {{ lead.property?.title ?? `#${lead.property_id}` }}<br /><span
                  class="muted"
                  >{{ lead.assignee?.name ?? 'Belum ditugaskan' }}</span
                >
              </td>
              <td>
                <span class="badge" :data-state="lead.status">{{
                  labels[lead.status]
                }}</span>
              </td>
              <td>
                <button class="text-button" @click="openLead(lead)">
                  Lihat histori →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="leads && !leads.data.length" class="notice">
          Belum ada lead untuk ditampilkan.
        </p>
        <nav
          v-if="leads && leads.meta.last_page > 1"
          class="pagination"
          aria-label="Halaman lead"
        >
          <button
            v-if="leads.meta.current_page > 1"
            @click="load(leads.meta.current_page - 1)"
          >
            Sebelumnya</button
          ><span
            >{{ leads.meta.current_page }} / {{ leads.meta.last_page }}</span
          ><button
            v-if="leads.meta.current_page < leads.meta.last_page"
            @click="load(leads.meta.current_page + 1)"
          >
            Berikutnya
          </button>
        </nav>
      </div>
      <aside id="notifications" class="notifications">
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
      </aside>
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
        <p v-if="message" role="alert" class="error-text">{{ message }}</p>
        <details
          v-if="user?.role === 'ADMIN' && transitions[selected.status].length"
        >
          <summary>Assign / alihkan Marketing</summary>
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
        <label v-if="transitions[selected.status].length"
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
        <div class="action-row">
          <button
            v-if="transitions[selected.status].length"
            class="button"
            :disabled="busy"
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
