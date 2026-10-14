# Kesiapan produksi dan deployment

Versi 1.1 · 2026-10-14 · Di-merge ke `main` melalui PR #25 (`808b69c`), belum di-deploy otomatis oleh pekerjaan ini. Dokumen ini menggantikan asumsi; semua nilai rahasia tetap berada di Vercel/secret manager, bukan di repo.

## 1. Inventaris environment

### `apps/web` (Nuxt)

| Variabel | Wajib | Fungsi | Nilai saat ini |
|---|---|---|---|
| `NUXT_API_BASE` | Ya (build Vercel gagal bila kosong) | Origin API untuk proxy same-origin | `https://flamboyan-api.vercel.app` di demo |
| `NUXT_API_PROXY_SECRET` | Ya di produksi | Tanda tangan request proxy | Rahasia (Vercel) |
| `NUXT_ALLOWED_HOSTS` | Ya | Allowlist host | host domain final |
| `NUXT_TRUSTED_PROXY_IPS` | Kondisional | Trusted proxy | sesuai hosting |
| `NUXT_TOUR_HOSTS` | Tidak | Host virtual tour yang diizinkan CSP/embed | `my.matterport.com` |
| `NUXT_PUBLIC_SITE_URL` | Ya | Canonical, sitemap, tautan WhatsApp | wajib domain final |
| `NUXT_PUBLIC_WHATSAPP_NUMBER` | Ya | CTA WhatsApp | nomor dari CMS bila ada |
| `NUXT_PUBLIC_ANALYTICS_ENABLED` | Tidak | Analytics first-party agregat | `false` |
| `NUXT_PUBLIC_GTM_ID` | Tidak | Container GTM + pemicu banner consent | kosong |
| `NUXT_PUBLIC_META_PIXEL_ID` | Tidak | Pixel Meta langsung (alternatif GTM) | kosong |
| `NUXT_PUBLIC_INSTAGRAM_URL` | Tidak | Tautan Instagram di footer | kosong |

### `apps/api` (Laravel)

Tetap mengikuti [runbook.md](../runbook.md) dan `.env.example` masing-masing; pekerjaan ini tidak mengubah kontrak API. Perubahan hanya dokumentasi.

## 2. Contoh konfigurasi non-rahasia

```dotenv
NUXT_API_BASE=https://flamboyan-api.vercel.app
NUXT_ALLOWED_HOSTS=flamboyan-web.vercel.app
NUXT_PUBLIC_SITE_URL=https://flamboyan-web.vercel.app
NUXT_PUBLIC_WHATSAPP_NUMBER=62895375894848
NUXT_PUBLIC_ANALYTICS_ENABLED=false
# Biarkan kosong sampai akun resmi tersedia.
NUXT_PUBLIC_GTM_ID=
NUXT_PUBLIC_META_PIXEL_ID=
NUXT_PUBLIC_INSTAGRAM_URL=
```

## 3. Build dan deploy

- Web: `npm ci && npm run build:checked` (lint → typecheck → unit test → build). Vercel memakai perintah ini dari `apps/web/vercel.json`; `NITRO_PRESET=vercel` diset pada konfigurasi build.
- API: mengikuti `apps/api/vercel.json` + `scripts/vercel-build.php`; tidak berubah pada pekerjaan ini.
- GitHub Actions tidak digunakan; verifikasi dilakukan lokal dan oleh build Vercel pada PR/commit.
- Peringatan build yang sengaja tidak memblokir: `NUXT_PUBLIC_SITE_URL` masih berakhiran `.vercel.app` pada `VERCEL_ENV=production` (demo berjalan di host tersebut; domain final akan menghilangkan peringatan).

## 4. Checklist verifikasi pasca-deploy

