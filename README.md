# Flamboyan Perum

Katalog properti dan CRM leads terpusat: **Nuxt SSR + Laravel REST API**, PostgreSQL sebagai target produksi dan SQLite untuk lokal/instalasi ringan. Target deployment Hostinger/Rumahweb tanpa Docker membutuhkan paket dengan PHP dan proses Node persisten; paket dan domain belum dipilih. Untuk demo/portofolio, tersedia jalur deployment tanpa VPS di [docs/vercel-demo-deployment.md](docs/vercel-demo-deployment.md) (Vercel + Supabase + Cloudflare R2, dengan batas media yang dijelaskan di dokumen tersebut).

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

Untuk mencoba aplikasi dengan **dummy dinamis**, ikuti [panduan dataset demo](docs/demo-data.md). Generator membuat data sintetis acak sekali pada database kosong; halaman membaca API dan perubahan melalui back office tersimpan di database. Default: 24 properti, 72 lead, tiga Marketing, tujuh konten CMS, serta foto ilustrasi/denah generatif melalui worker media. Tidak ada array katalog/CRM hardcoded atau fallback mock saat API gagal.

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

Setiap fitur/fix/refactor/dokumentasi memakai branch baru dari `main` terbaru, Conventional Commits dan PR komprehensif. PR #3 → #4 → #5 → #6 → #7 → #8 → #9 → [#10 dataset dinamis](https://github.com/ariefmavlana/flamboyan-perum/pull/10) telah diintegrasikan berurutan ke `main` pada 2026-10-04 setelah pengguna menginstruksikan merge dan pemeriksaan konflik/review/rules lolos. Main memuat seluruh implementasi dan dataset generator. Pekerjaan berikutnya kembali berbasis `main` terbaru; merge tetap memerlukan instruksi pengguna. GitHub Actions tidak digunakan. [Catatan integrasi](docs/integration-review.md) menjelaskan pemeriksaan dan batas produksi yang tetap terbuka.
