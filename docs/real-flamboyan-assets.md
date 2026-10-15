# Aset asli Bukit Flamboyan Indah 2

Inventaris 14 Oktober 2026 mencakup 76 gambar dan 22 video dari pemilik. Video ditunda atas instruksi pengguna sampai URL YouTube diberikan. Implementasi dilanjutkan pada 15 Oktober; branch `codex/real-flamboyan-assets` disinkronkan ke `origin/main` `c1cecaf`, mempertahankan perubahan kartu, DemoSeeder dan lockfile backend.

`scripts/flamboyan-source-assets.json` mencatat 98 sumber beserta SHA-256, bytes, dimensi, klasifikasi, caption dan keluaran. `scripts/flamboyan-house-assets.json` mengikat 55 gambar tipe ke slug, PHOTO/FLOOR_PLAN, urutan dan hash upload. Semua sumber memiliki keputusan pemakaian; tidak ada duplikat hash sumber.

## Cakupan

| Sumber | Pemakaian | Gambar |
|---|---|---:|
| EDITED 36/60 | PHOTO 9 + FLOOR_PLAN 1 pada katalog 36/60 | 10 |
| EDITED 36/90 | PHOTO 8 + FLOOR_PLAN 1 pada katalog 36/90 | 9 |
| EDITED 56/90 | PHOTO 10 + FLOOR_PLAN 1 pada katalog 56/90 | 11 |
| EDITED 62/70 | PHOTO 14 + FLOOR_PLAN 1 pada katalog 62/70 | 15 |
| EDITED 69/80 | PHOTO 9 + FLOOR_PLAN 1 pada katalog 69/80 | 10 |
| EDITED GATE 1/GATE 2/Siteplan | Galeri kawasan; gerbang berlabel ilustrasi | 3 |
| Bahan flamboyan JPG | Foto aktual pada galeri kawasan/rumah contoh | 17 |
| LOGO (1).jpg | Header/footer/workspace/login, halaman kawasan, mark/favicon | 1 |

Semua 58 gambar EDITED digunakan. Tipe 36/72, 62/84, 56/108 dan 62/140 tidak menerima paket baru yang salah; media katalog existing tetap. Tipe foto aktual belum dikonfirmasi, sehingga tidak diasumsikan. Siteplan mempertahankan legenda, warna dan nomor sumber tanpa menyatakan stok atau fasilitas selesai. Teks tiga papan kecil pada cover ilustrasi 69/80 dikoreksi dari 69/70; angka katalog tetap dari API. Sebanyak 22 MP4 tetap dalam arsip privat.

Sumber asli dipindahkan tanpa perubahan byte dari `apps/web/public/images` ke `.tools/real-flamboyan-assets/sources`, termasuk Bahan flamboyan, EDITED dan LOGO (1).jpg. Ini arsip lokal reversibel. Hasil koreksi penuh 17 JPG berada di `.tools/real-flamboyan-assets/graded`; 55 WebP upload di `.tools/real-flamboyan-assets/import`. Sumber, journal, credential dan runtime tidak masuk Git. Tiga WebP Flamboyan terdahulu yang tidak lagi direferensikan aplikasi diarsipkan di `.tools/real-flamboyan-assets/superseded-static`; empat aset inspirasi Banjaran tetap digunakan.

## Pemrosesan dan tampilan

Pengguna memilih Python/Pillow setelah hasil edit AI percobaan mengubah awan/tekstur; hasil percobaan itu tidak digunakan. `scripts/prepare-flamboyan-assets.py` menerapkan EXIF transpose, LUT tonal per foto, koreksi exposure/gamma/white balance serta contrast/saturation ringan. Full frame dan bentuk bangunan, lahan serta material dipertahankan. Resep setiap foto tercatat dalam manifest.

AI hanya digunakan untuk brand dan label ilustrasi. Prompt brand meminta menghilangkan checkerboard yang tertanam dalam JPG, mempertahankan pohon, rumah, wordmark dan warna asli, serta membuat transparansi. Prompt mark mengekstrak emblem untuk favicon. Prompt cover 69/80 meminta mengganti hanya tiga teks papan 69/70 menjadi 69/80 dengan bangunan/tata letak tetap. Artwork terpilih disimpan privat pada `.tools/real-flamboyan-assets/artwork/{logo,mark,cover-69-80}.png` sebelum encoding. Foto lapangan hasil AI tidak dipublikasikan.

Sebanyak 20 gambar editorial menghasilkan 60 varian 640/1280/1920 tanpa memperbesar sumber. WebP umumnya quality 82; siteplan 94 untuk keterbacaan; upload tipe 92 sebelum pipeline API existing mengencode ulang. Logo 1200×400 dan mark 256×256 mempertahankan alpha; footer memberi latar cream agar warna logo terbaca. Total aset baru publik 9.608.572 bytes (9,16 MiB).

