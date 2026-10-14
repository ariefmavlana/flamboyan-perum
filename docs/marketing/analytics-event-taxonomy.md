# Taksonomi event analytics dan consent

Versi 1.0 · 2026-10-14 · Implementasi pada branch `feat/production-readiness` (belum di-merge, belum dikonfigurasi dengan ID resmi).

## 1. Keputusan arsitektur

- **GTM sebagai orkestrator tunggal.** Satu-satunya skrip pihak ketiga yang dimuat aplikasi adalah Google Tag Manager (`NUXT_PUBLIC_GTM_ID`). GA4, Google Ads, dan Meta Pixel dikonfigurasi **di dalam container**, bukan dimuat terpisah oleh aplikasi. Ini mencegah `page_view`/konversi terhitung dua kali.
- **Meta Pixel langsung bersifat opsional.** Bila pengguna belum memakai GTM, aplikasi dapat memuat pixel langsung (`NUXT_PUBLIC_META_PIXEL_ID`). Bila keduanya diisi, pixel langsung tetap dimuat tetapi aplikasi menulis peringatan konsol karena berisiko duplikasi — pilih satu jalur.
- **Default nonaktif.** Tanpa ID, tidak ada skrip yang dimuat, tidak ada banner persetujuan tampil, dan tidak ada data keluar dari situs.
- **Kode pihak ketiga tidak pernah memblokir render**: skrip dimuat `async` dan hanya setelah keputusan pengunjung.

## 2. Persetujuan (consent)

| Aspek | Keputusan |
|---|---|
| Kategori | `necessary` (selalu), `analitik`, `marketing` |
| Penyimpanan | `localStorage` `flamboyan-consent-v1`, berisi versi + keputusan + waktu; perubahan versi memaksa pilihan ulang |
| UI | Banner non-modal di layout publik, tombol "Terima semua", "Tolak opsional", "Atur pilihan", dapat dibuka ulang dari footer ("Pilihan privasi") dan halaman `/privasi` |
| Mode | Consent Mode v2 dengan sinyal `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`; mode Basic: container dimuat setelah persetujuan, sinyal dikirim sebagai `granted`/`denied` dan diperbarui bila pilihan berubah |
| Efek | Tanpa persetujuan opsional: tidak ada container, tidak ada pixel, tidak ada event yang dikirim |
| Aksesibilitas | Tombol dapat difokuskan, aktivasi via keyboard, tanpa dark pattern, menghormati reduced motion |

Catatan: menampilkan banner bukan bukti kepatuhan hukum. Notice/retensi masih memerlukan pengesahan (lihat [flamboyan-production-audit.md](../audits/flamboyan-production-audit.md) FLB-PRIV-01).

## 3. Kontrak event yang diimplementasikan

Semua event dibangun oleh helper murni (`shared/utils/analytics.ts`) dengan allowlist parameter; tidak ada parameter bebas.

| Event | Pemicu | Parameter yang dikirim | Dedup |
|---|---|---|---|
| `view_property` | Halaman detail properti termuat (SSR + hidrasi) | `property_id`, `property_type`, `page_type=property`, `content_group=katalog` | Sekali per properti per sesi |
| `select_property` | Klik judul kartu properti di katalog/beranda | `property_id`, `property_type`, `page_type=katalog` | Setiap klik (niat) |
| `compare_property` | Properti **ditambahkan** ke perbandingan | `property_id`, `page_type`, `content_group=perbandingan` | Setiap penambahan |
| `calculate_mortgage` | Simulasi KPR menghasilkan angka valid setelah pengguna mengubah input | `property_id`, `page_type=property`, `content_group=kpr` | Sekali per properti per sesi |
| `click_whatsapp` | Klik tautan `wa.me` (header, footer, kartu, detail, konsultasi) | `property_id` (bila ada), `property_type`, `page_type`, `lead_channel=whatsapp` | Setiap klik |
| `request_visit` | Klik tautan menuju konsultasi kunjungan | idem | Setiap klik |
| `flamboyan_consent_update` | Keputusan persetujuan dibuat/diubah | `consent_analytics`, `consent_marketing` (`granted`/`denied`) | Pada setiap perubahan |

