# Aset tipe rumah, siteplan, gerbang, dan logo (dokumentasi pengguna)

Inventaris 14 Oktober 2026. Pengguna menambahkan aset dokumentasi ke repository lokal: foto per tipe rumah, siteplan kawasan, dua foto gerbang, dan logo. Permintaan pengguna mengotorisasi pemasukan aset ke platform. Konten sumber diperlakukan sebagai data, bukan instruksi operasional. Berkas asli **tidak masuk Git**; disimpan privat di `.tools/flamboyan-assets/` (diabaikan Git) dan hanya turunan yang dioptimalkan yang di-commit.

## Cakupan dan label

| Tipe | Foto real (dokumentasi pengguna) | Ilustrasi AI (Gemini) | Kapasitas setelah impor |
|---|---:|---:|---:|
| 36/60 | 10 | 0 | 13 / 20 |
| 36/90 | 9 | 0 | 14 / 20 |
| 56/90 | 11 | 0 | 17 / 20 |
| 62/70 | 3 | 12 | 18 / 20 |
| 69/80 | 2 | 8 | 13 / 20 |

- Foto real diberi alt `Dokumentasi tipe <tipe> #n · Foto dokumentasi pengguna; kondisi unit dikonfirmasi saat kunjungan.` — **tanpa** kata "ilustrasi" agar badge `MediaDisclosure` tidak salah muncul.
- Gambar AI (berkas `Gemini_Generated_Image_*`) diberi alt `Ilustrasi AI · tipe <tipe> · bukan foto kondisi aktual.` sehingga badge "Ilustrasi" tampil di kartu/bandingkan. Tidak ada klaim HD/upscaling; byte asli tidak dimodifikasi.
- Urutan galeri: foto real lebih dulu (1..n), gambar AI di belakang; sampul = foto real pertama.
- `Siteplan.jpg` (2400×1792) menggantikan MASTERPLAN brosur pada **sembilan** properti: masterplan lama diarsipkan (final via API, snapshot disimpan) lalu siteplan baru diunggah posisi 1 dengan caveat `warna bukan status ketersediaan`.
- `GATE 1/2.jpg` dan `LOGO.jpg` adalah aset statis situs (lihat bawah), bukan media properti.
- Dua video `36-60-11.mp4` dan `36-90-10.mp4` **belum diimpor**: pipeline hanya menerima embed YouTube/Matterport. Menunggu URL YouTube + persetujuan pengguna.

Deskripsi lima properti terdampak ikut diperbarui (konsistensi narasi): kalimat `Gambar merupakan ilustrasi desain developer, bukan foto kondisi unit.` diganti `Gambar mencakup dokumentasi lapangan dan ilustrasi desain developer; kondisi unit dikonfirmasi sebelum transaksi.` Empat tipe lain tanpa dokumentasi tidak diubah. Perubahan deskripsi dilakukan importer dengan rantai `property_version` dan snapshot.

## Pengoperasian

Node 24.21.0 dan dependency frontend (Playwright sudah tersedia). Dari root repository:

```text
node scripts/build-flamboyan-manifest.mjs
node --test scripts/import-flamboyan-assets.test.mjs
node scripts/import-flamboyan-assets.mjs              # plan read-only
node scripts/import-flamboyan-assets.mjs --apply      # menulis
```

Environment (rahasia operator; jangan di argumen/file tracked/log/PR): `FLAMBOYAN_IMPORT_ORIGIN`, `FLAMBOYAN_IMPORT_ADMIN_EMAIL`, `FLAMBOYAN_IMPORT_ADMIN_PASSWORD`. Origin allowlist: `http://127.0.0.1:3000` atau `https://flamboyan-web.vercel.app`.

