# Bukti implementasi growth

Status 17 Oktober 2026: kode growth tersedia pada branch `codex/growth-acquisition-implementation`. Hasil lokal ada di bawah; keputusan review dan bukti Vercel untuk SHA release final dicatat di [PR #45](https://github.com/ariefmavlana/flamboyan-perum/pull/45). Ini bukan deklarasi produksi aktif. [Traceability](implementation-traceability.md) mencakup 146 requirement unik. IMPLEMENT_NOW adalah lingkup delivery, bukan tanda seluruh gate eksternal lulus.

## Hasil yang telah dibuktikan

- Backend intake allowlist, generic receipt, HMAC relay, idempotency, Admin reconciliation, role scope, concurrency version, qualification/visit/akad, manual source, dua cohort laporan, serta privacy/retention.
- Nuxt BFF allowlist portable, bounded body/header forwarding, consent default denied, first/last context, pageview SPA bersih, one-receipt form event dan private-route suppression.
- Canonical pagination/tracking/filter, noindex Banjaran dan preview, sitemap public allowlist dan lastmod harga efektif WIB.
- Form website dan WhatsApp tetap dua jalur; alur nyata lokal melalui session/CSRF berhasil dari form sampai konfirmasi akad. Konfirmasi future attendance ditolak. Tidak ada spend, akun iklan resmi, upload kontak atau production seed.

## Runtime dan perintah

Windows, PHP 8.5.11, PostgreSQL 17 lokal terisolasi port 15533, Node 24.21.0; browser Edge Chromium. Tidak menggunakan GitHub Actions.

| Pemeriksaan | Bukti saat ini |
| --- | --- |
| PHPUnit SQLite | 157 tes / 1.250 assertion lulus, 23,780 detik; termasuk regresi fail-closed preview dan retensi resolved/lead anonim |
| PHPUnit PostgreSQL | 157 tes / 1.250 assertion lulus, 26,598 detik; cluster test lokal kemudian dihentikan |
| Unit frontend | 20 file, 89 tes lulus, 1,87 detik; termasuk kunci idempotency 128 bit dan identitas OIDC server-only |
| Browser SSR fixture | Sembilan tes consent/intake/mobile/role/routing/CRM→akad/event 503→202 lulus dalam satu run final, 21,6 detik |
| Nuxt build | `build:checked` lulus: lint, typecheck, unit, node-server SSR (3,73 MB / 978 kB gzip) |
| Pint, lint, typecheck | Pint full lulus; lint dan typecheck lulus dalam `build:checked` |
| Composer validate/audit | Strict validate lulus; advisories/abandoned kosong |
| npm audit source | 11 high pada toolchain existing; SDK resmi `@vercel/oidc` 4.0.1 ditambahkan untuk identitas preview dan tidak menambah advisori |
| npm audit runtime | 0 setelah lock audit dibuat hanya di `.output/server` yang diabaikan Git |

Perintah standar: `php vendor/bin/pint --test`, `php vendor/bin/phpunit`, `composer validate --strict`, `composer audit`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit`, dan audit `.output/server --omit=dev`. Build produksi memerlukan NUXT_API_BASE eksplisit. PostgreSQL memakai DB_URL kosong, database lokal test dan kredensial runtime; tidak pernah memakai DB produksi untuk PHPUnit. Browser fixture GTM di-stub, tidak mengirim event provider nyata. Sandbox Windows sempat membuat is_readable PHP false dan rename cache Vitest EPERM; pengujian diulang dengan izin eksekusi lokal dan lulus, bukan dianggap tes aplikasi gagal.

Pemeriksaan visual formulir desktop 1440px dan seluler 390px juga dijalankan pada browser nyata: tidak ada overflow horizontal atau JavaScript page error; form dan kontrol tampil. Satu pengulangan route-auth sempat menerima 502 karena proses API fixture lokal sudah berhenti, kemudian lulus setelah API dihidupkan ulang; run gabungan sembilan tes di atas memakai kedua proses aktif.

## Risiko dependensi yang tetap terbuka

11 temuan source berasal dari rantai braces dan node-forge yang existing. Advisory resmi [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) dan [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) belum menyediakan patched version saat pemeriksaan. Bundle node-server yang dibangun tidak memuat kedua paket dan audit runtime 0. Ini pembatasan hasil audit, bukan klaim source audit bersih; jangan menjalankan tooling build terhadap glob/input tidak tepercaya. Tidak melakukan downgrade Nuxt otomatis yang merombak versi/framework.

## Gate terbuka dan batas klaim

Preview Vercel harus membuktikan project/branch/SHA sama, schema Supabase dan prefix R2 terpisah, serta browser/auth/form/media/CRM. Prosedur dan persetujuan akses minimum ada di [runbook preview](preview-isolation-runbook.md). Kelulusan lokal tidak menggantikan bukti Vercel.

Trust provider yang dipakai hanya proyek `flamboyan-web` preview → `flamboyan-api` preview, menggunakan OIDC resmi dan pin hostname API immutable. Aturan existing dipertahankan, tidak ada public protection override, tidak ada grant ke environment produksi, dan tidak ada token API statis di konfigurasi aplikasi. Sesi uji browser memakai cookie terbatas host di memori dan tokennya wajib dicabut setelah tes. Deployment ID/SHA, hasil uji Supabase/R2, serta bukti pencabutan token browser dicatat pada PR untuk versi yang benar-benar diuji.

Belum ada akun/tag resmi, Keyword Planner/CPC aktual, billing/tax/net budget, pengesahan privacy/controller/retention/jam layanan, domain resmi/GSC/GBP, atau trafik untuk field CWV/ranking/lead/akad. Kesiapan kode tidak menandai gate tersebut selesai. Hostinger belum dibeli/dikonfigurasi; Node SSR+PHP runtime, TLS pooler, scanner, scheduler/worker, SLA dan resource SKU harus dibuktikan sebelum membeli. Konflik target notifikasi ≤5 detik vs cron shared ≤120 detik tetap keputusan arsitektur eksternal, bukan silently waived.

## Review dan rollback

Review independen menemukan dan memperbaiki unsigned POST, nullable DTO, idempotency crypto fallback/entropi, hilangnya form event, aturan waktu/terminal kunjungan, privacy preference, urutan redaksi attribution resolved, guard boot preview dan query lintas database. Kelulusan final memerlukan read-only review serta thermo-nuclear full-diff dengan hash stabil; verdict lengkap dan hash final disimpan di PR sehingga menunjuk change set yang tepat tanpa siklus hash dokumen sendiri.

Rollback aplikasi: matikan growth flags dan deploy commit sebelumnya; tabel migrasi aditif dipertahankan. Jangan drop tabel berisi inquiry/histori. Isolasi preview dapat dihentikan dengan menonaktifkan gate/alias; penghapusan schema/prefix tidak otomatis dilakukan. Semua perubahan pengguna di `.commandcode` dikecualikan dari commit.

Rollback akses Vercel: cabut hanya rule Trusted Sources web-preview→API-preview yang ditambahkan untuk rehearsal, menggunakan salinan non-rahasia keadaan sebelumnya dan pemeriksaan perubahan serentak. Jangan mereset seluruh aturan proyek. Nonaktifkan `NUXT_API_PREVIEW_OIDC` dan hapus pin host sebelum cutover ke Hostinger; kebutuhan HTTPS dan same-origin BFF tetap berlaku.
