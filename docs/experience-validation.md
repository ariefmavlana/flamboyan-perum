# Validasi pengalaman pengguna — 5 Oktober 2026

Branch `codex/experience-clarity`, dari `origin/main` `25869e3566f146508b42d16aafeb6c532a52205f`. Perubahan dan sumber aset dijelaskan di [experience-clarity.md](experience-clarity.md). Tidak melakukan merge atau deploy. Tidak menggunakan GitHub Actions.

## Lingkungan dan isolasi

Windows, Node 24.21.0, PHP 8.4.26 dengan GD, PostgreSQL 17, dan Chromium dari instalasi Chrome. PHPUnit memakai SQLite testing dan cluster PostgreSQL lokal terisolasi pada port 15533/database `vercel_fix_tests`; dijalankan berurutan karena fake media storage PHPUnit digunakan bersama. Browser memakai salinan SQLite khusus tugas ini, `.tools/experience-browser.sqlite`, API lokal 8000 dan web 3000. Kredensial, database, log, screenshot, artefak runtime, serta runner lokal tidak dicommit.

Fixture browser berasal dari katalog brosur: sembilan tipe published, katalog arsip dan kontak/akun sintetis untuk pengujian. Pengujian membuat atau memperbarui data hanya pada fixture lokal. Tidak mengirim pesan WhatsApp dan tidak mengubah data cloud. Cache throttle pada database fixture dibersihkan antarkelompok browser; aturan throttle aplikasi tetap aktif.

## Pemeriksaan source dan backend

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| PHP style | `php vendor/bin/pint --test` dari `apps/api` | Lulus |
| PHPUnit SQLite | `php artisan test` dengan `DB_CONNECTION=sqlite` pada database testing | 96 tests, 749 assertions lulus; 254,88 detik pada pengulangan final |
| PHPUnit PostgreSQL | `php artisan test` dengan koneksi cluster testing terisolasi | 96 tests, 749 assertions lulus; 248,39 detik (runner 283,36 detik termasuk lifecycle cluster) |
| Manifest Composer | `php ../../.tools/composer.phar validate --strict` | Lulus |
| Audit Composer | `php ../../.tools/composer.phar audit` | 0 advisory |
| Frontend lint | `npm run lint` dari `apps/web` | Lulus dengan `--max-warnings 0`; runner 59,69 detik |
| Frontend types | `npm run typecheck` | Lulus; runner 106,04 detik |
| Frontend unit | `npm run test` | 17 tests lulus; Vitest 5,34 detik, runner 18,90 detik |
| Nuxt SSR build | `npm run build` | Lulus; runner 207,06 detik, hasil server sekitar 3,02 MB |
| Runtime audit | Buat lock di `.output/server` dengan `npm install --package-lock-only --ignore-scripts --no-fund --no-audit`, lalu `npm audit --prefix .output/server --omit=dev` | 0 vulnerability |
| Source dependency audit | `npm audit --json` | 11 high, 0 critical, sama dengan baseline; tidak dinyatakan lulus bebas temuan |

`LeadWorkspaceTest` menambah dua pengujian/36 assertion untuk agregasi lebih dari satu halaman, scope Marketing, antrean tanpa penanggung jawab, terminal/anonim, filter beririsan, akun nonaktif, akses guest, serta ringkasan kosong. `EditorialAssetsTest` memeriksa fallback hero tanpa media eksplisit, pilihan media eksplisit, dan pencabutan media yang tidak lagi publik.

## Browser dan tinjauan visual

Sebanyak **24 kasus browser relevan lulus** pada build final, dijalankan per kelompok secara berurutan dengan `node node_modules/@playwright/test/cli.js test tests/e2e/<spec>.spec.ts --reporter=line --config ../../.tools/experience-playwright.config.mjs` dari `apps/web`. Lima kasus `ui-design` memakai `--grep` sesuai nama pada tabel. Konfigurasi lokal mengimpor konfigurasi repository, menggunakan satu worker/tanpa retry, dan memperpanjang waktu assertion menjadi 20 detik. Alur operasi diulang setelah timeout sebagaimana dicatat di bawah; angka ini bukan klaim satu eksekusi seluruh suite repository tanpa kegagalan awal.

| Kelompok / grep | Kasus lulus | Durasi runner akhir (detik) |
|---|---:|---:|
| `experience-clarity` | 5 | 181,68 |
| `foundation` | 3 | 94,50 |
| `operations` (pengulangan) | 2 | 11,13 |
| `supervision` | 1 | 73,74 |
| `cms-assets` | 2 | 133,69 |
| `evaluation` | 2 | 143,88 |
| `media` | 1 | 34,58 |
| `realtime` | 1 | 6,39 |
| `buyer-journey` | 2 | 8,42 |
| `ui-design`: public navigation, responsive | 1 | 27,66 |
| `ui-design`: staff menu, all workspace | 1 | 12,62 |
| `ui-design`: missing property shows | 1 | 3,27 |
| `ui-design`: applied filters can | 1 | 2,99 |
| `ui-design`: mobile detail places | 1 | 3,76 |

Pengujian baru memeriksa navbar tanpa Bandung Timur, decode gambar publik, fokus input netral dan fokus tombol keyboard, lebar 1440/390/320, hitungan CRM terhadap API, filter URL/reload/back, notifikasi, scope tindakan Marketing, alasan penutupan wajib, bagian editor properti, filter tujuan CMS, serta kegagalan ringkasan dengan retry tanpa angka nol palsu. Regresi operasi juga memeriksa properti/penanggung jawab tetap terlihat setelah perubahan tahap.

Screenshot beranda, ruang kerja Admin, detail pembeli, serta mobile diperiksa lokal. Pemeriksaan visual terakhir tidak menemukan overflow horizontal atau error JavaScript. Bukti disimpan pada `.tools/experience-review`; nama/kontak sintetis dari fixture tidak dimasukkan ke dokumen publik.

