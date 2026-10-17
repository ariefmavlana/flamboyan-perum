# Bukti implementasi growth

Status 17 Oktober 2026: implementasi dan verifikasi berlangsung pada branch `codex/growth-acquisition-implementation`; belum dinyatakan selesai atau siap produksi. [Traceability](implementation-traceability.md) mencakup 146 requirement unik. IMPLEMENT_NOW adalah lingkup delivery, bukan tanda semua gate sudah lulus.

## Hasil yang telah dibuktikan

- Backend intake allowlist, generic receipt, HMAC relay, idempotency, Admin reconciliation, role scope, concurrency version, qualification/visit/akad, manual source, dua cohort laporan, serta privacy/retention.
- Nuxt BFF allowlist portable, bounded body/header forwarding, consent default denied, first/last context, pageview SPA bersih, one-receipt form event dan private-route suppression.
- Canonical pagination/tracking/filter, noindex Banjaran dan preview, sitemap public allowlist dan lastmod harga efektif WIB.
- Form website dan WhatsApp tetap dua jalur; alur nyata lokal melalui session/CSRF berhasil dari form sampai konfirmasi akad. Konfirmasi future attendance ditolak. Tidak ada spend, akun iklan resmi, upload kontak atau production seed.

## Runtime dan perintah

Windows, PHP 8.5.11, PostgreSQL 17 lokal terisolasi port 15533, Node 24.21.0; browser Edge Chromium. Tidak menggunakan GitHub Actions.

| Pemeriksaan | Bukti saat ini |
| --- | --- |
| PHPUnit SQLite | Suite 148 tes / 1.194 assertion lulus sebelum tambahan regresi SEO/pagination/isolation terakhir; final suite harus diperbarui |
| PHPUnit PostgreSQL | Suite 148 tes / 1.194 assertion lulus pada cluster test lokal, kemudian dihentikan; final suite harus diperbarui |
| Unit frontend | 18 file, 74 tes lulus; final sesudah lint/format harus diperbarui |
| Browser SSR fixture | Enam tes consent/intake/role/routing lulus; dua live tests alur CRM dan event 503→202 lulus |
| Nuxt build | node-server SSR berhasil; final build sesudah SEO/routing terakhir masih wajib |
| Pint, lint, typecheck | Telah dijalankan pada WIP; final full checks sebelum freeze wajib |
| Composer validate/audit | Strict validate lulus; advisories/abandoned kosong |
| npm audit source | 11 high pada toolchain existing; tidak ada perubahan dependency/lockfile pada paket ini |
| npm audit runtime | 0 setelah lock audit dibuat hanya di `.output/server` yang diabaikan Git |

Perintah standar: `php vendor/bin/pint --test`, `php vendor/bin/phpunit`, `composer validate --strict`, `composer audit`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit`, dan audit `.output/server --omit=dev`. Build produksi memerlukan NUXT_API_BASE eksplisit. PostgreSQL memakai DB_URL kosong, database lokal test dan kredensial runtime; tidak pernah memakai DB produksi untuk PHPUnit. Browser fixture GTM di-stub, tidak mengirim event provider nyata. Sandbox Windows sempat membuat is_readable PHP false dan rename cache Vitest EPERM; pengujian diulang dengan izin eksekusi lokal dan lulus, bukan dianggap tes aplikasi gagal.

## Risiko dependensi yang tetap terbuka

11 temuan source berasal dari rantai braces dan node-forge yang existing. Advisory resmi [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) dan [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) belum menyediakan patched version saat pemeriksaan. Bundle node-server yang dibangun tidak memuat kedua paket dan audit runtime 0. Ini pembatasan hasil audit, bukan klaim source audit bersih; jangan menjalankan tooling build terhadap glob/input tidak tepercaya. Tidak melakukan downgrade Nuxt otomatis yang merombak versi/framework.

## Gate terbuka dan batas klaim

Preview Vercel harus membuktikan project/branch/SHA sama, schema Supabase dan prefix R2 terpisah, serta browser/auth/form/media/CRM. Prosedur dan persetujuan akses minimum ada di [runbook preview](preview-isolation-runbook.md). Kelulusan lokal tidak menggantikan bukti Vercel.

Belum ada akun/tag resmi, Keyword Planner/CPC aktual, billing/tax/net budget, pengesahan privacy/controller/retention/jam layanan, domain resmi/GSC/GBP, atau trafik untuk field CWV/ranking/lead/akad. Kesiapan kode tidak menandai gate tersebut selesai. Hostinger belum dibeli/dikonfigurasi; Node SSR+PHP runtime, TLS pooler, scanner, scheduler/worker, SLA dan resource SKU harus dibuktikan sebelum membeli. Konflik target notifikasi ≤5 detik vs cron shared ≤120 detik tetap keputusan arsitektur eksternal, bukan silently waived.

## Review dan rollback

Review independen WIP menemukan dan memperbaiki unsigned POST, nullable DTO, idempotency crypto fallback, hilangnya form event, aturan waktu/terminal kunjungan, privacy preference dan query lintas database. Final read-only review serta thermo-nuclear full-diff dengan hash stabil masih wajib sebelum status selesai.

Rollback aplikasi: matikan growth flags dan deploy commit sebelumnya; tabel migrasi aditif dipertahankan. Jangan drop tabel berisi inquiry/histori. Isolasi preview dapat dihentikan dengan menonaktifkan gate/alias; penghapusan schema/prefix tidak otomatis dilakukan. Semua perubahan pengguna di `.commandcode` dikecualikan dari commit.
