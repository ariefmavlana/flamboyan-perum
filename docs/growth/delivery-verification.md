# Rencana pengiriman, risiko dan bukti penerimaan

Status: DRAFT. Paket ini menyelesaikan tahap spesifikasi yang diminta; bukan bukti fitur telah dibuat atau rilis sudah siap. Implementasi material memerlukan persetujuan pengguna atas scope/plan yang konkret menurut kontrak engineering.

## 1. Urutan dan batas fase

| Fase                                | Cakupan                                                                                      | Exit gate                                                                 | Di luar fase                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| F0: keputusan dan review            | Paket shared, domain, biaya/retensi/SLA, definisi qualified/akad, review spec                | Keputusan terbuka terselesaikan atau deferred dengan alasan               | Pembelian/deploy/iklan           |
| F1: hosting qualification           | Staging Nuxt+PHP, routing, Supabase/R2, worker/scanner, restore, load                        | requirement HOST terbukti; SLO queue disahkan                             | Cutover sebelum bukti            |
| F2: minimum acquisition product     | Form+inbox Admin+dedup+source, consent/GTM/GA4, template SEO/indexation, outcome operasional | Acceptance privacy/security/behavior lulus; dokumen API/status diperbarui | CAPI/API iklan/WhatsApp Platform |
| F3: production cutover              | Domain/redirect, runtime/routing, smoke, monitoring, rollback                                | Persetujuan cutover dan pemeriksaan pascarilis                            | Belanja iklan otomatis           |
| F4: Search 30 hari                  | Akun, keyword, draft ads, verifikasi/billing, launch setelah approval                        | Batas belanja/proses respons/hasil dilaporkan                             | Meta paid pada budget awal       |
| F5: SEO berkelanjutan dan perluasan | Konten berdasar data, SEO lokal, evaluasicohort; Meta/offlineconversions bila dipilih        | Budget dan scope baru disetujui                                           | Janji ranking/akad               |

Outcome tracking minimal sampai akad harus dirancang bersama intake/report, meskipun outcome aktual baru muncul kemudian. Pengiriman teknis dapat dipisah PR kecil dengan backward compatibility. Tidak membangun fitur yang lalu disembunyikan sebagai "selesai" sebelum jalur pengukuran dan operasinya terbukti.

## 2. Artefak implementasi berikutnya

1. Context dan requirement baseline dari paket ini; revisi keputusan pemilik dengan tanggal/provenance.
2. Plan per PR dengan acceptance, migration, privacy impact, rollout, rollback dan verifikasi spesifik.
3. API contract/migration proposal final berdasarkan schema existing, diagram route Hostinger yang telah diuji dan pilihan queue/scanner.
4. Review independen read-only full diff; thermo-nuclear saat menyentuh deployment/config/secrets/infrastructure dan area sensitif yang diwajibkan kontrak.
5. PR baru dari main terbaru dengan Conventional Commits, tanpa GitHub Actions, secret/dump/runtime lokal. Jangan merge tanpa instruksi pemilik.

## 3. Matriks acceptance dan bukti