## Batasan dan percobaan yang tidak dinyatakan lulus

- Percobaan PHPUnit paralel sempat bertabrakan pada fake media storage; hasil tersebut tidak dipakai. Kedua database kemudian diuji ulang secara berurutan dan lulus.
- Percobaan browser awal menemukan label pengujian lama serta pemilihan kartu pertama yang keliru pada fixture sembilan tipe; locator diperbarui untuk memilih properti fixture secara eksplisit. Pemeriksaan CMS menemukan pilihan media hero perlu tetap didukung; kontrak backend/frontend diperbaiki dan kasus CMS foto/video/pencabutan diuji ulang.
- Build dan dev server sempat memakai folder `.nuxt` bersamaan, kemudian host melambat dan beberapa interaksi melampaui timeout. Runner tersebut tidak dinyatakan lulus. Pengujian akhir menggunakan preview hasil build lewat proxy lokal (API/auth/media ke 8000, Nitro ke 3104, origin browser 3000); konfigurasi lokal memberi waktu assertion hingga 20 detik. Ini bukan pengukuran kinerja atau bukti deployment Vercel.
- Alur operasi yang membuat properti/kontak/akun lalu berganti peran melewati batas keseluruhan 60 detik pada percobaan pertama build final. Batas kasus tersebut menjadi 120 detik dengan assertion yang sama, termasuk properti/penanggung jawab setelah perubahan tahap. Pengulangan selesai dengan dua kasus lulus dalam 10,5 detik Playwright (11,13 detik runner). Lint berkas pengujian yang berubah juga lulus. Variasi waktu di tabel mencerminkan beban host; tidak dipakai sebagai benchmark produk.
- Kasus lama `editorial images load and testimonial blocks are useful on narrow screens` tidak digunakan karena memerlukan testimonial sintetis published yang sengaja tidak tersedia pada fixture brosur. Pengujian baru memeriksa decode seluruh gambar pada tiga ukuran layar; CMS testimonial diuji dengan konten fixture sementara. Tidak mengklaim seluruh test browser repository telah dijalankan.
- Build masih mencatat warning upstream `DEP0155` dari pemetaan package exports Vue/Nuxt dan `PLUGIN_TIMINGS` saat host terbebani. Lint tidak mempunyai warning. Tidak menyebut build bebas warning.
- Source audit tetap memiliki 11 entri high yang diturunkan dari dua advisory tooling (`GHSA-86w9-cpqp-85rv`, `GHSA-vfj7-8cjw-p6xm`); tidak ada perubahan dependensi pada PR ini. Lihat [dependency-security.md](dependency-security.md). Artefak runtime dan Composer diaudit terpisah.
- Tidak menjalankan ulang load test, menguji provider push/SMTP eksternal, melakukan UAT dengan calon pembeli, atau mengukur konversi/Core Web Vitals komparatif. Persona adalah hipotesis desain dari brief pengguna. Gate produksi yang sudah ada tetap berlaku.

## Rilis dan rollback

Tidak ada migrasi, impor data produksi, perubahan dependensi, atau GitHub Actions. Rilis membutuhkan backend dan frontend dari revisi yang sama agar endpoint ringkasan/filter tersedia. Revert PR dan deploy ulang kedua aplikasi untuk rollback; jangan menjalankan down migration atau mengembalikan database. PR tidak mengotorisasi merge/deploy.

## Koreksi saat review PR, 2026-10-05

Review gabungan dengan PR#22/#23 menjalankan ulang SQLite dan PostgreSQL: masing-masing 96 test/749 assertion lulus (13,29s dan 365,72s saat host terbebani). Pint dan Composer validate strict lulus; lockfile Composer tidak berubah dan audit 0 advisory sudah dijalankan pada masing-masing PR. Frontend lint/typecheck/17 unit/build dan audit artefak runtime 0 lulus.

Suite browser gabungan pertama menghasilkan 7 lulus/4 timeout 60 detik (20,6 menit termasuk startup/teardown browser). Trace menunjukkan identitas tetap 200, dengan beberapa request lokal sampai 19 detik. Pengulangan privat mempertahankan assertion, memberi batas kasus 180 detik/expect 30 detik dan menonaktifkan trace: 10 lulus/1 gagal dalam 141,08s. Keenam regresi sesi lulus; kegagalan Marketing ternyata dapat direproduksi, sehingga bukan diabaikan sebagai timeout.

Saat antrean diganti, tombol detail pada daftar lama dapat diklik sebelum watcher navigasi memulai pemuatan. Klien kini mengaktifkan status loading dan menginvalidasi request lama secara sinkron sebelum navigasi, menonaktifkan tombol detail serta menolak pembukaan selama loading. Filter identik memuat ulang daftar; kegagalan navigasi tidak meninggalkan spinner permanen. Endpoint/RBAC tidak berubah. Regresi Marketing menahan request daftar `work=contact` asli, memeriksa aria-busy/tombol disabled sebelum melepas respons, kemudian memeriksa detail dari antrean yang benar dan penerapan filter identik. Lima alur UX dengan guard lulus pada build dalam 1,3 menit; lint 6,27s, typecheck 8,63s, 17 unit 1,47s, build 14,57s, audit runtime 0. Bukti percobaan disimpan privat pada `.tools/review-*`; data fixture/kredensial tidak masuk Git.

Pemeriksaan tambahan Marketing termasuk penerapan filter identik lulus satu kasus dalam 3,5 menit pada host yang kembali melambat. Request yang ditahan dilepas melalui `finally`, termasuk bila assertion gagal. Angka waktu tersebut merupakan runtime runner lokal, bukan benchmark produk.