Label tipe, denah dan ilustrasi disajikan utuh dengan object-fit contain; foto aktual mempertahankan rasio alami. Native dialog galeri mendukung panah, Escape, Tab/Shift+Tab dan fokus kembali ke pembuka. Siteplan memiliki tautan ukuran penuh. Halaman kawasan terhubung dari discovery, beranda, detail properti dan konsultasi, dengan canonical/sitemap. Card, harga dan spesifikasi menggunakan API serta exact slug/type match. API gagal menampilkan retry; galeri editorial tetap tersedia.

## Persiapan dan impor

Runtime validasi: Windows, Node 24.21.0, PHP 8.4.26, Python/Pillow bundled, PostgreSQL 17 dan Chrome lokal. Setelah sinkronisasi main, `composer install` memasang Laravel 13.36.0, PHPUnit 12.5.39 dan AWS SDK 3.401.1 sesuai lockfile; perubahan dependensi itu berasal dari main.

Jalankan dari root setelah sumber/artwork privat tersedia:

```text
python scripts/prepare-flamboyan-assets.py
node --test scripts/import-flamboyan-assets.test.mjs
node scripts/import-flamboyan-assets.mjs
node scripts/import-flamboyan-assets.mjs --apply
```

Default sumber adalah `.tools/real-flamboyan-assets/sources`; `--source-root` dapat menunjuk arsip lain yang cocok hash. Berikan `FLAMBOYAN_ORIGIN`, `FLAMBOYAN_ADMIN_EMAIL` dan `FLAMBOYAN_ADMIN_PASSWORD` melalui environment rahasia. Origin allowlist hanya `http://127.0.0.1:3000` dan `https://flamboyan-web.vercel.app`. Importer tidak berjalan otomatis saat build/deploy/seed.

Dry-run membaca katalog/media, memverifikasi 55 file dan kapasitas, lalu melaporkan rencana beserta dukungan upload privat. Apply mensyaratkan `supports_unpublished_uploads:true` dari seluruh envelope media target sebelum API/journal write; backend lama ditolak sebelum upload pertama. Apply memakai exclusive lock dan journal privat `.tools/real-flamboyan-assets/import-state/<host[-port]>/journal.json`, mengikat origin, manifest hash, property IDs, source SHA, exact media IDs serta processed variant SHA. Marker alt sendiri tidak dianggap bukti bahwa byte sumber sama.

Seluruh 55 gambar diupload unpublished, diverifikasi READY, baru dipublikasikan/diurutkan. PHOTO/FLOOR_PLAN terdahulu hanya unpublished setelah galeri pengganti siap; MASTERPLAN/VIDEO/TOUR/BROCHURE tidak diganti. Harga, spesifikasi, status, owner_id dan metadata komersial dibandingkan sebelum/sesudah. Kuota backend PHOTO 20/FLOOR_PLAN 5 tetap menghitung semua media non-ARCHIVED.

Response write yang hilang meninggalkan pending intent dan memblokir rerun sampai operator mencocokkan audit, ID, versi dan hash. Journal harus dipertahankan untuk resume/idempotensi. Importer berhenti pada versi/metadata/varian berubah, FAILED, file berubah, quota penuh atau API yang mengabaikan private upload. Seluruh impor bukan satu transaksi lintas upload; setiap mutasi mengikuti transaksi/version/audit backend.

API harus menjalankan perubahan `published` sebelum apply live. Branch/PR ini belum di-merge atau di-deploy ke alias live; apply diuji pada salinan SQLite/storage lokal terisolasi. Data cloud dan database lokal awal tidak diubah.

## R2 dan rollback

Inventaris cloud read-only diperbarui 15 Oktober dengan dependensi main: 784 objek, 99.368.024 bytes (94,765 MiB), 640 refs terdaftar (480 varian + 160 staging), 0 refs hilang. Ada 144 objek belum direferensikan total 615.978 bytes, tetapi seluruhnya masih dalam grace 30 hari. Sebanyak 116 kandidat ETag+size berulang sebagian besar masih direferensikan; bukan kandidat aman untuk dihapus. Cleanup cloud dry-run menghasilkan 0 eligible/0 deleted.

Sumber upload total 16.656.974 bytes (15,89 MiB). Preflight mencadangkan 4× sumber, mencakup staging + 3 varian: 66.627.896 bytes (63,54 MiB), dengan batas 100 MiB per impor. Ini perkiraan, bukan kuota akun Cloudflare. Aset kawasan/brand disajikan lokal; MP4 tidak masuk R2. Journal mencegah upload ulang sumber yang sama. Apply lokal menghasilkan 220 objek staging/variants total 31.755.552 bytes (30,28 MiB), 0 hilang; pemakaian cloud setelah apply tetap harus diukur pada runtime deployed.