| Test ID | Requirement       | Skenario/kelulusan                                                                  | Bukti yang diperlukan                                        |
| ------- | ----------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| V-HOST1 | HOST-01..08       | SKU Node/PHP/ekstensi/outbound/build dan resource sesuai                            | Hasil staging dan inventaris nonsecret                       |
| V-HOST2 | HOST-09..20       | SSR publik; staff auth, CSRF, inactive/logout, API errorstatus dan TLS database     | HTTP/browser+transaksi terisolasi                            |
| V-HOST3 | HOST-21..26       | media READY, revocation, scanner PDF, job retries/overlap/lag                       | Uji private/public serta kegagalan queue                     |
| V-HOST4 | HOST-27..32       | restore terisolasi, SHA manifest, monitor dan rollback satu scheduler               | Catatan rehearsal dengan runtime/timing                      |
| V-SEO1  | SEO-01..13        | Semua template, lima tipe, canonical, query/filter/page,404/503, sitemap            | Crawl/HTML assertions dan review source                      |
| V-SEO2  | SEO-14..24        | JSON-LD faktual, OGimage200, gallery/mobile/baseline CWV                            | Unit/schema/browser+lab, field terpisah                      |
| V-SEO3  | SEO-25..36        | NAP/kelayakan GBP, sources, peta konten, GSC dan reporting                          | Signoff konten dan bukti akun tanpa PII                      |
| V-CRM1  | CRM-07..18        | WAcontext; validasi form, penolakan consent, generic202, abuse dan error API        | Unit/feature+browser desktop/mobile                          |
| V-CRM2  | CRM-19..21        | Race/duplicate/idempotency/rollback transaksi, version409, pengaman status terminal | pengujian perilaku SQLite+PostgreSQL                         |
| V-CRM3  | CRM-01..06,22..26 | Inquiry→valid→qualified→visits→DEAL→akad; corrections/history                       | Rehearsal dua role, cohort/penanganan sampel/denominator nol |
| V-MEAS1 | MEAS-01..08       | Tolak semua, hanya analytics, hanya marketing, grant/revoke/reload, CSP dan SPA     | Browsernetwork+GTM Preview+Tag Assistant                     |
| V-MEAS2 | MEAS-09..12       | Dedup hydration/retry/refresh; no PII/secret/private routes; no falselead           | GA4 DebugView+review payload; provider lain sesuai fase      |
| V-ADS1  | ADS-01..28        | Kota Bandung dengan Presence, destination aktual, keyword/copy/cap, no doublegoal   | Draftsettingreview+billing dan persetujuan launch            |
| V-META1 | META-01..10       | Akun/kebijakan/aset/event/CSP verified untuk fase yang dipilih                      | Events Manager/Ads Manager; belum diasumsikan tersedia       |

Uji browser menggunakan skill/framework Playwright yang sesuai; screenshot+HTTP evidence di lingkungan aman. Data uji tidak bercampur CRM produksi, tidak menyertakan secret/kontak pada PR. Pengujian live read-only dan aksi tulis produksi mempunyai otorisasi terpisah.

Untuk kode yang diimplementasikan: Pint, PHPUnit SQLite dan PostgreSQL test, Composer validate/audit, frontend lint/typecheck/unit/build, browser flows dan dependency audit source/runtime mengikuti aturan repo. Catat versi runtime, perintah, durasi, hasil, skip dan keterbatasan. Kegagalan existing tetap dilaporkan; tidak menyebut audit runtime bersih sebagai audit source bersih.

## 4. Risiko dan mitigasi

| ID   | Risiko                                                         | Mitigasi/pemilik                                                                 | Gate                           |
| ---- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------ |
| R-01 | Shared mendukung Node tetapi auth/proxy/pgsql tidak cocok      | Engineering membuktikan alur lengkap; owner memilih paket setelah bukti          | Block cutover                  |
| R-02 | Cron-only melanggar push≤5 detik dan media backlog             | Ukur hosting; persetujuan eksplisit SLO alternatif atau arsitektur               | Block cutover sampai keputusan |
| R-03 | Memublikasikan bucket untuk mempercepat foto membocorkan draft | Pertahankan handler private/revocation; strategi cache tersendiri                | Block perubahan publicbucket   |
| R-04 | Budget habis tanpa cukup klik/lead untuk inferensi             | Search terpusat, cap, review kueri dan ukuran sampel; owner                      | Tidak menjamin akad/ROI        |
| R-05 | Klaim lokasi/promo salah atau expired                          | CMSsingle-source, review/expiry, targetaudiens terpisah alamat                   | Block copy/landing salah       |
| R-06 | WA manual menyisakan sumber tidak diketahui                    | Metode UNKNOWN/SELF_REPORTED, form deterministik dalam sistem                    | Wajib caveat laporan           |
| R-07 | Formspam/duplicate membanjiri CRM/merusak bidding              | Inbox validasi, throttle, idempotency, unique constraint DB, raw event secondary | Block konversi palsu           |
| R-08 | Event consent kustom dikira ConsentMode lengkap                | Default/update API resmi dan uji category/revoke                                 | Block tag sebelum lolos        |
| R-09 | Tracking via GTM terhalang CSP/terhitung ganda                 | Satu jalur tag, konfigurasi provider eksplisit, uji SPA/network                  | Block kepercayaan laporan      |
| R-10 | Staf lambat follow-up; jadwal/akad semu                        | PIC layanan/SLA, bukti outcome, audit terpisah dan review pending                | Block launch tanpa petugas     |
| R-11 | Migrasi URL kehilangan trafik/preview/tagging                  | Mapping+redirect+GSC+canonical+rollback origin lama                              | Block cutover tanpa mapping    |
| R-12 | PII/identifiers bocor analytics/log/provider                   | Minimisasi, encryptedserver, redaction, scopedaccess/retensi                     | Security fail-closed           |
| R-13 | Meta policy/API tidak terverifikasi pada penelitian            | Verifikasi di akun/dokumentasi sebelum setup/implementasi                        | Blokir aktivasi Meta/CAPI      |
| R-14 | Rollback code menghapus lead baru melalui restore DB           | Migrasi aditif, pertahankan DB, rekonsiliasi receipt, satu scheduler             | Blokir rollback destruktif     |

