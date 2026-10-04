# Validasi operasi situs — 2026-10-05 WIB

## Hasil dan source

Web https://flamboyan-web.vercel.app dan API https://flamboyan-api.vercel.app berjalan pada Supabase PostgreSQL/R2 privat. Source aplikasi1868e5a (branch codex/site-operations) sudah dirilis melalui push Git, bukan upload CLI. Tidak ada upgrade, Pro trial, GitHub Actions, migration baru, atau dependency baru. PR tetap menuju main; tidak merge tanpa instruksi pengguna. Production branch Vercel kedua project sekarang codex/site-operations, sehingga push branch itu memperbarui alias setelah checks lulus. Main belum memuat perubahan ini; jangan mengganti tracking ke main sebelum PR diintegrasikan.

Perubahan konten CMS tidak memerlukan commit/deploy: simpan konten, lakukan attestation, publikasikan; SSR membaca database. Katalog/properti, penugasan CRM, histori, notifikasi dan CMS memakai backend nyata; tidak ada fallback data hardcoded.

## Validasi lokal

Windows, PHP8.4.26+GD, Node24.21.0, PostgreSQL17.9. Waktu berikut dari log .tools yang tidak di-commit.

| Perintah | Hasil | Durasi |
|---|---|---|
| php vendor/bin/pint --test | lulus | 0.96s |
| php artisan test (SQLite :memory:) |86 tes/637 assertion lulus |9.23s wall;8.39s suite |
| php artisan test (PostgreSQL test vercel_fix_tests, port15533) |86 tes/637 assertion lulus |16.55s suite |
| composer validate --strict |lulus |1.31s |
| composer audit |0 advisory |4.22s |
| npm run lint |0 warning |4.16s |
| npm run typecheck |lulus |6.68s |
| npm test |15 unit lulus |1.24s wall |
| npm run build |lulus |11.91s |
| npm audit --json (source) |exit1,11 high dari dua advisory upstream tooling |2.83s |
| npm install --package-lock-only --ignore-scripts --prefix .output/server; npm audit --prefix .output/server --omit=dev --json |runtime0 advisory |9.22s +1.00s |

PostgreSQL memakai database dan credential test terpisah; cluster dihentikan setelah suite. Tidak menjalankan RefreshDatabase pada Supabase. Source advisories tetap tercatat di dependency-security.md; tidak melakukan downgrade paksa, fork atau suppression. Entry-point test yang diubah diuji ulang terarah3tes/6assertion; full suite terbaru juga lulus pada runtime cloud.

## Bukti CI/CD

Push c6b7553 otomatis membuat Preview untuk kedua project; web lulus. Pipeline API memblokir build karena cache autoload native. Push bb8d56c mengatasi cache proses utama tetapi pengujian terisolasi masih menemukan origin Sanctum cloud dan cache nested process. Keduanya diperbaiki pada1868e5a; tidak menonaktifkan tes atau menandai build gagal sebagai berhasil. CLI PHP pada build mematikan opcache.enable_cli untuk semua subprocess; production function tetap memakai konfigurasi runtime normal.

Pada1868e5a, API native PHP8.5.2 menjalankan Pint,86tes/637assertion, Composer validate/audit, menghapus30 dev packages, dan migrate --force --isolated (Nothing to migrate). Build28s, deployment READY. Web npm ci/lint/typecheck/15unit/build46s, READY. Deployment IDs API dpl_HfJBLof13zLaDC33FypCeyt9SdYV dan web dpl_24DNnvPkYgwLvYX5UYce4ctLEUdX; metadata Git commit/ref cocok. Kedua alias production menunjuk build sukses. Build yang gagal tidak mengganti API lama.

Pipeline memakai native Vercel Git; tidak ada workflow Actions atau worker komputer. Forward migrations production dijalankan setelah checks; Preview tidak memigrasi database. Web/API tidak dirilis atomik, jadi migration selanjutnya wajib kompatibel dengan dua versi. Branch baru dari main terbaru dan PR tetap aturan perubahan; pengaturan production branch ini adalah release sementara hingga integrasi main diotorisasi.

## Browser cloud

Chrome terpasang dikendalikan Playwright dengan sesi sendiri, memakai public origin yang sama seperti client. Suite inti7kelompok lulus54.6s, tanpa pageerror:

- Admin login UI/reload; Marketing login/session aktual.
- Anonymous401; Marketing403 pada CMS/users/reports/audit dan404 pada properti milik orang lain.
- Marketing membuat/mengedit properti, upload foto→READY tanpa worker lokal, foto baru menghasilkan3varian, publish media/properti, file WebP200, public allowlist tidak memuat owner, stale version409, dan unpublish404.
- Admin membuat akun/attestation; membuat lead, assignment/notifikasi persisten, reassignment menghilangkan akses Marketing lama; seluruh pipeline sampai DEAL dan terminal/stale409; histori minimal8entry dan tidak memiliki route edit.
- Hero diedit lewat UI; verifikasi reset saat teks berubah; perubahan muncul pada SSR; stale409 dan teks asli dipulihkan.
- TESTIMONIAL/BANK_RATE/BANK_PARTNER buat/edit/draft, publish tanpa attestation422, publish eligible masuk public API, unpublish hilang; logo diunggah lewat UI, dibaca image/webp dari R2, path private tidak bocor, setelah unpublish404.
- Beranda/katalog/kawasan/panduan/konsultasi dan workspace laporan/katalog/konten/akun terbuka tanpa narasi lama; reports/operations/notifikasi200; readiness200 dan logout UI berhasil.

