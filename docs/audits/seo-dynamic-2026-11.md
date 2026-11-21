# Metadata dinamis dan layanan pemasaran — 22 November 2026

## Kebutuhan dan otorisasi

Pemilik meminta optimasi pencarian dan metadata, memberi izin pelaksanaan,
menetapkan pesaing `bukitflamboyanindah.com`, dan menjelaskan bahwa pengelola
situs membantu pemasaran BFI2. Alamat kunjungan yang diizinkan: Jl. Cikoneng,
Ciguruwik, Cibiru Wetan, Kabupaten Bandung. Ini bukan bukti pengelola adalah
pengembang atau memiliki badan usaha tertentu.

Branch baru dari main terbaru yang telah di-fetch: `245ec2be5cdc587ede1524a4b9f13b2d1ae7943d`.
Checkout lama dipertahankan. PRD, SRS, arsitektur, status dan rilis PR58 dibaca.

## Bukti dan batas pengukuran

Search Console mode Web, pilihan 3 bulan, data grafik 17 Oktober–19 November:
6 klik, 141 impresi, CTR4,3%, posisi rata-rata13,9. Kueri `bukit flamboyan indah`
38impresi/0klik/posisi8,9; `bukit flamboyan indah 2`16/1/10,1. Angka ini bukan
peringkat saat ini pada setiap lokasi, perangkat atau pencarian.

Sitemap berstatus Success dengan16URL. Agregat indeks terakhir16November masih
11indexed/10excluded. Inspeksi URL yang lebih baru menyatakan beranda serta
tipe36/60,56/90,62/70,69/80 sudah di Google. Beranda di-crawl21November dan
Google memilih canonical URL yang diperiksa. HTML crawl Google sudah memuat
title/deskripsi/WebSite.name/OG/canonical baru PR58. Jangan meminta crawl ulang
untuk perubahan yang sudah dibaca atau menyebut agregat lama sebagai insiden.

Pesaing menampilkan rincian fasilitas, pembayaran dan FAQ, tetapi kebenaran
klaimnya tidak diaudit; promo pada halaman menyebut akhir30September2026.
Katalog kita mempertahankan lima tipe dan harga API, tidak menyalin penawaran.
Pembukaan detail melalui browser audit mengalami connection reset, sehingga
bukti live metadata seluruh tipe belum lengkap. Artefak/source PR58 membantu
penelusuran, bukan pengganti pemeriksaan rilis kandidat ini.

## Rencana, lingkup dan acceptance

1. Deskripsi detail disusun dari judul, lokasi, luas, kamar dan harga katalog
   pada public DTO yang sama dengan halaman. Menggantikan pemotongan155karakter
   di tengah kalimat. Open Graph dan Twitter memakai ringkasan yang sama;
   gambar berasal dari foto publik existing. Tidak menambah request data.
2. Footer menyebut layanan informasi/pemasaran dan alamat kunjungan dari CMS
   DEVELOPMENT existing. Nama staf, kontak privat, CRM dan klaim badan usaha
   tidak diterbitkan. Nomor kontak dan jam layanan existing dipertahankan.
3. Verifikasi pada HTML SSR dan browser setelah hidrasi; harga/spesifikasi baru
   melalui API harus tercermin pada ringkasan tanpa mengedit source. Canonical,
   private noindex, schema faktual dan URL stabil dipertahankan.

Non-goal: halaman kata kunci massal, perubahan harga/data produksi, penggantian
judul beranda yang sudah benar, akun baru/GBP, iklan/budget, DNS/server/cache,
auth/CRM, migrasi, dependensi dan klaim eksklusif/resmi atau jaminan peringkat1.
Kontrak REST tidak berubah; input tetap public DTO existing.

## Verifikasi, rilis dan rollback

Gunakan pengujian SSR/browser existing pada database lokal sintetis terisolasi,
lint/typecheck/unit/build web, Pint, PHPUnit SQLite/PostgreSQL, Composer
validate/audit dan audit npm. Catat hasil aktual dan keterbatasan, lalu review
independen full diff termasuk berkas baru. Tidak mengklaim suite telah lulus
sebelum dijalankan. PR dibuat sebelum merge; tidak merge tanpa instruksi.

Rollback: revert PR dan rilis ulang artefak kompatibel sebelumnya. Tidak ada
migrasi atau perubahan data. Google memilih tampilan judul/snippet sendiri;
metadata yang benar tidak menjamin tampilan persis atau peningkatan ranking.

## Prioritas konten lanjutan