## 5. Keputusan yang masih memerlukan pemilik/bukti eksternal

| ID   | Pertanyaan/keputusan                                              | Default desain selama draft                                    | Kapan wajib selesai                                  |
| ---- | ----------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| O-01 | Nama domain resmi dan kewenangan DNS                              | Placeholder; tidak mengubah canonical produksi                 | Sebelum cutover/verificationakun                     |
| O-02 | SKU/harga Hostinger dan runtime pgsql/queue/scanner               | BusinessNode-capable sebagai kandidat; belum dipilih/dibeli    | Sebelum pembelian/cutover                            |
| O-03 | Target push bila shared cron-only                                 | Targetexisting≤5 detik tetap berlaku sampai perubahan disahkan | Sebelum implementasi deployment final                |
| O-04 | Rp500.000 termasuk pajak/biaya pembayaran?                        | Konservatif total uang keluar≤Rp500.000                        | Sebelum bidding/billing/activation                   |
| O-05 | Entitas pengendali, notice, retensi, optin dan hak pengguna       | Proposal bukan legalapproval; tracking/upload belum diaktifkan | Sebelum form publik/tag aktif                        |
| O-06 | Jamlayanan, PIC/cadangan, SLA, definisi qualified/akad            | Usulan respons≤30 menit saat layanan; akad confirmation Admin  | Sebelum outcome CRM dan launch iklan                 |
| O-07 | Harga aktif, DP/biaya, legalitas, fasilitas, stok dan syarat bank | Unknown dipertahankan; sumber terbaru CMS                      | Sebelum publikasi copy                               |
| O-08 | Inventaris akun existing dan kepemilikan                          | Belum setup ads bukan berarti semua akun lain belumada         | Sebelum membuat/menautkan akun                       |
| O-09 | GBP eligible, bukti kantor dan NAP                                | Tidak membuat profil tipe/rumah; verifikasi bisnis sebenarnya  | Sebelum profil lokal                                 |
| O-10 | Banjaran layak index atau noindex sementara                       | Tidak masuk kampanye penjualan                                 | Sebelum revisi sitemap/indexation                    |
| O-11 | Penanganan pembeli tunai yang tidak melewati tahap KPR existing   | Tidak mengubah pipeline diam-diam                              | Sebelum menyatakan funnel akad mencakup semua metode |

Keputusan budget/kanal/two-intake/proyek/geoaudiens sudah diberikan pengguna dan tidak perlu ditanyakan ulang. Pertanyaan di atas tidak menghalangi penulisan/review spesifikasi; aksi yang bergantung pada keputusan tersebut tetap tertahan.

## 6. Verifikasi PR spesifikasi ini

Perubahan hanya Markdown dan indeks status perencanaan. Tidak ada migrasi, dependency, container tag, perubahan runtime, pembelian, deployment atau spending. Verifikasi yang relevan: `git diff --check`, validasi link lokal/ID requirement, pemeriksaan scope dan review independen. Suite aplikasi tidak dijalankan ulang untuk dokumen-only; bukan klaim hasil test kode.

Dokumen ini tidak ditandai siap implementasi hanya karena review AI lulus. Hasil review dan bukti command aktual dicatat pada PR; hasil uji deployment/akun/field tetap NOT_RUN sampai dilakukan. PR tetap draft selama keputusan/validasi implementasi belum selesai.

## 7. Rollout dan rollback dokumen

Publikasikan sebagai draft spec pada PR branch terpisah. Sumber historis dipertahankan dan diberi konteks melalui README; angka budget/produk lama tidak dipakai untuk fase baru. Rollback dokumen cukup revert commit ini; tidak ada rollback database, perubahan DNS atau penghentian kampanye yang diperlukan dari PR dokumen.
