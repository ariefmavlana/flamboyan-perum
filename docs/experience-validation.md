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

Hasil browser final dicatat setelah runner selesai. Kelompok yang diperiksa: `experience-clarity`, `foundation`, `operations`, `supervision`, `cms-assets`, `evaluation`, `media`, `realtime`, `buyer-journey`, dan lima kasus terkait pada `ui-design`.

Pengujian baru memeriksa navbar tanpa Bandung Timur, decode gambar publik, fokus input netral dan fokus tombol keyboard, lebar 1440/390/320, hitungan CRM terhadap API, filter URL/reload/back, notifikasi, scope tindakan Marketing, alasan penutupan wajib, bagian editor properti, filter tujuan CMS, serta kegagalan ringkasan dengan retry tanpa angka nol palsu. Regresi operasi juga memeriksa properti/penanggung jawab tetap terlihat setelah perubahan tahap.

Screenshot beranda, ruang kerja Admin, detail pembeli, serta mobile diperiksa lokal. Pemeriksaan visual terakhir tidak menemukan overflow horizontal atau error JavaScript. Bukti disimpan pada `.tools/experience-review`; nama/kontak sintetis dari fixture tidak dimasukkan ke dokumen publik.

## Batasan dan percobaan yang tidak dinyatakan lulus

- Percobaan PHPUnit paralel sempat bertabrakan pada fake media storage; hasil tersebut tidak dipakai. Kedua database kemudian diuji ulang secara berurutan dan lulus.
- Percobaan browser awal menemukan label pengujian lama serta pemilihan kartu pertama yang keliru pada fixture sembilan tipe; locator diperbarui untuk memilih properti fixture secara eksplisit. Pemeriksaan CMS menemukan pilihan media hero perlu tetap didukung; kontrak backend/frontend diperbaiki dan kasus CMS foto/video/pencabutan diuji ulang.
- Build dan dev server sempat memakai folder `.nuxt` bersamaan, kemudian host melambat dan beberapa interaksi melampaui timeout. Runner tersebut tidak dinyatakan lulus. Pengujian akhir menggunakan preview hasil build lewat proxy lokal (API/auth/media ke 8000, Nitro ke 3104, origin browser 3000); konfigurasi lokal memberi waktu assertion hingga 20 detik. Ini bukan pengukuran kinerja atau bukti deployment Vercel.
- Kasus lama `editorial images load and testimonial blocks are useful on narrow screens` tidak digunakan karena memerlukan testimonial sintetis published yang sengaja tidak tersedia pada fixture brosur. Pengujian baru memeriksa decode seluruh gambar pada tiga ukuran layar; CMS testimonial diuji dengan konten fixture sementara. Tidak mengklaim seluruh test browser repository telah dijalankan.
- Build masih mencatat warning upstream `DEP0155` dari pemetaan package exports Vue/Nuxt dan `PLUGIN_TIMINGS` saat host terbebani. Lint tidak mempunyai warning. Tidak menyebut build bebas warning.
- Source audit tetap memiliki 11 entri high yang diturunkan dari dua advisory tooling (`GHSA-86w9-cpqp-85rv`, `GHSA-vfj7-8cjw-p6xm`); tidak ada perubahan dependensi pada PR ini. Lihat [dependency-security.md](dependency-security.md). Artefak runtime dan Composer diaudit terpisah.
- Tidak menjalankan ulang load test, menguji provider push/SMTP eksternal, melakukan UAT dengan calon pembeli, atau mengukur konversi/Core Web Vitals komparatif. Persona adalah hipotesis desain dari brief pengguna. Gate produksi yang sudah ada tetap berlaku.

## Rilis dan rollback

Tidak ada migrasi, impor data produksi, perubahan dependensi, atau GitHub Actions. Rilis membutuhkan backend dan frontend dari revisi yang sama agar endpoint ringkasan/filter tersedia. Revert PR dan deploy ulang kedua aplikasi untuk rollback; jangan menjalankan down migration atau mengembalikan database. PR tidak mengotorisasi merge/deploy.
