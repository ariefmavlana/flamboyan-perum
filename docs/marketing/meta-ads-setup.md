# Kesiapan Meta Ads (Facebook/Instagram)

Versi 1.0 · 2026-10-14 · **Tidak ada pixel, akun, atau kampanye yang dibuat/diaktifkan oleh pekerjaan ini.**

## 1. Status saat ini

- Meta Pixel **belum ada** di aplikasi. Yang tersedia pada branch ini: loader pixel langsung yang bersifat opsional dan consent-aware (`NUXT_PUBLIC_META_PIXEL_ID`), serta jalur yang disarankan yaitu menempatkan pixel di dalam GTM agar tidak ada dua sumber `PageView`.
- Bila GTM dan pixel langsung aktif bersamaan, aplikasi menulis peringatan konsol karena `PageView` berpotensi terhitung dua kali.
- Meta Conversions API (CAPI) **belum dijustifikasi**: tidak ada provenance event di backend, tidak ada consent server-side, dan tidak ada kebutuhan yang membenarkan penambahan server hanya demi terlihat canggih.

## 2. Pemetaan event

| Peristiwa situs | Event Meta | Catatan |
|---|---|---|
| Halaman dimuat | `PageView` | Dikirim sekali; jangan gandakan dengan pixel di GTM bila loader langsung juga aktif |
| Melihat detail properti (`view_property`) | `ViewContent` | Dikirim oleh loader langsung; di GTM setara dapat dipetakan ke custom event `view_property` |
| Klik WhatsApp/evaluasi lain | `trackCustom` dengan nama event situs (`click_whatsapp`, `calculate_mortgage`, `compare_property`, `select_property`, `request_visit`) | Tidak dipetakan ke `Lead`/`Schedule` |
| Lead sungguhan | **Tidak dikirim dari situs** | Hanya boleh dicatat melalui proses bisnis yang sah (CRM) |

Aturan: tidak ada `Purchase`, tidak ada `Schedule` yang mengklaim kunjungan terkonfirmasi, dan tidak ada `Lead` yang dipicu oleh klik tombol. Kesalahan pemetaan ini membuat optimisasi Meta mengejar tindakan yang salah.

## 3. Consent dan privasi

- Pixel hanya dimuat setelah pengunjung memberi persetujuan **marketing**.
- Bila memakai GTM, sinyal `ad_storage`, `ad_user_data`, dan `ad_personalization` dikirim sesuai pilihan (lihat [analytics-event-taxonomy.md](analytics-event-taxonomy.md)).
- Tidak ada data pribadi (nama/nomor/email) yang dikirim dari situs; tidak ada Parameter URL pengguna yang diteruskan.
- Bila CAPI dipertimbangkan di masa depan, syaratnya: provenance event backend yang dapat diaudit, dasar pemrosesan + notice yang sah, dan deduplikasi `event_id` dengan pixel. Belum ada satu pun yang terpenuhi.

## 4. Tindakan akun (manual)

1. Buat/verifikasi Meta Business Portfolio dan tetapkan pemilik + akses iklan.
2. Buat Meta Pixel/Dataset dan verifikasi domain (DNS atau meta-tag).
3. Tempatkan pixel (disarankan melalui GTM) dan uji dengan Events Manager Test Events + Meta Pixel Helper.
4. Hubungkan akun Instagram profesional yang resmi (username belum tersedia — jangan mengarang; lihat [instagram-content-strategy.md](instagram-content-strategy.md)).
5. Periksa kewajiban **Housing Special Ad Category** untuk akun dan wilayah Indonesia pada kebijakan Meta yang berlaku saat kampanye dibuat. Jangan menyalin aturan/pembatasan khusus Amerika Serikat; kewajiban kategori perumahan dapat berbeda per negara dan berubah dari waktu ke waktu.
6. Aktifkan kampanye hanya setelah pengukuran diuji dan budget disetujui.

## 5. Struktur kampanye awal (rencana)

- 1 kampanye (tujuan: prospek/percakapan) dengan 1–2 ad set; jangan memecah budget kecil ke banyak audiens.
- Audiens awal: geografis (Bandung Raya + sekitarnya) dengan penargetan detail tipe rumah/pembiayaan; hindari penargetan terlalu sempit yang membuat learning phase tidak selesai.
- Format: Reels vertikal untuk penemuan, carousel untuk perbandingan tipe.
- Kreatif wajib memakai ilustrasi berlabel (bukan diklaim sebagai foto asli) sampai foto asli pengembang tersedia.
- Konsekuensi budget kecil: keputusan perlu ditahan minimal 1–2 siklus belajar; jangan menilai hasil dari beberapa hari pertama.

## 6. Pengukuran

- Pisahkan angka platform (impresi, klik, biaya per hasil) dari hasil bisnis (lead valid yang dicatat CRM, kunjungan terkonfirmasi).
- Bila pixel dan GTM dipakai bersamaan, buktikan deduplikasi di Events Manager sebelum mempercayai angka.
- Formula singkat: biaya per lead valid = belanja ÷ lead valid CRM; jangan campur dengan "hasil" yang dilaporkan platform.

## 7. Batas

Semua langkah di bagian 4 dan 5 memerlukan akun, ID resmi, dan otorisasi pembayaran. Tidak ada satu pun yang dijalankan pada pekerjaan ini.
