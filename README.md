# Flamboyan Perum

Fondasi katalog properti premium dan CRM leads terpusat: **Nuxt SSR + Laravel REST API**, PostgreSQL sebagai target produksi dan SQLite untuk lokal/instalasi ringan. Target deployment shared hosting tanpa Docker, dengan PHP dan proses Node persisten.

## Struktur

```text
apps/api       Laravel 13: session auth, scoped catalog/CRM, history, notifications
apps/web       Nuxt 4 / Vue / TypeScript: public SSR + login + CRM workspace
docs           PRD, SRS, review, architecture, API, runbook, implementation status
docs/original  Arsip utuh tiga dokumen sumber
.github        CI SQLite/PostgreSQL, frontend, browser flows, dependency audit
```

## Mulai

Prasyarat: PHP8.3+ dengan ekstensi yang sesuai, Composer2, Node24 LTS. Ikuti [runbook setup](docs/runbook.md) untuk konfigurasi `.env`, database, provisioning akun, dan demo opt-in.

```sh
# Terminal backend, apps/api
composer install
# copy .env.example → .env, generate key, create SQLite file, migrate (lihat runbook)
php artisan flamboyan:create-user
php artisan serve --host=127.0.0.1 --port=8000

# Terminal frontend, apps/web
npm ci
npm run dev
```

Buka `http://127.0.0.1:3000`. Nomor WA/konten produksi tidak disediakan; konfigurasi kosong tidak membuat CTA fiktif. Seed default tidak membuat account. Demo memerlukan password yang dipilih sendiri dan tidak dapat dijalankan pada production.

## Cakupan fondasi

Tersedia: home/list/detail SSR, katalog API dengan filter/pagination dan public allowlist, session login/logout, backend role/ownership, create/assign/status/notes CRM, optimistic concurrency, history dan database notifications atomik, tabel CRM/drawer, provisioning CLI, calculation kernel KPR, tests/CI.

Tahap berikutnya: UX Admin create/assign dan CRUD katalog lengkap, media/upload, recovery/profil/CMS, real-time push/Echo, compare/KPR UI dan bank rates, maps/POI/brochure/reporting. [Status per fitur](docs/implementation-status.md) memisahkan fondasi dari MVP dan produksi.

## Dokumentasi dan kualitas

- [Review sumber dan resolusi 30 temuan](docs/review.md)
- [PRD](docs/PRD.md), [SRS](docs/SRS.md), [guideline aktif](<docs/AI Agent Guide Line.md>)
- [Arsitektur](docs/architecture.md), [ADR](docs/adr/001-proportional-foundation.md), [API](docs/API_DOCS.md)
- [Deployment/recovery runbook](docs/runbook.md), [dependency security](docs/dependency-security.md)
- [Aturan kontribusi](CONTRIBUTING.md), [AGENTS](AGENTS.md)

Jalankan backend Pint/PHPUnit/Composer validate+audit dan frontend lint/typecheck/Vitest/build/Playwright. Suite lokal lulus pada SQLite dan PostgreSQL17.9 dengan PHP8.4.26. CI dikonfigurasi untuk SQLite/PostgreSQL dan PHP8.3/8.4, tetapi run pertama belum memulai job karena masalah billing akun GitHub. Source toolchain Nuxt memiliki advisory upstream tanpa patch yang dicatat di security document; audit tetap dijalankan dan tidak disamarkan. Tidak mengklaim production-ready sebelum hosting, security, media/data recovery, content, privacy, provider, load dan UAT gates lulus. Bukti lengkap ada di [docs/validation.md](docs/validation.md).

## Workflow

Setiap fitur/fix/refactor/dokumentasi memakai branch baru dan PR menuju `main`, Conventional Commits, validasi aktual, risiko/migrasi/rollback, dan dokumentasi terbaru. Tidak ada merge otomatis. PR fondasi pertama berstatus draft untuk review scope dan advisory upstream.
