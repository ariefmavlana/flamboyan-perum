# Pemulihan SEO dan kepercayaan BFI2 — 21 November 2026

## Otorisasi, konteks dan target

Pemilik menginstruksikan perbaikan SEO menyeluruh dan mengizinkan implementasi langsung pada 21 November 2026. Fokus pencarian: **bukit flamboyan indah**; pesaing yang disebut pemilik: `bukitflamboyanindah.com`. Peringkat pertama adalah target evaluasi, bukan acceptance teknis yang dapat dijamin. Hubungan formal pengelola website dengan pengembang belum dikonfirmasi: jangan menulis “satu-satunya situs resmi”, afiliasi eksklusif, penghargaan, testimoni, rating atau legalitas baru.

Baseline source: `origin/main` `8625407c8398a131805948751eea12eadd2c98d2`; branch `codex/seo-recovery`, checkout terisolasi. Checkout awal pengguna tidak diubah. PRD, SRS, arsitektur dan status implementasi dibaca; dokumen growth sebelumnya menjadi konteks, bukan bukti pelaksanaan Search Console atau izin belanja.

## Bukti awal publik

- Beranda HTTP200, title `Rumah Baru Bandung Timur · Flamboyan`, H1 `Ruang untuk hidup yang lebih baik.`, `WebSite.name`/`og:site_name` masih `Flamboyan Perum`. Nama proyek belum menjadi identitas utama beranda domain proyek.
- Robots200 tidak memblokir seluruh website. Sitemap index200 menunjuk pages/properties; 11 halaman statis dan 5 properti published tersedia. Banjaran tidak masuk sitemap. Canonical beranda sudah menuju domain produksi HTTPS.
- Permintaan halaman tak dikenal mengembalikan404. Tidak ditemukan header noindex menyeluruh pada beranda yang diperiksa.
- Sampel dari satu koneksi audit menunjukkan variasi besar: HEAD beranda sekitar7detik dengan upstream5,076detik; pengambilan HTML sekitar53detik; beberapa halaman timeout45detik. Ini sinyal investigasi, bukan nilai Core Web Vitals, median, bukti pengalaman Googlebot, atau bukti masalah hosting tunggal.
- HTML pesaing HTTP200 memiliki title dan H1 `Bukit Flamboyan Indah 2`, bagian tipe/harga/fasilitas/FAQ. Ini bukti perbandingan halaman, bukan bukti posisi Google atau kebenaran seluruh klaim pesaing. Konten pesaing tidak disalin.
- Pencarian publik bukan laporan indexation Google. Status indeks, query, impression, posisi, manual action dan canonical pilihan Google belum diketahui tanpa Search Console.

## Rencana dan spesifikasi implementasi

1. Selaraskan nama situs, WebSite, title, Open Graph dan heading beranda dengan Bukit Flamboyan Indah 2; bedakan intent beranda, detail kawasan, katalog dan panduan. Pertahankan URL stabil.
2. Tambahkan penjelasan pembeli dan pertanyaan umum yang menjawab lokasi, tipe/harga aktif, foto aktual/ilustrasi dan verifikasi penawaran. Semua angka komersial tetap berasal dari API/CMS; jangan memasang badge kepercayaan tanpa bukti.
3. Hilangkan pengambilan konten CMS berulang pada beranda melalui composable existing dan payload yang hanya hidup dalam satu render SSR. Navigasi/refresh mengambil data baru; tidak menambah cache global. Periksa status gagal sumber data; jangan menyatakan katalog gagal sebagai katalog valid kosong.
4. Periksa sitemap/canonical/robots, SSR, JSON-LD, media, mobile dan navigasi/WhatsApp. Perbaiki hanya regresi yang terbukti; jangan menambah framework, cache global atau dependensi untuk mengejar skor.
5. Catat prosedur Search Console, local identity, pengukuran kompetisi dan tindak lanjut yang memerlukan akses bisnis. Jangan membuat kepemilikan/akun/ulasan/tautan palsu atau iklan berbayar.

## Acceptance dan batas