Suite publik tambahan4kelompok lulus:12foto katalog mobile seluruhnya termuat, SSR katalog, detail3foto+1denah, simulasi fixed/floating dan DP penuh, sitemap/robots private route, readiness database/R2/queue. Integrity check read-only flamboyan:media-verify memeriksa363varian termasuk3file fixture, missing0/missing_published0.

Fixture pemeriksaan pertama (1properti,1lead,1akun,4CMS) dipensiunkan melalui transaksi terkontrol setelah snapshot privat, hanya ID/nama/slug pengujian yang dibuat sesi ini. Katalog awal24properti/16publik dan72leads dipertahankan. Audit cleanup disimpan. Objek R2 fixture dihapus sesuai path metadata;360varian awal tidak disentuh. Pengujian lanjutan dan hasil final dicatat di bawah setelah selesai.

## Narasi, data dan batas

Atas instruksi pengguna, narasi yang ditampilkan dibersihkan dari label lama, termasuk nama, slug fixture, alt, keterangan, CMS dan teks gambar ilustrasi. Atribusi Unsplash serta label ilustrasi dipertahankan.3testimonial persona/3rate sintetis draft, bukan klaim pelanggan/bank. Ini pemeliharaan data ilustratif terkontrol dengan snapshot privat/audit; catatan histori sintetis dibersihkan pada CLI, bukan melalui API edit histori. ID/order/status/actor/timestamp histori awal dipertahankan. Nama resource provider yang sudah dibuat tidak diganti.

Email recovery/verification masih mail log, scanner PDF belum tersedia (fail closed), push realtime nonaktif (notifikasi aplikasi memakai polling), dan backup terjadwal/restore cloud belum dikonfigurasi. Tidak menyatakan seluruh gate layanan client komersial terpenuhi. Tetap Free/Hobby dan kuota dashboard perlu dipantau; batas ketentuan Hobby personal/noncommercial berlaku. Tidak ada secret/snapshot/database/upload/tooling lokal yang di-commit.

Referensi: https://vercel.com/docs/git, https://github.com/vercel-community/php, docs/vercel-demo-deployment.md, docs/API_DOCS.md.

## Perbaikan sesi inactive dan putaran akhir

Uji tambahan menemukan dua kasus berbeda: stamp sesi inactive masih tersisa setelah403, dan error login dari proxy berakhir sebagai HTML200. Regresi test_inactive_account_denial_also_clears_the_stale_login_session gagal sebelum fix (stamp masih tersisa). ActiveUser sekarang logoutCurrentDevice/invalidate/regenerateToken sebelum403; security stamp mismatch401 tetap sama. Pint dan suite ulang87tes/640assertion lulus: SQLite8.70s, PostgreSQL15.38s; cluster test dihentikan lagi. Ini perubahan perilaku auth, bukan sekadar penyesuaian assertion browser. Probe langsung API422 dibanding proxy web200 membuktikan masalah kedua berasal dari H3 proxy yang membuang Accept; Laravel web validation lalu mengalihkan ke Referer. bootstrap/app.php sekarang memperlakukan auth/* sebagai endpoint JSON, sama seperti api/*. Regresi auth-errors dengan Accept:text/html gagal302 pada code lama, kemudian full suite88tes/655assertion lulus pada SQLite8.88s dan PostgreSQL16.20s. Uji cloud pascadeploy memastikan422 pada login gagal, login akun inactive dan recovery invalid.

## Hasil final cloud

Source aplikasi198acc1 berhasil melalui push Git ke production tracking codex/site-operations. API deployment dpl_DFYDkTGpduEmczt5ni9p8AuCaioc menggunakan PHP8.5.2: Pint,88tes/655assertion, Composer validate/audit0, removal dev tools dan migrate(Nothing to migrate) lulus, build28s/READY. Web dpl_Cao29NiqMLGKZTA7Zb6Rpxevw9C3 juga READY. Probe invalid login API langsung dan host web sama-sama422 application/json; tidak ada redirect HTML200.

Putaran ulang inti7kelompok (2026-10-04T19:14:22Z–19:15:10Z,47.6s) lulus tanpa pageerror; mencakup route workspace yang benar: profil, operasi dan privasi selain laporan/katalog/CMS/akun.6kelompok tambahan lulus: Marketing login/reload/katalog/denialCMS/logout, login salah tetap di halaman login dengan error, deactivation mencabut sesi401 dan login akun inactive422, notifikasi read persisten dan recipient lain404, seluruh gambar beranda benar-benar termuat, serta katalog16public/CRM72 tetap utuh setelah fixture cleanup. Foto ilustrasi/atribusi ditinjau pada screenshot desktop dan mobile privat di .tools.

Audit artefak preset Vercel aktual: npm install --package-lock-only --ignore-scripts --prefix .vercel/output/functions/__fallback.func lalu npm audit --prefix .vercel/output/functions/__fallback.func --omit=dev --json,0advisory. Ini tambahan terhadap audit source11high yang tetap terbuka, tidak menghapus hasil source.

Seluruh akun/properti/lead/CMS pengujian tambahan dipensiunkan terkontrol dengan snapshot privat bertimestamp/audit; data awal24properties/72leads/4users dan queue0 tetap utuh. Read notification yang diuji menggunakan akun Admin tetap tersimpan. Tidak ada scanner PDF, SMTP atau backup terjadwal yang diklaim sudah aktif. PR#18 menuju main; main tidak di-merge. Dokumen akhir tidak mengubah source aplikasi198acc1.
