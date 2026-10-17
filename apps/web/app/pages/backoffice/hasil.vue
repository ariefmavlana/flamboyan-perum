<script setup lang="ts">
import type {
  LeadOutcomes,
  OutcomeLeadSummary,
  VisitStatus,
} from '#shared/growth-types'
import { jakartaPreferenceToIso } from '#shared/utils/inquiries'

definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Hasil prospek', robots: 'noindex, nofollow' })

const api = useStaffApi()
const session = useStaffSession()
const route = useRoute()
const leadInput = ref(
  typeof route.query.lead === 'string' ? route.query.lead : '',
)
const lead = ref<OutcomeLeadSummary | null>(null)
const outcomes = ref<LeadOutcomes | null>(null)
const loading = ref(false)
const busy = ref(false)
const message = ref('')
const success = ref(false)
const qualification = reactive({ qualified: true, reason: '' })
const visit = reactive({
  status: 'REQUESTED' as VisitStatus,
  scheduled_at: '',
  reason: '',
})
const visitEdits = reactive<
  Record<number, { status: VisitStatus; scheduled_at: string; reason: string }>
>({})
const akad = reactive({
  confirmed: true,
  occurred_at: '',
  reference: '',
  reason: '',
})
const attribution = reactive({ source: 'unknown', medium: 'unknown', campaign: 'unknown', reason: '' })

const visitLabels: Record<VisitStatus, string> = {
  REQUESTED: 'Diminta',
  CONFIRMED: 'Dikonfirmasi',
  COMPLETED: 'Hadir',
  CANCELLED: 'Dibatalkan',
  NO_SHOW: 'Tidak hadir',
}

function formatDate(value: string | null) {
  if (!value) return 'Belum dicatat'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}
function localValue(value: string | null) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}
function syncForms() {
  if (!outcomes.value) return
  qualification.qualified = outcomes.value.qualification?.qualified ?? true
  qualification.reason = ''
  for (const item of outcomes.value.visits)
    visitEdits[item.id] = {
      status: item.status,
      scheduled_at: localValue(item.scheduled_at),
      reason: '',
    }
  akad.confirmed = outcomes.value.akad?.confirmed ?? true
  akad.occurred_at = localValue(outcomes.value.akad?.occurred_at ?? null)
  akad.reference = outcomes.value.akad?.reference ?? ''
  akad.reason = ''
}

async function load(visitsPage = 1) {
  const id = Number(leadInput.value)
  if (!Number.isInteger(id) || id < 1) {
    message.value = 'Masukkan ID calon pembeli yang valid.'
    return
  }
  loading.value = true
  message.value = ''
  success.value = false
  try {
    await session.refresh()
    const [leadResponse, outcomeResponse] = await Promise.all([
      api.request<{ data: OutcomeLeadSummary }>(`/api/v1/leads/${id}`),
      api.request<{ data: LeadOutcomes }>(
        `/api/v1/internal/leads/${id}/outcomes?visits_page=${visitsPage}`,
      ),
    ])
    lead.value = leadResponse.data
    outcomes.value = outcomeResponse.data
    syncForms()
    await navigateTo(
      { path: '/backoffice/hasil', query: { lead: String(id) } },
      { replace: true },
    )
  } catch (error) {
    lead.value = null
    outcomes.value = null
    message.value = staffError(error)
  } finally {
    loading.value = false
  }
}

async function mutate(
  path: string,
  method: 'POST' | 'PATCH',
  body: Record<string, unknown>,
) {
  if (!outcomes.value || busy.value) return
  busy.value = true
  message.value = ''
  success.value = false
  try {
    outcomes.value = (
      await api.request<{ data: LeadOutcomes }>(path, {
        method,
        body: { version: outcomes.value.lead_version, ...body },
      })
    ).data
    syncForms()
    message.value = 'Hasil berhasil disimpan dan histori aktivitas diperbarui.'
    success.value = true
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409) await load()
    message.value = staffError(error)
    success.value = false
  } finally {
    busy.value = false
  }
}

