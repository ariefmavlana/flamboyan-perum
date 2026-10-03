# Rencana penuntasan requirement

2026-10-03. Instruksi pengguna: seluruh requirement dokumentasi diselesaikan, tanpa GitHub Actions. Nomor WhatsApp sementara yang diberikan pengguna: `6287776734038`. Kandidat hosting: Hostinger/Rumahweb; paket, domain, SMTP dan push credentials belum ditetapkan.

PR #3 fondasi masih terbuka; main belum memuat fondasi. Setiap tahap membuat branch baru dari main terbaru, membawa dependensi melalui fast-forward cherry-pick, dan membuka PR terhadap branch tahap sebelumnya agar diff review terbatas. Tidak melakukan merge PR tanpa instruksi pengguna. Urutan review/merge mengikuti dependensi, bukan menutup proposal sebelumnya.

| Tahap / PR | Requirement | Acceptance yang harus dibuktikan |
|---|---|---|
| Workspace operasi — implemented PR #4 | I-01..I-06/I-09, FR-BO-PROP-001..003/005, CRM manual/assignment | UI CRUD scoped/create/assign/reassign, account/profile/recovery/workload/audit; operations-validation.md |
| Media properti — implemented PR #5 | P-04/P-08, FR-PUB-022..025/028 | Private staging/decode/WebP/queue/version, video/tour/PDF fail-closed/archive; media-validation.md |
| Evaluasi/editorial — implemented PR #6 | P-01..P-08/I-09 | Filters/compare/floating KPR/CMS/maps/POI/SEO/WA; evaluation-validation.md |
| Notifikasi — implemented PR #7 | I-07/FR-RT-001..004 | Private Echo/Pusher/durablequeue/IDs/retry/dedup/reconnect/poll/inbox; realtime-validation.md |
| Supervisi/privacy — implemented PR #8 | I-08/FR-CRM-004, PRD§8/retention | Cohort/median/pending/PII-free aggregate/read-only candidates/controlled CLI; supervision-validation.md |
| Operasi/acceptance — implemented PR #9 | SRS§7/10/NFR | Headers/host/signed proxy/readiness/JSONlogs/backup alert/load/restore/mobile320/database parity; acceptance-validation.md dan requirements-traceability.md |
| Dummy dinamis — implemented branch codex/dynamic-demo-data | Instruksi pengguna 2026-10-04 + PRD§11/SRS§12 | Persisted generative dataset/real CRUD/API/SSR/native media/rollback/empty-domain guard; demo-data.md dan dynamic-demo-validation.md |

Setiap tahap menjalankan Pint, PHPUnit SQLite/PostgreSQL terisolasi, Composer validate/audit, frontend lint/typecheck/unit/build/browser, audit lengkap source+artefak; hasil dan runtime dicatat pada PR. Status berubah menjadi implemented hanya setelah perilaku diuji. Test/provider fakes membuktikan kontrak tetapi bukan bukti pengiriman SMTP/Pusher nyata.

Gate eksternal sebelum go-live tetap membutuhkan bukti: paket hosting dengan PHP>=8.3 dan Node24 SSR persisten, domain/TLS/routing/restart/cron/storage/database, SMTP identity, Pusher/private-channel credentials, konten/media berizin/rates berlaku, privacy/retention disahkan, serta verifikasi advisori upstream tanpa patch. Gate tidak boleh disamarkan sebagai fitur aplikasi yang selesai. Konten bisnis produksi tidak direkayasa; kosong memiliki empty state dan CTA yang valid. Sesuai instruksi pengguna, demo lokal boleh memakai data sintetis generatif dengan label jelas dan database terpisah; ini tidak memenuhi gate konten produksi.
