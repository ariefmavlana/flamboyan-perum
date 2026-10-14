<script setup lang="ts">
definePageMeta({ layout: 'backoffice' })
useSeoMeta({
  title: 'Operasi layanan',
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
const session = useStaffSession()
const authorized = ref(false)
const message = ref('')
const busy = ref(false)
async function load() {
  busy.value = true
  authorized.value = false
  try {
    const account = await session.refresh()
    if (account?.role !== 'ADMIN') {
      await navigateTo('/backoffice', { replace: true })
      return
    }
    authorized.value = true
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
  <section v-if="authorized" class="container section">
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
          <dt>Basis data</dt>
          <dd>{{ health.database ? 'Terhubung' : 'Gagal' }}</dd>
        </div>
        <div>
          <dt>Penyimpanan privat</dt>
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
          <dt>Tugas menunggu</dt>
          <dd>{{ health.queue.pending ?? 'Tidak tersedia' }}</dd>
        </div>
        <div>
          <dt>Usia tugas tertua</dt>
          <dd>
            {{ health.queue.oldest_age_seconds ?? 'Tidak tersedia' }} detik
          </dd>
        </div>
        <div>
          <dt>Tugas gagal</dt>
          <dd>{{ health.queue.failed ?? 'Tidak tersedia' }}</dd>
        </div>
        <div>
          <dt>Media gagal / diproses &gt;15 menit</dt>
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
        Antrean melewati 5 menit atau belum dapat diperiksa. Periksa proses
        latar dan penyedia layanan sesuai panduan operasi.
      </p>
      <p v-if="health.backup.overdue" role="alert">
        Bukti cadangan belum tersedia atau melewati 26 jam. Verifikasi cadangan
        basis data dan media sesuai panduan operasi.
      </p></template
    >
    <p class="muted">
      Pemeriksaan tidak membuktikan pengiriman penyedia layanan, ketersediaan
      bulanan, cadangan di luar lokasi, atau izin konten. Pemantauan eksternal
      dan bukti rilis tetap diperlukan.
    </p>
  </section>
  <section v-else class="container section">
    <p v-if="message" role="alert">{{ message }}</p>
    <p v-else role="status">Memeriksa akses…</p>
    <button v-if="message" class="button" :disabled="busy" @click="load">
      Coba lagi
    </button>
  </section>
</template>
