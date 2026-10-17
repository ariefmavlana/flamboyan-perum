# Setup pengukuran sebelum aktivasi akun

Kode tidak memasang akun/tag resmi. Pemilik menginventaris akun existing terlebih dahulu, kemudian menautkan ID yang benar setelah notice, consent dan akses disahkan. Budget tetap Google Search dulu, total uang keluar maksimal Rp500.000/bulan; Meta paid Rp0. Tidak ada upload kontak atau offline conversion fase ini.

## Konfigurasi

| Variabel web | Tujuan |
| --- | --- |
| NUXT_PUBLIC_GTM_ID | Satu container GTM milik bisnis; kosong berarti tidak load |
| NUXT_PUBLIC_META_VIA_GTM | true hanya bila container mempunyai Pixel yang telah direview; menambah host Meta pada CSP |
| NUXT_PUBLIC_META_PIXEL_ID | Fallback direct Pixel; jangan aktifkan bersamaan dengan GTM Pixel. Jika GTM terisi kode direct tidak digunakan |
| NUXT_PUBLIC_ATTRIBUTION_ENABLED | Penyimpanan sanitized first/last consented context; bukan izin memuat seluruh tag |
| NUXT_PUBLIC_INDEXABLE | false pada semua preview/staging |

API mempunyai gate notice/retensi dan lima ID terpisah. Tidak memasukkan token provider, APP_KEY, proxy secret, DB/R2 credential pada runtime public. Consent skema versi 2 berlaku maksimal 180 hari; context browser maksimal 30 hari. Perubahan atau penolakan optional consent membersihkan context. Nama/nomor/pesan/receipt/lead ID tidak dikirim dalam event.

## Resep container GTM

1. Buat satu Google tag/GA4 milik bisnis. Matikan automatic page_view (`send_page_view=false`), enhanced measurement yang merekam URL/query/form, automatic form detection, dan user-provided/enhanced-conversion data collection. Jangan memakai built-in Page URL/referrer atau URL query sebagai parameter event. Semua tag memerlukan public-page guard serta consent category yang sesuai.
2. Container hanya dimuat sesudah optional consent pada route publik. Default Consent Mode v2: analytics_storage, ad_storage, ad_user_data, ad_personalization denied sebelum load. Update berasal dari plugin sebelum event berikutnya; Ads data redaction aktif dan URL passthrough mati. Basic consent implementation ini tidak sengaja mengirim cookieless ping sebelum pilihan.
3. Custom event `page_view`: baca `page_location`, `page_path`, `page_referrer` sanitized dari dataLayer; guard `flamboyan_public_page=true`, `consent_analytics=granted`. Satu pageview per navigasi SPA, tanpa query/hash. Jangan menambah trigger All Pages/history otomatis lain yang menggandakan event.
4. Event allowlist: view_property, select_property, compare_property, calculate_mortgage, click_whatsapp, request_visit, inquiry_submitted. Parameter hanya property_id/type, page_type, content_group, lead_channel dan sanitized source/medium/campaign. Jangan mengirim DOM input, nomor tujuan WhatsApp, link WA penuh, click URL, form fields atau teks bebas.
5. GA4 mengamati inquiry_submitted sebagai form tersimpan, click_whatsapp sebagai intent. Keduanya belum valid lead. Jangan membuat purchase event/value harga rumah. CRM adalah sumber qualification, kunjungan dan akad; belum ada transfer otomatis ke Google/Meta.
6. Google Ads conversion link/goal diaktifkan hanya setelah tag diuji di akun yang benar. Bila form observation dipakai sebagai secondary, namanya harus jelas. Jangan mengoptimalkan Smart Bidding seolah klik WA = lead valid/akad. Auto-tagging provider dapat aktif pada akun, namun fase ini tidak menyimpan gclid/gbraid/wbraid/fbclid untuk upload offline.
7. Pixel via GTM harus marketing-consented; pageview SPA dan ViewContent satu kali. Jangan sekaligus memasang direct Pixel. Meta website/form custom event tetap bukan qualification CRM; CAPI/offline import ditunda.

Container resmi adalah kode pihak ketiga yang dapat mengirim data sendiri. Karena itu kelulusan fixture browser belum mengesahkan container bisnis: inspeksi network aktual, Tag Assistant, GA4 DebugView dan Meta Test Events tetap gate setelah pemilik menyediakan akun. Periksa consent revocation, private route navigation, autofire/referrer, adblocker, reload, SPA/back, satu vs dua category, dan duplikasi. Tidak ada tag di login/reset/backoffice, termasuk private query.

## UTM dan provenance

Gunakan lowercase kode source/medium/campaign/content. Contoh: `utm_source=google&utm_medium=cpc&utm_campaign=bfi2_search_kota_bandung_<periode>`. Instagram organik `instagram/organic_social`, Facebook organik `facebook/organic_social`; paid memakai paid_social. Term hanya keyword yang diizinkan, bukan pencarian bebas dengan data pribadi. Landing bersih tetap canonical; preview/social link tanpa tracking.

CLIENT_REPORTED dan ADMIN_REPORTED bukan verifikasi platform. Outcome UNKNOWN tetap dicatat dan ditampilkan. Campaign registry minimal: platform, official campaign ID, kode UTM, landing, periode, anggaran bersih, biaya tagihan, PIC, status dan tanggal review. ID akun/kampanye yang belum dibuat dibiarkan kosong, tidak dibuat-buat.

## Bukti penerimaan

Fixture browser membuktikan no tag sebelum keputusan, consent ditolak tetap bisa submit, retry 503 tidak memberi event sukses, 202 memberi satu inquiry_submitted tanpa PII, login+CRM memakai same-origin session/CSRF, dan source/report tidak mengklaim platform verification. Pengujian akun resmi serta data lapangan hanya dapat ditutup setelah akun dikonfigurasi dan trafik tersedia.
