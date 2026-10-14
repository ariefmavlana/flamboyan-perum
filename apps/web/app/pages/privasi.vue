<script setup lang="ts">
import { whatsappLink } from '#shared/utils/catalog'
import { canonicalUrl } from '#shared/utils/seo'
const config = useRuntimeConfig()
const consent = useConsent()
const { whatsappNumber } = await useDevelopment()
const canonical = canonicalUrl(String(config.public.siteUrl), '/privasi')
useSeoMeta({
  title: 'Informasi privasi',
  description:
    'Informasi penggunaan data kontak, interaksi katalog, dan teknologi opsional Flamboyan Perum.',
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
const contact = whatsappLink(
  whatsappNumber.value,
  'permintaan informasi privasi',
  canonical,
)
</script>
<template>
  <section class="container section narrow">
    <h1>Informasi privasi</h1>
    <p>
      Tim Flamboyan Perum menggunakan informasi kontak yang Anda berikan kepada
      Admin untuk menanggapi pertanyaan dan menindaklanjuti minat properti.
      Akses catatan internal dibatasi kepada Admin dan Marketing yang
      ditugaskan.
    </p>
    <h2>Interaksi katalog</h2>
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
      WhatsApp dibuka ketika Anda memilih tautannya. Peta, video dan virtual
      tour dimuat setelah Anda memilih untuk memuatnya; penyedia tersebut dapat
      memproses informasi koneksi menurut kebijakannya sendiri. Sesi masuk tim
      memakai cookie untuk keamanan akses.
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
      >Hubungi Admin tentang privasi ↗</a
    >
  </section>
</template>