- Nama proyek dan lokasi terverifikasi terbaca pada HTML SSR beranda, judul unik, satu H1, canonical domain sendiri, WebSite konsisten, OG absolut.
- Katalog/harga/availability tetap sumber API; tidak ada PII/identitas Marketing/CRM pada schema atau konten baru. Foto aktual vs ilustrasi tetap berlabel.
- Tidak ada perubahan auth, CRM, schema database, consent/tag, harga, nomor kontak, DNS atau deployment otomatis. Situs pesaing tidak dimutasi.
- Pemeriksaan frontend lint/typecheck/unit/build/browser dan audit dependency serta pemeriksaan backend yang diwajibkan dicatat dengan runtime dan hasil aktual. Review independen mencakup seluruh diff termasuk berkas baru. Kegagalan tidak disamarkan.
- Sumber siap review tidak berarti sudah tayang atau terindeks. PR tidak di-merge tanpa instruksi pemilik; promosi mengikuti jalur produksi yang terverifikasi.

## Risiko, rilis dan rollback

Perubahan judul/nama dapat membutuhkan recrawl; Google dapat memilih judul/canonical berbeda. Copy baru perlu ditinjau pemilik untuk hubungan bisnis. Pengurangan permintaan CMS harus mempertahankan freshness, error dan fallback kontak. Perubahan status error harus menghindari soft404 tanpa mematikan halaman sehat. Tidak ada migrasi: rollback dengan revert PR dan artefak web sebelumnya, tanpa mengubah data operasional.

## Akses dan bukti lanjutan

Konektor Hostinger mengembalikan `MCP tool call requires approval, but approval policy is never`. Akses Google Chrome melalui Computer Use mengembalikan `Computer Use was not approved to use Google Chrome`. Ini batas alat, bukan penolakan otorisasi pemilik. Jangan menggunakan jalur alternatif untuk mengambil sesi browser yang ditolak. Search Console/DNS/config server belum diubah. Graphify belum terpasang dan graph proyek tidak tersedia; source inspection menjadi bukti utama audit komponen.

Hasil implementasi, validasi, review dan daftar pekerjaan eksternal ditambahkan sebelum PR siap direview.

## Keputusan konten dan kompetisi

| Klaster | Halaman utama | Pembeda yang dipakai |
| --- | --- | --- |
| bukit flamboyan indah / bukit flamboyan indah 2 | `/` | Nama proyek jelas; lokasi Cibiru Wetan; jalur cepat katalog dan pengenalan kawasan |
| tipe, lokasi, siteplan Bukit Flamboyan Indah 2 | `/perumahan/bukit-flamboyan-indah-2` | Dokumentasi aktual/ilustrasi terpisah, siteplan, FAQ pembeli, sumber CMS dan verifikasi penawaran |
| harga / tipe rumah BFI2 | `/properti`, detail tipe | Harga aktif dan luas/kamar dari API; slug stabil, tanpa promo pesaing yang disalin |
| memilih lokasi / survei / pembiayaan | Tiga URL `/panduan/{slug}` existing | Judul menjelaskan isi; checklist membantu evaluasi, bukan artikel massal |

Nama tanpa angka2 dapat juga merujuk kawasan/tahap lain. Konten tetap menyatakan proyek BFI2 yang benar, tanpa menyamarkan tahap, mengklaim wilayah Kota Bandung, atau menyatakan pesaing tidak resmi. Penambahan FAQ berguna untuk pembeli; tidak menambahkan FAQ rich-result markup, Product/review/rating buatan atau klaim ketersediaan yang belum terverifikasi.

## Tindakan eksternal dan pemilik

