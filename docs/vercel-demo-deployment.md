# Deployment Flamboyan: Vercel + Supabase + Cloudflare R2

## Rilis melalui main

Production branch kedua project harus `main`. Perubahan aplikasi memakai branch baru dari main terbaru, validasi lokal, PR, kemudian merge yang diotorisasi pengguna; push/merge ke main memicu Vercel Git deployment otomatis. Tidak menggunakan GitHub Actions. Backend menjalankan Pint, PHPUnit SQLite terisolasi, Composer validate/audit sebelum install production dan migrasi aditif; frontend buildCommand `npm run build:checked`, installCommand `npm ci` menjalankan lint/typecheck/unit/build. Validasi PostgreSQL/browser/audit source dilakukan lokal dan dicatat pada PR; tidak mengklaim pemeriksaan itu ada dalam Vercel build.

`VERCEL_RUN_MIGRATIONS=1` hanya production; APP_ENV=production; test build memakai database SQLite in-memory dan cache terpisah, tidak memakai database Supabase. Test dibangun dengan CLI opcache dinonaktifkan agar perubahan autoload native runtime tidak tertahan cache bytecode. Git project root tetap apps/api dan apps/web. Jangan mengembalikan production branch ke branch fitur atau memakai helper lama yang mengubah APP_ENV menjadi local.

Perubahan isi Admin/CMS tersimpan langsung di Supabase/R2 dan tidak membutuhkan commit/deploy. Katalog brosur diimpor melalui API yang telah terdeploy setelah migrasi, memakai upload media private dan audit; bukan DemoSeeder produksi. Snapshot privat sebelum impor menjaga konfigurasi harga/katalog lama. Archive katalog lama mempertahankan referensi72lead. Rollback source melalui PR revert ke main dan redeploy; unpublish/restore isi via API versi terbaru bila diperlukan. Kolom aditif dipertahankan saat rollback agar konfigurasi komersial tidak hilang; jangan menjalankan down migration atau reseed produksi otomatis.

Situs: https://flamboyan-web.vercel.app. Backend: https://flamboyan-api.vercel.app. Nuxt SSR dan Laravel API memakai project Vercel berbeda, root apps/web dan apps/api. Data, session, cache dan antrean berada di PostgreSQL Supabase; file berada di bucket R2 privat. Tidak ada state persisten pada filesystem function.

## Konfigurasi

Web memakai NUXT_API_BASE menuju API, secret NUXT_API_PROXY_SECRET sama dengan API_PROXY_SECRET, NUXT_ALLOWED_HOSTS/NUXT_PUBLIC_SITE_URL sesuai host web, serta proxy same-origin untuk /api, /auth, /sanctum, /media dan /up. Cookie host-only/secure menjaga login Admin/Marketing pada satu origin. API memakai APP_ENV=production, APP_DEBUG=false, trusted host eksplisit, secure session, DB sslmode=require, MEDIA_DISK_DRIVER=s3 dan endpoint R2. Kunci hanya berada di environment encrypted provider atau berkas lokal yang diabaikan Git.

Vercel memakai runtime komunitas vercel-php@0.9.0. Paket native aktual @libphp/almalinux-9-v85@0.0.3 menyediakan GD/WebP; unggah logo cloud berhasil. Daftar ekstensi contoh yang sebelumnya dipakai sebagai dasar asumsi tanpa GD tidak mewakili deployment aktual. Runtime komunitas dapat berubah; uji ulang upload saat runtime diperbarui.

MEDIA_PROCESS_IN_REQUEST=true memproses satu job gambar setelah commit upload/retry. Editor media melanjutkan satu job per polling10s selama PROCESSING; antrean tetap durable di database. Mode default false tetap memerlukan worker persisten. Logo CMS diproses langsung pada request. PDF brosur tetap FAILED/SCANNER_UNAVAILABLE bila scanner malware tidak tersedia; jangan melewati pemeriksaan scanner.

VIEW_COMPILED_PATH dan cache config/route/events/services/packages diarahkan ke /tmp. Media remote dibaca melalui temporary file dan dibersihkan setelah response. Bucket tidak dibuka publik; endpoint memeriksa publikasi properti/media atau scope staff setiap request.

## CI/CD tanpa GitHub Actions

Kedua project terhubung repository ariefmavlana/flamboyan-perum melalui Vercel Git. Push membuat deployment dengan pemeriksaan build; hanya build yang sukses mengganti alias. Production branch awal main; konfigurasi branch aktif dan bukti push ada di site-operations-validation.md. Branch lainnya membuat Preview. Tidak ada reseed di build atau runtime.

Web: npm ci lalu npm run build:checked (lint, typecheck, unit, build). API: builder Composer menjalankan scripts/vercel-build.php setelah install production. Script memakai SQLite :memory: dan storage lokal/array untuk pengujian, tidak database/R2 cloud. Pint,PHPUnit, Composer validate/audit wajib sukses; dev dependencies dihapus kembali sebelum bundling. VERCEL_RUN_MIGRATIONS=1 production menjalankan migrate --force --isolated setelah validasi; Preview tidak memigrasi shared database. Gunakan migration forward compatible karena web/API deploy terpisah dan schema dapat maju sebelum alias baru aktif.

Workflow perubahan: branch baru dari main terbaru → commit Conventional Commit → push → PR → validasi lokal lengkap → review → merge hanya dengan instruksi pengguna. Full test PostgreSQL/browser dan source/runtime audit tetap gate PR lokal. Perubahan konten CMS langsung tersimpan dan tampil tanpa Git/deploy.

## Verifikasi dan rollback

Buka /up dan /ready di API; uji SSR katalog/detail, image/webp dari R2, Admin/Marketing login/reload/logout, scope404/403, CRM/version/history/notifikasi, semua jenis CMS dan upload. Jalankan flamboyan:media-verify sebelum membagikan situs. Jangan menjalankan PHPUnit terhadap database cloud: RefreshDatabase menghapus tabel.

Rollback memakai deployment Vercel sebelumnya pada web dan API. Schema maju tidak otomatis di-rollback; ambil backup sebelum migration berisiko dan gunakan perbaikan forward. Perubahan ini tidak menambah migration. Snapshot privat sebelum pembersihan narasi berada di .tools; jangan commit snapshot/credential, jangan restore data di atas perubahan baru tanpa review.

## Batas penggunaan

Tetap paket Free/Hobby; tidak ada upgrade atau Pro trial. Hobby diperuntukkan penggunaan personal/noncommercial menurut ketentuan Vercel, sehingga presentasi portofolio tidak berarti izin hosting layanan client komersial. Supabase Free dapat pause saat tidak aktif; buka dan periksa readiness sebelum presentasi. R2 memiliki kuota gratis, bukan janji biaya nol tanpa batas. Pantau dashboard quota masing-masing provider.

Email recovery/verification masih mail log sampai SMTP nyata dihubungkan; Admin dapat membuat/verifikasi akun melalui workflow berizin. Notifikasi aplikasi memakai polling dan tersimpan, realtime push belum diaktifkan. Backup terjadwal/restore terpantau dan scanner PDF belum tersedia pada topologi ini. Data masih ilustratif; menghapus kata "demo" tidak mengubahnya menjadi penawaran atau bukti bisnis nyata. Seed sintetis tetap opt-in local/testing dan dilarang production/staging.

Sumber: https://vercel.com/docs/git, https://vercel.com/docs/git/vercel-for-github, https://github.com/vercel-community/php, https://vercel.com/docs/plans/hobby, https://supabase.com/pricing, https://developers.cloudflare.com/r2/pricing/.