async function saveQualification() {
  if (!lead.value) return
  await mutate(
    `/api/v1/internal/leads/${lead.value.id}/qualification`,
    'PATCH',
    {
      qualified: qualification.qualified,
      reason: qualification.reason.trim(),
    },
  )
}
async function addVisit() {
  if (!lead.value) return
  const scheduled = visit.scheduled_at
    ? jakartaPreferenceToIso(visit.scheduled_at)
    : null
  await mutate(`/api/v1/internal/leads/${lead.value.id}/visits`, 'POST', {
    status: visit.status,
    ...(scheduled ? { scheduled_at: scheduled } : {}),
    reason: visit.reason.trim(),
  })
  if (success.value) {
    visit.status = 'REQUESTED'
    visit.scheduled_at = ''
    visit.reason = ''
  }
}
async function updateVisit(id: number) {
  if (!lead.value) return
  const edit = visitEdits[id]
  if (!edit) return
  const scheduled = edit.scheduled_at
    ? jakartaPreferenceToIso(edit.scheduled_at)
    : null
  await mutate(
    `/api/v1/internal/leads/${lead.value.id}/visits/${id}`,
    'PATCH',
    {
      status: edit.status,
      ...(scheduled ? { scheduled_at: scheduled } : {}),
      reason: edit.reason.trim(),
    },
  )
}
async function saveAkad() {
  if (!lead.value) return
  const occurred = akad.occurred_at
    ? jakartaPreferenceToIso(akad.occurred_at)
    : null
  await mutate(
    `/api/v1/internal/leads/${lead.value.id}/akad-confirmation`,
    'POST',
    {
      confirmed: akad.confirmed,
      ...(occurred ? { occurred_at: occurred } : {}),
      ...(akad.reference.trim() ? { reference: akad.reference.trim() } : {}),
      reason: akad.reason.trim(),
    },
  )
}
async function saveAttribution() {
  if (!lead.value) return
  await mutate(`/api/v1/internal/leads/${lead.value.id}/attribution`, 'PATCH', { ...attribution, reason: attribution.reason.trim() })
  if (success.value) attribution.reason = ''
}

onMounted(() => {
  if (leadInput.value) load()
  else
    session.refresh().catch((error) => {
      message.value = staffError(error)
    })
})
</script>

