# Audit kesiapan produksi Flamboyan

Versi 1.1 · 2026-10-14 · Di-merge ke `main` melalui PR #25 (`808b69c`); halaman perumahan berasal dari PR #24 (`e6b5f86`) · Tanpa deploy produksi otomatis dan tanpa aktivasi iklan.

Dokumen ini adalah induk temuan kesiapan produksi, SEO, pengukuran, privasi, dan akuisisi berbayar. Status implementasi per item dicatat apa adanya; item yang belum dijalankan tidak diklaim selesai.

## 1. Metode dan cakupan

- Inspeksi source: `apps/web` (Nuxt 4.5.2 SSR) dan `apps/api` (Laravel 13), konfigurasi Vercel, CSP, metadata, sitemap/robots, analytics first-party, CRM/lead, dan data komersial properti.
- Pemeriksaan HTTP langsung situs live `https://flamboyan-web.vercel.app` pada 2026-10-14: beranda, `/robots.txt`, `/sitemap.xml`.
- Pengujian lokal pada branch ini: unit test Vitest, lint, typecheck, build, dan smoke HTTP (lihat [implementation-status.md](../implementation-status.md) serta dokumen validasi terkait).
- Batasan yang tidak dapat diverifikasi dari lingkungan ini: akun Google Ads/GA4/GTM, Meta Business/Events Manager, Vercel, DNS/domain, Search Console, data NAP/legal perusahaan, stok dan legalitas unit aktual, serta Core Web Vitals lapangan (tanpa RUM/traffic). Item tersebut dicatat sebagai `NOT VERIFIED` atau `REQUIRES BUSINESS APPROVAL`, bukan sebagai fakta.
- Catatan lingkungan: tool pencarian teks pada sesi ini tidak berfungsi; pencarian dilakukan lewat pembacaan file bertarget dan PowerShell `Select-String`.

Kosakata status: `CONFIRMED`, `SUSPECTED`, `NOT VERIFIED`, `RESOLVED`, `REQUIRES BUSINESS APPROVAL`, `CONFIG REQUIRED`, `EXTERNAL ACTION REQUIRED`, `PLANNED`.

## 2. P0 — launch blocker