| Prioritas | Tindakan dan acceptance | Pemilik / akses | Status sesi ini |
| --- | --- | --- | --- |
| P0 | Search Console: pilih Domain property yang benar, pastikan ownership terverifikasi; baca Pages, Crawl stats, Manual actions, Security issues, Sitemaps dan canonical pilihan Google | Pemilik Google + akses browser/konektor yang diizinkan | BLOCKED akses, bukan dianggap belum pernah dilakukan |
| P0 | Submit `https://bukitflamboyanindah2.com/sitemap.xml`; URL Inspection untuk beranda, halaman kawasan dan lima detail tipe setelah rilis; simpan hasil actual crawl/index/canonical | Pemilik Search Console | Belum dilakukan; jangan gunakan Indexing API generik atau request massal |
| P0 | Konfirmasi badan usaha/pengelola domain, hubungannya dengan pengembang, alamat kantor penjualan, jam layanan dan kanal keluhan; terbitkan identitas yang disahkan | Pemilik bisnis | Hubungan formal belum dijawab; nama pengembang CMS bukan otomatis pengelola website |
| P1 | Samakan NAP dan tautan website pada profil sosial milik bisnis yang benar; identifikasi profil yang tersedia sebelum membuat duplikat | Pemilik kanal | Belum diubah; Linktree yang muncul di pencarian tidak otomatis membuktikan kepemilikan |
| P1 | Audit Google Business Profile existing. Gunakan kantor/bisnis yang memenuhi kelayakan; bukan profil untuk setiap tipe atau properti kosong. Tautkan domain ini hanya bila dimiliki/dikelola sah | Pemilik bisnis/profil | Belum diakses; jangan mengambil alih profil pesaing atau membuat ulasan |
| P1 | Performa: ambil CrUX/GSC mobile bila datanya cukup; lab beranda, kawasan dan detail; pisahkan waktu DNS/TLS, SSR/API, gambar LCP, JS dan pihak ketiga | Engineering + hosting | Sampel curl lambat; bukan bukti CWV atau SLO. Perlu diagnosis server dan pengukuran sesudah rilis |
| P1 | Periksa alias HTTP/www/host lama, redirect permanen ke origin final, DNS/TLS, crawler challenge serta log akses Googlebot yang diverifikasi | Engineering + hosting | Canonical/sitemap HTTPS benar; konfigurasi hosting/log belum diakses |
| P2 | Publikasikan perkembangan proyek/foto bertanggal dan izin media yang sah melalui CMS; tanggapi pertanyaan pembeli berdasarkan kebutuhan aktual | Pemilik bisnis + editorial | Jangan mengarang tanggal, legalitas, waktu tempuh, stok atau testimoni |

## Pengukuran tanpa janji peringkat

Baseline yang harus diekspor dari Search Console: 28hari terakhir vs 28hari sebelumnya, Search type Web, negara Indonesia, pisahkan mobile/desktop, brand/nonbrand dan URL. Catat impressions, clicks, CTR dan average position untuk query brand, lalu tipe/harga/lokasi. Average position bukan posisi tetap setiap pengguna; pencarian manual dipengaruhi lokasi dan konteks.

Review mingguan dilakukan oleh pemilik/engineering setelah rilis. Jangan mengubah title berulang hanya karena satu pencarian. Ukur kelengkapan indeks dan canonical dahulu, lalu CTR/traffic berkualitas serta inquiry valid dan kunjungan yang benar-benar dicatat. Klik WhatsApp tetap klik, bukan bukti lead/akad. Tidak ada jadwal otomatis atau belanja iklan dibuat pada pekerjaan ini.

Target performa lapangan mengikuti kontrak proyek: p75 mobile LCP≤2,5detik, INP≤200ms, CLS≤0,1. Bila data CrUX belum cukup, tulis N/A dan gunakan lab sebagai diagnosis. Skor Lighthouse tidak boleh disebut sebagai jaminan ranking.

## Rujukan primer

