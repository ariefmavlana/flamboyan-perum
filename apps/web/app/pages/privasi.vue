<script setup lang="ts">
import { whatsappLink } from '#shared/utils/catalog'
import { canonicalUrl } from '#shared/utils/seo'
const config = useRuntimeConfig()
const consent = useConsent()
const { development, whatsappNumber } = await useDevelopment()
const operatorName = computed(
  () => development.value?.name?.trim() || 'Bukit Flamboyan Indah 2',
)
const canonical = canonicalUrl(String(config.public.siteUrl), '/privasi')
useSeoMeta({
  title: 'Informasi privasi',
  description: () =>
    `Informasi penggunaan data kontak, interaksi katalog, dan teknologi opsional ${operatorName.value}.`,
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
const contact = computed(() =>
  whatsappLink(
    whatsappNumber.value,
    'permintaan informasi privasi',
    canonical,
  ),
)
</script>
<template>
  <section class="container section narrow">
    <h1>Informasi privasi</h1>
    <p>
      Tim {{ operatorName }} menggunakan informasi kontak yang Anda berikan kepada
      Admin untuk menanggapi pertanyaan dan menindaklanjuti minat properti.
      Akses catatan internal dibatasi kepada Admin dan Marketing yang
      ditugaskan.
    </p>
    <h2>Interaksi katalog</h2>
    <p>
      Bila formulir konsultasi tersedia, nama, nomor WhatsApp, tipe rumah,
      tujuan konsultasi dan preferensi waktu yang Anda kirim digunakan untuk
      menanggapi permintaan. Preferensi kunjungan memerlukan konfirmasi Admin.
      Permintaan yang masuk diperiksa sebelum menjadi lead valid. Pilihan
      menerima informasi promosi bersifat opsional dan terpisah dari konsultasi.
    </p>
    <p v-if="String(config.public.analyticsEnabled) === 'true'">
      Kami menghitung tampilan detail dan klik WhatsApp sebagai jumlah harian
      per properti. Penghitung ini tidak menyimpan nama, nomor telepon, IP,
      identitas perangkat, atau cookie analitik dan tidak menghubungkan klik
      dengan calon pembeli atau transaksi.
    </p>
    <p v-else>
      Penghitung interaksi katalog belum diaktifkan. Pilihan perbandingan
      properti disimpan di browser Anda sebagai ID properti.
    </p>
    <h2>Teknologi opsional</h2>
    <p>
      Situs menyediakan pilihan persetujuan terpisah untuk teknologi opsional
      analitik dan pengukuran iklan. Teknologi tersebut hanya dimuat setelah
      Anda memberi persetujuan, dan tidak dimuat sama sekali selama pengelola
      situs belum mengaktifkannya. Bila teknologi itu diaktifkan, Anda dapat
      mengubah atau mencabut pilihan kapan saja melalui tombol di bawah atau
      tautan “Pilihan privasi” di footer setiap halaman.
    </p>
    <button
      v-if="consent.required.value"
      class="button secondary"
      type="button"
      @click="consent.requestChange()"
    >
      Ubah pilihan privasi
    </button>
    <h2>Penyedia eksternal</h2>
    <p>
      Jika pengukuran sumber kunjungan diaktifkan dan Anda menyetujui kategori
      yang sesuai, konteks kampanye dapat disimpan di browser paling lama
      30 hari. Data ini membantu membedakan sumber permintaan; tidak membuktikan
      bahwa percakapan WhatsApp, kunjungan, atau transaksi telah terjadi.
      Data kontak formulir tidak dikirim sebagai parameter analitik browser.
    </p>
    <p>
      WhatsApp dibuka ketika Anda memilih tautannya. Film YouTube pada beranda dapat dimuat otomatis tanpa suara jika pengelola mengaktifkannya; pemuatan ini mengirim informasi koneksi kepada YouTube. Anda dapat menjeda video melalui area pemutar atau kontrol Jeda. Peta, video galeri properti, dan virtual tour lainnya dimuat setelah Anda memilihnya. Penyedia eksternal memproses informasi menurut kebijakannya sendiri. Sesi masuk tim memakai cookie untuk keamanan akses.
    </p>
    <h2>Kontak dan permintaan Anda</h2>
    <p>
      Hubungi Admin untuk pemeriksaan, koreksi atau permintaan penghapusan data
      kontak. Tim memverifikasi identitas dan permintaan sebelum memprosesnya.
      Kebijakan retensi resmi dan detail pengelola harus disahkan sebelum
      layanan produksi diluncurkan.
    </p>
    <a
      v-if="contact"
      :href="contact"
      class="button"
      target="_blank"
      rel="noopener noreferrer"
      >Hubungi Admin tentang privasi<AppIcon name="external" /></a
    >
  </section>
</template>
