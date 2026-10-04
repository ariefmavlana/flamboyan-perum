<script setup lang="ts">
import type { LeadReport } from '#shared/types'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({
  title: 'Laporan supervisi — Flamboyan',
  robots: 'noindex, nofollow',
})
const api = useStaffApi()
const session = useStaffSession()
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
}).format(new Date())
const from = ref(
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date(Date.now() - 29 * 86400000),
  ),
)
const to = ref(today)
const marketing = ref<number | null>(null)
const report = ref<LeadReport | null>(null)
const message = ref('')
const busy = ref(false)
const statusLabels: Record<string, string> = {
  NEW_LEAD: 'Lead baru',
  FOLLOWED_UP: 'Ditindaklanjuti',
  SURVEY_LOKASI: 'Survei lokasi',
  PEMBERKASAN_KPR: 'Pemberkasan KPR',
  DEAL: 'Deal',
  LOST: 'Lost',
}
async function load() {
  busy.value = true
  message.value = ''
  try {
    await session.refresh()
    if (session.account.value?.role !== 'ADMIN') {
      report.value = null
      message.value = 'Laporan hanya tersedia untuk Admin.'
      return
    }
    const query = new URLSearchParams({
      from: from.value,
      to: to.value,
      ...(marketing.value ? { marketing_id: String(marketing.value) } : {}),
    })
    report.value = (
      await api.request<{ data: LeadReport }>(
        `/api/v1/internal/reports?${query}`,
      )
    ).data
  } catch (error) {
    report.value = null
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <section class="container section">
    <p class="eyebrow">ADMIN · SUPERVISI</p>
    <h1>Laporan perjalanan lead</h1>
    <p class="muted">
      Cohort berdasarkan tanggal pencatatan lead, ditampilkan dalam
      Asia/Jakarta. Status dan assignee adalah keadaan saat laporan dimuat.
    </p>
    <form class="action-row" @submit.prevent="load">
      <label>Tanggal awal<input v-model="from" type="date" required /></label>
      <label>Tanggal akhir<input v-model="to" type="date" required /></label>
      <StaffPicker
        v-if="session.account.value?.role === 'ADMIN'"
        v-model="marketing"
        kind="marketing"
        label="Assignee aktif saat ini (opsional)"
        :required="false"
      />
      <button class="button" :disabled="busy">
        {{ busy ? 'Memuat…' : 'Tampilkan laporan' }}
      </button>
    </form>
    <p v-if="message" role="alert">{{ message }}</p>
    <template v-if="report">
      <div class="report-metrics">
        <article>
          <h2>Ukuran cohort</h2>
          <strong>{{ report.cohort_size }} lead</strong>
        </article>
        <article>
          <h2>Konversi DEAL</h2>
          <strong>{{ report.conversion_percent }}%</strong>
          <p>{{ report.statuses.DEAL }} / {{ report.cohort_size }} lead</p>
        </article>
        <article>
          <h2>Median follow-up pertama</h2>
          <strong>{{
            report.follow_up.median_seconds === null
              ? 'Belum tersedia'
              : `${(report.follow_up.median_seconds / 3600).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam`
          }}</strong>
          <p>
            {{ report.follow_up.completed }} sampel valid;
            {{ report.follow_up.invalid_timing_count }} waktu tidak valid.
          </p>
        </article>
      </div>
      <p>
        Median dihitung dari assignment pertama sampai FOLLOWED_UP pertama.
        Reassignment tidak mereset waktu. Lead yang belum follow-up, termasuk
        terminal tanpa follow-up, tidak masuk median.
      </p>
      <h2>Belum follow-up: {{ report.follow_up.not_followed_up }} lead</h2>
      <ul>
        <li>
          Belum pernah ditugaskan: {{ report.follow_up.pending_age.unassigned }}
        </li>
        <li>
          Usia assignment &lt;1 hari:
          {{ report.follow_up.pending_age.under_1_day }}
        </li>
        <li>
          Usia 1–7 hari: {{ report.follow_up.pending_age['1_to_7_days'] }}
        </li>
        <li>Usia &gt;7 hari: {{ report.follow_up.pending_age.over_7_days }}</li>
      </ul>
      <div class="table-wrap">
        <table class="lead-table">
          <caption>
            Distribusi status cohort
          </caption>
          <thead>
            <tr>
              <th scope="col">Status saat ini</th>
              <th scope="col">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, status) in report.statuses" :key="status">
              <th scope="row">{{ statusLabels[status] ?? status }}</th>
              <td>{{ count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table class="lead-table">
          <caption>
            Assignee saat ini
          </caption>
          <thead>
            <tr>
              <th scope="col">Tim</th>
              <th scope="col">Lead</th>
              <th scope="col">DEAL</th>
              <th scope="col">Konversi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in report.current_assignees"
              :key="item.user_id ?? 0"
            >
              <th scope="row">{{ item.name }}</th>
              <td>{{ item.lead_count }}</td>
              <td>{{ item.deals }}</td>
              <td>{{ item.conversion_percent }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table class="lead-table">
          <caption>
            Aktor follow-up pertama, terpisah dari assignee saat ini
          </caption>
          <thead>
            <tr>
              <th scope="col">Tim</th>
              <th scope="col">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in report.first_follow_up_actors"
              :key="item.user_id"
            >
              <th scope="row">{{ item.name }}</th>
              <td>{{ item.completed }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!report.cohort_size">Belum ada lead dalam cohort ini.</p>
      <h2>Interaksi katalog anonim</h2>
      <p>
        {{
          report.funnel.enabled
            ? 'Pencatatan aktif'
            : 'Pencatatan belum diaktifkan'
        }}
        · {{ report.funnel.property_view }} tampilan detail ·
        {{ report.funnel.whatsapp_click }} klik WhatsApp.
      </p>
      <p class="muted">
        Jumlah event seluruh properti pada rentang yang dipilih, terpisah dari
        filter assignee. Bukan jumlah orang unik, pesan diterima, atau atribusi
        lead/deal. Tidak menyimpan identitas, IP, nomor kontak, atau cookie
        analitik.
      </p>
    </template>
  </section>
</template>
