# Bukti validasi fondasi

Tanggal 2026-10-03, local Windows. Branch `feat/project-foundation`.

| Check | Hasil lokal | Cakupan / batas |
|---|---|---|
| Source archive | SHA256 sama dengan original | `.gitattributes -text` mempertahankan bytes arsip |
| PHPUnit PHP8.4.26/SQLite |18 tests,95 assertions passed | Public allowlist/hidden404, scoped role/owner, phone+duplicate, assignment/version/status/terminal, immutable API history, notifications/read-idempotency, transaction rollback, session auth/bearer rejection, seed production guard |
| Pint |passed | Formatter Laravel |
| Composer validate strict |passed | Lock/schema valid, platform PHP8.3 |
| Composer audit |0 advisories | Versi lock saat review |
| Laravel migrate/cache |passed | SQLite migration, route:cache dan clear |
| Nuxt typecheck |passed | Strict TS; Nuxt/Vue router versions aligned |
| ESLint |passed,0 warnings | `--max-warnings 0` |
| Vitest |5 tests passed | WA encoding/invalid config, annuity zero-rate/full-DP/rounding/bounds |
| Playwright local Chrome |3 flows passed | SSR+canonical+404+missing-CSRF419, hydrated mobile navigation/list/layout, cookie login/history/notes/Escape/logout |
| SSR build |passed | Nuxt4.5.2/Nitro2.13.4/Vue3.5.43/Node24.21.0 |
| Raw HTML HTTP |200 content+canonical | Development port3000 dan built artifact port3001 |
| Screenshots |Reviewed desktop/mobile | Layout smoke, belum audit WCAG lengkap/UAT real content |
| Runtime artifact npm audit |0 advisories | Generated `.output/server` dependency lock audit |
| Source npm audit |11 high entries,2 root advisories | Upstream node-forge/braces tanpa patch; draft PR+security gate; jangan klaim all-green |
| Build warnings |1 upstream DEP0155 | Vue/Nitro trailing-slash exports mapping; bukan warning aplikasi yang disembunyikan |
| CI PostgreSQL/PHP8.3+8.4 |Configured | Hasil GitHub CI dicatat setelah PR, tidak diasumsikan dari local SQLite |

Red→green: sebelum migrations/routes/domain implementasi, suite fondasi gagal pada kolom role dan route missing. Setelah implementasi dan regression fixes, seluruh18 backend tests lulus. E2E awal mendeteksi input sebelum hydration dan origin Sanctum lokal; form ready gate dan konfigurasi origin memperbaiki reproduksi. Scope/duplicate/concurrency assertions menguji kontrak bisnis, bukan hanya snapshot implementasi.

Tidak dijalankan: actual deployment shared hosting, load/SLO, restore DB/media produksi, provider push, accessibility audit lengkap, account recovery, media uploads dan business UAT. Keputusan/gate tercatat pada PRD/SRS/runbook/status; bukan fitur yang diklaim telah selesai.
