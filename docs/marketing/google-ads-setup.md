# Kesiapan Google Ads

Versi 1.0 · 2026-10-14 · **Tidak ada kampanye, akun, atau pembayaran yang dibuat/diaktifkan oleh pekerjaan ini.**

Dokumen ini menyiapkan struktur, pelacakan, dan pemetaan landing page untuk Google Search Ads dengan budget awal yang direncanakan. Angka volume pencarian, CPC, dan ekspektasi lead tidak dikarang.

## 1. Prasyarat sebelum aktivasi

1. FLB-CONTENT-01 (listing tak terverifikasi "Rumah Minimalis Cihapit") selesai diputuskan — lihat [manual-actions-required.md](../deployment/manual-actions-required.md).
2. FLB-PRIV-01: notice privasi dan kebijakan retensi disahkan.
3. FLB-SEO-01: domain resmi ditetapkan dan `NUXT_PUBLIC_SITE_URL` diperbarui.
4. GTM container aktif dengan GA4 + Google Ads conversion tag, dan banner consent tampil (persetujuan berfungsi).
5. Lead workflow CRM disepakati (siapa mencatat lead, kapan status berubah) — atribusi tidak dapat diklaim tanpa ini.
6. Konfirmasi harga program berlaku sampai 2026-10-29 dan harga/biaya 31 Oktober (agar iklan tidak menayangkan angka kedaluwarsa).

## 2. Pemetaan intent → landing page

| Kelompok pencarian (hipotesis) | Landing page sebaiknya | Alasan |
|---|---|---|
| Brand ("Bukit Flamboyan Indah 2", "Flamboyan Perum") | `/` atau halaman tipe yang dicari | Sudah mengenal; beri pengenalan cepat |
| Tipe spesifik ("rumah 36/60 Bandung") | `/properti/bukit-flamboyan-indah-2-36-60` | Harga/spesifikasi persis ada di halaman itu |
| Lokasi ("rumah Cibiru Wetan", "perumahan Bandung Timur") | `/bandung-timur` (konteks kawasan) atau katalog terfilter tanpa parameter query — hindari mengirim trafik ke URL filter ber-query | Query tidak diindeks dan rawan duplikat |
| Pembiayaan ("KPR rumah Bandung Timur") | Halaman tipe + anchor `#simulasi-kpr`, atau `/panduan/merencanakan-pembiayaan` | Kalkulator dan panduan sudah tersedia |
| Pertimbangan ("bandingkan rumah") | `/properti` (fitur bandingkan di kartu) | Fitur sudah ada |

Jangan mengarahkan semua iklan ke beranda; sesuaikan dengan intent agar biaya klik tidak terbuang.

## 3. Konvensi UTM

Pola: `utm_source`, `utm_medium`, `utm_campaign`, opsional `utm_content`, `utm_term` (untuk Search, gunakan `{keyword}`).

- Google Search: `utm_source=google`, `utm_medium=cpc`, `utm_campaign=flamboyan_search_bfi2_<bulan>`, `utm_content=<adgroup>`, `utm_term={keyword}`.
- Meta/Instagram: `utm_source=instagram`, `utm_medium=paid_social`, `utm_campaign=flamboyan_launch`, `utm_content=reels_property_36_60`.
- Aturan: huruf kecil, `snake_case`, tanpa spasi, tanpa data pribadi, tanpa nama staf. Nama campaign tidak boleh memuat nomor telepon atau alamat email.
- Parameter dibaca aplikasi dan dilampirkan ke event sebagai `traffic_source`/`traffic_medium`/`campaign_id` **setelah** persetujuan.

## 4. Konversi: hierarki dan definisi

| Tingkat | Tindakan | Definisi yang sah | Status implementasi |
|---|---|---|---|
| Utama | Lead tervalidasi | Lead tercatat di CRM dengan properti + kontak | Perlu proses CRM (belum ada kolom sumber; lihat bagian 6) |
| Utama | Kunjungan properti terkonfirmasi | Status lead `SURVEY_LOKASI` tercatat Admin | Perlu proses CRM |
| Sekunder | Niat kontak | Event `click_whatsapp` / `request_visit` | Sudah diimplementasikan (bukan konversi bisnis) |
| Sekunder | Evaluasi produk | `view_property`, `compare_property`, `calculate_mortgage` | Sudah diimplementasikan |

Aturan: **klik WhatsApp bukan lead**. Jangan menandai klik sebagai konversi "lead" di Google Ads, dan jangan menghitung konversi dua kali (mis. import GA4 **dan** tag langsung untuk aksi yang sama).

## 5. Opsi pelaporan konversi (pilih satu)

1. **Import konversi dari GA4** (disarankan sebagai awal): tandai `click_whatsapp`/`request_visit` sebagai key event di GA4, lalu import ke Google Ads. Kekurangan: hanya mengukur niat, bukan lead sebenarnya.
2. **Konversi off-line/CRM** (disarankan untuk lead sah): unggah konversi (manual/API) berdasarkan lead CRM; memerlukan kolom sumber lead dan proses ekspor. Belum tersedia.
3. Tag konversi langsung di GTM untuk event niat: sederhana tetapi paling rawan disalahartikan sebagai lead.

## 6. Enhanced conversions

**Belum layak diimplementasikan sekarang.** Syaratnya: sumber data first-party yang sah (form/CRM dengan consent), notice privasi sah, dan proses pencocokan aman. Saat ini lead dicatat manual oleh Admin dan tidak ada form publik, sehingga tidak ada sumber data pribadi first-party yang dapat dipakai. Tinjau kembali setelah CRM memiliki kolom sumber + consent tercatat.

## 7. Struktur kampanye awal (rencana)

- 1 kampanye Search (tujuan: lead; jaringan hanya Search; pasang di lokasi target Bandung Raya + sekitarnya).
- 2 ad group maksimum agar budget tidak terfragmentasi: (a) brand/proyek, (b) komersial non-brand (tipe/lokasi/KPR).
- Gunakan Responsive Search Ads dengan 3 headline utama yang mencerminkan tipe/lokasi; hindari klaim yang tidak ada di halaman (misal "siap huni" bila belum terverifikasi).
- Lokasi: Bandung Raya + area sekitar sesuai data akses yang terverifikasi; jangan mengklaim jarak/travel time.
- Waktu: sepanjang hari (tidak ada data konversi per jam untuk optimisasi awal).
- Kata kunci: frasa/eksak untuk tipe + lokasi; broad hanya setelah ada data.
- Kandidat negative keyword (perlu validasi): `sewa`, `kontrakan`, `lowongan`, `gratis`, `desain`, `software`, `jual tanah` (bila tidak relevan dengan inventori).

## 8. Pengukuran

Ikuti tabel pengukuran di [paid-ads-launch-plan.md](paid-ads-launch-plan.md). Yang wajib dipisahkan: metrik laporan platform (klik, CPC, biaya) vs hasil bisnis yang dikonfirmasi CRM (lead valid, qualified, kunjungan). Tanpa pemisahan ini, laporan akan menyesatkan.

## 9. Tindakan manual yang dibutuhkan

- Buat/verifikasi akun Google Ads, tautkan ke GA4 dan Search Console.
- Buat container GTM + tag GA4 + conversion tag (ID resmi) dan uji lewat Preview.
- Tetapkan aksi konversi utama dengan definisi pada bagian 4.
- Unggah/verifikasi kebijakan privasi di akun sesuai persyaratan Google.
- Aktifkan kampanye hanya setelah daftar periksa bagian 1 selesai dan pembayaran disetujui pemilik bisnis.