1. `GET /robots.txt` → daftar disallow + baris `Sitemap` memakai domain final.
2. `GET /sitemap.xml` → sitemapindex valid; `pages.xml` hanya berisi URL publik; `properties-1.xml` memuat properti published dengan `lastmod`.
3. Halaman detail: `<link rel="canonical">` absolut dan **tanpa query**; `<title>` unik dengan satu suffix `· Flamboyan`; `og:image` absolut.
4. HTML detail memuat dua blok `application/ld+json` (listing + breadcrumb) yang lolos `JSON.parse`.
5. Header respons: CSP `script-src` hanya memuat host pihak ketiga bila `NUXT_PUBLIC_GTM_ID`/`META_PIXEL_ID` diisi; `X-Robots-Tag: noindex` tetap ada untuk `/backoffice/**`, `/login`, halaman reset kata sandi.
6. Banner consent muncul **hanya** bila ID opsional terisi; tombol tolak → tidak ada request ke `googletagmanager.com`/`connect.facebook.net`; tombol terima → skrip dimuat; pilihan bertahan setelah reload.
7. `/properti/{slug-arsip}` mengembalikan `404` dan tidak muncul di sitemap.
8. Detail properti dengan slot promo: harga mengikuti tanggal WIB (uji `29 → 30 → 31 Oktober 2026` mengikuti [CommercialTest](../../apps/api/tests/Feature/CommercialTest.php)).
9. WhatsApp CTA memakai nomor final dan pesan memuat URL kanonik.
10. Tidak ada error konsol kritis pada beranda, katalog, detail, konsultasi, privasi (desktop + mobile).

## 5. Domain dan DNS

- Domain resmi belum ditetapkan (lihat [manual-actions-required.md](manual-actions-required.md) B2). Setelah domain disetujui: arahkan DNS ke project web Vercel, verifikasi HTTPS, lalu ubah `NUXT_PUBLIC_SITE_URL`.
- Karena canonical/sitemap dibaca saat request dari runtime config, perubahan `NUXT_PUBLIC_SITE_URL` di Vercel diikuti deployment ulang (redeploy) agar build baru memakai nilai terbaru.
- Jangan memakai hostname preview Vercel sebagai canonical di produksi.

## 6. Search Console

- Verifikasi properti setelah domain final aktif: preferensi verifikasi **domain (DNS)** untuk mencakup seluruh subdomain.
- Kirim `sitemap.xml`, lalu pantau laporan Pages; ekspektasi awal: halaman internal/ber-query muncul sebagai "Excluded" (memang disengaja).
- Pantau Core Web Vitals setelah trafik cukup; data lapangan baru tersedia berminggu-minggu setelah rilis.

## 7. Rollback

- Kode: revert commit/PR; tidak ada migrasi database dan tidak ada perubahan data pada pekerjaan ini.
- Konfigurasi: kosongkan kembali `NUXT_PUBLIC_GTM_ID`/`NUXT_PUBLIC_META_PIXEL_ID` dan redeploy → tidak ada skrip pihak ketiga, tidak ada banner (perilaku identik sebelum branch).
- Dokumen: folder `docs/audits|marketing|deployment` dapat dihapus tanpa efek runtime.

## 8. Monitoring

- SLO usulan tetap mengikuti PRD §9 (availability 99,5%, API p95 ≤ 500 ms, SSR p95 ≤ 1,5 s, error < 1%).
- Endpoint kesehatan API (`/up`, `/ready`) dan halaman internal "Operasi layanan" sudah tersedia bagi Admin; monitoring eksternal tetap gate hosting (belum dijalankan).
- Untuk iklan: pantau konsistensi antara event situs dan laporan platform; bila mencurigai duplikasi, periksa ulang keputusan GTM-vs-pixel.

## 9. Privasi — materi untuk review legal

Ringkasan teknis yang perlu ditinjau dan disahkan sebelum analytics/iklan aktif:

- Pengendali data: entitas pemilik proyek/marketing (belum ditetapkan pada dokumen ini — jangan mengarang identitas).
- Data yang diproses situs: log server + data teknis koneksi; data kontak hanya bila pengunjung mengirim pesan WhatsApp ke Admin (diproses di WhatsApp, bukan tersimpan di situs); pilihan perbandingan properti tersimpan lokal di browser; preferensi persetujuan tersimpan lokal.
- Teknologi opsional (setelah persetujuan): analitik & pengukuran iklan (Google dan/atau Meta) dengan kategori `analitik` dan `marketing` yang dapat ditolak/diubah.
- Retensi: kebijakan resmi belum disahkan (PRD mengusulkan 24 bulan untuk PII lead; CLI anonimisasi sudah tersedia).
- Hak pengguna & kontak: melalui WhatsApp Admin sesuai prosedur verifikasi identitas.

Dokumen ini **tidak** menyatakan kepatuhan; ia hanya menyediakan ringkasan teknis untuk ditinjau bersama penasihat hukum.

## 10. Batas

Belum dieksekusi pada pekerjaan ini: deploy ke Vercel, perubahan DNS, verifikasi Search Console/Meta domain, pembuatan akun iklan, dan pengukuran lapangan. Semua langkah tersebut tercatat sebagai tindakan manual dengan pemiliknya.
