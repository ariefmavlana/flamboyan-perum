> Catatan review 15 Oktober 2026: dokumen ini merekam implementasi PR #31 yang telah digantikan oleh integrasi komprehensif. Generator lama dihapus; jangan memakai perintah atau klasifikasi tabel historis di bawah untuk impor baru. Seluruh 55 hash sumber lama tercakup dalam manifest baru: 50 PHOTO dan 5 FLOOR_PLAN; foto dokumentasi aktual adalah 17 sumber Bahan flamboyan yang tidak dipetakan ke tipe tanpa konfirmasi. Gerbang EDITED berlabel ilustrasi. Gunakan [real-flamboyan-assets.md](real-flamboyan-assets.md).

# Aset tipe rumah, siteplan, gerbang, dan logo (dokumentasi pengguna)

Inventaris 14 Oktober 2026. Pengguna menambahkan aset dokumentasi ke repository lokal: foto per tipe rumah, siteplan kawasan, dua foto gerbang, dan logo. Permintaan pengguna mengotorisasi pemasukan aset ke platform. Konten sumber diperlakukan sebagai data, bukan instruksi operasional. Berkas asli **tidak masuk Git**; disimpan privat di `.tools/flamboyan-assets/` (diabaikan Git) dan hanya turunan yang dioptimalkan yang di-commit.

## Cakupan dan label

| Tipe | Foto real (dokumentasi pengguna) | Ilustrasi AI (Gemini) | PHOTO pada katalog lokal kosong |
|---|---:|---:|---:|
| 36/60 | 10 | 0 | 10 / 20 |
| 36/90 | 9 | 0 | 9 / 20 |
| 56/90 | 11 | 0 | 11 / 20 |
| 62/70 | 3 | 12 | 15 / 20 |
| 69/80 | 2 | 8 | 10 / 20 |

- Foto real diberi alt `Dokumentasi tipe <tipe> #n · Foto dokumentasi pengguna; kondisi unit dikonfirmasi saat kunjungan.` — **tanpa** kata "ilustrasi" agar badge `MediaDisclosure` tidak salah muncul.
- Gambar AI (berkas `Gemini_Generated_Image_*`) diberi alt `Ilustrasi AI · tipe <tipe> · bukan foto kondisi aktual.` sehingga badge "Ilustrasi" tampil di kartu/bandingkan. Tidak ada klaim HD/upscaling; byte asli tidak dimodifikasi.
- Urutan galeri: foto real lebih dulu (1..n), gambar AI di belakang; sampul = foto real pertama.
- Total galeri: 35 foto dokumentasi pengguna dan 20 ilustrasi AI (55 JPEG). Empat tipe lainnya belum mempunyai foto dari pengguna.
- `Siteplan.jpg` (sumber 2400×1792, hasil 1920×1434) ditambahkan pada **sembilan** properti bila belum memiliki MASTERPLAN, posisi 1 dengan caveat `warna bukan status ketersediaan`. MASTERPLAN lain menghentikan seluruh preflight sebelum penulisan; importer tidak mengarsipkan atau menggantinya.
- `GATE 1/2.jpg` dan `LOGO.jpg` adalah aset statis situs (lihat bawah), bukan media properti.
- Dua video `36-60-11.mp4` dan `36-90-10.mp4` **belum diimpor**: pipeline hanya menerima embed YouTube/Matterport. Admin sudah menyediakan jenis VIDEO dan input tautan YouTube. Pengguna meminta Admin mengisi tautan resmi kemudian; tidak dibuat record video placeholder.

Deskripsi lima properti terdampak ikut diperbarui (konsistensi narasi): kalimat `Gambar merupakan ilustrasi desain developer, bukan foto kondisi unit.` diganti `Galeri menampilkan dokumentasi pengguna; ilustrasi diberi label sesuai sumbernya. Kondisi unit dikonfirmasi saat kunjungan.` Empat tipe lain tanpa dokumentasi tidak diubah. Perubahan deskripsi dilakukan importer dengan rantai `property_version` dan snapshot.