| ID | Area | Temuan | Bukti | Dampak | Usulan perbaikan | Status |
|---|---|---|---|---|---|---|
| FLB-CONTENT-01 | Konten/kepercayaan | Listing **"Rumah Minimalis Cihapit"** (`/properti/weje`) tayang di produksi dan muncul sebagai kartu featured di beranda | Live 2026-10-14 (beranda); pencarian repo: tidak ada di seeder, fixture, CMS seed, katalog brosur, maupun dokumen; database lokal juga tidak memuatnya (hanya ada satu record fixture) | Listing uji pada katalog publik menurunkan kredibilitas dan berisiko pada penilaian iklan | **Pemilik bisnis mengonfirmasi 2026-10-14 bahwa record ini dibuat sebagai data uji.** Arsipkan melalui workspace Admin (Lampiran A di [manual-actions-required.md](../deployment/manual-actions-required.md)); tidak ada hard delete sehingga riwayat aman | CONFIRMED (data uji) · eksekusi arsip menunggu akses Admin produksi |
| FLB-CONTENT-02 | Konten/promo | Batas harga program 2026-10-29, biaya program 2026-10-30, harga/biaya berikutnya 2026-10-31; tanggal 30 Oktober adalah hari "harga normal + konfirmasi" | `apps/api/app/Models/Property.php` (`publicPrice`), `apps/api/tests/Feature/CommercialTest.php`, [brochure-kpr-research.md](../brochure-kpr-research.md) | Salah label promo/harga setelah 29 Oktober dapat merusak kepercayaan dan memicu sengketa harga | Pertahankan perilaku saat ini (sudah ber-test), konfirmasi ulang sumber harga sebelum 29 Oktober, dan pastikan komunikasi iklan tidak memakai angka promo kedaluwarsa | RESOLVED by design · konfirmasi bisnis tetap diminta |
| FLB-PRIV-01 | Privasi/legal | Halaman `/privasi` menyatakan kebijakan retensi resmi dan detail pengelola data belum disahkan | `apps/web/app/pages/privasi.vue` | Iklan berbayar dan analytics opsional tidak layak diaktifkan sebelum notice/retensi disahkan | Siapkan materi review legal (lihat [production-readiness.md](../deployment/production-readiness.md) bagian privasi) dan sahkan sebelum aktivasi iklan | REQUIRES BUSINESS APPROVAL |
| FLB-MKTG-01 | Marketing/pengukuran | Tidak ada tag pihak ketiga (GA4/GTM/Meta) dan CSP produksi `script-src 'self' 'nonce-…'` akan memblokirnya; tidak ada mekanisme persetujuan opsional | `apps/web/server/plugins/security.ts`, tidak ada plugin analytics sebelum branch ini | Kampanye berbayar tidak dapat diukur secara sah | Fondasi consent-aware + CSP kondisional diimplementasikan pada branch ini; aktivasi tag tetap menunggu ID resmi | CONFIRMED → IMPLEMENTED (merged 2026-10-14; ID resmi tetap gate) |
| FLB-SEO-01 | SEO | Canonical, sitemap, dan `Sitemap:` di robots memakai hostname Vercel `flamboyan-web.vercel.app`, bukan domain produksi | Live `/sitemap.xml`, `/robots.txt`; `apps/web/server/utils/sitemap.ts` | Sinyal kanonik menunjuk host preview; perpindahan domain nanti memerlukan penyesuaian | Tetapkan domain resmi lalu set `NUXT_PUBLIC_SITE_URL`; peringatan build ditambahkan pada branch ini | CONFIG REQUIRED · keputusan domain bisnis |
| FLB-SEC-01 | Keamanan | Berkas env lokal `apps/api/.env.demo-cloud` (dan `apps/api/.env`) berada di disk dan memuat field kredensial: `APP_KEY`, `API_PROXY_SECRET`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (R2), `DB_URL`/`DB_PASSWORD`, `MAIL_PASSWORD`, `PUSHER_APP_SECRET`, `DEMO_PASSWORD` | Verifikasi 2026-10-14: berkas ada; nama kunci dibaca tanpa nilai. `git check-ignore` memastikan keduanya diabaikan (`apps/api/.gitignore:3`, `.gitignore:4`) dan riwayat tidak pernah memuatnya | Bila nilai tersebut masih aktif, siapa pun yang memperoleh berkas dapat mengakses database/storage/mail demo | Rotasi seluruh kredensial, pindahkan ke secret manager, lalu musnahkan salinan lokal; berkas tidak disentuh/diubah oleh pekerjaan ini | REQUIRES OWNER ACTION |
| FLB-DEPLOY-01 | Deployment | Build Vercel gagal cepat bila `NUXT_API_BASE` kosong; pemisahan env public/private jelas | `apps/web/nuxt.config.ts`, `apps/web/vercel.json`, `apps/api/vercel.json` | Risiko deploy diam-diam rusak | Tidak ada perubahan diperlukan | RESOLVED |

## 3. P1 — perbaikan berdampak tinggi

