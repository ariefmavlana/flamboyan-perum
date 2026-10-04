# Validasi workspace operasi

2026-10-03 · Windows · branch `codex/operations-workspace`, bergantung pada PR #3. Tidak memakai GitHub Actions. Seluruh perintah memakai runtime lokal private PHP8.4.26/Node24.21.0; Composer platform tetap PHP8.3. File runtime/fixture/password tidak di-commit.

| Perintah | Hasil | Cakupan / batas |
|---|---|---|
| `vendor/bin/pint --test` | passed | Seluruh backend |
| `php artisan test` SQLite |32 tests /167 assertions passed | Seluruh fondasi +14 test operasi |
| `php artisan test` PostgreSQL17.9 |32 tests /167 assertions passed | Cluster isolated127.0.0.1:54329, DB flamboyan_foundation_test; port55432 kini reserved Windows |
| `composer validate --strict` / `composer audit` | valid /0 advisories | Lock unchanged |
| `php artisan route:cache` / `route:clear` | passed | Protected/auth/recovery routes |
| `npm run lint` | passed /0 warnings | ESLint termasuk tests |
| `npm run typecheck` | passed | Nuxt strict TS |
| `npm test` |5 passed | WA/KPR kernel regression |
| `npm run test:e2e` |5 flows passed | SSR/canonical404/CSRF, mobile discovery, session drawer/notes/logout, Admin catalog/lead/assign/users→Marketing pipeline/profile, recovery UI |
| `npm run build` | passed | SSR artifact, upstream DEP0155 tetap tercatat |
| `npm audit --json` |11 high,0 moderate/critical | Source termasuk dev; exit1, dua root advisories di dependency-security.md |
| `npm run audit:runtime` |0 vulnerabilities | Lock generated hanya pada ignored .output/server |

Backend mencakup Admin user CRUD/version/email dedup/last-admin, workload guard, owner transfer/stale/role/404, profile current-password/session revoke, generic recovery/expiry/single-use/verified-active/throttle/production mail gate/legacy email case, security stamp dan logout current-device, contact correction/dedup/version. Fault injection membuktikan account/contact update rollback ketika audit/history gagal. Test backend bypass CSRF secara framework; browser membuktikan HTTP cookie/CSRF pada server local.

Browser fixture adalah SQLite khusus yang sudah dimigrasi, opt-in demo password private, API `artisan serve --no-reload`, Chrome terpasang melalui PLAYWRIGHT_EXECUTABLE. Test menambahkan properti/lead/akun demo; tidak menunjuk data bisnis. UI mempunyai native dialog/focus/Escape, label, loading/empty/error, bounded search/pagination. Screenshot katalog360px ditinjau: halaman tidak overflow, tabel memiliki scroll container. Belum audit WCAG lengkap/UAT dengan konten nyata.

Red→green: lima test awal gagal404 sebelum endpoint tersedia; lalu lulus. Browser mendeteksi query q kosong yang diubah Laravel menjadi null, handler template multiline yang tidak dapat dikompilasi, dan label select yang bercampur option text; semuanya diperbaiki. Test fondasi sekarang memilih baris Prospek Demo secara eksplisit agar stabil ketika fixture berisi lead tambahan.

## Migrasi dan rollback

Migration `2026_10_03_000002_create_operations_audit`: preflight duplikasi LOWER(email) sebelum perubahan schema, users.version default1, unique LOWER(email), activity_logs indexed(subject_type,subject_id,id), FK actor restrict. Selesaikan duplikat legacy melalui prosedur manual audited sebelum migrate; tidak menormalkan/menghapus akun diam-diam. Backup DB konsisten sebelum migrate. API tidak menawarkan edit/delete audit. Rollback aplikasi memakai artefak F0 sebelumnya dengan schema tambahan tetap ada; jangan blind migrate:rollback karena menghapus audit. Bila schema harus dipulihkan, maintenance+restore snapshot yang diuji.

Recovery membutuhkan FRONTEND_URL trusted dan SMTP nyata; log/array mailer ditolak di produksi. Account email verified hanya setelah attestation identitas Admin; tidak mengklaim SMTP ownership challenge otomatis. Actual mail delivery, PHP8.3/Linux, hosting/domain/provider/production load, media/push/compare/KPR UI/CMS/report/privacy belum dibuktikan tahap ini. Kandidat hosting Hostinger/Rumahweb dan nomor sementara6287776734038 merupakan input pengguna, bukan bukti readiness hosting.

Sesi legacy tanpa account_security_stamp harus login ulang setelah upgrade; stamp stale ditolak tanpa mengganti stamp perangkat aktif lainnya. Logout biasa hanya current device. Backend checks terakhir:32 tests/167 assertions masing-masing SQLite dan PostgreSQL.
