# SEO teknis — kondisi, implementasi, dan verifikasi

Versi 1.0 · 2026-10-14 · Branch `feat/production-readiness` dari `main` `f1005fb` · Implementasi pada dokumen ini belum di-merge.

Dokumen ini mencatat kondisi SEO teknis sebelum dan sesudah pekerjaan pada branch ini. Klaim hasil pencarian tidak dibuat: tidak ada akses Search Console, tidak ada crawl aktual, dan tidak ada data volume.

## 1. Matriks metadata per halaman (sesudah perubahan)

Semua judul halaman kini berupa judul deskriptif tanpa suffix brand, dan template global menambahkan `· Flamboyan` satu kali.

| Halaman | Judul (digabung template) | Deskripsi | Canonical | Robots |
|---|---|---|---|---|
| Beranda `/` | Rumah Baru Cibiru Wetan, Bandung Timur · Flamboyan | Faktual: katalog BFI2, bandingkan harga/spesifikasi, simulasi KPR, kunjungan | `{siteUrl}` | index |
| Katalog `/properti` | Jelajahi properti · Flamboyan | Cari rumah berdasarkan lokasi/harga/spesifikasi | `{siteUrl}/properti` | index; `noindex, follow` bila ada query filter |
| Detail `/properti/{slug}` | `{judul properti} · Flamboyan` | 155 karakter pertama deskripsi properti | `{siteUrl}/properti/{slug}` | index (404 untuk draft/arsip) |
| Bandung Timur `/bandung-timur` | Hunian Bandung Timur · Flamboyan | Konteks kawasan | `{siteUrl}/bandung-timur` | index |
| Panduan `/panduan` | Panduan memilih hunian Bandung Timur · Flamboyan | Ringkasan tiga panduan | `{siteUrl}/panduan` | index |
| Panduan detail `/panduan/{slug}` | `{judul panduan} · Flamboyan` | Ringkasan panduan | `{siteUrl}/panduan/{slug}` | index; 404 untuk slug tak dikenal |
| Konsultasi `/konsultasi` | Konsultasi hunian & kunjungan · Flamboyan | Menyiapkan percakapan WhatsApp | `{siteUrl}/konsultasi` | index; `noindex, follow` bila ada query |
| Privasi `/privasi` | Informasi privasi · Flamboyan | Ringkasan pemrosesan data | `{siteUrl}/privasi` | index |
| Bandingkan `/bandingkan` | Bandingkan properti · Flamboyan | — | — | `noindex, follow` |
| Login/pemulihan/kata sandi | Masuk tim / Pemulihan akun / Kata sandi baru | — | — | `noindex, nofollow` |
| Backoffice (CRM/katalog/laporan/konten/akun/profil/privasi/operasi) | Label halaman masing-masing | — | — | `noindex, nofollow` + header `X-Robots-Tag` |
| Error 404/503 | Halaman tidak ditemukan / belum tersedia | — | — | `noindex, nofollow` |

Perubahan utama: `titleTemplate` global di `nuxt.config.ts`, normalisasi seluruh judul halaman, default `description`, `og:site_name`, `og:locale=id_ID`, `og:type=website`, `og:image` + `og:image:alt` (aset ilustrasi berlisensi yang sudah dipakai beranda), dan `twitter:card`. Judul beranda dan deskripsinya mengikuti usulan instruksi pengguna dan hanya menyatakan fakta yang tersedia di situs.

## 2. Sumber URL dan canonical

- Satu helper (`shared/utils/seo.ts`: `siteOrigin`, `canonicalUrl`, `absoluteUrl`) dipakai semua halaman dan sitemap; menghapus variasi manual `.replace(/\/+$/,'')`.
- Canonical selalu absolut dan tidak membawa query (`?utm_*`, filter, atau halaman) sehingga parameter kampanye tidak menciptakan URL kanonik bersaing.
- Canonical mengikuti `NUXT_PUBLIC_SITE_URL`. Bila pada produksi Vercel nilainya masih berakhiran `.vercel.app`, build hanya menulis peringatan (tidak gagal) karena demo sepenuhnya berjalan di host tersebut. Domain resmi adalah keputusan bisnis (lihat [production-readiness.md](../deployment/production-readiness.md)).
- `/privasi` kini memiliki canonical (sebelumnya tidak ada).

## 3. robots.txt

Isi saat ini (dihasilkan `apps/web/server/routes/robots.txt.get.ts`, terverifikasi identik di live):

```
User-agent: *
Disallow: /backoffice
Disallow: /login
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /bandingkan
Disallow: /api/
Disallow: /auth/
Disallow: /sanctum/
Disallow: /*?
Sitemap: {siteUrl}/sitemap.xml
```

