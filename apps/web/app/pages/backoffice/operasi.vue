<script setup lang="ts">
definePageMeta({ layout: 'backoffice' })
useSeoMeta({
  title: 'Operasi layanan — Flamboyan',
  robots: 'noindex, nofollow',
})
type Health = {
  ready: boolean
  database: boolean
  private_storage: boolean
  production_configuration: boolean
  queue: {
    pending: number | null
    oldest_age_seconds: number | null
    failed: number | null
    backlog_alert: boolean
  }
  media: { failed: number; stale_processing: number } | null
  backup: {
    verified_at: string | null
    age_seconds: number | null
    overdue: boolean
  }
}
const health = ref<Health | null>(null)
const message = ref('')
const busy = ref(false)
async function load() {
  busy.value = true
  try {
    health.value = (
      await useStaffApi().request<{ data: Health }>(
        '/api/v1/internal/operations',
      )
    ).data
    message.value = ''
  } catch (error) {
    health.value = null
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <section class="container section">
    <p class="eyebrow">ADMIN · OPERASI</p>
    <h1>Kesehatan layanan</h1>
    <button class="button secondary" :disabled="busy" @click="load">
      {{ busy ? 'Memeriksa…' : 'Periksa kembali' }}
    </button>
    <p v-if="message" role="alert">{{ message }}</p>
    <template v-if="health"
      ><p role="status">
        {{
          health.ready
            ? 'Pemeriksaan aplikasi sehat'
            : 'Pemeriksaan membutuhkan perhatian'
        }}
      </p>
      <dl class="spec-grid">
        <div>
          <dt>Database</dt>
          <dd>{{ health.database ? 'Terhubung' : 'Gagal' }}</dd>
        </div>
        <div>
          <dt>Storage private</dt>
          <dd>{{ health.private_storage ? 'Baca/tulis sehat' : 'Gagal' }}</dd>
        </div>
        <div>
          <dt>Konfigurasi produksi</dt>
          <dd>
            {{
              health.production_configuration
                ? 'Pemeriksaan konfigurasi lulus'
                : 'Perlu diperbaiki'
            }}
          </dd>
        </div>
        <div>
          <dt>Job tertunda</dt>
          <dd>{{ health.queue.pending ?? 'Tidak tersedia' }}</dd>
        </div>
        <div>
          <dt>Usia job tertua</dt>
          <dd>
            {{ health.queue.oldest_age_seconds ?? 'Tidak tersedia' }} detik
          </dd>
        </div>
        <div>
          <dt>Failed jobs</dt>
          <dd>{{ health.queue.failed ?? 'Tidak tersedia' }}</dd>
        </div>
        <div>
          <dt>Media gagal / processing &gt;15 menit</dt>
          <dd>
            {{ health.media?.failed ?? '—' }} /
            {{ health.media?.stale_processing ?? '—' }}
          </dd>
        </div>
        <div>
          <dt>Backup terakhir diverifikasi</dt>
          <dd>
            {{
              health.backup.verified_at
                ? new Date(health.backup.verified_at).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                  }) + ' WIB'
                : 'Belum ada bukti'
            }}
          </dd>
        </div>
      </dl>
      <p v-if="health.queue.backlog_alert" role="alert">
        Backlog melewati 5 menit atau queue belum dapat diperiksa. Periksa
        worker dan provider melalui runbook.
      </p>
      <p v-if="health.backup.overdue" role="alert">
        Bukti backup belum tersedia atau melewati 26 jam. Verifikasi backup
        database dan media sesuai runbook.
      </p></template
    >
    <p class="muted">
      Pemeriksaan tidak membuktikan pengiriman provider, ketersediaan bulanan,
      backup offsite atau izin konten. Monitor eksternal dan bukti rilis tetap
      diperlukan.
    </p>
  </section>
</template>