| ID | Area | Temuan | Bukti | Dampak | Usulan perbaikan | Status |
|---|---|---|---|---|---|---|
| FLB-SEO-02 | SEO | Tidak ada `titleTemplate`/default metadata; judul setiap halaman menggandakan nama brand secara manual dan tidak konsisten | `apps/web/nuxt.config.ts` sebelum branch; seluruh `pages/*.vue` | Suffix ganda/berbeda antar halaman; halaman baru mudah terlupa | Template judul global + normalisasi judul halaman | IMPLEMENTED (merged 2026-10-14) |
| FLB-SEO-03 | SEO | Tidak ada OG/Twitter default; beranda tanpa `og:image`/`og:url` | Sebelum branch: hanya detail properti/panduan yang menetapkan `og:*` | Pratinjau tautan di WhatsApp/Instagram kosong atau tidak konsisten | Default `og:site_name/locale/type/image` + `twitter:card` di `app.head` | IMPLEMENTED |
| FLB-SEO-04 | SEO | `/privasi` tidak memiliki canonical | `apps/web/app/pages/privasi.vue` sebelum branch | URL duplikat berpotensi terindeks | Canonical + helper terpusat | IMPLEMENTED |
| FLB-SEO-05 | SEO | JSON-LD hanya `RealEstateListing` di detail properti; tidak ada `WebSite`/`BreadcrumbList`; `Organization` belum dapat dibuat karena identitas bisnis belum terverifikasi | `apps/web/app/pages/properti/[slug].vue` | Peluang rich result terbatas | Builder JSON-LD murni + pemasangan WebSite dan Breadcrumb; Organization ditahan sampai identitas sah tersedia | IMPLEMENTED (Organization: REQUIRES BUSINESS APPROVAL) |
| FLB-SEO-06 | SEO/UX | Tidak ada favicon/apple-touch-icon/`theme-color` | `apps/web/public/` hanya berisi `fonts/` dan `images/` | Tampilan tab/perangkat kurang kredibel | Perlu aset brand resmi; belum dibuat agar tidak mengarang identitas visual | PLANNED · butuh aset disetujui |
| FLB-SEO-07 | SEO | `robots.txt` memblokir seluruh URL ber-query (`Disallow: /*?`) | Live `/robots.txt`; `apps/web/server/routes/robots.txt.get.ts` | Diversi filter/UTM tidak terindeks (disengaja); perlu dipastikan tidak memengaruhi crawler Google Ads | Verifikasi kebijakan crawler `AdsBot-Google` terbaru lalu putuskan apakah perlu grup `Allow` eksplisit | NOT VERIFIED |
| FLB-SEO-08 | SEO | Sitemap memakai `lastmod` dari `updated_at` dan mengirim `Cache-Control: no-store` | `apps/web/server/routes/sitemaps/[file].get.ts` | Tidak salah, namun cache berlebihan membebani API | Opsional: cache pendek ber-key versi; bukan blocker | PLANNED |
| FLB-PERF-01 | Performa | Baseline tanpa skrip pihak ketiga; risiko regresi muncul saat tag ditambahkan | Analisis bundle/build; tidak ada `plugins/` sebelumnya | Tag yang salah pasang dapat merusak LCP/INP | Pemuatan tag hanya setelah persetujuan, dimuat asinkron, tanpa duplikasi GA4+GTM | IMPLEMENTED (gating) · pengukuran lapangan PLANNED |
| FLB-PERF-02 | Performa | Penanganan gambar sudah baik: varian responsif, `srcset`/`sizes`, `loading="lazy"`, `fetchpriority="high"` untuk LCP | `PropertyCard.vue`, `index.vue`, `panduan/[slug].vue` | — | Pertahankan; jangan lazy-load gambar hero | RESOLVED |
| FLB-PERF-03 | Performa | Data lapangan LCP/INP/CLS belum tersedia (tanpa RUM) | — | Tidak ada pembuktian p75 | Ukur setelah analytics aktif/trafik nyata; protokol di [performance-before-after.md](performance-before-after.md) | NOT VERIFIED |
| FLB-MKTG-02 | Marketing | Tidak ada pemetaan intent → landing page dan konvensi UTM; parameter UTM tidak dimanfaatkan untuk konteks event | Sebelum branch: tidak ada pembacaan `utm_*` | Kampanye berbayar akan buta atribusi | Konvensi UTM didokumentasikan; konteks kampanye dibaca dari URL dan dilampirkan ke event (setelah persetujuan) | IMPLEMENTED (dokumen + kode) |
| FLB-MKTG-03 | Marketing | Meta Pixel belum terpasang; Conversions API belum dapat dijustifikasi (tidak ada provenance event backend + consent) | Tidak ada referensi pixel di repo | Klaim pengukuran Meta tidak dapat dilakukan | Loader pixel langsung opsional (config-gated) + evaluasi CAPI didokumentasikan | IMPLEMENTED (config-gated) · CAPI PLANNED |
| FLB-MKTG-04 | Marketing | Tidak ada tautan/identitas Instagram di aplikasi | Footer hanya navigasi internal | Kanal Instagram tidak terhubung ke situs | Slot konfigurasi `NUXT_PUBLIC_INSTAGRAM_URL`; username tidak dikarang | IMPLEMENTED (config-gated) · handle resmi EXTERNAL ACTION |
| FLB-MKTG-05 | Marketing | Tidak ada consent layer untuk tracking opsional | Tidak ada banner/consent sebelum branch | Iklan/analytics berisiko melanggar persetujuan | Banner consent aksesibel + Consent Mode, hanya muncul bila ID opsional diisi | IMPLEMENTED (merged 2026-10-14) |
| FLB-ANLYT-01 | Pengukuran | Hanya dua event agregat first-party (`property_view`, `whatsapp_click`) dan default nonaktif | `usePropertyAnalytics.ts`, `AnalyticsController`, `ANALYTICS_ENABLED=false` | Funnel berbayar tidak terukur | Layer event terketik (`view_property`, `select_property`, `compare_property`, `calculate_mortgage`, `click_whatsapp`, `request_visit`) di atas GTM; event lead sengaja tidak dibuat | IMPLEMENTED (merged 2026-10-14) |
| FLB-CRM-01 | CRM/atribusi | Tabel `leads` tidak menyimpan sumber/UTM; pencatatan lead manual oleh Admin; percakapan WhatsApp tidak teramati sistem | `apps/api/database/migrations`, `LeadController`, [API_DOCS.md](../API_DOCS.md) | Atribusi campaign → lead → deal tidak dapat diklaim | Perluas CRM secara terpisah (kolom sumber opsional + pemilihan oleh Admin); jelaskan batas atribusi | PLANNED · desain di [google-ads-setup.md](../marketing/google-ads-setup.md) |
| FLB-A11Y-01 | Aksesibilitas | Belum ada audit WCAG 2.2 AA menyeluruh; UI consent baru harus terbukti dapat dioperasikan keyboard | Berbagai komponen; spec Playwright membuktikan dialog/keyboard pada alur yang diuji saja | Klaim aksesibilitas tidak boleh berlebihan | Uji keyboard pada banner consent + lanjutkan audit bertahap | IMPLEMENTED (banner) · audit penuh NOT VERIFIED |
| FLB-CONTENT-03 | Konten | H1 beranda live ("Ruang untuk hidup yang lebih baik.") berasal dari CMS dan tidak ada di fixture lokal; fixture lokal memakai "Ruang untuk cerita berikutnya." | Live 2026-10-14; `apps/web/app/pages/index.vue` | Perbedaan konten lokal vs produksi dapat membingungkan audit | Tidak ada cacat; catat bahwa konten hero dikelola CMS | RESOLVED (informasional) |