Rasional: area internal dan halaman hasil pencarian tidak perlu diindeks; `Disallow: /*?` mencegah URL filter/UTM terindeks sebagai halaman duplikat. `robots.txt` bukan pengaman: proteksi sebenarnya ada di autentikasi backend dan header `X-Robots-Tag`.

Item yang **belum diverifikasi**: perilaku crawler `AdsBot-Google` terhadap grup `User-agent: *` (crawler iklan memiliki aturan sendiri). Sebelum menjalankan Google Ads, verifikasi dokumentasi Google terbaru dan putuskan apakah perlu grup `Allow` eksplisit untuk `AdsBot-Google`. Jangan mengubah `robots.txt` hanya berdasarkan asumsi.

## 4. sitemap.xml

- `/{sitemap.xml}` mengembalikan sitemapindex (`pages.xml` + `properties-1.xml`…`properties-N.xml`) dengan `Cache-Control: no-store`; bila API sitemap gagal, respons `503` (bukan sitemap kosong).
- `pages.xml` berisi origin, `/properti`, `/privasi`, `/bandung-timur`, `/panduan`, `/konsultasi`, dan seluruh slug panduan.
- `properties-N.xml` hanya memuat properti `PUBLISHED` (endpoint `/api/v1/sitemap`), maksimum 1000 entri per berkas, `lastmod` berasal dari `updated_at` (bukan tanggal buatan).
- Yang **tidak** dimasukkan: `/bandingkan`, area tim, auth, URL ber-query, dan properti draft/arsip.
- Verifikasi lokal: `GET /sitemap.xml`, `GET /sitemaps/pages.xml`, `GET /sitemaps/properties-1.xml` harus `200`; nama berkas atau halaman di luar rentang harus `404`.

## 5. Structured data

| Tipe | Lokasi | Catatan |
|---|---|---|
| `WebSite` | Beranda | Nama, URL, `inLanguage: id-ID`; tanpa `SearchAction` (tidak ada endpoint pencarian publik sendiri) |
| `BreadcrumbList` | Detail properti, detail panduan | Urutan Beranda → Katalog/Panduan → halaman |
| `RealEstateListing` + `Offer` + `House` | Detail properti | Harga IDR, `availability` hanya bila bukan `CHECK_REQUIRED`, `floorSize` MTK, kamar, alamat pos. Kini ditambah `image` bila cover tersedia |

Aturan yang dipegang: hanya fakta yang tampil di halaman; `availability` dihilangkan ketika unit masih "konfirmasi"; tidak ada `AggregateRating`/review/testimonial terstruktur; `Organization` **tidak** dipancarkan sebelum identitas badan usaha resmi tersedia. Keberhasilan validasi schema.org bukan jaminan rich result; pengujian rich result adalah tindakan manual (lihat bagian 8).

## 6. Crawlability dan internal linking

- Seluruh konten utama dirender SSR (HTML memuat judul, spesifikasi, canonical); tidak ada konten pencarian yang disembunyikan di balik render klien.
- Alur internal: beranda → katalog → detail → konsultasi/WhatsApp; detail → panduan kunjungan; panduan → katalog/konsultasi; footer menjangkau katalog, bandingkan, kawasan, panduan, konsultasi, privasi, (opsional) Instagram, dan area tim.
- Detail properti yang tidak ada mengembalikan `404`; kegagalan API mengembalikan `503` (bukan soft 404). Slug panduan tak dikenal `404`. Sitemap dengan nama berkas tidak valid `404`.
- Slug properti stabil (tidak berubah saat judul diedit) sehingga URL yang dibagikan tetap berlaku.

## 7. Batas klaim

Tidak ada klaim "posisi naik", "terindeks", atau "rich result aktif" pada dokumen ini. Yang dapat dibuktikan lokal hanya: struktur metadata, canonical, robots/sitemap, validitas JSON-LD secara sintaks, dan status HTTP. Sisanya (crawl, index, peringkat, rich result) memerlukan Search Console dan waktu.

## 8. Verifikasi yang tersedia (manual)

1. Jalankan build lokal lalu server produksi: `npm run build` dan `npm run start` di `apps/web`.
2. `curl -s localhost:3000/properti/<slug> | grep -o 'rel="canonical"[^>]*'` — canonical absolut, tanpa query.
3. Periksa `<title>` unik dan hanya memiliki satu suffix `· Flamboyan`; periksa `og:image` absolut.
4. Ambil blok `application/ld+json` dan validasi sintaks (`JSON.parse`) — atau tempel ke Rich Results Test setelah domain produksi aktif.
5. `curl -s localhost:3000/sitemap.xml` → index valid; `pages.xml` hanya berisi URL eligible.
6. Setelah domain resmi aktif: daftarkan properti di Google Search Console (domain/DNS atau prefix URL), lalu periksa laporan Pages/Sitemaps. Google Business Profile menyusul terpisah sesuai [manual-actions-required.md](../deployment/manual-actions-required.md).