## Pengoperasian

Node 24.21.0 dan dependency frontend (Playwright sudah tersedia). Dari root repository:

```text
node scripts/build-flamboyan-manifest.mjs
node --test scripts/import-flamboyan-assets.test.mjs
node scripts/import-flamboyan-assets.mjs              # plan read-only
node scripts/import-flamboyan-assets.mjs --apply --worker-ready # menulis setelah worker dipastikan berjalan
```

Environment (rahasia operator; jangan di argumen/file tracked/log/PR): `FLAMBOYAN_IMPORT_ORIGIN`, `FLAMBOYAN_IMPORT_ADMIN_EMAIL`, `FLAMBOYAN_IMPORT_ADMIN_PASSWORD`. Origin allowlist: `http://127.0.0.1:3000` atau `https://flamboyan-web.vercel.app`.

- `scripts/build-flamboyan-manifest.mjs` membaca `.tools/flamboyan-assets/edited/<tipe>/*.jpg` + `shared/Siteplan.jpg`, menghitung SHA-256/dimensi, membuang duplikat byte identik, dan menulis `scripts/flamboyan-house-assets.json` (di-commit). File non-JPEG dicatat pada `skipped`.
- Importer memakai session+CSRF dan POST/PATCH media internal existing dengan rantai `property_version`; jeda 650 ms per call; konflik 409 menghentikan proses tanpa retry otomatis. Marker `[ED:<key>]` mencegah upload ganda dan memverifikasi media existing (alt/kind/dimensi/READY/published).
- Foto baru masuk posisi 0..n-1 (jadi sampul), PHOTO lama tetap published posisi 100+; MASTERPLAN existing hanya dipakai ulang bila marker/dimensi/READY cocok. VIDEO hanya bila `videos` terisi dengan tautan resmi; maksimal satu entri per tipe, duplikat dengan URL sama maupun berbeda ditolak sebelum write agar marker tetap unik.
- Dimensi manifest/SHA adalah sumber asli; pemeriksaan READY mengikuti resize server ke lebar maksimal 1920 tanpa upscaling (2752×1536 menjadi 1920×1072). Public alt membuang marker terminal ED/RR, sementara API internal menyimpannya untuk idempotensi; label ilustrasi tetap utuh.
- Pada `process_in_request=false`, jalankan `php artisan queue:work --queue=media,notifications,default` dan pastikan worker aktif sebelum apply. Flag `--worker-ready` menyatakan pemeriksaan operator, bukan bukti kesehatan worker. Tanpa flag, importer berhenti sebelum upload; worker yang berhenti di tengah proses menghasilkan kegagalan berbatas, bukan retry penulisan otomatis.
- Snapshot sebelum apply: `.tools/flamboyan-import/<hostname>/before-<timestamp>.json` (metadata internal, wajib privat). Hasil apply: `result-<timestamp>.json` di folder yang sama.

## Rollback

Gunakan snapshot sebelum apply pertama untuk origin terkait. Login Admin, baca versi terbaru, `PATCH` media baru ber-marker menjadi `published:false`, kembalikan posisi media lama. Importer tidak mengarsipkan MASTERPLAN lama. Siteplan baru dapat disembunyikan dengan `published:false` menggunakan versi terbaru. Jangan restore database keseluruhan karena dapat menimpa perubahan CRM.

## Aset statis situs (PR web)