## 4. P2 — pertumbuhan dan optimasi lanjutan

| ID | Area | Usulan | Status |
|---|---|---|---|
| FLB-GROW-01 | Marketing | Landing page khusus kampanye hanya bila intent menuntut; saat ini halaman existing cukup | PLANNED |
| FLB-GROW-02 | Marketing | Evaluasi Meta Conversions API setelah ada backend event provenance + consent + dedup `event_id` | PLANNED |
| FLB-GROW-03 | Pengukuran | Import konversi CRM → Google Ads/Meta setelah tahap lead dapat dipercaya | PLANNED |
| FLB-GROW-04 | Konten | Perluas klaster konten (panduan tambahan) tanpa halaman tipis/duplikat | PLANNED |
| FLB-GROW-05 | UX | Modul properti terkait dan breadcrumb visual di halaman detail | PLANNED |
| FLB-GROW-06 | Pengukuran | A/B testing terkontrol setelah baseline trafik stabil | PLANNED |

## 5. Audit UI/UX tiga peran — 2026-10-14

Pemeriksaan menyeluruh permukaan publik (pengunjung), workspace Admin, dan workspace Marketing: bahasa, label, format angka/tanggal, konsistensi nama halaman, tabel responsif, pesan error, dan redundansi. Temuan diperbaiki pada branch `fix/ui-consistency` dan di-merge ke `main` (lihat [implementation-status.md](../implementation-status.md)); ringkasannya:

| ID | Area | Temuan | Perbaikan | Status |
|---|---|---|---|---|
| FLB-UI-01 | Publik | Tanggal ISO tampil ke pengunjung di 8 tempat (masa berlaku suku bunga, harga program, periode skema pembayaran, tanggal sumber POI/kawasan) | Helper `shared/utils/format.ts` (`formatDate`, `formatDateRange`) dipakai di beranda, kalkulator KPR, `PropertyCommercial`, `PropertyLocation`, `bandung-timur` | FIXED |
| FLB-UI-02 | Publik | Luas tampil "90.00 m²" (desimal titik) di kartu, detail, dan perbandingan | `formatArea` (desimal koma, nol desimal dihilangkan); spek `foundation.spec.ts` memakai helper yang sama | FIXED |
| FLB-UI-03 | Publik | Persen dan tenor tampil "2.75%", potensi "1.5 tahun" | `formatPercent`/`formatNumber` (id-ID) di beranda dan kalkulator | FIXED |
| FLB-UI-04 | Publik | CTA beranda "Rencanakan survei" menyimpang dari istilah "kunjungan" yang dominan; dua CTA berbeda label untuk tujuan kunjungan yang sama | Istilah distandarkan ke "kunjungan"; label unik per tujuan | FIXED |
| FLB-UI-05 | Publik | Footer memakai "Bicarakan dengan Admin" untuk tautan WhatsApp identik dengan header "Hubungi Admin" | Footer memakai "Hubungi Admin" | FIXED |
| FLB-UI-06 | Publik | Alt/caption gambar ilustrasi tidak konsisten ("Foto suasana" vs "Foto inspirasi" vs "Ilustrasi"); badge `MediaDisclosure` hanya menyala bila alt diawali "Ilustrasi" | Deteksi berbasis kata kunci "ilustrasi"/"inspirasi" (case-insensitive); label badge "Ilustrasi" | FIXED |
| FLB-UI-07 | Publik | Pesan "Kontak konsultasi belum tersedia." tidak muncul saat nomor WhatsApp tidak valid (hanya muncul bila properti tidak ada) | Pesan tampil setiap kali tautan handoff tidak tersedia | FIXED |
| FLB-UI-08 | Publik | Tombol unduh brosur memakai teks alt sebagai nama berkas; `aria-label` tombol cari tidak sesuai aksi | Label diganti "Unduh brosur (PDF)"; aria-label "Cari properti" | FIXED |
| FLB-UI-09 | Admin/Marketing | Nama halaman berbeda antara sidebar, judul tab, dan `<h1>` (mis. Katalog properti/Katalog tim/Kelola properti) | Nama disatukan per halaman (nav = `<h1>` = judul tab) | FIXED |
| FLB-UI-10 | Admin/Marketing | Istilah campur: "lead" vs "calon pembeli", "workspace" vs "ruang kerja", "Policy", "queue/backlog/failed jobs/processing/storage", "cohort", "Follow-up", "Cash", "published", "draft" | Distandarkan ke bahasa Indonesia pada seluruh teks yang terlihat (istilah teknis seperti `fixed`, `floating`, `LTV`, `PWA` tetap karena dipakai industri/bank) | FIXED |
| FLB-UI-11 | Admin/Marketing | Enum mentah tampil ke pengguna (status lead di halaman retensi, kepala kolom "DEAL") dan versi internal ditampilkan | Memakai `leadLabels`; kolom versi dihapus; kepala kolom memakai label Indonesia | FIXED |
| FLB-UI-12 | Admin/Marketing | Pesan error memakai `role="status"` (tanpa gaya error) pada properti/konten/media/lokasi/komersial/akun/profil | Pola `success` + `:role`/kelas dinamis, konsisten dengan halaman CRM | FIXED |
| FLB-UI-13 | Admin/Marketing | Ketidaksesuaian `<th>` vs `data-label` tabel responsif (7 kolom), label ganda `StaffPicker`, typo "maksimal20", instruksi menunjuk menu yang tidak ada | Diselaraskan; label ganda dijadikan `sr-only`; typo dan instruksi diperbaiki | FIXED |
| FLB-UI-14 | Admin | Tombol terkunci tanpa penjelasan (verifikasi komersial, unggah logo, batas skema/POI) dan pesan aksi arsip/retry yang generik | Petunjuk ditambahkan; pesan dibedakan per aksi | FIXED |
| FLB-UI-15 | Publik | Redundansi: blok langkah 01/02/03 beranda mengulang label yang sama dengan blok pintasan; dua pengumuman pemuatan katalog | Label dibedakan agar tidak ambigu; pengumuman pemuatan ganda dihapus | FIXED |
| FLB-UI-16 | Publik | Badge ketersediaan "Tersedia" tampil sebagai kepastian stok, sementara situs meminta konfirmasi ke Admin | Ditinjau: nilai berasal dari data properti yang dikelola Admin; narasi konfirmasi tetap dipertahankan. Perubahan label keputusan bisnis, tidak diubah sepihak | REVIEWED (kept) |
| FLB-UI-17 | Uji | Beberapa string yang diuji spec browser ikut berubah (format luas, label tombol) | Spec diperbarui memakai helper/semi teks yang sama; dijalankan pada build produksi lokal untuk area yang tidak memerlukan API | FIXED |

