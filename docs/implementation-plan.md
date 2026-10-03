# Rencana penuntasan requirement

2026-10-03. Instruksi pengguna: seluruh requirement dokumentasi diselesaikan, tanpa GitHub Actions. Nomor WhatsApp sementara yang diberikan pengguna: `6287776734038`. Kandidat hosting: Hostinger/Rumahweb; paket, domain, SMTP dan push credentials belum ditetapkan.

PR #3 fondasi masih terbuka; main belum memuat fondasi. Setiap tahap membuat branch baru dari main terbaru, membawa dependensi melalui fast-forward cherry-pick, dan membuka PR terhadap branch tahap sebelumnya agar diff review terbatas. Tidak melakukan merge PR tanpa instruksi pengguna. Urutan review/merge mengikuti dependensi, bukan menutup proposal sebelumnya.

| Tahap / PR | Requirement | Acceptance yang harus dibuktikan |
|---|---|---|
| Workspace operasi | I-01..I-06/I-09, FR-BO-PROP-001..003/005, CRM manual/assignment | UI CRUD katalog scoped, create/assign/reassign lead, property/assignee labels, search/filter/pagination; profile; Admin users, deactivation/workload/last-admin guard; recovery single-use/expiry/session revocation; perubahan audited/versioned |
| Media properti | P-04/P-08, FR-PUB-022..025/028 | Staging private, validated/decode/strip EXIF/variants queue, limits/scoped/versioned mutations; video/tour allowlist; PDF signature+scanner gate/download nosniff; ordering/archive/history; public only sanitized/published media |
| Evaluasi dan konten publik | P-01..P-08/I-09 | Full filter UI/URL, compare max3/missing states, KPR fixed+floating+schedule/chart/rate dates, Admin hero/testimonials/bank rates, maps consent/POI/sources, sitemap/robots/structured data/canonical/WA |
| Notifikasi real-time | I-07/FR-RT-001..004 | Private user channels, after-commit queued push, payload tanpa PII, bounded retries/failure recovery, event dedup, reconnect refresh, polling60s fallback, notification navigation/read/pagination |
| Supervisi dan privacy | I-08/FR-CRM-004, PRD§8/retention | Cohort/date/status/Marketing/conversion/first-follow-up metrics, pending age; scoped Admin API/UI; PII-free funnel events; controlled audited correction/anonymization/retention workflow |
| Operasi dan acceptance akhir | SRS§7/10/NFR | Security headers/host/proxy, readiness/monitoring, backup/restore drill, bounded local load, keyboard/mobile/accessibility flows, PHP/database parity; requirement traceability dan seluruh status/API/runbook aktual |

Setiap tahap menjalankan Pint, PHPUnit SQLite/PostgreSQL terisolasi, Composer validate/audit, frontend lint/typecheck/unit/build/browser, audit lengkap source+artefak; hasil dan runtime dicatat pada PR. Status berubah menjadi implemented hanya setelah perilaku diuji. Test/provider fakes membuktikan kontrak tetapi bukan bukti pengiriman SMTP/Pusher nyata.

Gate eksternal sebelum go-live tetap membutuhkan bukti: paket hosting dengan PHP>=8.3 dan Node24 SSR persisten, domain/TLS/routing/restart/cron/storage/database, SMTP identity, Pusher/private-channel credentials, konten/media berizin/rates berlaku, privacy/retention disahkan, serta verifikasi advisori upstream tanpa patch. Gate tidak boleh disamarkan sebagai fitur aplikasi yang selesai. Konten publik tidak direkayasa; kosong memiliki empty state dan CTA yang valid.
