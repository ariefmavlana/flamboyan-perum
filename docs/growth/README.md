# Flamboyan: spesifikasi produksi, SEO, dan akuisisi

Versi 1.1 · 17 Oktober 2026 · **Implementasi diotorisasi pengguna; pembelian, penayangan iklan dan merge belum diotorisasi.** Bukti aktual: [validation.md](validation.md). Kontrak final: [backend-api-contract.md](backend-api-contract.md).

## 1. Keputusan pengguna

| ID   | Keputusan yang sudah diberikan                                           | Implikasi                                                                                       |
| ---- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| D-01 | Memilih shared hosting Hostinger yang sesuai                             | Kandidat harus membuktikan Nuxt SSR dan Laravel; tidak otomatis berpindah ke VPS                |
| D-02 | Database tetap Supabase; media tetap Cloudflare R2                       | Tidak ada migrasi ke MySQL, SQLite produksi, atau public bucket                                 |
| D-03 | Fokus penjualan Bukit Flamboyan Indah 2                                  | Banjaran tetap pengenalan; tidak masuk kampanye penjualan                                       |
| D-04 | Target calon pembeli Kota Bandung                                        | Alamat proyek tetap Cibiru Wetan, Kabupaten Bandung; target audiens tidak mengubah fakta lokasi |
| D-05 | Anggaran total awal Rp500.000 untuk satu bulan; Google Search lebih dulu | Meta paid Rp0 pada tahap awal; hosting/domain berada di luar anggaran media ini                 |
| D-06 | WhatsApp Admin dipertahankan dan formulir konsultasi/survei ditambahkan  | Pencatatan manual dan intake situs harus bertemu di CRM existing                                |
| D-07 | Belum menyiapkan akun ads                                                | Inventaris akun, kepemilikan, pengukuran dan pemeriksaan akun menjadi pekerjaan sebelum launch  |
| D-08 | Tujuan bisnis sampai akad                                                | Pisahkan kontak, lead valid, qualified, jadwal, kunjungan aktual, DEAL dan akad terbukti        |

Pengguna kemudian mengotorisasi implementasi, commit/push/PR, review dan pemeriksaan Vercel sebelum pembelian Hostinger. Detail wire mengikuti kontrak implementasi; policy produksi, SLA paket, billing/bidding, akun dan fakta legal tetap gate eksternal. Rp500.000 bukan jaminan jumlah lead, peringkat, penjualan atau akad dalam satu bulan.

## 2. Paket spesifikasi

| Dokumen                                            | Isi                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Hostinger](hostinger-production-spec.md)          | Kualifikasi paket, runtime, routing, Supabase, R2, queue, migrasi hosting dan rollback             |
| [SEO](seo-spec.md)                                 | Arsitektur informasi, kontrak indexability, konten, lokal, media, schema, performa dan operasi SEO |
| [Pengukuran dan CRM](measurement-crm-spec.md)      | Dua jalur intake, data/endpoint usulan, dedup, atribusi, consent, event dan hasil sampai akad      |
| [Google dan Meta](paid-acquisition-spec.md)        | Search bulan pertama Rp500.000, kesiapan Meta, landing page, kreatif, anggaran dan evaluasi        |
| [Rencana dan verifikasi](delivery-verification.md) | Fase, acceptance, traceability, risiko, keputusan terbuka dan bukti yang diperlukan                |

## 3. Konteks aplikasi yang menjadi batas

Sumber baseline: [PRD](../PRD.md), [SRS](../SRS.md), [arsitektur](../architecture.md), [status implementasi](../implementation-status.md), dan [API existing](../API_DOCS.md). Baseline source diperiksa pada `origin/main` `79e3d56` setelah fetch 16 Oktober 2026. Hasil pembacaan source tidak merupakan pemeriksaan live, akun Hostinger, Supabase, R2, GTM atau ads.

- Nuxt SSR + Laravel REST modular monolith; browser memakai API same-origin; otorisasi backend.
- Lima tipe aktif: 36/60, 36/90, 56/90, 62/70, 69/80. Harga, ketersediaan dan promosi berasal dari katalog/CMS, bukan salinan di landing page.
- Revisi terbaru membatasi BSI Rp3.700.000/bulan selama 180 bulan ke **36/60**. BNI/BSI Griya mengikuti penawaran terverifikasi; angka tarif yang belum tersedia tidak diisi.
- WhatsApp utama berasal dari DEVELOPMENT CMS, fallback source `6282214795024`; nomor harus diverifikasi kembali saat launch. Tidak mengirim pesan pada pekerjaan spesifikasi.
- Lead existing wajib terkait satu properti, dedup nomor+properti, manual Admin, assignment terkontrol, optimistic concurrency, histori append-only dan notifikasi atomik.
- Pipeline existing: NEW_LEAD → FOLLOWED_UP → SURVEY_LOKASI → PEMBERKASAN_KPR → DEAL; LOST terminal. Desain ini tidak diam-diam mengganti makna status atau membuka terminal.
- Identitas Marketing/data CRM tidak masuk halaman, schema, feed, event browser atau API publik.

## 4. Kondisi sekarang dan gap yang terbukti pada source

