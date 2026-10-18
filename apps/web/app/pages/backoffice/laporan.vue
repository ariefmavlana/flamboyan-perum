<script setup lang="ts">
import type { LeadReport } from '#shared/types'
import { leadLabels } from '#shared/utils/leads'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({
  title: 'Laporan supervisi',
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
const statusLabels: Record<string, string> = leadLabels
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
    <h1>Hasil penjualan</h1>
    <p class="muted">
      Pilih periode masuknya calon pembeli untuk melihat perkembangan hingga
      saat ini. Semua waktu ditampilkan dalam WIB.
    </p>
    <form class="action-row" @submit.prevent="load">
      <label>Tanggal awal<input v-model="from" type="date" required /></label>
      <label>Tanggal akhir<input v-model="to" type="date" required /></label>
      <StaffPicker
        v-if="session.account.value?.role === 'ADMIN'"
        v-model="marketing"
        kind="marketing"
        label="Marketing penanggung jawab (opsional)"
        :required="false"
      />
      <button class="button" :disabled="busy">
        {{ busy ? 'Memuat…' : 'Tampilkan laporan' }}
      </button>
    </form>
    <p v-if="message" role="alert">{{ message }}</p>
    <template v-if="report">
      <h2>Akuisisi sampai akad</h2>
      <p>Periode cohort memakai tanggal lead dibuat, termasuk WhatsApp manual dan formulir. Outcome menunjukkan keadaan terakhir; satu lead dihitung sekali per metrik. Tahap DEAL dan bukti akad ditampilkan terpisah.</p>
      <div v-if="report.growth" class="report-metrics">
        <article><h3>Lead valid</h3><strong>{{ report.growth.valid_leads_unique }}</strong></article>
        <article><h3>Qualified</h3><strong>{{ report.growth.qualified_unique }}</strong></article>
        <article><h3>Survei terkonfirmasi</h3><strong>{{ report.growth.visits_confirmed_unique }}</strong></article>
        <article><h3>Survei dihadiri</h3><strong>{{ report.growth.visits_completed_unique }}</strong></article>
        <article><h3>DEAL</h3><strong>{{ report.growth.deals_unique }}</strong></article>
        <article><h3>Akad terverifikasi Admin</h3><strong>{{ report.growth.akad_confirmed_unique }}</strong></article>
      </div>
      <template v-if="report.growth">
        <p>{{ report.growth.unknown_source_unique }} lead tanpa sumber diketahui. CPL / biaya qualified: {{ report.growth.costs.available ? report.growth.costs.cpl_idr : 'Belum tersedia' }}. {{ report.growth.costs.reason }}</p>
        <p>Formulir yang masuk dalam periode: {{ report.growth.inquiries.total }}; menunggu {{ report.growth.inquiries.pending }}, direkonsiliasi {{ report.growth.inquiries.resolved }}, spam {{ report.growth.inquiries.rejected_spam }}, kedaluwarsa {{ report.growth.inquiries.expired }}. Ini cohort tanggal inquiry, sehingga berbeda dari cohort lead.</p>
        <div
          class="table-scroll responsive-records"
          role="region"
          aria-label="Sumber akuisisi"
          tabindex="0"
        >
          <table class="lead-table">
            <caption>
              Sumber terakhir yang diketahui per lead; klaim client / Admin
              belum diverifikasi platform
            </caption>
            <thead>
              <tr>
                <th scope="col">Sumber / media</th>
                <th scope="col">Kampanye</th>
                <th scope="col">Metode</th>
                <th scope="col">Lead</th>
                <th scope="col">Qualified</th>
                <th scope="col">Akad</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in report.growth.campaigns"
                :key="`${item.source}:${item.medium}:${item.campaign}:${item.method}`"
              >
                <td data-label="Sumber / media">
                  {{ item.source }} / {{ item.medium }}
                </td>
                <td data-label="Kampanye">{{ item.campaign }}</td>
                <td data-label="Metode">{{ item.method }}</td>
                <td data-label="Lead">{{ item.valid_leads_unique }}</td>
                <td data-label="Qualified">{{ item.qualified_unique }}</td>
                <td data-label="Akad">{{ item.akad_confirmed_unique }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <div class="report-metrics">
        <article>
          <h2>Calon pembeli dalam periode</h2>
          <strong>{{ report.cohort_size }} calon pembeli</strong>
        </article>
        <article>
          <h2>Menjadi pembelian</h2>
          <strong>{{ report.conversion_percent }}%</strong>
          <p>
            {{ report.statuses.DEAL }} / {{ report.cohort_size }} calon pembeli
          </p>
        </article>
        <article>
          <h2>Waktu tengah untuk menghubungi</h2>
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
        Waktu dihitung dari penugasan pertama sampai pertama kali ditandai sudah
        dihubungi. Nilai tengah (median) hanya memakai calon pembeli yang sudah
        dihubungi; pergantian Marketing tidak mengulang perhitungan.
      </p>
      <h2>
        Belum dihubungi: {{ report.follow_up.not_followed_up }} calon pembeli
      </h2>
      <ul>
        <li>
          Belum pernah ditugaskan: {{ report.follow_up.pending_age.unassigned }}
        </li>
        <li>
          Ditugaskan kurang dari 1 hari:
          {{ report.follow_up.pending_age.under_1_day }}
        </li>
        <li>
          Usia 1–7 hari: {{ report.follow_up.pending_age['1_to_7_days'] }}
        </li>
        <li>Usia &gt;7 hari: {{ report.follow_up.pending_age.over_7_days }}</li>
      </ul>
      <h2>Perjalanan pembelian</h2>
      <ul
        class="report-distribution"
        aria-label="Jumlah calon pembeli per tahap"
      >
        <li v-for="(count, status) in report.statuses" :key="status">
          <span>{{ statusLabels[status] ?? status }}</span
          ><progress
            :value="count"
            :max="Math.max(report.cohort_size, 1)"
            :aria-label="statusLabels[status] ?? String(status)"
          /><strong>{{ count }}</strong>
        </li>
      </ul>
      <div
        class="table-scroll responsive-records"
        role="region"
        aria-label="Rincian tahap calon pembeli"
        tabindex="0"
      >
        <table class="lead-table">
          <caption>
            Rincian tahap calon pembeli dalam periode
          </caption>
          <thead>
            <tr>
              <th scope="col">Status saat ini</th>
              <th scope="col">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, status) in report.statuses" :key="status">
              <th scope="row" data-label="Status saat ini">
                {{ statusLabels[status] ?? status }}
              </th>
              <td data-label="Jumlah">{{ count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="table-scroll responsive-records"
        role="region"
        aria-label="Penanggung jawab saat ini"
        tabindex="0"
      >
        <table class="lead-table">
          <caption>
            Penanggung jawab saat ini
          </caption>
          <thead>
            <tr>
              <th scope="col">Tim</th>
              <th scope="col">Calon pembeli</th>
              <th scope="col">Pembelian selesai</th>
              <th scope="col">Konversi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in report.current_assignees"
              :key="item.user_id ?? 0"
            >
              <th scope="row" data-label="Tim">{{ item.name }}</th>
              <td data-label="Calon pembeli">{{ item.lead_count }}</td>
              <td data-label="Pembelian selesai">{{ item.deals }}</td>
              <td data-label="Konversi">{{ item.conversion_percent }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="table-scroll responsive-records"
        role="region"
        aria-label="Marketing yang pertama kali menghubungi"
        tabindex="0"
      >
        <table class="lead-table">
          <caption>
            Marketing yang pertama kali menghubungi
          </caption>
          <thead>
            <tr>
              <th scope="col">Tim</th>
              <th scope="col">Tindak lanjut</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in report.first_follow_up_actors"
              :key="item.user_id"
            >
              <th scope="row" data-label="Tim">{{ item.name }}</th>
              <td data-label="Tindak lanjut">{{ item.completed }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!report.cohort_size">
        Belum ada calon pembeli dalam periode ini.
      </p>
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
