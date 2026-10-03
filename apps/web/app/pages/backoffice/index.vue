<script setup lang="ts">
import type {
  Lead,
  LeadHistory,
  LeadStatus,
  Paginated,
  User,
} from '#shared/types'
const api = useStaffApi()
const user = ref<User | null>(null)
const leads = ref<Paginated<Lead> | null>(null)
const notices = ref<{
  data: { id: string; kind: string; lead_id: number; read_at: string | null }[]
  unread_count: number
} | null>(null)
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
      api.request<Paginated<Lead>>(`/api/v1/leads?page=${page}`),
      api.request<NonNullable<typeof notices.value>>('/api/v1/notifications'),
    ])
    leads.value = results[0]
    notices.value = results[1]
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
  drawer.value?.showModal()
  await loadHistory()
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
    await api.request(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
    await load(leads.value?.meta.current_page ?? 1)
  } catch {
    message.value = 'Notifikasi belum dapat diperbarui.'
  }
}
async function logout() {
  try {
    await api.request('/auth/logout', { method: 'POST' })
    await navigateTo('/login')
  } catch {
    message.value = 'Belum dapat keluar. Coba kembali.'
  }
}
onMounted(() => load())
</script>

<template>
  <section class="container section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">
          WORKSPACE · {{ user?.role === 'ADMIN' ? 'ADMIN' : 'MARKETING' }}
        </p>
        <h1 class="page-title">Perjalanan calon pembeli.</h1>
        <p v-if="user" class="muted">{{ user.name }}</p>
      </div>
      <button class="button secondary" @click="logout">Keluar</button>
    </div>
    <p v-if="message && !selected" role="alert" class="error-text">
      {{ message }}
    </p>
    <p v-if="loading" role="status">Memuat workspace…</p>
    <button class="text-button" @click="load(leads?.meta.current_page ?? 1)">
      Muat ulang data ↻
    </button>
    <div class="workspace-grid">
      <div class="table-scroll">
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
                ><br /><span class="muted">+{{ lead.whatsapp_number }}</span>
              </td>
              <td>#{{ lead.property_id }}</td>
              <td>
                <span class="badge">{{ labels[lead.status] }}</span>
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
      <aside class="notifications">
        <h2>
          Notifikasi
          <span class="badge"
            >{{ notices?.unread_count ?? 0 }} belum dibaca</span
          >
        </h2>
        <p class="muted">Muat ulang untuk melihat kabar terbaru.</p>
        <ul>
          <li v-for="notice in notices?.data" :key="notice.id">
            <p>
              {{
                notice.kind === 'LEAD_ASSIGNED'
                  ? 'Penugasan lead'
                  : 'Perubahan status lead'
              }}
              #{{ notice.lead_id }}
            </p>
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
        <p class="badge">{{ labels[selected.status] }}</p>
        <p v-if="message" role="alert" class="error-text">{{ message }}</p>
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
        ><label
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
              <strong>{{ event.actor.name }}</strong> · {{ event.type }}
            </p>
            <p v-if="event.to_status">
              {{ event.from_status ? labels[event.from_status] + ' → ' : ''
              }}{{ labels[event.to_status] }}
            </p>
            <p v-if="event.note">{{ event.note }}</p>
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
  </section>
</template>
