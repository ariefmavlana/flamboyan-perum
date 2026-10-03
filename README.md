# Flamboyan Perum

Katalog properti dan CRM leads terpusat: **Nuxt SSR + Laravel REST API**, PostgreSQL sebagai target produksi dan SQLite untuk lokal/instalasi ringan. Target deployment Hostinger/Rumahweb tanpa Docker membutuhkan paket dengan PHP dan proses Node persisten; paket dan domain belum dipilih.

## Struktur

```text
apps/api       Laravel 13: session auth, scoped catalog/CRM, history, notifications
apps/web       Nuxt 4 / Vue / TypeScript: public SSR + login + CRM workspace
docs           PRD, SRS, review, architecture, API, runbook, implementation status
docs/original  Arsip utuh tiga dokumen sumber
.github        Template PR (tanpa GitHub Actions)
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

Buka `http://127.0.0.1:3000`. Nomor WA sementara dari pengguna: `6287776734038`; konfirmasi kepemilikan sebelum rilis. Konfigurasi kosong menyembunyikan CTA. Konten bisnis asli belum disediakan. Seed default tidak membuat account. Demo memerlukan password yang dipilih sendiri dan tidak dapat dijalankan pada production.

## Cakupan implementasi

Tersedia: home/list/detail SSR, full filter/sort/URL, compare, KPR fixed/floating dengan schedule/chart, galeri/denah/video/tour/brosur, maps/POI, sitemap/metadata; katalog dan CRM scoped dengan UI Admin/Marketing, akun/profil/recovery/CMS, histori/notifikasi/queue atomik, Echo private dengan polling, laporan cohort, analytics agregat opt-in, prosedur redaksi CLI, readiness/monitoring dan suite pengujian lokal.

[Status per fitur](docs/implementation-status.md), [traceability](docs/requirements-traceability.md) dan [bukti acceptance](docs/acceptance-validation.md) memisahkan kode yang telah diuji dari gate produksi: hosting/domain/SMTP/Pusher/ClamAV aktual, konten berizin, policy, audit upstream, UAT dan kapasitas hosting.

## Dokumentasi dan kualitas

- [Review sumber dan resolusi 30 temuan](docs/review.md)
- [PRD](docs/PRD.md), [SRS](docs/SRS.md), [guideline aktif](<docs/AI Agent Guide Line.md>)
- [Arsitektur](docs/architecture.md), [ADR](docs/adr/001-proportional-foundation.md), [API](docs/API_DOCS.md)
- [Deployment/recovery runbook](docs/runbook.md), [dependency security](docs/dependency-security.md)
- [Aturan kontribusi](CONTRIBUTING.md), [AGENTS](AGENTS.md)

GitHub Actions tidak digunakan. Jalankan backend Pint/PHPUnit/Composer validate+audit dan frontend lint/typecheck/Vitest/build/Playwright secara lokal sebelum review PR. Suite lokal fondasi lulus pada SQLite dan PostgreSQL17.9 dengan PHP8.4.26; PHP8.3 dan Linux belum diuji. Source toolchain Nuxt memiliki advisory upstream tanpa patch yang dicatat di security document; audit source dan artefak runtime tetap wajib serta hasilnya tidak disamarkan. Tidak mengklaim production-ready sebelum hosting, security, media/data recovery, content, privacy, provider, load dan UAT gates lulus. Perintah lengkap ada di [runbook](docs/runbook.md), bukti di [docs/validation.md](docs/validation.md).

## Workflow

Setiap fitur/fix/refactor/dokumentasi memakai branch baru dari `main` terbaru, Conventional Commits dan PR komprehensif. Selama fondasi belum di-merge, PR lanjutan berbasis branch dependensi agar diff terbatas; urutan review/merge mengikuti PR #3 → #4 → #5 → #6 → #7 → #8 → #9. Tidak ada merge tanpa instruksi pengguna, tidak ada GitHub Actions. Main masih bootstrap sampai PR disetujui dan merge diinstruksikan.
