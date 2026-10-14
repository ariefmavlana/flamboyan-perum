# Tindakan manual yang diperlukan

Versi 1.0 · 2026-10-14 · Daftar tindakan yang **tidak dapat** dilakukan dari dalam repository: memerlukan akun, akses, keputusan bisnis, atau pengesahan legal.

Dokumen ini adalah daftar tunggal; setiap item menyebutkan pemilik, alasan, dan bukti yang diharapkan.

## 1. Pemilik bisnis

| # | Tindakan | Mengapa | Bukti selesai |
|---|---|---|---|
| B1 | Putuskan status listing "Rumah Minimalis Cihapit" (`/properti/weje`) | Data tampak tidak konsisten dan tidak ada sumbernya di repository; lihat Lampiran A untuk prosedur unpublish terkontrol | Status terpublikasi/arsip sesuai keputusan + spesifikasi benar bila tetap tayang |
| B2 | Tetapkan domain produksi resmi | Canonical/sitemap saat ini memakai hostname Vercel | Domain aktif + `NUXT_PUBLIC_SITE_URL` diperbarui |
| B3 | Konfirmasi masa berlaku harga program (≤ 2026-10-29), biaya program (30 Oktober), dan harga berikutnya (31 Oktober) | Perilaku kode mengikuti data ini; komunikasi iklan harus selaras | Konfirmasi tertulis dari sumber harga |
| B4 | Sediakan data legal/unit yang belum ada (sertifikat, koordinat, fasilitas berjarak terukur, waktu tempuh) | Saat ini `CHECK_REQUIRED`/belum dicantumkan; dilarang mengarang | Data terverifikasi di CMS/katalog |
| B5 | Berikan username Instagram resmi | Slot tautan sudah tersedia tetapi kosong | `NUXT_PUBLIC_INSTAGRAM_URL` diisi |
| B6 | Otorisasi anggaran iklan (Google Rp 1.000.000, Meta Rp 1.000.000 per bulan) | Rencana iklan tidak boleh mengeluarkan biaya tanpa persetujuan | Persetujuan tertulis |
| B7 | Sahkan notice privasi + kebijakan retensi | Halaman privasi menyatakan hal ini belum disahkan | Teks final disetujui |
| B8 | Konfirmasi nomor WhatsApp Admin yang berlaku | Nomor saat ini disebut "sementara" pada dokumen internal | Nomor final di CMS |
| B9 | Bila layak: buat/klaim Google Business Profile | Hanya bila bisnis memenuhi kelayakan Google (lokasi yang dapat dikunjungi) | Profil terverifikasi, NAP konsisten |
| B10 | Sediakan logo/favicon resmi | Aplikasi belum punya favicon; aset brand tidak boleh dikarang | Berkas aset disetujui |

## 2. Engineering / operasi

| # | Tindakan | Mengapa | Bukti selesai |
|---|---|---|---|
| E1 | **Rotasi kredensial** pada `apps/api/.env` dan `apps/api/.env.demo-cloud` (mis. `APP_KEY`, `API_PROXY_SECRET`, kunci R2/S3, kredensial database, `MAIL_PASSWORD`, `PUSHER_APP_SECRET`, `DEMO_PASSWORD`) lalu musnahkan salinan lokal yang tidak terpakai | Kedua berkas berisi field kredensial di disk. Keduanya sudah diabaikan git (`git check-ignore` terverifikasi) dan tidak pernah ter-commit, tetapi nilainya tetap berisiko selama masih aktif | Kredensial baru terpasang; akses lama dicabut; berkas lama dimusnahkan |
| E2 | Set variabel produksi di Vercel: `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_WHATSAPP_NUMBER`, `NUXT_PUBLIC_GTM_ID`, `NUXT_PUBLIC_META_PIXEL_ID` (opsional), `NUXT_PUBLIC_INSTAGRAM_URL` (opsional) | Fitur baru bergantung padanya | Preview deployment memuat nilai benar |
| E3 | Buat container GTM + tag GA4/Google Ads/Meta (ID resmi) | Orkestrasi tunggal mencegah duplikasi | Container dipublikasikan + uji Preview |
| E4 | Verifikasi domain di Search Console (dan di Meta bila memakai pixel) | Canonical & sitemap perlu dipantau | Verifikasi selesai |
| E5 | Jalankan smoke pasca-deploy: `/robots.txt`, `/sitemap.xml`, canonical detail, header CSP, banner consent | Memastikan perubahan rilis berperilaku seperti uji lokal | Catatan hasil |
| E6 | Bila ingin caching sitemap: tambahkan cache pendek ber-key versi | Saat ini `no-store` | Perubahan terukur, bukan asumsi |
| E7 | Verifikasi perilaku crawler `AdsBot-Google` terhadap `robots.txt` sebelum menjalankan Google Ads | Saat ini belum diverifikasi | Catatan kebijakan resmi Google + keputusan |
| E8 | Siapkan modul atribusi lead CRM (kolom sumber opsional + pemilihan oleh Admin) sebagai PR terpisah | Atribusi campaign → lead belum dimodelkan | PR terpisah dengan migrasi + uji |

## 3. Legal

| # | Tindakan | Mengapa |
|---|---|---|
| L1 | Tinjau dan sahkan teks privasi final (data controller, dasar pemrosesan, kategori data, pihak ketiga, retensi, hak pengguna, prosedur permintaan) | Wajib sebelum analytics/iklan berjalan; teks saat ini belum disahkan |
| L2 | Tinjau pernyataan harga/promo dan disclaimer simulasi KPR | Mencegah klaim yang dapat dianggap janji |
| L3 | Tinjau klaim kemitraan bank/testimonial | Saat ini digerbangi; harus tetap kosong sampai ada perjanjian/izin |

## 4. Marketing

| # | Tindakan | Mengapa |
|---|---|---|
| M1 | Isi kolom sumber lead secara manual saat mencatat lead (sementara tanpa atribusi otomatis) | Satu-satunya cara menghubungkan kampanye dengan hasil |
| M2 | Siapkan materi kreatif asli (foto/video) | Ilustrasi berlabel harus diganti bila ingin klaim foto nyata |
| M3 | Tinjau draf copy di [instagram-content-strategy.md](../marketing/instagram-content-strategy.md) sebelum dipublikasikan | Menghindari klaim berlebihan |
| M4 | Uji tautan iklan + UTM pada mode pratinjau sebelum aktivasi | Memastikan landasan pengukuran benar |

## Lampiran A — Prosedur unpublish terkontrol untuk listing tak terverifikasi

Tujuan: menghilangkan listing dari katalog/sitemap **tanpa** menghapus riwayat (tidak ada hard delete; riwayat lead tetap utuh).

1. Masuk ke workspace tim (`/backoffice`) dengan akun Admin.
2. Buka **Katalog tim**, cari listing (mis. "Rumah Minimalis Cihapit").
3. Ubah status publikasi menjadi **Arsip** (bukan hapus). Perubahan memakai pengaman versi: bila data sudah berubah di tempat lain, muat ulang lalu ulangi.
4. Periksa hasil: halaman detail mengembalikan `404`, listing hilang dari `/properti`, beranda (featured), `/bandingkan`, dan `/sitemaps/properties-*.xml`.
5. Bila keputusan bisnis adalah mempertahankan listing: lengkapi spesifikasi (luas, kamar, sertifikat), sumber data, dan hapus label yang menyesatkan; jangan hanya memperbaiki judul.
6. Bila listing terkait lead yang sudah berjalan, catat alasan arsip pada catatan properti/CRM agar tim memahami konteksnya.