| Bukti source                           | Kondisi                                                                      | Gap untuk target                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/web/nuxt.config.ts`              | SSR aktif; proxy produksi dikondisikan `VERCEL === '1'`                      | Routing Hostinger perlu desain dan smoke auth/media; dukungan Node saja belum cukup          |
| `server/routes/robots.txt.get.ts`      | `Disallow: /*?` memblokir seluruh URL ber-query untuk crawler umum           | Pisahkan filter, pagination dan parameter kampanye; periksa AdsBot                           |
| `server/routes/sitemaps/[file].get.ts` | Sitemap halaman dan properti published sudah ada                             | Aturan kelayakan Banjaran, query, perubahan konten/harga dan migrasi domain perlu diperjelas |
| `app/composables/useAnalytics.ts`      | Campaign dibaca dari query route saat event                                  | Belum ada kontrak persistence lintas halaman atau hubungan campaign ke lead                  |
| `app/plugins/consent.client.ts`        | Memuat GTM opsional; mengirim event consent kustom                           | Default/update Consent Mode resmi dan pemetaan container masih perlu dibuktikan              |
| `server/utils/csp.ts`                  | Host koneksi/gambar Meta bergantung `metaPixelId`                            | Meta melalui GTM memerlukan konfigurasi CSP yang sesuai jalur aktif                          |
| `docs/API_DOCS.md` dan SRS             | Intake publik, provenance campaign dan konfirmasi akad belum menjadi kontrak | Perlu perubahan backend aditif; dilarang menyebutnya fitur selesai                           |

Dokumen marketing 14 Oktober berguna sebagai riwayat, tetapi anggaran Rp2 juta, katalog/nomor lama, status aset dan klaim kesiapan tracking di dalamnya tidak mengungguli keputusan di atas. Paket ini menjadi proposal pengganti strategi ke depan; tidak menyatakan deployment existing sudah berubah.

## 5. Non-goals

Tidak membangun WhatsApp Business Platform, chatbot, pembayaran/booking berbayar, pengajuan kredit ke bank, ERP, microservices, generic repository, dashboard BI baru, GTM server-side, atau integrasi ads API otomatis pada fase pertama. Tidak membeli paket/domain, mengubah DNS, memindahkan data, mengunggah kontak ke platform iklan, mengaktifkan iklan, atau mengubah akun pada PR dokumen ini.

## 6. Sumber resmi dan tingkat verifikasi

Ditinjau 16 Oktober 2026. Batas paket/produk dan kebijakan perlu diperiksa lagi saat eksekusi.

| ID    | Sumber                                                                                                                       | Pemakaian                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| H-01  | [Hostinger Node.js Web Apps](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)                 | Business/Cloud tertentu mendukung Node/Nuxt; batas platform dan build/release               |
| H-02  | [Database Hostinger](https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/)           | PostgreSQL server lokal bukan fasilitas Web/Cloud; koneksi eksternal tetap harus diuji      |
| H-03  | [Pengaturan PHP Hostinger](https://www.hostinger.com/support/4667515-how-to-manage-php-extensions-and-options-in-hostinger/) | Ekstensi bergantung versi PHP; konfirmasi runtime aktual                                    |
| H-04  | [Batas paket Hostinger](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)      | Periksa SKU/akun, batas resource, website dan Node; jangan memakai nama paket sebagai bukti |
| DB-01 | [Koneksi PostgreSQL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)                              | IPv4/IPv6, session/transaction pooler, prepared statements dan TLS                          |
| R2-01 | [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)                                            | Domain publik mengubah batas akses bucket; baseline tetap private                           |
| G-01  | [Perpindahan URL Google](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)             | Mapping dan redirect bila domain/URL berubah                                                |
| G-02  | [Faceted navigation](https://developers.google.com/crawling/docs/faceted-navigation)                                         | Kebijakan filter dan kendali ruang URL                                                      |
| G-03  | [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)                                      | Target pengalaman pengguna dan pembuktian lapangan                                          |
| G-04  | [Kebijakan spam Search](https://developers.google.com/search/docs/essentials/spam-policies)                                  | Doorway, scaled content dan link spam                                                       |
| G-05  | [Google Business Profile](https://support.google.com/business/answer/3038177?hl=en)                                          | Kelayakan bisnis dan kantor penjualan; bukan membuat profil tiap tipe                       |
| G-06  | [Consent Mode](https://developers.google.com/tag-platform/security/guides/consent)                                           | Default/update serta API template GTM                                                       |
| G-07  | [Primary/secondary conversions](https://support.google.com/google-ads/answer/11461796?hl=en)                                 | Memisahkan observasi dan tujuan bidding                                                     |
| G-08  | [Budget Google Ads](https://support.google.com/google-ads/answer/10486536)                                                   | Average daily budget dan limit bulanan kalender                                             |
| G-09  | [Location presence](https://support.google.com/google-ads/answer/9376662?hl=en)                                              | Target kehadiran calon pembeli di Kota Bandung                                              |
| G-10  | [Enhanced conversions](https://support.google.com/google-ads/answer/9888656?hl=en-EN)                                        | Fase lanjutan dengan sumber first-party dan proses sah                                      |
| G-11  | [Galeri structured data Search](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)         | Schema valid tidak menjamin fitur rich result                                               |

Dokumentasi Meta CAPI mengembalikan HTTP429, dan halaman kategori iklan Meta meminta login ketika diperiksa. Karena itu ketentuan Meta per negara/akun, versi API, jendela atribusi dan mekanisme teknis final berstatus **BELUM DIVERIFIKASI**. Rancangan Meta di sini adalah kebutuhan produk dan kriteria verifikasi, bukan klaim konfigurasi yang saat ini pasti tersedia.
