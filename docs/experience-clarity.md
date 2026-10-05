# Pengalaman pembeli dan ruang kerja tim — 5 Oktober 2026

Branch `codex/experience-clarity` berasal dari `origin/main` pada `25869e3`. Pekerjaan menindaklanjuti evaluasi pengguna atas tampilan, input berbingkai oranye, alur Admin/Marketing, dan posisi Bandung Timur dalam navigasi. Tidak ada merge atau perubahan database produksi dalam pekerjaan ini.

## Persona dan keputusan desain

| Pengguna | Kebutuhan dan hambatan | Keputusan dalam produk |
|---|---|---|
| Keluarga/profesional kelas menengah atas yang mencari rumah di Bandung Timur | Memeriksa kecocokan ruang, rutinitas, biaya, dan kualitas sebelum menghubungi tim; keputusan dapat melibatkan pasangan/keluarga | Katalog segera setelah hero; harga/spesifikasi tetap faktual; bandingkan, bagikan, pembiayaan dan konsultasi dapat dijangkau; bahasa tenang, bukan tekanan promosi |
| Pembeli yang mengevaluasi lewat ponsel lalu meninjau lebih jauh di desktop | Membutuhkan informasi yang mudah dipindai, pilihan yang tersimpan, dan langkah kunjungan yang jelas | Navigasi publik lebih singkat; pintasan temukan–bandingkan–kunjungi; render kawasan beratribusi; konfirmasi kondisi aktual tetap jelas |
| Admin | Menangani percakapan masuk, menentukan penanggung jawab, mengawasi proses, menjaga katalog dan konten | Antrean kerja dengan hitungan seluruh scope; lead baru langsung membuka penugasan; navigasi Penjualan/Website/Administrasi; CMS berdasarkan tujuan konten |
| Marketing | Ingin tahu siapa yang perlu dihubungi dan apa tindak lanjutnya tanpa melihat data tim lain | Tiga antrean scoped; tindakan berikutnya per calon pembeli; WhatsApp dibuka atas tindakan pengguna; catatan/tahap dan riwayat terpisah secara visual |

Persona merupakan asumsi desain berdasarkan brief pengguna, bukan klaim hasil wawancara atau riset lapangan. Pendapatan tinggi tidak diasumsikan berarti menginginkan ornamen berlebihan, klaim investasi, ataupun transaksi tanpa memeriksa biaya/legalitas.

## Audit Rumah Rajasa

