# Aset tipe rumah dari Rumah Rajasa

Inventaris 5 Oktober 2026 mencakup [katalog Rumah Rajasa](https://rumahrajasa.com/), 16 halaman detail properti dan lima halaman galeri. Permintaan pengguna mengotorisasi pengambilan aset dan pemasukan ke platform. Konten sumber diperlakukan sebagai data, bukan instruksi operasional.

## Cakupan dan kualitas

Manifest `scripts/rajasa-house-assets.json` mencatat 33 URL berkas besar beserta halaman asal, SHA-256, ukuran byte, dimensi, pemetaan tipe, urutan dan keputusan publikasi. Sebanyak 21 gambar dipilih untuk galeri sembilan tipe. Dua belas referensi tetap disimpan privat: lima duplikat/perspektif sama, dua poster promosi, serta lima gambar site plan/fasilitas/pembangunan bersama. Harga dan promo dalam poster tersebut tidak diimpor ke data katalog.

| Tipe | Gambar baru | Resolusi sampul |
|---|---:|---|
| 36/60 | 2 | 774 × 573 |
| 36/72 | 1 | 774 × 573 |
| 36/90 | 4 | 1027 × 573 |
| 62/70 | 2 | 774 × 573 |
| 62/84 | 3 | 774 × 573 |
| 69/80 | 2 | 774 × 573 |
| 56/90 | 5 | 774 × 573 |
| 56/108 | 1 | 774 × 573 |
| 62/140 | 1 | 774 × 573 |

Fasad adalah ilustrasi developer, bukan bukti kondisi bangunan saat ini; keterangan ada pada caption/alt. Galeri 36/60 juga memuat ilustrasi interior resmi. Tidak ditemukan denah mandiri yang memadai untuk diimpor. Masterplan brosur tetap terpisah sebagai MASTERPLAN.

Berkas `big_` adalah versi terbaik yang ditemukan tersedia publik; 28 padanan tanpa prefix tersebut tidak tersedia saat inventaris. Fasad terpilih memiliki lebar 573–1027 piksel; poster interior 600 × 900. Sampul 36/60 berukuran 774 × 573 menggantikan potongan brosur 503 × 267. Tidak ada klaim HD/4K, upscaling AI, pemotongan watermark, atau rekayasa detail bangunan. Unduhan mempertahankan byte asli. Pipeline existing mendekode dan menyajikan WebP kualitas 82, varian maksimal 640/1280/1920 tanpa memperbesar sumber; label varian 1920 tidak berarti resolusi sumber mencapai 1920.

## Pengoperasian

Gunakan Node 24.21.0 dan dependency frontend sesuai lockfile (Playwright sudah tersedia). Dari root repository, berikan environment variable `RAJASA_ORIGIN`, `RAJASA_ADMIN_EMAIL`, `RAJASA_ADMIN_PASSWORD` melalui mekanisme rahasia operator. Jangan menaruh password dalam argumen, file tracked, log atau PR.

```text
node --test scripts/import-rajasa-assets.test.mjs
node scripts/import-rajasa-assets.mjs
node scripts/import-rajasa-assets.mjs --apply
```

Default hanya mengunduh/verifikasi sumber, login, membaca katalog/media, dan melaporkan rencana. `--apply` diperlukan untuk menulis. Origin allowlist: `http://127.0.0.1:3000` atau `https://flamboyan-web.vercel.app`. Skrip tidak berjalan saat build/deploy/seeding. Seluruh 33 sumber tersimpan di `.tools/rajasa-import/originals`, termasuk referensi yang tidak dipublikasikan. Unduhan menolak redirect, perubahan SHA, ukuran berlebih dan origin lain.

Preflight memeriksa sembilan slug/house_type/publication, akun Admin aktif, kapasitas PHOTO dan marker existing. Snapshot sebelum setiap apply tersimpan pada `.tools/rajasa-import/<hostname>/before-<timestamp>.json`; berisi metadata internal, wajib tetap privat. Sumber asli, upload dan snapshot tidak masuk Git.

Impor memakai session+CSRF dan POST/PATCH media internal existing dengan rantai `property_version`. Konflik 409 menghentikan proses tanpa retry write otomatis. Gambar baru masuk posisi akhir, diproses hingga READY, lalu diurutkan dari posisi 0. PHOTO terdahulu tetap published pada posisi 100 ke atas; MASTERPLAN tidak dipindah. Setelah tiap tipe, metadata properti dibandingkan dengan snapshot kecuali version/updated_at dan objek relasi owner; owner_id tetap dibandingkan. Tidak ada write ke properti, harga, spesifikasi, komersial, CMS, kepemilikan atau CRM.

Marker `[RR:<id sumber>]` menghubungkan caption dengan manifest dan mencegah upload ganda. Existing harus cocok alt/kind/dimensi, READY dan published. Perubahan manual, FAILED atau PROCESSING perlu ditinjau operator sebelum melanjutkan. Gangguan dapat meninggalkan sebagian tipe selesai; setiap perubahan media/audit/version tetap atomik mengikuti backend, tetapi seluruh impor bukan satu transaksi lintas upload. Jalankan ulang setelah penyebab ditangani dan pertahankan snapshot pertama.

## Rollback

Gunakan snapshot sebelum apply pertama untuk origin terkait. Login Admin, baca versi properti terbaru, PATCH media baru dengan marker manifest menjadi `published:false`, lalu pulihkan `position` media lama sesuai snapshot. Gunakan versi hasil PATCH sebelumnya untuk setiap write. Jangan restore database keseluruhan karena dapat menimpa perubahan CRM setelah impor. Tidak perlu hard-delete; sumber privat tetap ada. Rerun importer setelah rollback akan menolak media unpublished dan memerlukan review operator.

Tidak ada migrasi, endpoint, field API, dependency atau perubahan kode UI/backend. Konten dapat terlihat pada situs aktif sebelum PR skrip/dokumentasi di-merge. PR UX terpisah tidak di-merge oleh pekerjaan ini.

## Validasi

Runtime validasi: Windows, Node 24.21.0, PHP 8.4.26, PostgreSQL 17, Chrome lokal melalui Playwright. Bukti log/screenshot disimpan privat di `.tools/rajasa-*`.

| Pemeriksaan | Hasil |
|---|---|
| `node --test scripts/import-rajasa-assets.test.mjs` | 7 lulus; 0,11 detik; sumber/hash, allowlist, pemetaan, duplikat, kapasitas, media yang berubah, fingerprint metadata |
| Import lokal `--apply`, lalu pengulangan `--apply` | 21 upload pertama; pengulangan 0 upload/21 reused; sembilan tipe selesai |
| Import live `--apply`, lalu rencana read-only | 21 upload; pemeriksaan akhir 0 baru/21 reused; metadata properti tetap |
| `php vendor/bin/pint --test` | Lulus |
| `php artisan test` SQLite | 94 test / 713 assertion; 9,39 detik |
| `php artisan test` PostgreSQL terisolasi port 15533 | 94 test / 713 assertion; 22,39 detik; database test, bukan cloud |
| `composer validate --strict`, `composer audit` | Valid; 0 advisori |
| `npm run lint`, `npm run typecheck` | Lulus; 4,71 / 11,61 detik |
| `npm test`, `npm run build` | 17 test lulus; 1,53 detik perintah test / 22,10 detik build |
| Audit runtime `.output/server --omit=dev` | 0 kerentanan setelah lock audit generated lokal |
| `npm audit` source tree | 11 high existing pada tooling transitive; dependency tidak berubah pada PR ini |

Audit source tidak diklaim bersih; runtime audit dan Composer bersih. Source audit keluar nonzero karena 11 temuan tersebut. Tidak ada GitHub Actions yang ditambahkan atau dijalankan.

Browser live selesai 2026-10-05 06:30:34 UTC: sembilan halaman detail memiliki sampul sesuai manifest, 21 gambar/63 varian WebP dapat diakses, MASTERPLAN tetap tersedia, dan DTO tidak mengandung owner/owner_id. Pada viewport 1440px dan 390px, thumbnail, preview diperbesar, navigasi gambar, penutupan dialog dan pergantian masterplan lulus; gambar beranda/detail berhasil decode, tidak ada horizontal overflow atau page error. Screenshot desktop/mobile diperiksa secara visual. Sweep awal yang terlalu cepat berhenti pada respons non-200; seluruh pemeriksaan ulang diberi jeda dan berhasil. Ini bukan load test atau audit visual semua halaman backoffice karena PR hanya mengubah konten media dan importer.