- `public/images/gerbang-kawasan-960/1920.webp` (dari GATE 1) menggantikan ilustrasi `flamboyan-gerbang.webp` pada figure "Rumahnya. Kawasannya." di beranda; caption baru "Gerbang kawasan Bukit Flamboyan Indah 2 · dokumentasi pengguna". Berkas ilustrasi lama dihapus.
- `public/images/bandung-timur-gerbang-960/1920.webp` (dari GATE 2) menggantikan foto Unsplash pada place-intro `/bandung-timur`; kredit Unsplash dihapus, caption diganti dokumentasi pengguna.
- `logo-flamboyan.webp` (transparan, dari LOGO.jpg) dipakai di header publik lewat `BrandLogo logotype`; wordmark teks tetap untuk footer gelap dan sidebar backoffice. Favicon set: `favicon.ico` (16/32/48), `favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`, didaftarkan di `nuxt.config.ts` `app.head.link`.

## Validasi koreksi review — 2026-10-15

`node --test scripts/import-flamboyan-assets.test.mjs`: 12 tes lulus, termasuk penolakan VIDEO duplikat sebelum apply, dua URL berbeda untuk tipe yang sama, serta satu video untuk setiap tipe berbeda. Koreksi ini tidak menjalankan impor bisnis. Bukti gabungan backend/frontend/browser sebelumnya tercatat di `open-pr-integration-validation.md`; hasilnya tidak dianggap penerimaan risiko dependency source yang masih terbuka.

## Validasi awal sebelum koreksi review (historis)

Runtime Windows, Node 24.21.0, PHP 8.5.11 (GD WebP untuk konversi), Edge lokal via Playwright (Chromium Playwright belum diinstal di mesin ini).

| Pemeriksaan | Hasil |
|---|---|
| `node --test scripts/import-flamboyan-assets.test.mjs` | 9 lulus; marker/alt AI/kapasitas/mapping/limit/deskripsi |
| Generator manifest | 55 foto (10/9/11/15/10); siteplan 2400×1792; 2 mp4 tercatat `skipped` |
| `npm run lint`, `npm run typecheck` | Lulus pada branch ini |
| `npm test` | 39 tes (10 berkas) lulus |
| `npm run build` | Lulus (Nuxt 4.5.2, Nitro node-server) |
| Browser lokal (dev server) | logo header termuat (naturalWidth 308), favicon tertaut, foto gerbang beranda & `/bandung-timur` termuat 1440×1075 (HTTP 200), 0 page error; screenshot di `.tools/flamboyan-import/screens/` |

Pada putaran awal ini belum dijalankan: apply impor live, suite PHPUnit/Pint, tes menulis ke produksi, verifikasi visual oleh pengguna, dan embed video. Saat itu belum ada perubahan `apps/api`; PR final kemudian menambahkan sanitasi marker DTO publik beserta MediaTest. Bukti awal ini bukan cakupan maupun hasil validasi PR final. Screenshot awal disimpan privat; embed video tetap menunggu URL YouTube resmi.

## Koreksi review 15 Oktober 2026

Tabel validasi di atas adalah bukti historis PR awal. Perbaikan resize, penolakan replacement MASTERPLAN, preflight worker, sanitasi marker publik, dan gambar OG dokumentasi pengguna memerlukan validasi ulang pada gabungan PR sebelum merge. Source audit masih memiliki advisory tooling upstream; tidak dianggap lulus. Tidak ada migrasi, seed, impor cloud, atau perubahan CRM.

Deskripsi Admin yang tidak memakai kalimat lama/baru dipertahankan (`preserved`), bukan ditolak atau ditimpa. Katalog baru tidak perlu memasukkan kalimat ilustrasi developer yang sudah tidak sesuai agar importer berjalan.

Siteplan menyebut Komplek Bumi Flamboyan Indah, Jl. Cikoneng, Cimekar, Kecamatan Cileunyi; branding katalog tetap Bukit Flamboyan Indah 2. Nama kompleks pada sumber tidak dianggap identitas legal proyek. SEO/alt gerbang memakai Bandung Timur tanpa klaim desa Cibiru Wetan yang berbeda dari aset terbaru. Koordinat numerik, developer, situs, dan fasilitas berstatus aktual tidak disimpulkan dari gambar ini.