- Brand BFI/BFI2 menuju beranda; harga/tipe menuju katalog/detail; lokasi,
  fasilitas dan siteplan menuju halaman kawasan; pembiayaan/survei menuju
  panduan relevan. Hasil filter bebas tetap tidak dijadikan URL SEO baru.
- Perbarui dokumentasi progres aktual dan jawaban pertanyaan pembeli dengan
  tanggal/sumber nyata. Isi fasilitas dan promo hanya setelah konfirmasi.
- Selaraskan alamat/kontak/tautan pada kanal yang benar-benar dikelola pemilik.
- Bandingkan kueri brand/nonbrand dan klik dalam periode28hari setelah rilis;
  data sebelum21November belum mengukur dampak metadata baru.
- Baseline lab21November mobile performance88/LCP2,9detik adalah riwayat,
  bukan pengukuran sesi ini; CWV lapangan sebelumnya belum cukup data.

## Hasil validasi kandidat

Runtime: Windows, Node24.22.0, Nuxt4.6.4/Nitro2.13.6/Vitest4.1.12,
PHP8.5.11/PHPUnit12.5.39, PostgreSQL17 lokal dan Chromium headless existing.
API fixture pada loopback18085, web built pada4381. Tidak memakai database,
akun atau media produksi untuk pengujian.

| Pemeriksaan | Perintah / bukti | Hasil |
| --- | --- | --- |
| Web | `npm run build:checked` | Lint0warning, typecheck,90unit/20file3,24s, build node-server46,6s PASS |
| Lint final | `npm run lint` setelah tambahan assertion test | PASS |
| Browser | `npx playwright test` foundation dengan grep project identity/property specifications/discovery filters, server built | 3PASS4,7s pada run final dengan DEVELOPMENT fixture; SSR/hydrated meta cocok API dan footer memuat alamat CMS |
| Visual | Playwright390×844 dan1440×900, dua detail berbeda | 0overflow,0pageerror; dua deskripsi berbeda mengikuti API; screenshot footer diperiksa |
| Pint | `php vendor/bin/pint --test` | PASS |
| SQLite | `php vendor/bin/phpunit --colors=never`, in-memory | 163tests/1277assertions/1skip khusus PostgreSQL,33,510s PASS |
| PostgreSQL | Perintah PHPUnit yang sama, database test baru pada loopback15581 | 163/1282,0skip,28,404s PASS |
| Composer | `composer validate --strict`, `composer audit --format=json` | Valid,0advisory/0abandoned |
| npm source | `npm audit --json` | 0advisory |
| npm runtime | Lock generated di `.output/server`, `npm audit --omit=dev --prefix .output/server --json` | 0advisory pada manifest runtime; tidak menggantikan audit kode bundled |
| Diff | `git diff --check` | PASS |

Run SQLite pertama gagal124error karena checkout baru belum memiliki APP_KEY
lokal. Setelah menyediakan key test ephemeral, perintah standar lulus tanpa
perubahan assertion atau source backend. Cluster PostgreSQL lama sempat tidak
cocok nama role; cluster baru terisolasi dengan role test eksplisit dipakai
untuk hasil final. Fixture CMS dibuat hanya dalam SQLite baru. Tidak ada data
operasional yang dimigrasi, di-seed atau diubah.

API publik produksi22November dibaca tanpa autentikasi untuk memeriksa kelima
tipe. Simulasi komposisi kandidat dari DTO aktual menghasilkan146karakter
untuk tiap tipe; seluruhnya CHECK_REQUIRED dan ditulis sebagai Konfirmasi unit.
Ini bukan klaim kandidat telah deployed. Tidak diberlakukan pemotongan155
karakter: [Google](https://developers.google.com/search/docs/appearance/snippet)
menyatakan tidak ada batas panjang meta description; ringkasan dapat dipotong
sesuai perangkat atau dipilih dari isi halaman. Judul/lokasi yang diubah menjadi
sangat panjang akan memperpanjang ringkasan; periksa kualitas editorial CMS.

Tidak dijalankan: seluruh suite browser workspace/provider, lab PageSpeed baru,
CWV lapangan, pengukuran ranking setelah rilis. GSC tidak dimutasi dan tidak ada
request indexing ulang: metadata beranda sudah dibaca Google21November.
Review independen read-only22November atas lima berkas final: PASS, tidak ada
temuan actionable. Privasi DTO/footer, harga/status aktif, SSR/hydration dan
bukti pengujian diperiksa. Kandidat belum merge/deploy; PR tetap jalur rilis.