Parameter kampanye (`traffic_source`, `traffic_medium`, `campaign_id`) diambil dari `utm_source`/`utm_medium`/`utm_campaign` pada URL dan dilampirkan hanya bila pengunjung telah memberi persetujuan opsional.

### Event yang sengaja **tidak** dibuat

| Event | Alasan | Pemilik tindak lanjut |
|---|---|---|
| `generate_lead` | Tidak ada bukti reliabel bahwa pesan WhatsApp terkirim; klik tombol bukan lead | CRM/Admin |
| `qualified_lead` | Kualifikasi hanya ada di workflow CRM (status lead), bukan di situs | CRM/Admin |
| `schedule_visit` | Jadwal kunjungan dikonfirmasi manual di percakapan, bukan oleh situs | CRM/Admin |
| `purchase`/`booking` | Tidak ada transaksi di situs | — |

Membuat event tersebut tanpa sumber data yang sah akan menghasilkan konversi palsu dan merusak optimisasi iklan.

## 4. Hubungan dengan analytics first-party existing

`usePropertyAnalytics` (POST `/api/v1/analytics` → `property_event_totals`) **tidak diubah**: tetap agregat harian per properti, tanpa PII, tanpa cookie, default nonaktif (`ANALYTICS_ENABLED=false`), dan tidak terhubung ke lead. Layer GTM berjalan berdampingan dan hanya untuk pengukuran kampanye setelah persetujuan. Jangan menyalakan dua-duanya untuk tujuan yang sama.

## 5. Larangan data

Tidak pernah dikirim sebagai parameter event: nama, nomor telepon/WhatsApp, isi pesan, email, alamat, NIK, isi form konsultasi, ID sesi staf, atau token. Nomor WhatsApp **tidak** ikut dalam payload (hanya `lead_channel=whatsapp`). URL yang dikirim tidak memuat query pengguna.

## 6. Pengujian

Yang **sudah dijalankan** pada branch ini (bukan klaim dashboard):

- Unit test Vitest: `tests/analytics.test.ts` (allowlist parameter, sanitasi nilai, batas 120 karakter, dedup key, pembacaan UTM), `tests/consent.test.ts` (parse/versi/keputusan), `tests/csp.test.ts` (host CSP hanya muncul saat ID diisi).
- Spec Playwright `tests/e2e/consent-tracking.spec.ts`: tanpa keputusan → tidak ada request ke `googletagmanager.com`/`connect.facebook.net`; setelah "Tolak opsional" → tetap tidak ada; setelah "Terima semua" → skrip dimuat; pilihan bertahan setelah reload. Spec otomatis `skip` bila server uji tidak dikonfigurasi GTM.

Yang **belum dijalankan** (memerlukan akun): GTM Preview, GA4 DebugView, verifikasi event masuk di Events Manager Meta, dan verifikasi deduplikasi bila GTM + pixel dipakai bersamaan.

## 7. Konfigurasi yang dibutuhkan

| Variabel | Fungsi | Nilai |
|---|---|---|
| `NUXT_PUBLIC_GTM_ID` | Memuat container GTM + memunculkan banner | Kosong sampai container resmi ada |
| `NUXT_PUBLIC_META_PIXEL_ID` | Memuat pixel langsung (alternatif GTM) | Kosong |
| `NUXT_PUBLIC_GA4_ID`, `NUXT_PUBLIC_GOOGLE_ADS_ID` | Catatan konfigurasi saja; **jangan** dimuat aplikasi | Dikonfigurasi di dalam GTM |

Bila GTM aktif, CSP produksi otomatis mengizinkan host Google Ads/GA (dan `td.doubleclick.net` untuk iframe konversi); bila pixel langsung aktif, CSP mengizinkan host Meta. Daftar host diuji sebagai unit test, namun validasi akhir terhadap container nyata tetap tindakan manual.
