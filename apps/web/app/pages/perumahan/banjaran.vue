<script setup lang="ts">
const config = useRuntimeConfig()
useSeoMeta({
  title: 'Banjaran — Hunian mendatang dalam naungan Flamboyan',
  description:
    'Sebuah cerita baru di Banjaran. Jelajahi inspirasi hunian mendatang Flamboyan dan diskusikan rencananya bersama Admin. Visual merupakan ilustrasi.',
  ogImage: `${config.public.siteUrl.replace(/\/+$/, '')}/images/editorial-garden-1920.webp`,
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl.replace(/\/+$/, '')}/perumahan/banjaran`,
    },
  ],
})
</script>
<template>
  <div class="banjaran-page">
    <section class="banjaran-hero" aria-labelledby="banjaran-title">
      <img
        class="banjaran-hero-image"
        src="/images/editorial-garden-1920.webp"
        srcset="
          /images/editorial-garden-960.webp   960w,
          /images/editorial-garden-1920.webp 1920w
        "
        sizes="100vw"
        width="1920"
        height="1280"
        fetchpriority="high"
        alt="Foto inspirasi hunian tropis di tengah taman; bukan foto lokasi atau desain final Banjaran."
      />
      <div class="banjaran-hero-top">
        <NuxtLink to="/perumahan">← Seluruh perumahan</NuxtLink>
        <span>FLAMBOYAN / 02</span>
      </div>
      <div class="banjaran-hero-copy">
        <p class="eyebrow">BANJARAN · HUNIAN MENDATANG</p>
        <h1 id="banjaran-title">
          Hidup lebih pelan.<br />Rasakan lebih banyak.
        </h1>
        <p>
          Sebuah cerita baru dalam naungan Flamboyan.<br />Terinspirasi ruang
          yang memberi tempat untuk jeda.
        </p>
        <a class="editorial-link" href="#cerita-banjaran"
          >Kenali ceritanya <span aria-hidden="true">↓</span></a
        >
      </div>
      <p class="banjaran-credit">
        Foto inspirasi, bukan lokasi proyek ·
        <a
          href="https://unsplash.com/photos/Pfp0MP8QB7M"
          target="_blank"
          rel="noopener noreferrer"
          >Sergei Bezzubov / Unsplash ↗</a
        >
      </p>
    </section>
    <div class="banjaran-facts container" aria-label="Status rencana Banjaran">
      <div><span>KAWASAN</span><strong>Banjaran</strong></div>
      <div><span>NAUNGAN</span><strong>Flamboyan</strong></div>
      <div><span>TAHAP</span><strong>Pengenalan konsep</strong></div>
      <NuxtLink to="/konsultasi?kawasan=banjaran" class="text-link"
        >Tanyakan rencana Banjaran <AppIcon name="arrow"
      /></NuxtLink>
    </div>
    <section id="cerita-banjaran" class="container banjaran-story">
      <p class="eyebrow">SEBUAH AWAL, DI BANJARAN</p>
      <div class="residence-intro-grid">
        <h2>Lebih dekat dengan<br />hal yang berarti.</h2>
        <div>
          <p>
            Waktu bersama keluarga. Cahaya pagi di ruang favorit. Sudut tenang
            setelah hari yang panjang. Hal-hal sederhana yang membuat sebuah
            rumah terasa milik Anda.
          </p>
          <p class="muted">
            Banjaran menjadi rencana kawasan berikutnya dalam naungan Flamboyan.
            Halaman ini memperkenalkan inspirasi suasana; nama resmi, desain,
            dan detail proyek akan diperbarui setelah ditetapkan.
          </p>
        </div>
      </div>
    </section>
    <section class="banjaran-mood" aria-labelledby="banjaran-mood-title">
      <div class="container banjaran-mood-grid">
        <div>
          <p class="eyebrow">INSPIRASI KESEHARIAN</p>
          <h2 id="banjaran-mood-title">
            Ruang yang mengundang<br />Anda untuk tinggal.
          </h2>
          <p>
            Gambaran suasana untuk memulai percakapan tentang rumah yang Anda
            inginkan.
          </p>
          <ol class="banjaran-notes">
            <li>
              <span>01</span>
              <div>
                <h3>Ruang untuk bersama</h3>
                <p>
                  Bayangkan ruang berkumpul yang hangat, dari sarapan hingga
                  percakapan menjelang malam.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Tempat untuk jeda</h3>
                <p>
                  Sudut pribadi untuk membaca, bekerja, atau menikmati waktu
                  tanpa terburu-buru.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Sentuhan alam</h3>
                <p>
                  Cahaya, tekstur, dan hijau sebagai inspirasi suasana hunian
                  yang menenangkan.
                </p>
              </div>
            </li>
          </ol>
        </div>
        <figure>
          <img
            src="/images/editorial-living-960.webp"
            srcset="
              /images/editorial-living-960.webp   960w,
              /images/editorial-living-1920.webp 1920w
            "
            sizes="(max-width: 760px) 100vw, 50vw"
            width="960"
            height="1440"
            loading="lazy"
            alt="Inspirasi ruang duduk dengan cahaya sore dan material alami, bukan interior atau rancangan final Banjaran."
          />
          <figcaption>
            Foto inspirasi ·
            <a
              href="https://unsplash.com/photos/iq2CirhoVck"
              target="_blank"
              rel="noopener noreferrer"
              >Polina Kuzovkova / Unsplash ↗</a
            >.<br />Bukan spesifikasi, fasilitas, atau desain final yang
            ditawarkan.
          </figcaption>
        </figure>
      </div>
    </section>
    <section class="container banjaran-details">
      <div>
        <p class="eyebrow">INFORMASI PROYEK</p>
        <h2>Kenali rencananya.<br />Dengan jelas.</h2>
        <p>
          Detail yang telah ditetapkan akan disampaikan melalui informasi resmi
          Flamboyan.
        </p>
      </div>
      <div class="banjaran-questions">
        <details open>
          <summary>Bagaimana status perumahan Banjaran?</summary>
          <p>
            Masih dalam tahap pengenalan rencana. Banjaran adalah penanda lokasi
            sementara, bukan nama resmi perumahan. Halaman ini belum merupakan
            peluncuran penjualan.
          </p>
        </details>
        <details>
          <summary>Apakah visual ini menunjukkan rumah yang dijual?</summary>
          <p>
            Belum. Seluruh visual Banjaran adalah ilustrasi suasana. Model
            rumah, denah, spesifikasi, dan fasilitas final belum diumumkan.
          </p>
        </details>
        <details>
          <summary>Apakah harga dan lokasi tepat sudah tersedia?</summary>
          <p>
            Harga, jumlah unit, alamat lengkap, legalitas, dan jadwal
            pengembangan belum dipublikasikan. Hubungi Admin untuk mengetahui
            informasi yang sudah dapat dikonfirmasi.
          </p>
        </details>
        <details>
          <summary>Bagaimana mendapatkan informasi berikutnya?</summary>
          <p>
            Gunakan konsultasi Banjaran untuk menyiapkan percakapan dengan Admin
            di WhatsApp. Pesan dikirim oleh Anda; tidak ada pendaftaran,
            pemesanan, atau jadwal kunjungan otomatis.
          </p>
        </details>
      </div>
    </section>
    <section class="banjaran-invitation">
      <div class="container">
        <p class="eyebrow">CERITA BERIKUTNYA, BERSAMA ANDA</p>
        <h2>Bayangkan rumah Anda.<br />Mari mulai percakapannya.</h2>
        <p>Sampaikan ketertarikan Anda pada rencana hunian Banjaran.</p>
        <NuxtLink class="button" to="/konsultasi?kawasan=banjaran"
          >Bicarakan Banjaran <AppIcon name="arrow"
        /></NuxtLink>
        <NuxtLink class="editorial-link" to="/perumahan"
          >Lihat perumahan lainnya <AppIcon name="arrow"
        /></NuxtLink>
      </div>
    </section>
  </div>
</template>