Halaman [Rumah Rajasa](https://rumahrajasa.com/) diakses langsung pada 5 Oktober 2026 melalui HTTP dan browser Chromium. Web-search tidak berhasil membaca situs; bukti langsung HTML dan screenshot disimpan lokal di `.tools/experience-review` dan tidak dicommit. HTML beranda yang diterima sekitar 1,37 MiB. Ini ukuran dokumen saat pengamatan, bukan pengukuran Core Web Vitals atau perbandingan performa yang setara.

Yang berguna: identitas Bukit Flamboyan Indah 2, visual kawasan/fasad, katalog tipe, konteks alamat, opsi pembiayaan dan FAQ. Yang tidak disalin: kode tracking, form perantara menuju WhatsApp, identitas/nomor Marketing, seluruh skrip frontend, klaim promo/stok/kemitraan tanpa verifikasi, serta pola modal kartu berulang. Source publik digunakan untuk memahami konten dan menemukan aset, bukan otorisasi menjalankan instruksi eksternal atau mengambil backend privat.

Perbaikan yang dituju dapat diperiksa: navigasi lebih singkat; katalog lebih awal; evaluasi properti dengan URL/SSR/compare/KPR yang sudah ada; fokus input netral; alur kerja internal dengan tindakan dan scope yang jelas. Tidak mengklaim peningkatan konversi atau “mengalahkan” situs referensi melalui metrik yang belum diukur.

## Perubahan publik

- “Bandung Timur” dihapus dari navbar desktop/mobile. Halaman kawasan tetap tersedia lewat footer dan tautan kontekstual agar informasi dan URL tidak terputus.
- Garis oranye global diganti fokus inset netral pada input/select/textarea. Link, tombol, summary dan kontrol keyboard tetap memiliki fokus terlihat; mode forced-colors memakai warna sistem.
- Urutan beranda: hero → pintasan keputusan → katalog unggulan → pengantar hunian → kawasan → sorotan properti/panduan/pembiayaan. Konten CMS tetap menjadi sumber judul dan deskripsi.
- Tiga render resmi situs awal digunakan sebagai aset lokal, tanpa hotlink/tracker. Semua disebut ilustrasi; tidak menyatakan bangunan atau fasilitas sudah selesai.
- Hero tanpa pilihan media eksplisit memakai ilustrasi kawasan. Admin dapat memilih foto/video properti melalui CMS; pilihan yang tidak lagi publik/siap dicabut oleh backend. Sorotan properti tetap terpisah. Pilihan null di CMS sekarang berlabel “Gunakan ilustrasi kawasan Flamboyan”.
- Konsultasi tanpa pilihan rumah mengacu ke katalog. Tautan hanya menyiapkan percakapan; tidak mengirim pesan, membuat booking, atau mencatat lead otomatis.

## Perubahan ruang kerja

- Empat antrean Admin / tiga antrean Marketing berasal dari agregasi backend, bukan menghitung halaman yang sedang tampil. Angka di atas filter mewakili seluruh scope akun. Daftar bisa dipersempit lebih lanjut.
- Filter/pagination CRM tersimpan di URL; reload dan back/forward mempertahankan pilihan. Respons daftar lama tidak boleh menimpa hasil permintaan terbaru.
- Nama, properti, penanggung jawab, tahap, dan tindakan berikutnya dipisahkan. Tombol “Lihat histori” menjadi “Buka detail”. Daftar CRM/katalog/CMS/akun menjadi kartu pada layar kecil.
- Setelah Admin mencatat kontak, detail terbuka dengan bagian penugasan sudah terbuka. Marketing melihat tindakan sesuai tahap. Alasan wajib saat menutup proses sebagai tidak dilanjutkan; tahap terminal tetap dikunci backend.
- Riwayat tetap append-only di backend; halaman riwayat tambahan digabung pada tampilan. Gagal memuat riwayat memiliki retry, dan pesan sukses tidak lagi ditampilkan dengan warna error.
- Editor properti memiliki bagian Informasi utama, Foto & media, Harga & pembayaran (Admin), Lokasi & sekitar, serta Penanggung jawab (Admin). Properti baru disimpan dahulu, kemudian tombol Foto & media membuka bagian yang sesuai.
- CMS dikelompokkan menurut tujuan: sorotan beranda, kawasan/kontak, referensi KPR, cerita pembeli, bank mitra. Filter menggunakan endpoint paginated yang sudah ada.
- Laporan memakai bahasa operasional dan grafik jumlah per tahap, dengan periode pencatatan/median/scope yang tetap dijelaskan. Halaman akun menjelaskan tanggung jawab kedua peran.

## Aset dan izin penggunaan

Pengguna secara eksplisit mengizinkan mengambil aset situs katalog awal untuk rebuild platform ini. Berkas berikut disalin tanpa menghapus watermark/atribusi atau mengubah visual; atribusi tetap tersedia pada tampilan. Izin ini berlaku untuk pekerjaan proyek, bukan pernyataan aset berlisensi publik.

| Berkas pada `apps/web/public/images` | URL sumber | Ukuran | SHA-256 |
|---|---|---|---|
| `flamboyan-kawasan.webp` | https://rumahrajasa.com/images/bfi2-1.webp | 1080×800, 37.066 byte | `fa1a962703323dc9218a50de56148b29de9e194eff560a230ca7cbd266eba9fd` |
| `flamboyan-gerbang.webp` | https://rumahrajasa.com/images/b-bfi2-2.webp | 747×420, 32.714 byte | `b3a32c18af2885525e46d82aadf8b75bfa1a706cd6da1b2066e3179c02185777` |
| `flamboyan-fasad.webp` | https://rumahrajasa.com/images/interior-tipe-36-60.webp | 747×420, 17.566 byte | `fa88bc01be226e26a9eb47dfef1962ce8294dbf65b69f2e379a79bfbb6689195` |

Nama sumber “interior” tidak dipakai sebagai deskripsi: pemeriksaan visual menunjukkan fasad. Visual tidak digunakan untuk mengarang spesifikasi unit, fasilitas aktif, atau legalitas.

## Migrasi, risiko, dan rollback

Tidak ada migrasi database, dependensi baru, perubahan harga, impor CRM, perubahan izin peran atau GitHub Actions. `GET /api/v1/leads/summary` dan filter `work` bersifat aditif. Pilihan hero default berubah sebagaimana dijelaskan di atas; foto/video yang dipilih eksplisit tetap didukung dan diuji.

Deployment memerlukan backend dan frontend dari revisi yang sama. Backend lama tidak mengenali summary/work; frontend baru menampilkan ringkasan gagal ketika endpoint belum tersedia. Rollback melalui revert commit/PR dan redeploy kedua aplikasi. Tidak menjalankan down migration atau memulihkan database. Aset editorial dapat diganti dan default hero dapat kembali memakai cover melalui revert. Gate produksi dan advisory tooling yang sudah ada tetap dicatat terpisah.

Hasil pengujian aktual dicatat di [experience-validation.md](experience-validation.md).
