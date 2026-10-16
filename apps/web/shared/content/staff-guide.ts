import type { StaffAccount } from '../types'

export function staffGuide(role: StaffAccount['role']) {
  const admin = role === 'ADMIN'
  return [
    {
      id: 'mulai',
      title: 'Mulai hari kerja',
      intro: admin
        ? 'Pastikan setiap calon pembeli memiliki penanggung jawab dan informasi website tetap benar.'
        : 'Fokus pada calon pembeli yang ditugaskan kepada Anda dan catat hasil setiap percakapan.',
      steps: admin
        ? [
            'Buka Calon pembeli → Belum ditugaskan. Tinjau kebutuhan dan pilih Marketing penanggung jawab.',
            'Periksa Perlu dihubungi, Kunjungan & tindak lanjut, serta Pemberkasan untuk melihat pekerjaan tim.',
            'Tinjau notifikasi, perubahan katalog, dan penawaran bank sebelum ada informasi baru yang dipublikasikan.',
          ]
        : [
            'Buka Calon pembeli → Perlu dihubungi. Jika daftar kosong, periksa filter dan minta Admin memeriksa penugasan Anda.',
            'Buka detail, baca riwayat, lalu hubungi calon pembeli. Sepakati langkah berikutnya berdasarkan percakapan sebenarnya.',
            'Simpan catatan dan ubah status sesuai hasil. Periksa Kunjungan & tindak lanjut serta Pemberkasan sebelum mengakhiri hari kerja.',
          ],
      note: 'Gunakan akun pribadi masing-masing. Keluar dari sesi setelah memakai perangkat bersama.',
    },
    {
      id: 'calon-pembeli',
      title: 'Mengelola calon pembeli',
      intro: admin
        ? 'Percakapan WhatsApp perlu dicatat manual; klik WhatsApp pada website tidak otomatis menjadi calon pembeli di CRM.'
        : 'Anda melihat calon pembeli yang ditugaskan kepada Anda. Daftar ini bukan seluruh calon pembeli tim.',
      steps: [
        ...(admin
          ? [
              'Pilih Catat calon pembeli, isi nama, nomor WhatsApp dan properti yang diminati. Periksa kemungkinan duplikasi sebelum mencatat ulang.',
              'Buka detail, pilih Marketing dan isi alasan penugasan. Jika dialihkan, baca riwayat agar tindak lanjut tidak terputus.',
            ]
          : []),
        'Gunakan pencarian atau filter tahap, lalu pilih Buka detail. Baca penanggung jawab, status, catatan, dan riwayat sebelum menghubungi.',
        'Setelah percakapan, tambahkan catatan ringkas: kebutuhan, hasil, kesepakatan dan waktu tindak lanjut. Catatan tidak otomatis membuat pengingat terjadwal.',
        'Ikuti urutan: Baru → Sudah dihubungi → Survei lokasi → Pemberkasan / KPR → Pembelian selesai. Pilih Tidak dilanjutkan bila proses benar-benar berhenti.',
      ],
      note: admin
        ? 'Status akhir tidak dibuka kembali melalui form biasa. Koreksi kontak dan penugasan harus memiliki alasan; riwayat tidak dapat diedit.'
        : 'Anda tidak dapat membuat, membagi, atau memindahkan penugasan. Hubungi Admin jika kontak, properti, atau penanggung jawab perlu dikoreksi. Status akhir dan riwayat tidak dapat diedit melalui form biasa.',
    },
    {
      id: 'notifikasi',
      title: 'Notifikasi dan aktivitas',
      intro:
        'Tautan notifikasi di bawah header membuka Notifikasi & aktivitas pada daftar calon pembeli.',
      steps: [
        'Buka notifikasi untuk melihat penugasan atau perubahan status.',
        'Pilih calon pembeli yang terkait, baca detail, kemudian lakukan tindak lanjut yang diperlukan.',
        'Gunakan Tandai dibaca setelah ditinjau. Jika pembaruan terlambat, pilih Muat ulang notifikasi atau muat ulang data.',
      ],
      note: 'Notifikasi bukan konfirmasi bahwa pembeli sudah dihubungi. Catat hasil percakapan sendiri. Mode pembaruan berkala tetap dapat digunakan saat koneksi langsung tidak tersedia.',
    },
    {
      id: 'katalog',
      title: 'Katalog, gambar, dan publikasi',
      intro: admin
        ? 'Admin dapat mengelola katalog tim, penanggung jawab properti, harga komersial, dan publikasi.'
        : 'Marketing mengelola properti miliknya. Properti tim lain tidak ditampilkan dalam daftar Anda.',
      steps: [
        'Cari tipe rumah, lalu pilih Edit properti. Periksa informasi utama, luas, kamar, alamat, dan ketersediaan dari sumber yang benar.',
        'Pada Foto & media, pilih jenis yang tepat: foto, denah, masterplan, atau video YouTube. Isi keterangan dan izin publikasi, lalu tunggu media berstatus siap.',
        ...(admin
          ? [
              'Pada Harga & pembayaran, isi harga normal/program dan tanggal berlaku sesuai sumber. Kosong berarti belum diketahui; jangan menggantinya dengan nol atau data contoh.',
            ]
          : []),
        'Simpan perubahan dan periksa hasil melalui Lihat website publik. Draf/arsip serta media yang tidak dipublikasikan tidak tampil untuk pengunjung.',
      ],
      note: admin
        ? 'Lima tipe aktif: 36/60, 36/90, 56/90, 62/70, dan 69/80. Jumlah unit rencana bukan bukti stok. Bedakan ilustrasi, foto aktual dan denah.'
        : 'Pengaturan komersial, harga program, dan pengalihan pemilik dikelola Admin. Jangan menjanjikan stok atau pembiayaan tanpa konfirmasi terbaru.',
    },
    ...(admin
      ? [
          {
            id: 'konten',
            title: 'Beranda, video, dan konten website',
            intro:
              'Buka Konten publik, pilih bagian yang ingin diperbarui, lalu edit record yang sudah ada agar tidak membuat duplikasi.',
            steps: [
              'Sorotan beranda: isi judul/pengantar, tautan YouTube dan judul video. Pilih otomatis tanpa suara atau putar setelah dipilih pengunjung.',
              'Pilih properti dan foto banner. Foto tampil di pembuka dan video tetap tampil pada bagian video kawasan di bawahnya. Tambahkan foto melalui panel Foto & media, tunggu siap, lalu Perbarui pilihan gambar dan pilih hasilnya.',
              'Kawasan & kontak: periksa alamat, WhatsApp, fasilitas dan sumber. Bedakan fasilitas yang sudah ada dari rencana.',
              'Tinjau isi dan izin, centang verifikasi, pilih Publikasikan, lalu Simpan konten. Periksa halaman publik setelah simpan.',
            ],
            note: 'Kosongkan tautan video untuk kembali ke gambar. Autoplay mengikuti izin browser. Perubahan gambar unggahan baru tampil sebagai pendamping setelah dipilih dan konten disimpan.',
          },
          {
            id: 'kpr',
            title: 'Mengisi penawaran BNI dan BSI',
            intro:
              'Tarif proyek tidak boleh dikarang. Gunakan dokumen atau penawaran bank yang berlaku untuk tipe dan harga rumah terkait.',
            steps: [
              'Konten publik → Referensi KPR: isi penawaran BNI, sumber, tanggal berlaku, tenor, bunga efektif/tahapan dan biaya yang diketahui. Durasi tahapan harus sesuai periode fixed.',
              'Konten publik → Pembiayaan BSI & BNI: program BSI Flat hanya untuk 36/60. Tipe lain menggunakan BSI Griya sesuai penawaran yang dikonfirmasi.',
              'Untuk penawaran murabahah BSI, isi tipe, harga rumah, DP, tenor dan total margin rupiah sesuai akad/penawaran. Jika harga rumah berubah, tinjau dan perbarui penawaran.',
              'Verifikasi sumber sebelum publikasi. Periksa hasil pada detail tipe rumah; nilai yang belum diketahui tetap kosong atau berupa informasi yang menunggu konfirmasi.',
            ],
            note: 'Simulasi bukan persetujuan kredit. BNI/BSI tersedia untuk seluruh tipe; keberadaan pilihan bank tidak menjamin pengajuan disetujui. Jangan memakai promo developer lain sebagai tarif proyek ini.',
          },
          {
            id: 'laporan',
            title: 'Membaca hasil penjualan',
            intro:
              'Laporan menggunakan periode masuknya calon pembeli dan perkembangannya hingga saat ini, bukan nilai omzet.',
            steps: [
              'Pilih tanggal awal/akhir dan Marketing bila diperlukan, lalu Tampilkan laporan.',
              'Baca jumlah calon pembeli, pembelian selesai dan calon pembeli yang belum dihubungi bersama konteks periodenya.',
              'Tinjau waktu tengah untuk menghubungi beserta jumlah sampel. Nilai kosong berarti belum ada data yang memadai, bukan nol jam.',
            ],
            note: 'Semua waktu ditampilkan dalam WIB. Jangan menyimpulkan penilaian kinerja hanya dari satu angka tanpa meninjau penugasan dan riwayat.',
          },
          {
            id: 'akun',
            title: 'Mengelola akun dan penanggung jawab',
            intro:
              'Setiap anggota tim memakai akun sendiri dengan peran Admin atau Marketing sesuai tanggung jawabnya.',
            steps: [
              'Buka Akun tim, cari anggota dan periksa peran serta status aktifnya sebelum mengubah akses.',
              'Sebelum menonaktifkan atau mengubah peran, periksa calon pembeli dan properti yang masih menjadi tanggung jawabnya. Alihkan pekerjaan melalui tindakan yang tersedia.',
              'Jangan membagikan kata sandi melalui catatan calon pembeli, screenshot atau panduan. Gunakan proses pemulihan akun bila diperlukan.',
            ],
            note: 'Aplikasi melindungi Admin aktif terakhir dan pekerjaan yang belum dialihkan. Penonaktifan tidak menghapus riwayat. Jangan membuat akun bersama untuk seluruh tim.',
          },
          {
            id: 'retensi',
            title: 'Privasi dan kandidat retensi',
            intro:
              'Kandidat retensi adalah daftar untuk ditinjau, bukan tombol penghapusan massal.',
            steps: [
              'Tinjau kandidat dan dasar kebijakan yang sudah disahkan.',
              'Koordinasikan permintaan privasi kepada operator yang berwenang dengan referensi kasus secukupnya.',
              'Ikuti prosedur redaksi terkontrol; jangan menyalin nama, nomor atau catatan pribadi ke kanal publik.',
            ],
            note: 'Anonimisasi memerlukan prosedur dan konfirmasi tersendiri. Riwayat bukan dokumen yang dapat dihapus atau ditulis ulang dari halaman ini.',
          },
          {
            id: 'layanan',
            title: 'Ketika layanan membutuhkan perhatian',
            intro:
              'Kesehatan layanan membantu Admin meninjau kondisi aplikasi; perbaikan infrastruktur ditangani operator teknis.',
            steps: [
              'Pilih Periksa kembali dan lihat basis data, penyimpanan, antrean serta bukti cadangan.',
              'Jika media lama diproses, unggahan gagal, atau antrean bermasalah, catat waktu dan tindakan yang gagal lalu hubungi operator.',
              'Bila cadangan belum memiliki bukti atau terlambat, minta verifikasi. Jangan menganggap status aplikasi sehat sebagai bukti semua cadangan sudah aman.',
            ],
            note: 'Kirim keterangan masalah secukupnya tanpa kata sandi, token atau data pribadi calon pembeli.',
          },
        ]
      : []),
    {
      id: 'profil',
      title: 'Profil dan keamanan sesi',
      intro: 'Buka Profil saya atau pilih nama Anda di bagian bawah sidebar.',
      steps: [
        'Perbarui nama jika diperlukan. Email dan peran dikelola Admin.',
        'Untuk mengganti kata sandi, isi kata sandi saat ini dan konfirmasi kata sandi baru pada form. Perubahan mengakhiri seluruh sesi akun.',
        'Pilih ikon Keluar di samping nama Anda ketika selesai, terutama pada perangkat bersama.',
      ],
      note: 'Jika sesi berakhir, masuk kembali dan periksa data terbaru sebelum mengulangi perubahan yang belum terkonfirmasi.',
    },
    {
      id: 'kendala',
      title: 'Mengatasi kendala umum',
      intro:
        'Baca pesan yang ditampilkan sebelum mencoba lagi agar tidak mencatat data dua kali.',
      steps: [
        'Daftar kosong: hapus filter dan muat ulang. Marketing meminta Admin memeriksa penugasan/kepemilikan, bukan membuat data pengganti.',
        'Data berubah oleh anggota lain: muat ulang, baca perubahan terbaru dan isi kembali hanya perubahan yang masih diperlukan.',
        'Simpan belum terkonfirmasi atau koneksi putus: periksa daftar/detail terbaru lebih dahulu. Jangan langsung mengirim formulir berulang kali.',
        'Akses ditolak: gunakan menu sesuai peran; hubungi Admin bila tanggung jawab Anda berubah. Jika sesi habis, masuk kembali.',
      ],
      note: 'Laporkan nama halaman, waktu, langkah dan pesan kesalahan. Tutupi nomor pembeli serta informasi sensitif pada bukti yang dikirim.',
    },
  ]
}
