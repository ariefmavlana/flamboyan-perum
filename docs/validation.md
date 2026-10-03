# Bukti validasi fondasi

Tanggal 2026-10-03, local Windows. Branch `fix/foundation-validation`, fix aplikasi/dependensi commit `b5468a2`. Seluruh pemeriksaan aplikasi di bawah dijalankan ulang setelah update Vitest4.1.11; dokumentasi berikutnya tidak mengubah kode atau lockfiles. GitHub Actions tidak digunakan.

| Check | Hasil lokal | Cakupan / batas |
|---|---|---|
| Source archive | SHA256 sama dengan original | `.gitattributes -text` mempertahankan bytes arsip |
| PHPUnit PHP8.4.26/SQLite |18 tests,95 assertions passed | Public allowlist/hidden404, scoped role/owner, phone+duplicate, assignment/version/status/terminal, immutable API history, notifications/read-idempotency, transaction rollback, session auth/bearer rejection, seed production guard |
| PHPUnit PHP8.4.26/PostgreSQL17.9 |18 tests,95 assertions passed | Cluster pengujian terisolasi localhost:55432, database khusus; migrations, locks, constraints dan seluruh suite yang sama; bukan database produksi |
| Pint |passed | Formatter Laravel |
| Composer validate strict |passed | Lock/schema valid, platform PHP8.3 |
| Composer audit |0 advisories | Versi lock saat review |
| Laravel migrate/cache |passed | SQLite migration, route:cache dan clear |
| Nuxt typecheck |passed | Strict TS; Nuxt/Vue router versions aligned |
| ESLint |passed,0 warnings | `--max-warnings 0` |
| Vitest4.1.11 |5 tests passed | WA encoding/invalid config, annuity zero-rate/full-DP/rounding/bounds; versi patched GHSA-82fw-gwwq-j7x9 |
| Playwright local Chrome |3 flows passed | SSR+canonical+404+missing-CSRF419, hydrated mobile navigation/list/layout, cookie login/history/notes/Escape/logout |
| SSR build |passed | Nuxt4.5.2/Nitro2.13.4/Vue3.5.43/Node24.21.0 |
| Raw HTML HTTP |200 content+canonical,missing404 | Development port3000 dan built artifact port3001; spesifikasi tersedia sebelum client JS |
| Screenshots |Generated desktop/mobile | Layout smoke melalui browser tests; review visual fondasi sebelumnya, belum audit WCAG lengkap/UAT real content |
| Runtime artifact npm audit |0 advisories | Generated `.output/server` dependency lock audit |
| Source npm audit lengkap |11 high entries,2 root advisories;0 moderate/critical | Exit1 tetap dilaporkan; upstream node-forge/braces tanpa patch; Vitest fixed; gate produksi terbuka; jangan klaim all-green |
| Build warnings |1 upstream DEP0155 | Vue/Nitro trailing-slash exports mapping; bukan warning aplikasi yang disembunyikan |
| GitHub Actions |Tidak digunakan | Workflow dihapus sesuai instruksi pengguna; validasi lokal wajib. PHP8.3/Linux belum diuji; verifikasi runtime deployment sebelum produksi |
| Instalasi/arsip/workflow |passed | npm ci bersih berhasil; tidak ada file workflow Actions; diff --check bersih; ketiga SHA256 arsip sama dengan sumber |

Red→green: sebelum migrations/routes/domain implementasi, suite fondasi gagal pada kolom role dan route missing. Setelah implementasi dan regression fixes, seluruh18 backend tests lulus. E2E awal mendeteksi input sebelum hydration dan origin Sanctum lokal; form ready gate dan konfigurasi origin memperbaiki reproduksi. Scope/duplicate/concurrency assertions menguji kontrak bisnis, bukan hanya snapshot implementasi.

Tidak dijalankan: actual deployment shared hosting, load/SLO, restore DB/media produksi, provider push, accessibility audit lengkap, account recovery, media uploads dan business UAT. Keputusan/gate tercatat pada PRD/SRS/runbook/status; bukan fitur yang diklaim telah selesai.

Riwayat: [PR #1](https://github.com/ariefmavlana/flamboyan-perum/pull/1) membawa fondasi awal, [PR #2](https://github.com/ariefmavlana/flamboyan-perum/pull/2) menghapus Actions; proposal final membawa keduanya dan fix Vitest pada branch baru dari main terbaru. Billing bukan prasyarat kontribusi. Fondasi siap direview dengan hasil audit terbuka yang dijelaskan di dependency-security.md; review tidak mengizinkan merge/deployment atau menyatakan seluruh MVP selesai.

Regresi setup terdeteksi pada browser fixture baru: login422 karena `artisan serve` dengan reload membuang override DB dari shell lalu membaca `.env`. Server fixture dijalankan dengan `--no-reload`; ketiga browser flows kemudian lulus pada database demo terisolasi. Runbook mencatat perilaku ini. Pengujian backend tetap menggunakan SQLite in-memory/PostgreSQL khusus; tidak menjalankan test atau seed pada database bisnis.