Catatan: istilah "fixed"/"floating" pada kalkulator KPR dipertahankan karena dipakai label produk bank dan diuji spec; istilah "Marketing" sebagai nama peran juga dipertahankan.

## 6. Tidak dapat diverifikasi dari lingkungan ini

- Stok/ketersediaan unit dan legalitas sertifikat — memerlukan konfirmasi dokumen resmi (status listing Cihapit sendiri sudah dikonfirmasi sebagai data uji pada 2026-10-14).
- Volume pencarian, CPC, kesulitan kata kunci, dan estimasi performa iklan — dilarang dikarang; lihat [seo-keyword-map.md](../marketing/seo-keyword-map.md).
- Kelayakan Google Business Profile dan identitas badan usaha — memerlukan dokumen resmi.
- Perilaku tag aktual di GTM/GA4/Ads/Meta — memerlukan akun dan container nyata.
- Core Web Vitals lapangan dan crawl aktual Search Console.

## 7. Yang sudah benar dan dipertahankan

- Katalog publik hanya berisi properti `PUBLISHED`; draft/arsip 404 di detail dan tidak masuk sitemap/compare.
- Resource publik berupa allowlist tanpa identitas Marketing dan tanpa data CRM.
- Harga IDR bilangan bulat, tanggal komersial dihitung pada zona Asia/Jakarta, dan perubahan komersial memakai optimistik `version` + audit.
- Perubahan CRM, histori, dan notifikasi atomik; histori tidak dapat diedit via API.
- Media privat (staging) tidak terekspos; CSP nonce ketat dan header keamanan lain aktif.
- Forum aksesibilitas dasar: skip-link, `aria-*`, dialog keyboard, reduced motion, fokus terlihat.
- Seed demo opt-in dan menolak environment non-lokal.

## 8. Rujukan

- [technical-seo.md](technical-seo.md) — detail kondisi SEO dan verifikasi.
- [performance-before-after.md](performance-before-after.md) — baseline dan protokol pengukuran.
- [analytics-event-taxonomy.md](../marketing/analytics-event-taxonomy.md) — kontrak event.
- [google-ads-setup.md](../marketing/google-ads-setup.md), [meta-ads-setup.md](../marketing/meta-ads-setup.md) — kesiapan kanal berbayar.
- [production-readiness.md](../deployment/production-readiness.md), [manual-actions-required.md](../deployment/manual-actions-required.md) — deploy dan tindakan manual.
