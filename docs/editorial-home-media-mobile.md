# Beranda editorial, media YouTube dan mobile — 16 Oktober 2026

Permintaan pemilik: menyelaraskan mobile dan KPR terbaru, menambahkan gambar/video YouTube di beranda, menyediakan pengelolaannya di Admin, serta memperjelas kartu tipe rumah dengan identitas editorial Flamboyan. Harga, ketersediaan, legalitas dan data bank tidak diambil dari situs referensi.

## Keputusan tampilan dan sumber

[Untuk referensi Rumah Rajasa](https://rumahrajasa.com/), yang diadaptasi adalah keterbacaan harga/spesifikasi, pengenalan video kawasan dan akses langsung ke detail tipe. Palet gading–arang/terakota, DM Serif Display/Manrope dan bahasa desain Flamboyan dipertahankan. Hero menempatkan teks dan media berdampingan pada desktop, lalu pengantar → media → pencarian pada mobile. Frame video tetap utuh dan kontrol native YouTube tidak ditutupi. Kartu menampilkan tipe, harga aktif/harga normal bila program benar-benar berlaku, akhir program, LB/LT/kamar, denah/detail, compare dan kontak. Beranda mengambil sampai 6 listing dari API, bukan hanya 3 featured. Lima tipe aktif saat ini semuanya tampil.

Video yang diberikan pemilik: [Layout & Siteplan Bukit Flamboyan Indah 2](https://www.youtube.com/watch?v=-0al2pEnNDk&t=10s). Titik mulai 10 detik dipertahankan. Tidak ada ID video hardcoded pada komponen/config aplikasi.

Implementasi mengikuti [parameter pemutar YouTube](https://developers.google.com/youtube/player_parameters) dan [IFrame API resmi](https://developers.google.com/youtube/iframe_api_reference): SDK resmi dengan origin eksplisit, privacy-enhanced embed, playsinline, kontrol native, loop+playlist video yang sama dan penanganan event selesai. Putar/jeda dan suara mengikuti state pemutar; video dijeda saat di luar viewport/tab tersembunyi. Autoplay dimulai tanpa suara; reduced-motion/Data Saver memilih gambar dan tombol putar. Browser/pengaturan pengguna, izin embed pemilik video, iklan dan koneksi YouTube tetap dapat memengaruhi pemutaran. SDK/iframe yang gagal atau timeout mengembalikan gambar, tombol coba lagi dan tautan YouTube; tidak menjanjikan video selalu dapat diputar pada seluruh jaringan/perangkat.

Autoplay berarti YouTube dapat menerima data koneksi saat halaman dibuka. Halaman privasi dan keterangan media diselaraskan; galeri properti/peta/tour tetap opt-in. CSP hanya menambahkan script resmi `https://www.youtube.com/iframe_api` dan prefix widget `https://www.youtube.com/s/player/`, mempertahankan nonce dan batas frame existing. Tidak memakai wildcard script, unsafe-eval, download/rehost video, atau library pemutar baru.

## CMS dan kontrak

HERO existing menambah field opsional:

- `video_url`: HTTPS YouTube watch/share/shorts/embed; dinormalisasi ke youtube-nocookie.com/embed dengan hanya ID dan waktu mulai. Host lookalike, credentials, port lain, query array ID dan waktu negatif/>24 jam ditolak. `t=1m10s` menjadi `start=70`; parameter tracking dibuang.
- `video_title`: wajib ketika video_url diisi, maksimal 240 karakter, plain text.
- `video_autoplay`: boolean; true berarti mencoba autoplay tanpa suara, false menunggu pilihan pengguna. Klien lama tanpa field tetap kompatibel.

`property_id`/`media_id` existing memilih foto pendamping, atau video properti bila tautan beranda kosong. Video kawasan independen dari properti. Null video_url menghapus video tanpa menghapus foto. Public DTO hanya menambah ketiga field; tidak menambah identitas pemilik/Marketing atau metadata privat. Mutasi tetap Admin aktif, attestation, optimistic version409 dan audit transaksi. MediaOperations menggunakan normalisasi YouTube yang sama untuk galeri.

Admin → Konten publik → Sorotan beranda: isi tautan/judul/mode, pilih foto publik siap dari properti, simpan dengan verifikasi. Panel unggah di dialog yang sama menggunakan MediaManager/pipeline existing; unggahan menambah media properti pilihan, bukan storage/endpoint baru. Pilihan gambar dapat diperbarui setelah pemrosesan selesai. Form upload tidak dinest di dalam form CMS. Foto terpilih yang dicabut publikasinya/draft/archived tetap tidak ditampilkan oleh API. Sumber gambar kawasan yang sudah disetujui menjadi fallback bila foto tidak dipilih.

Tidak ada migration/dependency baru, perubahan akun/CRM/histori/notifikasi, seed produksi atau GitHub Actions. Perhitungan KPR tidak diubah; informasi syarat/sumber disajikan dalam details agar mobile lebih ringkas, input 16px dan hasil IDR dapat dibaca pada 320px. Scope BSI Flat tetap hanya 36/60.

## Validasi

PHP 8.4.26/PHPUnit 12.5.39: Pint lulus; 124 tes, 996 assertion SQLite memory 17,403s dan PostgreSQL 17 test terisolasi 29,408s; cluster dihentikan. Composer strict/audit 0; importer 19 tes lulus. Node 24.21.0: lint 0 warning, typecheck, 54 unit dalam 13 file, build node-server/proxy 12,91s lulus. Unit mencakup sumber embed, CSP, permintaan SDK tunggal, nonce, retry dan timeout. Audit source tetap FAIL 11 high/0 critical existing; runtime 0, source lockfile tidak berubah. Build mencatat deprecation DEP0155 milik dependency Vue/Nuxt; exit code 0.

Browser kandidat melalui CUA dengan video YouTube sebenarnya: autoplay tanpa suara, jeda native di area video, putar kembali dan suara; konfigurasi URL loop/playlist/start/origin diperiksa. Beranda 320/390/768/1440 tanpa overflow dengan 5 kartu/harga API. Admin login, mengubah judul/tautan/mode/foto, publikasi→public; mode manual tidak membuat iframe sebelum dipilih; foto saja; upload melalui dialog→READY→pilihan foto tersedia; kembali ke video aktual. Compare 2 rumah dan perhitungan BNI/BSI 320px lulus; tipe 56/90 tidak memiliki kartu Flat. Percobaan seek via slider YouTube mobile tidak didukung locator yang stabil; tidak diklaim sebagai pengukuran transisi ulang video frame-by-frame. Regresi Playwright CMS diperbarui untuk kontrak inline/opt-in; tidak mengklaim seluruh suite Playwright/cross-browser/WCAG penuh dijalankan. Editor Admin 320px tidak overflow; akses CMS Marketing juga diperiksa. Galeri video opt-in memakai referrer policy strict-origin-when-cross-origin untuk kompatibilitas identitas embed YouTube (error153); tur tetap no-referrer. Browser awal menggunakan fixture HERO lama dengan property_id yang sudah dihapus; pemilihan properti publik yang valid melalui UI mengatasi fixture tersebut.

Hasil pemeriksaan tambahan, self-review, build Vercel dan smoke produksi dicatat pada PR. Publishing memakai snapshot/version guard pada HERO saja. Tidak mengunggah gambar pengujian ke produksi atau membuat penawaran bank.

## Rollback

Revert PR/redeploy Git. Untuk konten, pulihkan payload HERO terpilih dari snapshot memakai versi terbaru dan audit baru; jangan restore database seluruhnya. Field baru opsional, gambar fallback tetap ada. Hapus/nonaktifkan video melalui CMS untuk menghentikan pemuatan YouTube tanpa deploy. Media uji hanya pada fixture lokal; media bisnis tidak diarsipkan/dihapus oleh rilis ini.
