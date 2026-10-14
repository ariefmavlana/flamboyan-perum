# Rencana peluncuran iklan berbayar

Versi 1.0 · 2026-10-14 · **Rencana, bukan otorisasi belanja.** Tidak ada kampanye atau pembayaran yang diaktifkan.

## 1. Konstrain budget

| Kanal | Batas bulanan yang direncanakan | Catatan |
|---|---|---|
| Google Ads | Rp 1.000.000 | Search saja pada tahap awal |
| Meta Ads | Rp 1.000.000 | Instagram-first, 1–2 ad set |
| Total | Rp 2.000.000 | Jangan dipecah ke banyak kampanye sehingga tidak ada cukup data |

Budget kecil berarti setiap keputusan harus konservatif: satu kanal, satu tujuan, satu pengukuran.

## 2. Prasyarat (harus tertutup sebelum aktivasi)

1. FLB-CONTENT-01: keputusan listing tak terverifikasi selesai.
2. FLB-PRIV-01: notice privasi + kebijakan retensi disahkan.
3. FLB-SEO-01: domain resmi + `NUXT_PUBLIC_SITE_URL` final.
4. ID resmi GTM/GA4/Google Ads/Meta Pixel terpasang dan diuji (Preview/DebugView).
5. Banner consent tampil dan terbukti memblokir tag sebelum persetujuan.
6. Harga yang ditayangkan iklan masih berlaku (batas program 2026-10-29; harga berikutnya 2026-10-31).
7. Proses pencatatan lead CRM berjalan (siapa mencatat, kapan status berubah).
8. Otorisasi anggaran dari pemilik bisnis.

## 3. Struktur kampanye

### Google Search

- 1 kampanye, tujuan lead, jaringan Search saja.
- Ad group A (brand/proyek): kata kunci nama proyek dan varian ejaan.
- Ad group B (komersial): tipe + lokasi + pembiayaan; frasa/eksak lebih dulu.
- Landing page mengikuti [google-ads-setup.md](google-ads-setup.md) bagian 2.
- Kandidat negative keyword: `sewa`, `kontrakan`, `lowongan`, `gratis`, `desain`, `software` (validasi saat kampanye dibentuk).

### Meta Ads

- 1 kampanye, tujuan prospek/percakapan; 1–2 ad set dengan audiens geografis Bandung Raya dan sekitarnya.
- Kreatif: Reels vertikal + carousel (lihat [instagram-content-strategy.md](instagram-content-strategy.md)).
- Periksa kewajiban kategori iklan perumahan untuk akun/wilayah Indonesia.
- Jangan menilai hasil sebelum periode pembelajaran selesai; jangan mengubah kreatif/audiens terlalu sering.

## 4. UTM

Pola: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` (Search). Contoh Meta:

```
https://<domain>/konsultasi?utm_source=instagram&utm_medium=paid_social&utm_campaign=flamboyan_launch&utm_content=reels_property_36_60
```

Aturan: `snake_case`, huruf kecil, tanpa spasi, tanpa data pribadi, tanpa nama staf.

## 5. Rencana pengukuran

| Metrik | Sumber | Pemisahan |
|---|---|---|
| Belanja, impresi, klik, CTR, CPC | Laporan platform | Metrik platform |
| Sesi landing page | GA4 (setelah consent) | Metrik platform/web |
| Niat kontak (`click_whatsapp`, `request_visit`) | Event situs (dataLayer → GA4) | Engagement, bukan lead |
| Lead valid | CRM (`leads` tercatat) | Hasil bisnis |
| Qualified prospect | CRM (status lanjutan) | Hasil bisnis |
| Kunjungan terkonfirmasi | CRM (`SURVEY_LOKASI`) | Hasil bisnis |
| Biaya per lead valid | Belanja ÷ lead valid CRM | Hasil bisnis |
| Biaya per kunjungan terkonfirmasi | Belanja ÷ kunjungan CRM | Hasil bisnis |

Catatan penting: `click_whatsapp` **bukan** lead. Karena percakapan WhatsApp tidak teramati sistem, satu-satunya jalur lead yang sah saat ini adalah pencatatan Admin ke CRM. Selama itu berjalan manual, atribusi kampanye → lead bergantung pada disiplin pencatatan dan (nanti) kolom sumber lead.

## 6. Irama evaluasi

- Kumpulkan data minimal satu periode pembelajaran penuh sebelum mengubah struktur.
- Evaluasi mingguan pada tingkat: biaya, niat kontak, dan lead CRM (dengan jumlah absolut kecil, bedakan sinyal dari kebetulan).
- Hentikan elemen yang jelas tidak relevan (mis. kata kunci yang mendatangkan pencarian sewa), bukan berdasarkan satu hari data.

## 7. Batas

- Tidak ada angka ekspektasi klik/lead/ROI di dokumen ini karena semuanya bergantung data aktual; mengarang angka akan menyesatkan keputusan.
- Tidak ada kampanye, akun, atau pembayaran yang dibuat. Aktivasi memerlukan keputusan dan akses pemilik bisnis.
- Atribusi multi-touch, nilai konversi, dan bidding otomatis berbasis data belum layak sebelum ada lead CRM yang cukup.