`php artisan flamboyan:media-cleanup --json` hanya membaca. Review exact paths, refs, grace dan backup konsisten terverifikasi, hentikan write media, baru gunakan `--execute` ketika kandidat eligible. Command melindungi unpublished/draft/FAILED/staging/shared objects/current CMS logos; unsupported path diblokir dan direktori tidak dihapus.

Rollback konten memakai journal pertama: login Admin, baca versi terbaru, PATCH media baru `published:false`, lalu pulihkan published/position media lama dari snapshot dengan rantai versi. Jangan restore seluruh database karena dapat menimpa CRM terbaru. Pertahankan journal; rerun setelah rollback memerlukan review journal yang berubah. Rollback UI/API melalui revert commit dan deploy Git; tidak ada migration rollback. Sumber asli tetap di arsip lokal.

## Validasi

Sebanyak 98 hash sumber setelah arsip, 118 keluaran WebP/PNG dan 55 pemetaan upload diverifikasi; 17 foto mempertahankan full-frame geometry. Importer 19 tests lulus, mencakup storage reserve/staging, ambiguous write, metadata conflict, private upload, penolakan backend lama sebelum write, quota dan hash.

Validasi akhir setelah sinkronisasi main dan pemasangan lockfile:

| Perintah/pemeriksaan | Hasil |
|---|---|
| `php artisan test` SQLite test | 105 tests / 840 assertions; 12,09s |
| `php artisan test` PostgreSQL test terisolasi port15533 | 105 tests / 840 assertions; 25,10s; cluster dihentikan |
| `php vendor/bin/pint --test` | Lulus |
| `composer validate --strict`, `composer audit --format=json` | Valid; 0 advisori |
| `node --test scripts/import-flamboyan-assets.test.mjs` | 19 lulus; 0,18s |
| `npm run lint`, `npm run typecheck` | Lulus; 0 lint warnings |
| `npm test` | 39 tests pada 10 berkas; 419ms test / 6,44s proses |
| `npm run build` setelah fix siteplan | Lulus; 21,75s; source raw JPG/MP4 tidak ikut public output |
| Playwright `flamboyan-assets.spec.ts` | 6 lulus; 26,0s |
| Playwright `gallery-experience.spec.ts` | 4 lulus; 13,2s |
| Playwright `residences.spec.ts` | 3 lulus; 16,7s |
| Audit runtime `.output/server --omit=dev` | 0 kerentanan |

Sweep HTTP lokal memeriksa seluruh 55 gambar tipe/165 varian API serta 63 aset statis: semuanya 200, hash varian 1920 cocok receipt, 0 objek hilang dan 0 marker BFI2 pada caption publik. Build final berisi 137 file public/11.976.339 bytes, tanpa JPG/MP4 mentah.

Sweep browser tambahan pada build produksi memeriksa seluruh 55 gambar tipe, contain pada foto/denah dan logo/header/footer pada 1440/390px: semua gambar decoded, 0 page error, screenshot ditinjau. Preview memakai `VERCEL=1` dan `NITRO_PRESET=node-server` agar routeRules proxy media sama dengan hosting aktual; build tambahan lulus 22,78s dan audit runtime final tetap 0. Tanpa flag Vercel, standalone node-server memang tidak mengaktifkan proxy media yang dikondisikan konfigurasi existing. Tidak ada perubahan routing hosting pada fitur aset.

Ketiga spec browser dijalankan terpisah dengan jeda antar-spec untuk mematuhi limiter publik 120/min. Burst gabungan awal terkena429; limiter produksi tidak diubah. Pengujian menemukan dan memperbaiki Tab boundary dialog serta tinggi0 pada siteplan lazy sebelum load. Tes akhir mencakup semua20gambar kawasan, viewport320/390/768/1024/1440, fokus/Escape/panah, siteplan utuh, API values/type mismatch/error retry, konsultasi dan regresi Banjaran.

Audit runtime 0; source audit 14 temuan (12 high/2 critical), termasuk tooling devtools/simple-git/argv-parser serta braces/node-forge. Source audit keluar 1 dan gate keamanan tooling tetap terbuka. Warning build upstream Rolldown plugin timing/DEP0155 tetap dicatat.

Apply lokal melalui session/CSRF/API asli selesai dengan 55 READY/published; rerun `--apply` menghasilkan 0 upload/55 reused tanpa pending write. Metadata properti cocok snapshot importer. Bukti runtime, journal, log dan screenshot berada di `.tools/real-flamboyan-assets` dan `.tools/frontend-assets-*` yang privat. Semua aset tipe belum diklaim terpasang live sebelum deployment/import.