<template>
  <section class="container section">
    <p class="eyebrow">CRM · OUTCOME</p>
    <h1>Hasil prospek</h1>
    <p class="muted">
      Catat qualification, kunjungan aktual, dan konfirmasi akad sebagai bukti
      terpisah. Perubahan tahap pipeline tetap dilakukan dari halaman Calon
      pembeli.
    </p>
    <form class="action-row" @submit.prevent="load()">
      <label
        >ID calon pembeli<input
          v-model="leadInput"
          type="number"
          min="1"
          required
          inputmode="numeric"
      /></label>
      <button class="button" :disabled="loading">
        {{ loading ? 'Memuat…' : 'Buka hasil' }}
      </button>
    </form>
    <p
      v-if="message"
      :class="success ? 'success-notice' : 'error-text'"
      :role="success ? 'status' : 'alert'"
    >
      {{ message }}
    </p>

    <template v-if="lead && outcomes">
      <div class="outcome-heading">
        <div>
          <span class="badge" :data-state="lead.status">{{ lead.status }}</span>
          <h2>{{ lead.name }}</h2>
          <p>
            {{ lead.property?.title ?? 'Properti tidak tersedia' }} · Lead #{{
              lead.id
            }}
          </p>
        </div>
        <NuxtLink
          :to="{ path: '/backoffice', query: { lead: lead.id } }"
          class="text-link"
          >Buka riwayat calon pembeli<AppIcon name="arrow" /></NuxtLink
        >
      </div>

      <div class="outcome-grid">
        <article class="outcome-card">
          <p class="eyebrow">KUALIFIKASI</p>
          <h2>
            {{
              outcomes.qualification?.qualified
                ? 'Qualified'
                : 'Belum qualified'
            }}
          </h2>
          <p class="muted">
            {{
              outcomes.qualification?.reason || 'Belum ada alasan yang dicatat.'
            }}
          </p>
          <form @submit.prevent="saveQualification">
            <label
              >Status<select v-model="qualification.qualified">
                <option :value="true">Qualified</option>
                <option :value="false">Belum qualified</option>
              </select></label
            >
            <label
              >Dasar penilaian<textarea
                v-model="qualification.reason"
                required
                maxlength="1000"
                rows="3"
                placeholder="Ringkas percakapan dua arah, kecocokan tipe, dan kesiapan langkah lanjut."
              />
            </label>
            <button class="button secondary" :disabled="busy">
              Simpan qualification
            </button>
          </form>
        </article>

        <article class="outcome-card">
          <p class="eyebrow">KUNJUNGAN BARU</p>
          <h2>Catat permintaan atau jadwal</h2>
          <form @submit.prevent="addVisit">
            <label
              >Status<select v-model="visit.status">
                <option value="REQUESTED">Diminta</option>
                <option value="CONFIRMED">Dikonfirmasi</option>
              </select></label
            >
            <label
              >Waktu WIB <span class="muted">(opsional saat diminta)</span
              ><input v-model="visit.scheduled_at" type="datetime-local"
            /></label>
            <label
              >Alasan / konteks<textarea
                v-model="visit.reason"
                required
                maxlength="1000"
                rows="3"
              />
            </label>
            <button class="button secondary" :disabled="busy">
              Tambah kunjungan
            </button>
          </form>
        </article>
      </div>

      <h2>Riwayat kunjungan</h2>
      <p v-if="outcomes.visits_meta">{{ outcomes.visits_meta.total }} kunjungan · Halaman {{ outcomes.visits_meta.current_page }} / {{ outcomes.visits_meta.last_page }}</p>
      <div class="visit-list">
        <article
          v-for="item in outcomes.visits"
          :key="item.id"
          class="outcome-card"
        >
          <div class="section-heading">
            <div>
              <span class="badge">{{ visitLabels[item.status] }}</span>
              <h3>{{ formatDate(item.scheduled_at) }}</h3>
            </div>
            <small class="muted">#{{ item.id }} · v{{ item.version }}</small>
          </div>
          <p>{{ item.reason || 'Tanpa catatan.' }}</p>
          <form @submit.prevent="updateVisit(item.id)">
            <label
              >Status<select v-model="visitEdits[item.id]!.status">
                <option
                  v-for="(label, status) in visitLabels"
                  :key="status"
                  :value="status"
                >
                  {{ label }}
                </option>
              </select></label
            >
            <label
              >Waktu WIB<input
                v-model="visitEdits[item.id]!.scheduled_at"
                type="datetime-local"
            /></label>
            <label
              >Alasan perubahan<textarea
                v-model="visitEdits[item.id]!.reason"
                required
                maxlength="1000"
                rows="2"
              />
            </label>
            <button class="button secondary" :disabled="busy">
              Simpan perubahan
            </button>
          </form>
        </article>
        <p v-if="!outcomes.visits.length" class="notice">
          Belum ada kunjungan yang dicatat.
        </p>
      </div>

      <nav v-if="outcomes.visits_meta && outcomes.visits_meta.last_page > 1" class="action-row" aria-label="Halaman kunjungan"><button class="button secondary" :disabled="loading || outcomes.visits_meta.current_page <= 1" @click="load(outcomes.visits_meta.current_page - 1)">Sebelumnya</button><button class="button secondary" :disabled="loading || outcomes.visits_meta.current_page >= outcomes.visits_meta.last_page" @click="load(outcomes.visits_meta.current_page + 1)">Berikutnya</button></nav>

      <article
        v-if="session.account.value?.role === 'ADMIN'"
        class="outcome-card akad-card"
      >
        <p class="eyebrow">ADMIN · AKAD</p>
        <h2>
          {{
            outcomes.akad?.confirmed ? 'Akad terkonfirmasi' : 'Konfirmasi akad'
          }}
        </h2>
        <p class="muted">
          Hanya dapat dikonfirmasi untuk lead berstatus DEAL. Referensi
          merupakan dasar verifikasi ringkas; jangan memasukkan dokumen atau
          data finansial sensitif.
        </p>
        <form @submit.prevent="saveAkad">
          <label
            >Tindakan<select v-model="akad.confirmed">
              <option :value="true">Konfirmasi akad</option>
              <option :value="false">Cabut konfirmasi</option>
            </select></label
          >
          <label v-if="akad.confirmed"
            >Waktu akad WIB<input
              v-model="akad.occurred_at"
              type="datetime-local"
              required
          /></label>
          <label v-if="akad.confirmed"
            >Referensi verifikasi<input
              v-model="akad.reference"
              required
              maxlength="160"
              placeholder="Contoh: konfirmasi Admin pada berkas internal"
          /></label>
          <label
            >Alasan<textarea
              v-model="akad.reason"
              required
              maxlength="1000"
              rows="3"
            />
          </label>
          <button
            class="button"
            :disabled="busy || (akad.confirmed && lead.status !== 'DEAL')"
          >
            {{
              akad.confirmed && lead.status !== 'DEAL'
                ? 'Lead harus berstatus DEAL'
                : 'Simpan konfirmasi akad'
            }}
          </button>
        </form>
      </article>

      <article class="outcome-card attribution-card">
        <p class="eyebrow">ATRIBUSI</p>
        <h2>Konteks yang tersedia</h2>
        <dl>
          <div>
            <dt>Metode</dt>
            <dd>{{ outcomes.attribution.method || 'UNKNOWN' }}</dd>
          </div>
          <div>
            <dt>First touch</dt>
            <dd>
              {{
                outcomes.attribution.first_touch?.source || 'Tidak diketahui'
              }}
              / {{ outcomes.attribution.first_touch?.medium || '—' }} /
              {{ outcomes.attribution.first_touch?.campaign || '—' }}
            </dd>
          </div>
          <div>
            <dt>Last touch</dt>
            <dd>
              {{
                outcomes.attribution.last_touch?.source || 'Tidak diketahui'
              }}
              / {{ outcomes.attribution.last_touch?.medium || '—' }} /
              {{ outcomes.attribution.last_touch?.campaign || '—' }}
            </dd>
          </div>
        </dl>
        <p class="muted">
          Klaim client bukan bukti platform terverifikasi. Outcome tetap dicatat
          walau atribusi tidak diketahui.
        </p>
        <form v-if="session.account.value?.role === 'ADMIN'" @submit.prevent="saveAttribution">
          <label>Sumber yang dikonfirmasi calon pembeli<select v-model="attribution.source"><option value="unknown">Tidak diketahui</option><option value="google">Google</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="referral">Referensi</option><option value="direct">Langsung / WhatsApp</option><option value="walk_in">Datang langsung</option></select></label>
          <label>Media<select v-model="attribution.medium"><option value="unknown">Tidak diketahui</option><option value="cpc">Iklan pencarian</option><option value="paid_social">Iklan sosial</option><option value="organic">Pencarian organik</option><option value="social">Sosial organik</option><option value="referral">Referensi</option><option value="direct">Langsung</option><option value="offline">Offline</option></select></label>
          <label>Nama kampanye (tanpa data pribadi)<input v-model="attribution.campaign" required maxlength="120" pattern="[a-z][a-z0-9_-]*" /></label>
          <label>Dasar pencatatan / koreksi<textarea v-model="attribution.reason" required maxlength="1000" rows="2" /></label>
          <p class="muted">Pilih tidak diketahui jika belum ada konfirmasi. Data ini dicatat sebagai ADMIN_REPORTED dan tidak dikirim otomatis ke platform iklan.</p>
          <button class="button secondary" :disabled="busy">Simpan sumber manual</button>
        </form>
      </article>
    </template>
  </section>
</template>
