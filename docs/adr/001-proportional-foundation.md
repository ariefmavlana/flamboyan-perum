# ADR 001 — Fondasi Nuxt/Laravel yang proporsional

Status: accepted untuk fondasi · 2026-10-03.

Context: katalog dan CRM membutuhkan SSR, persistent relational data, RBAC, dan audit; produksi diarahkan ke shared hosting tanpa Docker, paket belum dipilih. Dokumen awal belum mempunyai kontrak perilaku/concurrency.

Decision: monorepo `apps/web` Nuxt4 dan `apps/api` Laravel13; PostgreSQL utama/SQLite lokal; Sanctum cookie; satu CRM service transaksi + history + notification; conditional version mutation untuk parity SQLite/PostgreSQL; public resource allowlist. Standard Laravel layout cukup. Tidak membuat sembilan bounded contexts dari skill arsitektur generik karena tidak sesuai domain proyek ini.

Managed Pusher/Echo adalah target F1, bukan dependency fondasi yang belum dapat diuji provider. Notification database API dibangun sekarang. CMS/media/reporting/compare/KPR UI mengikuti PR terpisah. Tidak menggunakan microservices, Redis, Docker, AI agent, generic repository atau queue orchestration tambahan tanpa kebutuhan.

Consequences: stack membutuhkan PHP≥8.3 dan persistent Node; shared hosting statis-only gagal gate. SQLite concurrency terbatas, sehingga produksi PostgreSQL lebih disukai. Fondasi dapat diuji tanpa provider/konten produksi; MVP produksi tetap memerlukan F1 dan gate terkait. Pemilihan baseline bisnis kini transparan, perubahan berikutnya harus memperbarui SRS/tests dalam PR baru.

Sources: [Nuxt installation](https://nuxt.com/docs/4.x/getting-started/installation), [Nuxt deployment](https://nuxt.com/docs/4.x/getting-started/deployment), [Laravel deployment](https://laravel.com/docs/13.x/deployment), [Sanctum SPA auth](https://laravel.com/docs/13.x/sanctum). Diverifikasi 2026-10-03; versi package aktual ditentukan lockfiles.
