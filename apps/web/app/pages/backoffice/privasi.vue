<script setup lang="ts">
import type { Paginated } from '#shared/types'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Retensi lead — Flamboyan', robots: 'noindex, nofollow' })
type Candidate = {
  id: number
  property_id: number
  status: string
  version: number
  updated_at: string
}
const result = ref<
  | (Paginated<Candidate> & {
      policy_approved: boolean
      retention_months: number
    })
  | null
>(null)
const message = ref('')
const busy = ref(false)
async function load(page = 1) {
  busy.value = true
  try {
    result.value = await useStaffApi().request(
      `/api/v1/internal/privacy?page=${page}`,
    )
    message.value = ''
  } catch (error) {
    result.value = null
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(() => load())
</script>
<template>
  <section class="container section">
    <p class="eyebrow">ADMIN · PRIVASI</p>
    <h1>Kandidat retensi lead</h1>
    <p>
      Daftar baca saja untuk lead terminal yang melewati masa retensi sejak
      aktivitas terakhir. Verifikasi permintaan, dasar retensi, serta kebijakan
      dan backup dengan penanggung jawab sebelum redaksi permanen.
    </p>
    <p v-if="message" role="alert">{{ message }}</p>
    <template v-if="result"
      ><p>
        {{ result.retention_months }} bulan ·
        {{
          result.policy_approved
            ? 'Policy ditandai disahkan pada konfigurasi'
            : 'Policy belum ditandai disahkan'
        }}. Tidak ada penghapusan otomatis.
      </p>
      <div class="table-wrap">
        <table class="lead-table">
          <caption>
            Kandidat tanpa data kontak
          </caption>
          <thead>
            <tr>
              <th scope="col">Lead</th>
              <th scope="col">Properti</th>
              <th scope="col">Status</th>
              <th scope="col">Versi</th>
              <th scope="col">Aktivitas terakhir</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in result.data" :key="lead.id">
              <td>#{{ lead.id }}</td>
              <td>#{{ lead.property_id }}</td>
              <td>{{ lead.status }}</td>
              <td>{{ lead.version }}</td>
              <td>
                {{
                  new Date(lead.updated_at).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                  })
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!result.data.length">Belum ada kandidat retensi.</p>
      <nav class="pagination" aria-label="Halaman kandidat retensi">
        <button
          :disabled="busy || result.meta.current_page <= 1"
          @click="load(result.meta.current_page - 1)"
        >
          Sebelumnya</button
        ><span>{{ result.meta.current_page }}/{{ result.meta.last_page }}</span
        ><button
          :disabled="busy || result.meta.current_page >= result.meta.last_page"
          @click="load(result.meta.current_page + 1)"
        >
          Berikutnya
        </button>
      </nav></template
    >
    <h2>Prosedur redaksi terkontrol</h2>
    <p>
      Operator menjalankan CLI <code>flamboyan:lead-anonymize ID</code> untuk
      dry-run. Eksekusi membutuhkan Admin aktif, kata sandi melalui prompt
      private, versi terbaru, referensi kasus tanpa PII, policy disahkan, dan
      konfirmasi eksplisit. Mode retensi memeriksa ulang umur lead. Tidak
      tersedia API untuk mengedit histori.
    </p>
    <p>
      Nama/nomor dan catatan direduksi; waktu, aktor, status, relasi dan metrik
      dipertahankan. Lead dianonimkan terkunci agar data pribadi tidak
      dimasukkan kembali. Langkah lengkap dan penanganan backup ada dalam
      runbook.
    </p>
  </section>
</template>
