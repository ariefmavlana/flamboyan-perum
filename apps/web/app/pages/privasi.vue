<script setup lang="ts">
import { whatsappLink } from '#shared/utils/catalog'
const config = useRuntimeConfig()
useSeoMeta({
  title: 'Informasi privasi — Flamboyan Perum',
  description:
    'Informasi penggunaan data kontak dan interaksi katalog Flamboyan Perum.',
})
const contact = whatsappLink(
  config.public.whatsappNumber,
  'permintaan informasi privasi',
  `${config.public.siteUrl}/privasi`,
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
      dengan lead atau transaksi.
    </p>
    <p v-else>
      Penghitung interaksi katalog belum diaktifkan. Pilihan perbandingan
      properti disimpan di browser Anda sebagai ID properti.
    </p>
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
