export interface BuyerGuide {
  slug: string
  category: string
  title: string
  summary: string
  image: string
  imageAlt: string
  credit: string
  source: string
  sections: { title: string; text: string; checklist: string[] }[]
  reference?: { title: string; url: string }
}
export const buyerGuides: BuyerGuide[] = [
  {
    slug: 'kunjungan-rumah',
    category: 'KUNJUNGAN',
    title: 'Lihat rumah lebih dekat.',
    summary:
      'Bawa kebutuhan sehari-hari ke dalam kunjungan: cahaya, alur ruang, penyimpanan, dan lingkungan.',
    image: '/images/editorial-living-960.webp',
    imageAlt: 'Foto ilustrasi ruang duduk dengan cahaya alami.',
    credit: 'Polina Kuzovkova / Unsplash',
    source: 'https://unsplash.com/photos/iq2CirhoVck',
    sections: [
      {
        title: 'Mulai dari keseharian Anda',
        text: 'Bayangkan pagi yang sibuk, bekerja dari rumah, waktu keluarga, dan kedatangan tamu. Gunakan kunjungan untuk melihat apakah tata ruang mendukung kebiasaan tersebut.',
        checklist: [
          'Catat kebutuhan kamar, ruang kerja, penyimpanan, dan parkir.',
          'Bawa ukuran furnitur utama agar proporsi ruang dapat dibandingkan.',
          'Tentukan hal yang wajib ada dan hal yang masih bisa disesuaikan.',
        ],
      },
      {
        title: 'Lihat ruang, bukan hanya fotonya',
        text: 'Foto membantu menyaring pilihan. Saat berkunjung, periksa orientasi cahaya, sirkulasi, hubungan antarruang, dan kondisi yang terlihat. Minta penjelasan jika ada perbedaan dengan denah atau materi pemasaran.',
        checklist: [
          'Amati cahaya dan penghawaan di kamar serta ruang bersama.',
          'Periksa area basah, akses servis, dan ruang penyimpanan.',
          'Tanyakan bagian yang termasuk dalam penawaran dan opsi perubahan.',
        ],
      },
      {
        title: 'Konfirmasikan sebelum pulang',
        text: 'Simpan daftar pertanyaan yang belum terjawab. Untuk penilaian struktur, kondisi teknis, atau dokumen, gunakan tenaga profesional yang sesuai bila diperlukan.',
        checklist: [
          'Minta spesifikasi dan denah terbaru.',
          'Konfirmasikan harga, ketersediaan, dan tahapan berikutnya kepada Admin.',
          'Sepakati tindak lanjut tanpa menganggap kunjungan sebagai pemesanan unit.',
        ],
      },
    ],
  },
  {
    slug: 'memilih-lokasi',
    category: 'LOKASI',
    title: 'Temukan ritme hidup di Bandung Timur.',
    summary:
      'Nilai lokasi dari perjalanan dan kebutuhan keluarga Anda, lalu periksa langsung rute yang paling sering dilalui.',
    image: '/images/editorial-garden-960.webp',
    imageAlt:
      'Foto ilustrasi hunian tropis; bukan dokumentasi lokasi Bandung Timur.',
    credit: 'Sergei Bezzubov / Unsplash',
    source: 'https://unsplash.com/photos/Pfp0MP8QB7M',
    sections: [
      {
        title: 'Petakan tujuan yang penting',
        text: 'Lokasi yang terasa nyaman bergantung pada rutinitas masing-masing keluarga. Buat daftar tujuan yang sering dikunjungi sebelum membandingkan rumah.',
        checklist: [
          'Tempat kerja atau kegiatan usaha.',
          'Sekolah dan kebutuhan anggota keluarga.',
          'Belanja harian, layanan kesehatan, dan kegiatan akhir pekan.',
        ],
      },
      {
        title: 'Coba perjalanan Anda sendiri',
        text: 'Jarak di peta tidak sama dengan waktu perjalanan. Kondisi lalu lintas, pilihan rute, dan jam keberangkatan dapat mengubah pengalaman perjalanan.',
        checklist: [
          'Gunakan titik koordinat properti yang sudah dikonfirmasi.',
          'Coba rute pada jam yang mendekati rutinitas Anda.',
          'Periksa akses masuk, penerangan, dan kondisi jalan saat kunjungan.',
        ],
      },
      {
        title: 'Tanyakan kondisi lingkungan',
        text: 'Gunakan informasi lokasi yang bersumber dan bertanggal. Daftar fasilitas di halaman rumah adalah bahan awal untuk diverifikasi, bukan janji waktu tempuh.',
        checklist: [
          'Konfirmasikan pengelolaan lingkungan dan biaya yang berlaku.',
          'Tanyakan pasokan air, listrik, dan ketersediaan jaringan sesuai kebutuhan.',
          'Minta penjelasan kondisi drainase dan lingkungan kepada pihak yang berwenang.',
        ],
      },
    ],
  },
  {
    slug: 'merencanakan-pembiayaan',
    category: 'PEMBIAYAAN',
    title: 'Kenali angka di balik pilihan rumah.',
    summary:
      'Gunakan simulasi untuk membandingkan skenario, lalu minta rincian pembiayaan yang berlaku dari bank.',
    image: '/images/editorial-living-960.webp',
    imageAlt: 'Foto ilustrasi interior dengan material hangat.',
    credit: 'Polina Kuzovkova / Unsplash',
    source: 'https://unsplash.com/photos/iq2CirhoVck',
    sections: [
      {
        title: 'Bandingkan skenario dengan asumsi yang sama',
        text: 'Di halaman rumah, ubah uang muka, tenor, dan suku bunga untuk melihat estimasi cicilan serta komposisi pokok dan bunga. Simulasi bukan persetujuan kredit atau penawaran bank.',
        checklist: [
          'Catat harga rumah dan uang muka yang digunakan.',
          'Bandingkan tenor dan total pembayaran, bukan cicilan awal saja.',
          'Simpan asumsi agar hasil antarrumah dapat dibandingkan.',
        ],
      },
      {
        title: 'Perhatikan periode bunga',
        text: 'Periksa setiap tahap bunga fixed, tenor minimum, dan mekanisme bunga setelahnya. Referensi bank bertanggal dapat mempunyai bunga berjenjang; cicilan dihitung ulang dari sisa pokok dan tenor pada setiap tahap. Floating pada kalkulator adalah skenario, bukan ramalan atau janji bank.',
        checklist: [
          'Periode fixed dan syarat program.',
          'Mekanisme peninjauan bunga setelah fixed.',
          'Dampak perubahan bunga terhadap cicilan berikutnya.',
        ],
      },
      {
        title: 'Minta rincian biaya tertulis',
        text: 'Selain cicilan, ada provisi, administrasi, appraisal, asuransi, notaris, pajak, dan biaya sesuai produk. Program biaya developer perlu dikonfirmasi cakupan dan pengecualiannya agar tidak dihitung dua kali dengan biaya bank. Tanda jadi berbeda dari DP; klaim tanpa DP tetap membutuhkan keputusan kredit bank. Nilai biaya kosong belum diketahui, bukan gratis.',
        checklist: [
          'Minta ringkasan informasi produk yang berlaku.',
          'Tanyakan biaya awal dan biaya pelunasan dipercepat.',
          'Pastikan angka simulasi dan penawaran final dibedakan.',
        ],
      },
    ],
    reference: {
      title: 'Contoh informasi resmi biaya dan periode bunga KPR — BCA',
      url: 'https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first',
    },
  },
]