- Nama situs dipengaruhi WebSite dan identitas beranda: [Google Search Central — site names](https://developers.google.com/search/docs/appearance/site-names).
- Diagnosis indeks/performa pencarian: [Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start).
- Aturan crawl berbeda dari noindex: [robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- Pengukuran pengalaman: [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).
- Kelayakan dan representasi bisnis yang akurat: [Google Business Profile](https://support.google.com/business/answer/3038177).

## Hasil implementasi dan verifikasi lokal

### Penutupan gate sebelum merge

Instruksi pemilik berikutnya pada21November mengotorisasi membuka PR, merge ke main dan melanjutkan pekerjaan yang belum selesai. PR58 dibuka draft. Pemeriksaan pada lingkungan filesystem normal sudah meluluskan build produksi27,4detik dan PHPUnit standar dengan phpunit.xml: SQLite163tes/1277assertion/1skip PostgreSQL, PostgreSQL163/1282 tanpa failure. Riwayat kegagalan lingkungan di bawah dipertahankan sebagai audit trail, bukan status rilis terakhir.

Sisa18advisorymoderate ditelusuri ke Vitest/@vitest/mocker4.1.11 dan minimatch10.2.6. Rencana perbaikan bounded: naikkan Vitest ke patch4.1.12, perbarui rantai lint dalam constraint existing, dan override hanya `archiver → readdir-glob → minimatch` ke11.0.5. Tidak menurunkan Nuxt4.6.4 atau mengganti major readdir-glob. Pemakaian `Minimatch` yang dibutuhkan readdir-glob3 tetap tersedia; minimumNode proyek sudah memenuhi. Acceptance: audit sumber0, lint/type/unit/build, browser pada artefak produksi dan review independen diff baru. Harga, CRM, consent, schema database dan konfigurasi provider tidak masuk perluasan ini.

Sumber patched version: [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [mocker code injection](https://github.com/advisories/GHSA-qxg6-89mg-rqv8), [mocker traversal](https://github.com/advisories/GHSA-xp26-3454-mjgp). Tidak memakai audit force, suppression atau risk acceptance buatan.

### Riwayat percobaan awal dengan filesystem terbatas

Runtime: Windows, Node24.22.0, Nuxt4.6.4/Nitro2.13.6, PHP8.5.11, PHPUnit12.5.39, PostgreSQL17.6 pada cluster test baru localhost15579, Playwright1.63.0 dengan Chromium for Testing151.0.7922.34 existing. Tidak memakai profil/sesi Chrome pengguna; browser pengujian baru terisolasi.

| Pemeriksaan | Perintah / seam | Hasil |
| --- | --- | --- |
| Frontend lint | `npm run lint` | PASS, 0warning setelah perubahan final |
| Typecheck | `npm run typecheck` | PASS setelah perubahan final |
| Unit frontend | `npm test` | PASS 90tes/20file, 2,28detik setelah koreksi503 |
| Build produksi Node | `NUXT_API_BASE=http://127.0.0.1:18791 NUXT_PUBLIC_SITE_URL=http://127.0.0.1:18792 npm run build` | PASS17,4detik untuk identitas/cache; build sesudah koreksi503 **FAIL EPERM mkdir** pada output Nitro. Retry setelah server dihentikan dan output baru melalui layer lokal juga gagal. Build produksi diff final belum lulus; API/URL hanya fixture lokal |
| Browser nyata | Spec `foundation` untuk identitas SSR/schema/mobile, detail/canonical/404 dan filter; spec `buyer-journey` untuk halaman editorial pada320/768/1440 | PASS4flow/10,1detik pada build sebelum503; PASS4flow/20,2detik pada source final melalui dev server terisolasi. Full suite workspace/provider tidak dijalankan |
| Gangguan upstream nyata | Matikan API fixture lokal; HTTPGET beranda dan kawasan, lalu pulihkan API | Source final keduanya503 + `Retry-After: 60`, dengan notice retry tetap tampil. Tidak memalsukan API dengan mock atau mengubah data produksi |
| Permintaan CMS | Satu HTTPGET beranda built SSR, hitung request backend aktual; ulangi dengan HTTPGET independen | Kandidat awal6request konten/render; final1request konten+1katalog pada masing-masing dua render independen. Tidak ada cache antarkunjungan. Ini pengurangan request lokal, bukan klaim persentase peningkatan waktu produksi |
| Mobile visual | Screenshot beranda/kawasan390×844 pada build lokal dan pemeriksaan overflow | PASS tampilan heading/kontak/navigasi, tanpa overflow. Data demo sintetis hanya pada SQLite test terpisah; bukan konten rilis |
| Pint | `php vendor/bin/pint --test` | PASS |
| Composer validate | `composer validate --strict` | PASS |
| Composer audit | `composer audit --format=json` | PASS, 0advisory/0abandoned |
| SQLite | PHPUnit seluruh `tests`, environment testing, SQLite`:memory:` | **FAIL** 163tes,1239assertion,7failure,1skip PostgreSQL;18,316detik |
| PostgreSQL | PHPUnit seluruh `tests`, DB `seo_tests` baru/local15579 | **FAIL** 163tes,1244assertion,7failure;27,467detik |
| npm source audit | `npm audit --json` terhadap lockfile sumber | **FAIL** 18moderate,0high,0critical; lockfile/dependensi sumber tidak diubah |
| npm runtime audit | Lock sementara dari manifest generated `.output/server`, `npm audit --omit=dev --json` | 0advisory pada dependency manifest yang diperiksa. Tidak mencakup setiap kode yang dibundel; tidak menyatakan seluruh source toolchain aman |

Instalasi npm normal pertama gagalEPERM; retry `npm ci --ignore-scripts` berhasil765package, lalu `nuxt prepare` eksplisit dengan upstream lokal. Pemanggilan prepare pertama tanpa `NUXT_API_BASE` ditolak guard existing; guard tidak diubah. Composer menginstal enam update sesuai lockfile **main existing**, tanpa mengubah lockfile pada kandidat.

Lingkungan PHP melaporkan `is_writable=false` pada direktori cache yang dapat ditulis, serta `is_readable=false` pada file yang dapat dibaca4byte dengan `file_get_contents`. Ini memblokir discovery/bootstrap normal dan pemuatan file biner Symfony. Manifest provider generated existing yang tidak mengandung konfigurasi/secret dipakai pada checkout test. `php artisan test` tetap gagal saat PHPUnit memeriksa readability bootstrap; seluruh163tes kemudian dijalankan dengan `php vendor/bin/phpunit --no-configuration --colors=never tests` dan environment ekuivalen phpunit.xml (testing, key ephemeral, cache/sessionarray, queuesync, mailarray, BCRYPT4, database test eksplisit). Tidak ada source/vendor guard atau assertion yang dilemahkan.

Tujuh kegagalan kedua database terjadi pada respons media/logo/PDF yang diharapkan200 tetapi mendapat500. Log lokal menunjukkan `Symfony\\Component\\HttpFoundation\\File\\Exception\\FileException`; `BinaryFileResponse` menolak file ketika probe readability false. Ini konsisten dengan keterbatasan runtime lokal, tetapi **bukan** alasan menyebut backend green. Jalankan ulang perintah repository normal pada runtime dengan pembacaan file normal sebelum PR siap merge. Tidak ada file backend atau dependensi yang diubah oleh perbaikan SEO.

Tes browser baru pertama gagal karena regex mengasumsikan `<br>` tanpa atribut scoped SSR. Assertion diperbaiki untuk memeriksa teks H1 dari HTML, lalu dirun ulang; tidak mengubah output produk untuk menyesuaikan tes. Pemeriksaan HTTP saja tidak membuktikan semua media termuat. Tiga sampel media publik: gerbang189.202byte dan logo108.776byte mengembalikan200WebP; sampel `/media/164/1920` timeout20detik dari koneksi audit sehingga kesehatan/performa media dinamis **belum lulus**.

HTTP beranda mengalihkan301 ke HTTPS apex. Sampel HTTPS `www` timeout koneksi8detik: status alias/TLS/redirect belum dapat disimpulkan dan tetap perlu pemeriksaan hosting. Tidak ada DNS, credential, akses, tag/consent, iklan, data produksi atau deployment berubah.

Resolver publik tidak menemukan TXT berprefix `google-site-verification` pada apex dalam pemeriksaan ini; ini bukan bukti ownership Search Console gagal karena metode/properti lain mungkin dipakai. Alias `www` memiliki CNAME ke CDN Hostinger, tetapi keberadaan DNS bukan bukti TLS/redirect berfungsi. Verifikasi melalui akses pemilik tetap diperlukan.

Koreksi503 memakai status/header SSR Nuxt ketika CMS atau katalog error; UI retry dan perilaku client tetap. Katalog/detail existing tidak diubah selain deskripsi katalog. Tidak menambahkan noindex permanen pada halaman bisnis atau menghapus data saat gangguan.

## Verifikasi ulang untuk rilis PR58

Pada filesystem normal, `is_readable`/`is_writable` kembali benar dan standard
`php vendor/bin/phpunit` membaca phpunit.xml tanpa workaround bootstrap.
SQLite lulus163tes/1277assertion/1skip khusus PostgreSQL dalam15,367detik;
PostgreSQL lulus163/1282 tanpa skip/failure dalam25,617detik pada database test
localhost15579. Wrapper `artisan test --compact` menampilkan147warning tanpa
failure; PHPUnit standar tidak mengeluarkan warning dan meluluskan kasus media
yang sebelumnya500. Pint, Composer validate strict dan audit0 juga lulus.

Lint/typecheck dan90unit/20file lulus pada Vitest4.1.12; build Node final
setelah copy layanan24/7 lulus19,9detik. Manifest/lock konsisten melalui
`npm ci --dry-run --ignore-scripts`. Audit sumber0 dan audit manifest runtime
generated0; yang terakhir tetap tidak menggantikan pemeriksaan kode bundled.
Operasi ZIP nyata dengan archiver dan override minimatch lulus pemeriksaan
include/exclude/nama serta bytes isi. Batas API/CRM/otorisasi tidak berubah.

Tujuh flow browser dipilih: identitas SSR, konsultasi/share, konteks preview
WhatsApp, detail/canonical/404, filter, editorial dan navigasi responsif
320/768/1440. Semuanya lulus pada artefak produksi setelah patch dependency.
Pengukuran ulang dua HTTPGET independen memberi1CMS+1katalog per render.
Mematikan API fixture nyata memberi503+Retry-After60 dengan notice pada
beranda dan kawasan, tanpa mock atau data fallback fiktif. Tidak mengklaim
fullsuite workspace/provider dijalankan.

Pemilik mengonfirmasi layanan24/7 pada21November. Beranda/footer menampilkan
konsultasi24/7 dan kunjungan dengan konfirmasi Admin. Alamat kantor serta
hubungan formal pengelola belum diberikan; alamat proyek bukan alamat kantor.
Tidak ada klaim balasan instan, pengembang langsung, kantor atau afiliasi yang
diinventaris sendiri.

Akses GitHub sekarang terautentikasi dan PR58 dibuka draft; konektor Hostinger
dapat membaca deployment setelah kendala DNS sementara pulih. SSH terverifikasi
menunjukkan API masih pada main8625407 sebelum merge. Browser akun dihentikan
oleh alat karena URL Windows tidak dapat dipastikan untuk policy; tidak ada
interaksi lanjutan atau pengambilan sesi melalui jalur lain. Integrasi OpenSEO
untuk Search Console ditemukan tetapi belum terpasang/terhubung. PageSpeed API
tanpa key mengembalikan429quota; CWV lapangan tetap N/A, bukan skor rekaan.

## Status rilis

**Sumber tervalidasi untuk review final dan merge PR58 atas instruksi pemilik.**
Review independen/security wajib mengikat diff final; bukti merge, SHA web/API
dan smoke produksi dicatat pada PR setelah promosi. Search Console, CWV lapangan
serta identitas bisnis formal tetap eksternal dan bukan klaim selesai. Ranking,
indexation dan predikat paling tepercaya tidak dijanjikan. Rollback: revert PR
dan artefak web/API kompatibel sebelumnya; tidak ada migrasi/data yang perlu
dipulihkan dan tidak memundurkan database di atas data bisnis baru.