- `scripts/build-flamboyan-manifest.mjs` membaca `.tools/flamboyan-assets/edited/<tipe>/*.jpg` + `shared/Siteplan.jpg`, menghitung SHA-256/dimensi, membuang duplikat byte identik, dan menulis `scripts/flamboyan-house-assets.json` (di-commit). File non-JPEG dicatat pada `skipped`.
- Importer memakai session+CSRF dan POST/PATCH media internal existing dengan rantai `property_version`; jeda 650 ms per call; konflik 409 menghentikan proses tanpa retry otomatis. Marker `[ED:<key>]` mencegah upload ganda dan memverifikasi media existing (alt/kind/dimensi/READY/published).
- Foto baru masuk posisi 0..n-1 (jadi sampul), PHOTO lama tetap published posisi 100+; MASTERPLAN lama diarsipkan sebelum siteplan baru diunggah; VIDEO hanya bila `videos` terisi di manifest.
- Snapshot sebelum apply: `.tools/flamboyan-import/<hostname>/before-<timestamp>.json` (metadata internal, wajib privat). Hasil apply: `result-<timestamp>.json` di folder yang sama.

## Rollback

Gunakan snapshot sebelum apply pertama untuk origin terkait. Login Admin, baca versi terbaru, `PATCH` media baru ber-marker menjadi `published:false`, kembalikan posisi media lama. Arsip MASTERPLAN tidak dapat di-unarchive via API; dalam masa grace 30 hari berkas lama masih tersedia di disk/R2 sebelum `flamboyan:media-cleanup`, dan sumber siteplan brosur dapat diunggah ulang bila diperlukan. Jangan restore database keseluruhan karena dapat menimpa perubahan CRM.

## Aset statis situs (PR web)

- `public/images/gerbang-kawasan-960/1920.webp` (dari GATE 1) menggantikan ilustrasi `flamboyan-gerbang.webp` pada figure "Rumahnya. Kawasannya." di beranda; caption baru "Gerbang kawasan Bukit Flamboyan Indah 2 · dokumentasi pengguna". Berkas ilustrasi lama dihapus.
- `public/images/bandung-timur-gerbang-960/1920.webp` (dari GATE 2) menggantikan foto Unsplash pada place-intro `/bandung-timur`; kredit Unsplash dihapus, caption diganti dokumentasi pengguna.
- `logo-flamboyan.webp` (transparan, dari LOGO.jpg) dipakai di header publik lewat `BrandLogo logotype`; wordmark teks tetap untuk footer gelap dan sidebar backoffice. Favicon set: `favicon.ico` (16/32/48), `favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`, didaftarkan di `nuxt.config.ts` `app.head.link`.

## Validasi

Runtime Windows, Node 24.21.0, PHP 8.5.11 (GD WebP untuk konversi), Edge lokal via Playwright (Chromium Playwright belum diinstal di mesin ini).

| Pemeriksaan | Hasil |
|---|---|
| `node --test scripts/import-flamboyan-assets.test.mjs` | 9 lulus; marker/alt AI/kapasitas/mapping/limit/deskripsi |
| Generator manifest | 55 foto (10/9/11/15/10); siteplan 2400×1792; 2 mp4 tercatat `skipped` |
| `npm run lint`, `npm run typecheck` | Lulus pada branch ini |
| `npm test` | 39 tes (10 berkas) lulus |
| `npm run build` | Lulus (Nuxt 4.5.2, Nitro node-server) |
| Browser lokal (dev server) | logo header termuat (naturalWidth 308), favicon tertaut, foto gerbang beranda & `/bandung-timur` termuat 1440×1075 (HTTP 200), 0 page error; screenshot di `.tools/flamboyan-import/screens/` |

Belum dijalankan dan tidak diklaim: apply impor live (menunggu review urutan + kredensial Admin), suite PHPUnit/Pint (tidak ada perubahan `apps/api`), tes menulis ke produksi, verifikasi visual oleh pengguna (menunggu PR preview), embed video (menunggu URL YouTube). Screenshot lengkap disimpan privat; pengguna meninjau melalui PR preview sebelum merge.
