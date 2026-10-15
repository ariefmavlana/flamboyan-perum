# Status implementasi

## Revisi KPR dan akun produksi — 16 Oktober 2026

Instruksi terbaru menggantikan cakupan BSI sebelumnya: program BSI Flat Rp3,7 juta/180 bulan **hanya 36/60**. BNI dan BSI Griya tersedia untuk seluruh lima tipe. Tarif proyek belum tersedia; Admin mengisi penawaran melalui CMS existing, tanpa tarif dummy. FINANCING_PROGRAM mendukung `house_types` dan `MURABAHAH_QUOTE` (harga, DP, tenor, total margin rupiah per tipe); kalkulator mengabaikan penawaran BSI bila harga tidak sama dengan harga aktif. BANK_RATE existing menyediakan bunga efektif/tahapan BNI. Seeder akun produksi opt-in, rahasia melalui konfigurasi privat; default seed tetap kosong. Kontrak, riset, validasi dan rollback: [production-accounts-kpr.md](production-accounts-kpr.md).

## Revisi lima tipe, BSI/BNI dan pembersihan data — 2026-10-15

Branch baru `codex/real-catalog-bsi-bni` dari `origin/main` `d3aafec`. Pemilik menetapkan tepat lima tipe EDITED dan mengonfirmasi BSI Rp3.700.000/bulan selama 15 tahun untuk semuanya; draf weje dikonfirmasi sebagai data uji. CMS FINANCING_PROGRAM memisahkan angsuran tetap dan informasi bank tanpa tarif proyek terkonfirmasi dari BANK_RATE/anuitas. Tampilan kawasan/detail dan form Admin mengikuti kontrak tersebut; sumber BNI resmi dicatat tanpa memakai promo expired atau promo developer lain sebagai tarif proyek. Tidak ada migration/dependency baru.

**Live selesai** 15 Oktober 13:30:16 WIB: setelah snapshot privat, verifikasi provenance/hash, rehearsal rollback dan transaksi atomik, 29 listing lama/uji, 72 lead sintetis, 338 histori, 198 notifikasi, 8 konten placeholder/BCA dan 2 akun Marketing uji tambahan dihapus. Tersisa 5 properti published, 0 CRM/history/notifications, 2 akun operasional dan 80 record media. HERO/DEVELOPMENT menyebut lima tipe dan informasi BSI/BNI; angka unit brosur lama tetap diberi konteks, bukan dianggap stok. R2 tidak dihapus. Seluruh 55 gambar live cocok receipt SHA-256; 5 sampul/5 denah diperiksa visual, seluruh sumber EDITED yang dimanifestasikan cocok hash dan folder tipe.

**Source siap review, belum merge/deploy**: kartu program dan schema baru sudah tersedia pada kandidat lokal. Dua record program pada `scripts/flamboyan-financing-programs.json` baru dipublikasikan melalui API Admin setelah backend/web PR ini deployed; tidak memasukkan jenis konten baru ke UI live versi lama. Tidak ada production seed atau GitHub Actions. Penjelasan kebutuhan, riset, data yang dihapus, perintah, batas rollout dan rollback: [real-catalog-financing-revision.md](real-catalog-financing-revision.md).

Validasi: PHP 8.4.26/PHPUnit 12.5.39; Pint lulus, SQLite **116 tests/932 assertions** (17,131s), PostgreSQL **116/932** (28,364s, database test terisolasi dan cluster dihentikan), Composer validate strict/audit 0; 19 tes importer lulus. Node 24.21.0: lint 0 warning, typecheck, **48 unit pada 11 file**, build node-server/proxy lulus. Audit runtime 0; source tetap **FAIL 11 high/0 critical**, advisori identik dengan baseline existing dan lockfile source tidak berubah. Browser kandidat memeriksa lima tipe/BSI/BNI, konteks CTA pembiayaan, workspace kosong kedua peran dan form CMS; pemeriksaan mobile menemukan nominal terpotong baris dan ditangani dengan susunan label/nilai satu kolom. Login/logout API live kedua peran lulus: 5 properti/0 lead/0 notifikasi, akses akun Admin200/Marketing403 dan sesi pascalogout401. Snapshot/credential/output runtime tidak masuk Git.

## Kontak utama Pak Andre — 2026-10-15

Atas instruksi pemilik, kontak utama menjadi 0822-1479-5024 (format WhatsApp `6282214795024`). Konten DEVELOPMENT produksi diperbarui melalui API Admin dengan optimistic version dan audit, tanpa mengubah payload bisnis lain. Fallback Nuxt, `.env.example`, contoh deployment dan environment Vercel preview/production diselaraskan agar kegagalan CMS tidak mengarahkan pengunjung ke nomor berbeda. Pesan konsultasi/detail tetap membawa konteks kawasan/properti; perubahan ini tidak mengirim pesan WhatsApp.

Validasi: lint/typecheck, 48 unit frontend, build node-server dengan proxy Vercel (23,8s), Pint, Composer validate/audit 0, masing-masing SQLite/PostgreSQL 113 tes/907 assertion (22,571s/32,976s), serta 19 tes importer lulus. Empat pemeriksaan browser fixture membuktikan prioritas CMS saat sehat dan fallback baru ketika endpoint konten503 pada konsultasi/detail, tanpa page error; fixture dan flag gangguan dibersihkan. Dua pemeriksaan kontak live serta login/logout browser Admin/Marketing existing juga lulus. Kredensial hanya diserahkan lewat berkas privat lokal ignored dengan ACL pemilik; tidak masuk source, log, screenshot, atau PR. Tidak membuat akun duplikat atau mengganti password existing.

Audit artefak runtime 0. Audit source masih FAIL 11 high/0 critical dengan advisori yang sama persis seperti risiko sementara yang telah diterima pemilik; dependency/lock source tidak berubah. Percobaan audit output sebelum membuat lock artefak berhenti ENOLOCK, bukan hasil audit bersih; lock dibuat hanya pada output ignored lalu audit dijalankan ulang. Tidak ada migration, perubahan API, CRM, media/R2, atau GitHub Actions.

## Rilis aset live — 2026-10-15

PR #35 telah di-merge ke main sebagai `e9649656988d6f240ea59fbf5ced5275c1308087`; PR #30–34 ikut tertutup dengan merged=true. Tidak ada PR terbuka pada inventaris sesudah merge. Vercel API `dpl_DPKEriPGyJLaSux6fWwXv8quvUph` dan web `dpl_9Zwmq7K5PWMvj2uZFL7VzYbWurFJ` READY pada SHA yang sama. Alias [website](https://flamboyan-web.vercel.app/perumahan/bukit-flamboyan-indah-2), API /up dan /ready mengembalikan 200. TLS produksi memakai verify-full dan CA resmi; secret tidak dicetak atau di-commit.

Import produksi selesai 2026-10-15T03:58:38.476Z: 55 gambar baru READY/published (50 PHOTO + 5 FLOOR_PLAN); rerun apply 0 baru/55 reused, pending=null. Seluruh 58 EDITED terpakai, 17 foto lapangan dikoreksi deterministik, logo resmi tampil. Sweep live 165 varian API dan 63 aset statis semuanya 200; hash varian 1920 cocok receipt, 0 marker internal/objek hilang. Browser desktop 1440 memeriksa seluruh 55 gambar tipe + 20 gambar editorial: semuanya decoded. Pada mobile 390, halaman kawasan/beranda dan logo diperiksa; foto serta denah tipe 69/80 juga decoded, object-fit contain dan tanpa overflow horizontal. Seluruh run final memiliki 0 page error. Masterplan/media non-target dipertahankan, metadata harga/spesifikasi/owner/komersial cocok snapshot. Katalog tetap 10 listing publik: 9 tipe Flamboyan dan 1 listing existing. Sebanyak 22 video tetap ditunda sampai tugas YouTube.

R2 setelah rollout: 1004 objek/131123260 bytes (125.05 MiB), naik 220 objek/31755236 bytes; 860 refs terdaftar, 0 hilang. Seluruh objek lama masih ada; 0 penghapusan. Orphan 144 objek/615978 bytes masih dalam grace 30 hari; 0 eligible. Duplikasi ETag yang masih direferensikan tidak dihapus. MP4/sumber mentah tidak diupload. Jurnal khusus properti/media menjadi dasar rollback; backup seluruh CRM/auth tidak diperlukan untuk perubahan media ini.

Validasi kandidat final sebelum merge: SQLite 113 tes/907 assertion (14,243s), PostgreSQL 113/907 (24,255s, cluster test dihentikan), Pint/Composer strict/audit 0, 19 tes importer, frontend lint 0 warning/typecheck/48 unit pada 11 file/build 19,2s. Sebanyak 20 kasus browser lulus pada build final dalam kelompok; burst gabungan sempat 4 HTTP 429 dan diuji ulang sesuai limiter. Sweep HTTP/browser live paralel juga sempat 429; HTTP menghormati Retry-After dan browser diulang sesudah HTTP selesai serta jendela limiter pulih. Kelulusan live berasal dari run berurutan tersebut. Kedua check Vercel pada HEAD dde1d89 sukses. Source audit tetap FAIL: 11 high/0 critical braces/node-forge tanpa patch resmi; risiko sementara diterima eksplisit pemilik. Audit artefak runtime 0. Probe live CSP 204, private API 401, nonce/HSTS dan public allowlist lulus. Tidak ada migration/seed/perubahan CRM/GitHub Actions. Bukti dan rollback: [release-assets-review.md](release-assets-review.md).

## Riwayat implementasi aset sebelum review gabungan — 2026-10-15

Bagian ini adalah snapshot PR #34 sebelum rilis; status aktual dan audit final ada pada bagian rilis live di atas.

Branch `codex/real-flamboyan-assets` disinkronkan ke `origin/main` terbaru (`c1cecaf`) atas instruksi pengguna. Perubahan wording kartu, DemoSeeder dan lockfile main dipertahankan; vendor lokal dipasang sesuai Laravel 13.36.0/PHPUnit 12.5.39.

Implemented: seluruh 58 gambar EDITED dipetakan (50 PHOTO + 5 FLOOR_PLAN untuk lima tipe, 2 ilustrasi gerbang + 1 siteplan kawasan), 17 foto lapangan dikoreksi warna deterministik dengan full frame tetap, logo resmi transparan pada identitas publik/workspace/favicon, halaman kawasan SSR beserta galeri keyboard/responsif, navigasi/konsultasi/canonical/sitemap. Harga, spesifikasi dan card tetap dari API; tipe foto aktual tidak diasumsikan. Video 22 berkas ditunda sampai YouTube sesuai instruksi pengguna.

Importer opt-in memverifikasi sumber/journal/hash/versi/kapasitas; 55 gambar masuk unpublished dan seluruhnya READY sebelum publikasi. Backend menerima `published` opsional pada upload, default true kompatibel; caption publik tidak menampilkan suffix provenance BFI2. Cleanup lokal/R2 melaporkan objek/bytes dan melindungi seluruh refs privat/shared/CMS dengan grace orphan 30 hari. Sumber asli/video disimpan utuh di arsip lokal `.tools`, tidak ikut build/Git. Tidak ada migration atau dependency baru dari fitur aset.

Apply lokal menghasilkan 55 READY/published; rerun pada API final 0 upload/55 reused. Seluruh 220 objek hasil impor tersedia dengan total 31.755.552 bytes. Validasi akhir: Pint/Composer lulus, masing-masing SQLite/PostgreSQL 105 tests/840 assertions, importer 19 tests, frontend lint/typecheck/39unit/build dan 13 browser flows lulus. Seluruh 165 varian API + 63 aset statis berhasil dimuat; sweep produksi semua 55 gambar decoded tanpa page error. Bukti di [real-flamboyan-assets.md](real-flamboyan-assets.md). Audit runtime 0; source 14 temuan (12 high/2 critical) pada tooling existing tetap menjadi gate.

Cloud hanya dibaca: 784 objek/94,765 MiB, 640 refs/0 hilang; cleanup dry-run 0 eligible/0 deleted. Belum di-merge/deploy/import live. Semua 58 EDITED digunakan pada implementasi; 55 media tipe baru di cloud menunggu backend deployed yang mendukung private upload. Tidak ada seed otomatis, perubahan harga/CRM, penghapusan cloud atau GitHub Actions. Cakupan, proses, bukti dan rollback ada di [real-flamboyan-assets.md](real-flamboyan-assets.md).

## Hardening keamanan — 2026-10-14

Branch `feat/security-hardening` dari `main` `43b92e9`. Implemented: CORS di-pin ke origin `FRONTEND_URL`/`APP_URL` (config baru; framework default `*` tidak lagi berlaku), HSTS `includeSubDomains`, `Cross-Origin-Resource-Policy: same-site`, perluasan `Permissions-Policy` (payment/usb/magnetometer/gyroscope), `Cross-Origin-Opener-Policy: same-origin` pada HTML, CSP diperluas (`worker-src`/`manifest-src`/`report-uri`/`upgrade-insecure-requests`) + endpoint laporan CSP tersanitasi (query/token dibuang, batas 16 KiB, 60 laporan/menit per instance), HSTS dipasang middleware untuk semua response Nuxt, `SESSION_ENCRYPT` default true + masuk gate `/ready` bersama `same_site`, `DB_SSLMODE` default `verify-full` di produksi, audit `LOGIN` + log `login_failed` (tanpa kredensial). Validasi awal sebelum koreksi review: PHPUnit 97 lulus, Pint lulus; lint/typecheck/40 tes frontend/build lulus; uji HTTP fungsional pada server build (header lengkap, preflight CORS diizinkan/diblokir benar, laporan CSP 204 dengan log tersanitasi tanpa query). Tidak ada migrasi atau perubahan data; rollback revert commit.

Koreksi review 2026-10-15: PostgreSQL produksi hanya menerima sslmode efektif `verify-full`, termasuk parameter DB_URL; require/verify-ca ditolak sebelum query. DB_SSLROOTCERT opsional meneruskan CA provider ke libpq, dengan CA/hostname valid sebagai prasyarat rollout. CSP setelah 60 request/menit/instance mengembalikan429 sebelum membaca body dan menutup koneksi. Kuota lintas instance tetap memerlukan edge provider. Validasi koreksi final dicatat terpisah; hasil awal di atas bukan bukti CA/provider aktual.

## Aset dokumentasi tipe rumah, gerbang, dan logo — 2026-10-14

Branch `feat/integrasi-aset-tipe-rumah` dari `main` `43b92e9`. Implemented: generator manifest dan importer lokal; 55 foto galeri total terdiri dari 35 dokumentasi pengguna dan 20 ilustrasi AI berlabel (12 untuk tipe 62/70 dan 8 untuk 69/80), untuk lima tipe 36/60, 36/90, 56/90, 62/70, 69/80. Siteplan MASTERPLAN untuk sembilan properti hanya ditambahkan bila tidak ada masterplan aktif lain; importer menolak penggantian otomatis. Foto gerbang, logo dan favicon teroptimasi masuk Git; sumber asli tetap privat di `.tools/flamboyan-assets`. Public DTO backend membuang marker impor terminal, tetap mempertahankan disclosure ilustrasi AI; perubahan `apps/api` ini memiliki regresi MediaTest. Manifest menolak lebih dari satu VIDEO per tipe sebelum write. Dua MP4 belum diimpor dan menunggu tautan YouTube resmi dari Admin; tidak ada placeholder. **Impor bisnis belum dijalankan**, tanpa migrasi atau perubahan CRM. Validasi koreksi importer 2026-10-15: `node --test scripts/import-flamboyan-assets.test.mjs`, 12 tes lulus. Bukti awal 9 tes importer, 39 tes frontend serta browser logo/gerbang/favicon merupakan snapshot sebelum koreksi review; bukti gabungan berikutnya ada di [open-pr-integration-validation.md](open-pr-integration-validation.md). Rollback source melalui revert; rollback impor memakai snapshot privat dan versi terbaru tanpa restore DB keseluruhan. Detail: [flamboyan-assets.md](flamboyan-assets.md).

## Audit lokal Tim Flamboyan — 2026-10-14

Branch `codex/local-role-verification`, base main final `c1cecaf` (audit awal `43b92e9`). Guard frontend Operasi
dan Privasi memeriksa identitas/role sebelum menampilkan konten atau meminta API
Admin; Marketing dengan URL langsung kembali ke workspace, visitor ke login,
dan gangguan sesi menyediakan retry. Backend tetap menjadi batas otorisasi.
Tombol hapus perbandingan menunggu hydration agar klik tidak hilang sebelum state siap.
Kontradiksi status endpoint CMS/media/report pada kontrak API dikoreksi, tanpa
endpoint baru atau migration. Pengunjung tetap tanpa akun; hanya ADMIN/MARKETING.

Audit READ ONLY pada PostgreSQL lokal menemukan database domain kosong dan dua
akun yang diminta belum ada, bukan dataset demo yang perlu dihapus. Server API
lokal dipulihkan; ekspor cloud yang bernama `.env.local` dipindahkan byte-for-byte
ke nama privat ignored yang tidak dipilih Laravel untuk APP_ENV=local. Worker
lokal media/notifikasi database dijalankan. Tool provisioning privat tersedia,
tetapi **akun belum dibuat sampai pengguna memasukkan password pada prompt
tersembunyi**; tidak ada password bisnis di source/argumen/log/artifact.

Data uji dipisahkan dari database/media bisnis. Konten nyata lokal masih harus
diisi/diverifikasi; informasi konsep serta label ilustrasi/simulasi faktual tidak
disamarkan menjadi foto/properti/penawaran nyata. SMTP log, provider push/scanner,
backup/privasi/domain dan advisory source tetap gate produksi. Hasil, kegagalan
harness, scope isolasi, review, dan rollback dicatat pada
[local-role-production-validation.md](local-role-production-validation.md);
rencana yang disetujui ada di [local-role-production-plan.md](local-role-production-plan.md).

## Integrasi main terbaru — 2026-10-14

Atas instruksi pengguna, seluruh PR terbuka diperiksa lalu di-merge ke `main`: PR #24 `codex/multi-residence-banjaran` (`68e6bc5`, draft dijadikan siap-review) menjadi merge commit `e6b5f86`, lalu PR #25 `feat/production-readiness` (`0467d08`) menjadi merge commit `808b69c`. Pemeriksaan sebelum tiap merge: `mergeable/clean`, tidak ada review yang meminta perubahan, tidak ada konflik yang dibiarkan, dan status Vercel kedua project (`flamboyan-web`, `flamboyan-api`) `success` lebih dulu; tidak ada bypass, approval palsu, GitHub Actions, atau force-push.

Resolusi integrasi (dua konflik kode, dua konflik dokumen): judul/deskripsi beranda mempertahankan target SEO tanpa suffix ganda sekaligus menyebut rencana Banjaran; CTA hero mengikuti desain PR #24; `contextUrl` konsultasi memakai helper kanonik untuk `/perumahan/banjaran`; judul `/perumahan` dan `/perumahan/banjaran` dinormalisasi agar template `· Flamboyan` tidak berulang dan canonical/og memakai helper bersama; addendum PRD/status digabung urut terbaru-dulu.

Bukti: tree `main` hasil merge (`e9c2ef34`) identik dengan branch review yang divalidasi; `npm run build:checked` pada `main` exit0 (lint `--max-warnings 0`, typecheck, Vitest 9berkas/35tes, build); 4 tes browser lulus pada build produksi `main` (2 consent + 2 residences tanpa API); smoke metadata `/perumahan` dan `/perumahan/banjaran` bebas suffix ganda. Tidak dijalankan: suite Playwright yang memerlukan API/DB lokal, Lighthouse/CWV lapangan, validasi eksternal tag. Merge bukan kelulusan gate hosting/konten/privacy; deploy produksi mengikuti integrasi Git Vercel.

Audit UI/UX tiga peran (pengunjung, Admin, Marketing) menyusul pada 2026-10-14 melalui branch `fix/ui-consistency` → [PR #27](https://github.com/ariefmavlana/flamboyan-perum/pull/27), merge commit `5d9688c`. Perbaikan: helper format Indonesia (tanggal/rentang/persen/luas) menggantikan tanggal ISO dan desimal titik; penyeragaman istilah dan nama halaman workspace; penghapusan enum mentah dan kolom versi internal; penyelarasan `data-label` tabel responsif; pemulihan gaya pesan error; petunjuk tombol terkunci; koreksi label, typo, dan redundansi. Validasi: `npm run build:checked` (lint, typecheck, 10berkas/39tes, build) exit0 pada build bersih dari nol, ditambah 4 tes browser pada build produksi lokal. Status temuan: FLB-UI-01..17 di [audits/flamboyan-production-audit.md](audits/flamboyan-production-audit.md) §5; listing uji Cihapit dikonfirmasi pemilik dan tercatat di [deployment/manual-actions-required.md](deployment/manual-actions-required.md) Lampiran A.

Perbaikan lanjutan tampilan fasilitas `/bandung-timur` di-merge melalui PR #29 (FLB-UI-18): kartu fasilitas sebelumnya memakai `.value-strip` yang kolom pertamanya 32px sehingga judul kartu terjepit dan daftar fasilitas berdesakan. Kini memakai struktur kartu fasilitas khusus — heading seksi, dua kartu dengan daftar bertanda dan kolom seimbang (daftar sekitar dua kolom), blok catatan "Sebelum berkunjung" terpisah, item di-trim/dideduplikasi, dan fallback bila daftar kosong. Penjaga regresi lebar judul kartu ditambahkan pada spec browser.

## Kesiapan produksi, SEO, analytics dan consent — 2026-10-14

Branch `feat/production-readiness` dari `main` `f1005fb`, di-merge melalui PR #25 (`808b69c`). Implemented (seluruh fitur pengukuran **default nonaktif**): template judul global + normalisasi metadata semua halaman, deskripsi/OG default runtime, helper URL kanonik tunggal (canonical absolut tanpa query; `/privasi` kini bercanonical), JSON-LD `WebSite` + `BreadcrumbList` (Organisasi ditahan sampai identitas badan usaha sah), layer persetujuan kategori analitik/marketing (localStorage ber-versi, banner aksesibel yang hanya tampil bila ID opsional diisi, Consent Mode v2, tombol buka ulang di footer), layer event terketik ke dataLayer GTM (`view_property`, `select_property`, `compare_property`, `calculate_mortgage`, `click_whatsapp`, `request_visit`; tanpa PII; dedup single-fire), CSP kondisional via builder murni (host pihak ketiga hanya muncul bila ID terkait diisi), slot Instagram `NUXT_PUBLIC_INSTAGRAM_URL`, dan perluasan faktual halaman privasi. Event `generate_lead`/`qualified_lead`/`schedule_visit` sengaja tidak dibuat karena tidak ada bukti reliabel; analytics first-party agregat tidak diubah.

Dokumentasi: [audits/flamboyan-production-audit.md](audits/flamboyan-production-audit.md), [audits/technical-seo.md](audits/technical-seo.md), [audits/performance-before-after.md](audits/performance-before-after.md), [marketing/seo-keyword-map.md](marketing/seo-keyword-map.md), [marketing/analytics-event-taxonomy.md](marketing/analytics-event-taxonomy.md), [marketing/google-ads-setup.md](marketing/google-ads-setup.md), [marketing/meta-ads-setup.md](marketing/meta-ads-setup.md), [marketing/instagram-content-strategy.md](marketing/instagram-content-strategy.md), [marketing/paid-ads-launch-plan.md](marketing/paid-ads-launch-plan.md), [deployment/production-readiness.md](deployment/production-readiness.md), [deployment/manual-actions-required.md](deployment/manual-actions-required.md); addendum PRD dan indeks README.

Validasi aktual Windows/PHP8.4.26/Node24.21.0, 2026-10-14: `npm run build:checked` (lint `--max-warnings 0`, typecheck, Vitest 9berkas/35tes, build) exit0. Smoke server produksi **tanpa ID**: CSP identik baseline, judul unik dengan satu suffix, canonical/robots memakai origin runtime, `og:image` absolut, 1 blok JSON-LD WebSite di beranda, 0 kemunculan banner/GTM pada HTML SSR; `/sitemap.xml` 503 tanpa API (fail-safe). Smoke **dengan** `NUXT_PUBLIC_GTM_ID=GTM-TEST0`: CSP menambah `'strict-dynamic'` + host Google saja (tanpa host Meta). Playwright `tests/e2e/consent-tracking.spec.ts`: 2tes lulus (tanpa keputusan→0permintaan pelacakan; tolak→tetap0; terima→skrip dimuat; pilihan persist setelah reload; kontrol keyboard). Artefak build (cache Vite aktif, bukan build bersih): 53berkas JS klien500,4kB; 3CSS61,1kB; publik67berkas2.344,6kB.

Tidak dijalankan dan tidak diklaim: suite PHPUnit/Pint (tidak ada perubahan `apps/api`), suite Playwright yang bergantung pada API/DB lokal (PHP tidak tersedia di PATH sesi ini), Lighthouse/Core Web Vitals lapangan, serta validasi eksternal GTM/GA4/Google Ads/Meta. Tidak ada migrasi, perubahan data, dependency baru, merge, deploy, Actions, atau aktivasi iklan. Rollback: revert commit; mengosongkan ID opsional mengembalikan perilaku persis sebelum branch.

## Pengenalan perumahan Banjaran — 2026-10-08

Branch `codex/multi-residence-banjaran` dari `origin/main` `f1005fb`. Implemented: discovery dua kawasan dalam naungan Flamboyan, halaman editorial SSR `/perumahan` dan `/perumahan/banjaran`, navigasi/beranda/footer/sitemap, foto inspirasi berlisensi existing, tampilan responsif dan animasi dengan reduced motion, serta konteks Banjaran pada konsultasi WhatsApp. Nama sementara disetujui pengguna. Katalog/API/CRM tetap menggunakan data persisten existing; halaman konsep bukan record penawaran Banjaran.

Belum diimplementasikan: CMS multi-proyek, relasi proyek–properti, katalog/tipe/harga/stok Banjaran dan data lokasi/fasilitas final. Konten konsep terkurasi di source seperti halaman kawasan/panduan existing; kemampuan pengelolaan proyek tidak diklaim selesai. Tidak ada migration, dependency baru, merge, atau deploy produksi. Rollback: revert commit fitur; database tidak berubah.

Validasi Windows/PHP8.4.26/Node24.21.0/PostgreSQL17: `vendor/bin/pint --test`, `composer validate --strict`, `composer audit`, `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build` lulus. SQLite `artisan test`: 96 tests/749 assertions (12.21s); PostgreSQL database test terisolasi port15533: 96 tests/749 assertions (412.62s, cluster dihentikan). Vitest:17 tests (15.57s). Build client66.73s/server40.20s, warning upstream DEP0155 tetap ada. Tiga tes `playwright test tests/e2e/residences.spec.ts` lulus (2.5menit) pada Chrome lokal/build produksi: SSR/sitemap/404, navigasi, keyboard FAQ, konteks WhatsApp/reload/property priority, unknown area, gambar, no overflow 320/768/1024/1440px dan reduced motion. Screenshot desktop/mobile diperiksa visual. Tidak mengklaim audit WCAG penuh, Safari/Firefox, atau UAT produksi.

Audit runtime `.output/server --omit=dev`:0 kerentanan. Npm source audit saat ini14 temuan (8high,6critical), termasuk advisory simple-git/argv-parser pada tooling Nuxt; lockfile tidak berubah. Temuan source tetap terbuka dan PR disiapkan sebagai draft. Kegagalan pertama PHPUnit/Vitest/build akibat akses file sandbox Windows diselesaikan dengan rerun di luar sandbox; bukan kegagalan assertion aplikasi.

Regresi lanjutan: tiga tes existing `buyer-journey.spec.ts` dan `ui-design.spec.ts` (grep buyer consultation/editorial pages/public navigation) lulus29.8s: konsultasi properti/share, route editorial SSR/sitemap, navigasi mobile, katalog/perbandingan pada320/768/1440px. Total enam kasus browser lulus. Prettier check pada file baru dan `git diff --check` bersih.

## Riwayat implementasi

Review PR#21 pada 2026-10-05 menemukan celah pergantian filter CRM: daftar lama masih dapat dibuka sebelum navigasi memulai pemuatan. Guard kini langsung menonaktifkan detail, membatalkan penerapan respons lama, dan memuat ulang ketika filter yang sama diterapkan kembali. Regresi menahan request filter asli untuk memeriksa guard sebelum respons; tidak ada perubahan endpoint, schema, atau data cloud. Bukti review dan batas waktu host dicatat pada [experience-validation.md](experience-validation.md).

Pembaruan pengalaman pengguna 2026-10-05 berada pada branch `codex/experience-clarity` / [PR #21](https://github.com/ariefmavlana/flamboyan-perum/pull/21), berangkat dari `origin/main` `25869e3`. Implementasi mencakup fokus input netral, navigasi publik ringkas, visual kawasan bersumber dari katalog awal, antrean kerja CRM berdasarkan scope backend, filter URL, detail dengan tindakan berikutnya, editor properti per bagian, serta CMS/laporan/akun yang lebih mudah dibaca pada desktop/mobile. Kontrak baru `GET /leads/summary` dan filter `work` sudah diimplementasikan dan diuji; tidak ada migrasi database. Validasi: 96 test/749 assertion pada masing-masing SQLite dan PostgreSQL, 17 unit frontend, 24 kasus browser relevan, lint/typecheck/build, Pint dan Composer lulus; audit runtime 0, source audit tetap 11 high baseline. Belum di-merge atau di-deploy. Persona, sumber aset, perubahan dan rollback: [experience-clarity.md](experience-clarity.md); hasil validasi aktual dan batasan: [experience-validation.md](experience-validation.md). Catatan main/produksi di bawah adalah riwayat rilis sebelumnya.

Update aset 2026-10-05 · branch `codex/rajasa-type-assets`: inventaris 33 berkas Rumah Rajasa selesai; 21 gambar dipublikasikan melalui API existing pada sembilan tipe live, termasuk penggantian sembilan sampul. PHOTO lama dan MASTERPLAN tetap tersimpan; metadata properti sebelum–sesudah identik selain version/updated_at. Impor lokal dua kali membuktikan pengulangan tanpa duplikasi. Skrip/manifest/provenance berada pada PR terpisah dari PR UX#21; tidak ada merge atau deploy source oleh pekerjaan ini. Dimensi asli terbaik 573–1027px untuk fasad, tanpa upscaling; bukan klaim HD/4K. Lihat [rajasa-assets.md](rajasa-assets.md).

Validasi aset: 7 test importer; masing-masing 94 test/713 assertion SQLite dan PostgreSQL; Pint, Composer validate/audit, lint/typecheck, 17 test frontend dan build lulus. Runtime audit 0, source tooling masih 11 high existing. Browser live memverifikasi 9 tipe/63 varian serta interaksi galeri/beranda desktop1440 dan mobile390 tanpa gambar rusak, overflow atau page error. Rencana live setelah impor menunjukkan 0 baru/21 reused.

Perbaikan sesi tim 2026-10-05 · branch `codex/staff-session-return`: bug footer→login terbukti saat `/api/v1/me` masih200. Footer sekarang menuju workspace; login memeriksa sesi, melewati form untuk Admin/Marketing aktif, menyediakan retry gangguan dan menangani401/403 tanpa loop.6regresi browser lulus termasuk reload/tab baru/mobile/logout tab lain. Pint,94tes713assertion masing-masingSQLite/PostgreSQL,Composer,lint/typecheck,17unit dan build lulus; runtime audit0/source11high existing. Preview lokal sudah memakai fix; belum merge/deploy live. Bukti: [staff-session-return.md](staff-session-return.md).

Tanggal 2026-10-05 · branch `main`. PR#18 dan#19 merged sesudah pengguna menginstruksikan review semua PR dan merge yang lolos. Kedua project Vercel mengikuti main dan source69095d1 sudah READY; migrasi komersial serta impor katalog brosur selesai. Sembilan tipe/152unit rencana, kontak/fasilitas CMS, PHOTO/MASTERPLAN dan referensi KPR bertahap tersedia pada situs aktif.20kelompok browser produksi lulus;414varian R2 diperiksa tanpa objek hilang.33katalog tersimpan (9published/24archived),72lead awal/4akun aktif tetap utuh. Bukti ada di brochure-main-release.md; cara Admin di admin-catalog-financing.md. Bagian berikut merupakan snapshot historis, bukan status cloud terkini. Email SMTP, realtime push, scanner PDF, backup terjadwal/UAT/privacy kebijakan dan11temuan tooling upstream tetap mempunyai batas yang dicatat; deploy yang berfungsi tidak menyatakan seluruh gate layanan komersial selesai.

Update 2026-10-05: demo nyata tersedia pada Vercel + Supabase + R2. Entry PHP Vercel menjaga prefix `/api/v1` melalui normalisasi metadata script; Nuxt mem-proxy route API/auth/media melalui origin web yang sama. Bukti regresi, 83 test/609 assertion pada SQLite dan PostgreSQL, browser Admin/Marketing, SSR/media/KPR serta batas worker/SMTP/polling ada di [vercel-demo-validation.md](vercel-demo-validation.md). Fix berada pada branch baru dari main dan membawa proxy yang dipakai web demo commit `6bbf027`. Deployment demo bukan kelulusan gate produksi dan tidak mengotorisasi merge.

| Requirement / fitur | Status aktual | Batas / gate |
|---|---|---|
| Stack Nuxt4.5.2/Laravel13, lockfiles/runtime | Implemented | PHP8.3 compatible platform; hosting belum dipilih |
| FR-PUB-001 Hero | Implemented | CMS Admin/verified hero + sanitized cover published; konten asli masih gate |
| FR-PUB-002 Search | Implemented basic | title/location/address + full filter/URL/pagination; hydration guarded |
| FR-PUB-003/029 WhatsApp | Implemented/config-gated | Nomor sementara pengguna 6287776734038; link/context tested |
| FR-PUB-004 Featured | Implemented | Hanya published featured; scoped flag UI/catalog version |
| FR-PUB-005 Social proof | Implemented/content-gated | Testimonial verified + rate references; izin/konten aktual gate, tanpa klaim kemitraan |
| FR-PUB-010 Listing/cards | Implemented | Semua spesifikasi inti + availability; tanpa identitas Marketing |
| FR-PUB-011/012 Filter/sort | Implemented | Full documented UI, URL/back/reload, numeric bounds +7sort |
| FR-PUB-013 Compare | Implemented | Local IDs max3/dedup, SSR query, missing/unpublished, remove/mobile |
| FR-PUB-020/021 Detail/specifications | Implemented | SSR HTML/canonical/OG + missing404; no upstream soft404 |
| FR-PUB-022..025 Gallery/video/tour/plan | Implemented | Private staging/WebP variants/scoped management/SSR gallery, YouTube/tour consent; real content/hosting gate |
| FR-PUB-026/027 Maps/POI | Implemented/content-gated | Versioned coords/POI sources/date; OpenStreetMap consent/embed/external fallback |
| FR-PUB-028 Brochure | Implemented/scanner-gated | Signature/private queue/scan fail-closed/attachment; real maintainedClamAV required before public PDF |
| FR-PUB-030..035 KPR | Implemented/content-gated | Fixed/floating reset+schedule/chart/fullDP/zero; current verified bank rate references |
| FR-BO-PROP-001..003 Catalog/spec/availability | Implemented API + UI | Scoped create/edit/version/archive/featured; Admin audited owner transfer; no hard-delete |
| FR-BO-PROP-004 CMS | Implemented | Admin HERO/TESTIMONIAL/BANK_RATE; allowlist/attestation/version/audit/pagination |
| FR-BO-PROP-005 Profile | Implemented | Own-name/password + current-password/session revoke; Admin email/role/activation workflow |
| Auth/active-user/role | Implemented | Cookie session/CSRF/login/logout/provision CLI + users UI/recovery/deactivation guard; SMTP real-delivery gate |
| FR-CRM-001 Create lead | Implemented API | Manual Admin UI + normalized phone/unique perproperty; controlled audited contact correction |
| FR-CRM-002 Assignment | Implemented API | Single active assignee/reassign reason/atomic notification; bounded searchable dropdown UI |
| FR-CRM-003 Monitoring | Implemented | Scoped search/status/assignee/unassigned filters + labels/pagination/reports |
| FR-CRM-004 Reports | Implemented | Admin cohort/current assignee vs follow-up actor, median sample/pending age; date/count bounds |
| FR-MKT-001 Table | Implemented | Scoped list/pagination/read+status+notes; property/assignee human labels |
| FR-MKT-002/003 Pipeline/notes | Implemented | Ordered transitions+LOST reason+terminal guard+versions |
| FR-MKT-004/005 History drawer | Implemented | Native modal keyboard/Escape + descending history actor/status/note; reassignment event fields in API |
| FR-RT-001/002 Persistent notification | Implemented | Assignment→Marketing; status→Admin; recipient scope |
| FR-RT-003 Push/Echo | Implemented/config-gated | Private Echo/Pusher+durable queue/retry/dedup/reconnect/poll60s; actual provider≤5s gate |
| FR-RT-004 Read/unread | Implemented | Exact unread count, own recipient list/read idempotent |
| SEO canonical/metadata | Implemented | Sitemap index/1000 published perfile, robots/query noindex, factual JSON-LD |
| SEO/analytics/consent kesiapan produksi | Implemented/config-gated | Judul+OG+JSON-LD, consent, event layer, CSP kondisional; ID resmi/domain/policy gate; detail di docs/audits & docs/marketing |
| Validasi lokal / branch+PR | Implemented | GitHub Actions dihapus sesuai instruksi pengguna; bukti lokal wajib sebelum review; main protection belum dikonfigurasi |
| DB/migration parity | SQLite + PostgreSQL17.9 validated locally/PHP8.4.26 | Masing-masing71 tests/504 assertions; PHP8.3/Linux belum diuji; runtime deployment harus diverifikasi sebelum produksi |
| Dummy dinamis lokal | Implemented | Generative persisted24properties/72leads/3Marketing/7CMS/48media, real CRUD/workflows/API/SSR; opt-in local/testing/domain kosong; demo bukan konten bisnis |
| Host/proxy/CSP/logs/readiness/monitoring | Implemented | Signed per-client proxy, exact allowlists, production nonce CSP, JSON logs, Admin ops/backup age; external TLS/monitoring gate |
| Local load/restore | Validated synthetic locally | 18k requests/900s/20scheduledrps/0errors; 10k properties/50k leads; consistent/encrypted SQLite+media and PG isolated restore; actual hosting/offsite/RPO/RTO/retention gate |
| Production/privacy/providers/content | Gate open | Actual hosting/domain/SMTP/Pusher/ClamAV/policy/content/QA/security evidence required |

## Validasi F0 historis

- PHPUnit: 18 tests,95 assertions lulus pada SQLite/PHP8.4.26, termasuk duplicate/owner/scoping/status/reassign/version/read-idempotency/transaction rollback dan demo-production guard.
- Suite yang sama juga lulus18 tests/95 assertions pada PostgreSQL17.9 dengan cluster lokal terisolasi dan PHP8.4.26; tidak mengubah database instalasi yang sudah ada.
- Pint, Composer validate --strict dan Composer audit lulus; route:cache/route:clear berhasil.
- Frontend Node24.21.0: npm ci, ESLint `--max-warnings 0`, Nuxt typecheck, Vitest4.1.11/5 tests, Playwright3 flows, SSR build lulus pada validasi akhir. Browser flows meliputi raw SSR+canonical404+missing-CSRF419, mobile search/layout, session login/drawer/note/Escape/logout pada fixture terisolasi.
- Public API/detail HTTP smoke sukses200 dan spesifikasi ada pada HTML sebelum client JavaScript. Screenshot desktop/mobile ditinjau lokal; bukan audit accessibility/UAT lengkap.
- Advisory Vitest diperbaiki melalui versi patched4.1.11. Audit source lengkap termasuk devDependencies menghasilkan11 high propagated entries dari dua upstream advisories tanpa patch,0 moderate/critical; tetap menjadi gate keamanan produksi. Audit artefak runtime0 advisory dan tidak memuat paket tooling tersebut. Build mempunyai warning upstream DEP0155. Detail ada di dependency-security.md.
- Tidak ada klaim bahwa hosting produksi, load/SLO, actual backup/restore, legal privacy atau push provider telah diuji. Semua gate mempunyai pemilik/bukti di PRD§10/runbook.
- [PR #3](https://github.com/ariefmavlana/flamboyan-perum/pull/3) terbuka dan siap review pada branch baru, membawa fondasi yang belum di-merge, aturan tanpa Actions, fix Vitest dan validasi akhir. [PR #1](https://github.com/ariefmavlana/flamboyan-perum/pull/1)/[PR #2](https://github.com/ariefmavlana/flamboyan-perum/pull/2) ditutup sebagai superseded, tanpa merge. Tidak ada syarat memperbaiki billing atau menjalankan ulang Actions. Bukti commit/runtime/perintah dan batasan ada pada validation.md; siap review tidak berarti siap produksi atau otorisasi merge.

## Rencana historis setelah F0

1. `fix/dependency-tooling-advisories` saat patch upstream tersedia, scan/test ulang; jangan downgrade framework secara paksa.
2. `feat/admin-catalog-crm-ui`: owner-aware CRUD, create/assign form/dropdown, active-user provisioning/recovery/profile serta account deactivation policy.
3. `feat/property-media`: safe staging/variants/uploads/brochure, verified CMS content.
4. `feat/realtime-notifications`: managed provider/Echo private channels/queue+retry/fallback+monitoring.
5. `feat/property-evaluation`: compare, KPR UI/dates/scenarios/chart, maps/POI.
6. `feat/admin-reporting`: cohort/median/pending, query correctness/performance.
7. `chore/production-readiness`: hosting evidence/load/UAT/security/restore/content/privacy/SEO checks.

Daftar ini adalah rencana saat F0 dibuat, bukan pekerjaan aplikasi yang belum tersedia. Tahap telah dijalankan melalui PR #4–#9 pada implementation-plan.md. Perbaikan advisori upstream tetap menunggu patch yang benar. Setiap pekerjaan baru dari main terbaru dan PR sendiri sesuai AGENTS.

## Workspace operasi historis (PR #4)

Lihat operations-validation.md untuk bukti tahap operasi saat PR #4: PHPUnit32 tests/167 assertions pada SQLite dan PostgreSQL17.9, Pint/Composer/lint/typecheck/unit/build, source audit11 high dan runtime0. Workspace akun/katalog/CRM/recovery tersedia; SMTP nyata dan seluruh fitur media/evaluasi/push/report/privacy tetap gate/tahap berikutnya. Rencana penuntasan lengkap ada di implementation-plan.md. Tidak ada merge PR atau deployment produksi.

## Media historis (PR #5)

Lihat media-validation.md:43 tests/252 assertions masing-masing SQLite/PostgreSQL,6 browser flows termasuk queue worker nyata+SSR gallery/archive404, Pint/Composer/frontend checks/build. Source11 high dan runtime0 tetap dilaporkan. PR #4 operasi telah terbuka dan menjadi dependensi media; tidak ada merge. PDF clean/unsafe scanner tests menggunakan mocks; scanner nyata/content berizin/large-image hosting masih gate. Compare/KPR/CMS/maps/push/report/privacy tetap belum diklaim selesai.

## Evaluasi/editorial historis (PR #6)

Lihat evaluation-validation.md: PHPUnit49 tests/299 assertions masing-masing SQLite/PostgreSQL,8 browser flows55.6s,7 unit tests; final lint0/type/build passed, source11 high/runtime0 dan Composer0/cache fallback dicatat PR. Compare/fullfilters/KPR/CMS/maps/SEO tersedia dengan actual content/provider gates. PR #5 media terbuka sebagai dependensi; tidak ada merge. Push/report/analytics/privacy/operational acceptance masih harus diselesaikan sesuai implementation-plan.md.
## Notifikasi historis (PR #7)

Lihat realtime-validation.md:55 tests/337 assertions SQLite/PostgreSQL,11 unit tests,9 browser flows, lint/type/build/Composer passed; source11 high/runtime0. Echo/private push tersedia dengan provider nyata gated; laporan/analytics/privacy/operational acceptance masih dilanjutkan. Tidak ada merge/deployment.

## Supervisi dan privasi historis (PR #8)

Lihat supervision-validation.md:59 tests/389 assertions SQLite/PostgreSQL,11 unit tests,10 browser flows, lint/type/build/Composer passed; source11 high/runtime0. Reports/PII-free aggregates opt-in/read-only retention candidates/controlled CLI redaction implemented. Policy dan restore-ledger masih gate. Acceptance operasional dilanjutkan, tanpa merge/deployment.

## Acceptance operasional historis (PR #9)

Lihat acceptance-validation.md dan requirements-traceability.md:66 tests/453assertions SQLite+PostgreSQL,13 unit tests,12 browser flows termasuk production CSP/320px, lint/type/build/Pint/Composer/cache passed. Dataset10kproperty/50klead;15min/20scheduledrps/18krequests/0errors, API p95≤165.85ms/SSR≤428.19ms pada8nativePHPworkers+OPCache/PostgreSQL lokal. Native encrypted consistent SQLite+media restore dan PG isolated restore lulus. Tidak mengklaim throughput SQLite/shared-hosting, uptime99.5%, fullWCAG/cross-browser, realSMTP/Pusher/ClamAV/offsite/policy.

PR #3 fondasi, #4 workspace, #5 media, #6 evaluasi, #7 realtime, #8 supervisi/privacy dan #9 acceptance membentuk stack review. Main masih bootstrap, tidak ada merge/deployment/Actions. Nomor sementara pengguna6287776734038; hostingHostinger/Rumahweb paket/domain belum dipilih. Runtime audit0/Composer0; source11high dari dua upstream advisories tetap gate. Source originals unchangedSHA; app artifacts/runtime/private fixtures/keys/passwords tidak dicommit.

## Dataset dinamis (snapshot PR #10 sebelum integrasi)

Lihat demo-data.md dan dynamic-demo-validation.md. Default generator menyediakan24properties/72leads/3Marketing/7CMS/48media generatif yang diproses worker native pada database demo baru. E2E boleh menambah/mengubah data sehingga jumlah workspace setelah pengujian berbeda. Data tetap tersimpan dan berubah melalui UI/API; tidak ada katalog/CRM hardcoded, reseed saat reload, atau fallback mock. Semua konten diberi label sintetis; attestation CMS lokal bukan verifikasi bisnis. Seed menolak domain berisi data dan production/staging; rollback rows/jobs/staging dan pemulihan clock/config diuji.

Validasi final: Pint,71tests/504assertions masing-masingSQLite5.78s/PostgreSQL12.24s,Composer strict/audit0,routecache/clear; lint0/typecheck/build,13unit299ms, seluruh13browser flows pada8spec dengan cache fixture diisolasi antar-berkas dan worker aktif. Gallery SSR controls sekarang menunggu hydration; test histori tidak mengandalkan catatan seed tertentu. Audit source11high/exit1, runtime0/exit0; warning build upstreamDEP0155 tetap dicatat. Tidak ada migrasi/API breaking change, dependency baru, merge, deployment atau Actions. PR dataset bergantung pada PR #9 agar diff review tetap terfokus.

[PR #10](https://github.com/ariefmavlana/flamboyan-perum/pull/10) terbuka siap review pada branch baru `codex/dynamic-demo-data`, base `codex/operational-acceptance`. Workflow stack #3→#10 belum di-merge. Konektor GitHub tidak memiliki izin membuat PR (403); PR berhasil dibuat melalui GitHub API dengan kredensial Git lokal yang sudah digunakan untuk push, tanpa menyimpan/menampilkan token.

## Integrasi main terbaru

Pada2026-10-04 pengguna menginstruksikan pemeriksaan seluruh open PR dan merge jika tidak ada blocker/conflict. PR #3–#10 diperiksa, diarahkan ke main sesuai urutan dependensi, dan seluruhnya merged melalui merge commits dengan expected head SHA. Tidak ada unresolved review thread, changes requested, draft, konflik atau required status check yang menghambat; GitHub merge state CLEAN sebelum setiap merge. Tidak ada bypass, fake approval, GitHub Actions atau deployment.

Main setelah PR #10 adalah `e2e1ccd9a82796d32e57105aed0b062f5701a9e7`; tree `0e7178e2a8e8f6fdf0c0bba18b65c90483bf60ea` persis sama dengan final PR #10 `ee3cec7` yang validasinya dicatat di atas. Branch bootstrap telah digantikan implementasi lengkap. Sinkronisasi dokumentasi mengikuti branch/PR tersendiri dari main terbaru, tanpa perubahan kode aplikasi. Source11high dan hosting/provider/content/privacy/UAT tetap gate produksi. Detail SHA per PR dan pemeriksaan ada di integration-review.md.

## Redesign UI/UX (branch PR tersendiri, 2026-10-04)

Layout publik dan workspace sekarang terpisah. Sistem visual baru mencakup beranda/katalog/detail/compare/KPR/auth/recovery/privasi, sidebar tim, tabel/form/modal, label status, ringkasan operasi, dan halaman error. Menu mobile memiliki guard hydration, Escape/fokus dan close setelah route berubah; tabel responsif memiliki region scroll keyboard. Konten tetap berasal dari API/DB, dengan label demo dipertahankan. Tidak ada perubahan kontrak REST, migration, otorisasi, dependency, merge atau deployment. Rincian dan bukti validasi branch ada di `ui-ux-redesign.md`; status produksi/content/advisory upstream tetap gated.

Penyempurnaan referensi template pada PR #12: pola Nuxt Dashboard resmi (MIT) dan Houzez resmi (referensi UX saja, tanpa kode/aset vendor) diadaptasi untuk workspace dan pembeli properti. Filter aktif dapat dihapus secara independen, jumlah hasil jelas, panel harga/kontak mendahului deskripsi di mobile, dan sidebar dikelompokkan sesuai tugas/role. Catatan sumber dan validasi lanjutan ada di `ui-ux-redesign.md`.

## Arah editorial premium — revisi visual menyeluruh

Pengguna memilih foto besar, tipografi tegas dan layout lapang. Arah terbaru menggantikan tampilan hijau/netral awal dengan identitas editorial: DM Serif Display/Manrope lokal, gading–arang/terakota, hero foto berlisensi berlabel ilustrasi, wordmark baru, koleksi asimetris dan kartu dua kolom, galeri lebar, footer kontak, serta workspace yang diselaraskan. Referensi visual utama adalah Aucoot, Inigo dan Modern House Australia; Pinhome menjadi pembanding alur pencarian Indonesia. Detail amati/adaptasi, sumber dan lisensi ada di `editorial-direction.md`. Seluruh kontrol/kontrak data tetap berfungsi; gambar unit tetap dari API.

## Fotografi editorial dan katalog demo — 2026-10-04

Selesai pada branch redesign: fotografi berlisensi dengan tone hunian tropis, foto interior editorial responsif, cover pada perbandingan, dan label ilustrasi pada media demo. Seluruh24 properti fixture lokal memiliki3 foto terproses dari API (72 entri), termasuk yang draft/archived tanpa mengubah publikasinya. Script kurasi opt-in hanya mendukung database SQLite demo lokal. Sumber, batas penggunaan, dan rollback: [photo-curation.md](photo-curation.md). Data dan foto tetap ilustrasi demo, bukan penawaran nyata. Belum merge/deploy.

## Pengalaman pembeli Bandung Timur dan kesiapan aset — 2026-10-04

Branch baru `codex/bandung-buyer-experience` dari main `4816063`, membawa desain PR #12 melalui cherry-pick. Pengguna mempertahankan arah editorial premium dan menetapkan target middle-to-high Indonesia/Bandung Timur. Matriks Aucoot serta batas observasi tersedia di [aucoot-adaptation.md](aucoot-adaptation.md); arsip original tetap utuh.

Implemented pada branch: halaman Bandung Timur, tiga panduan pembeli SSR dengan canonical/sitemap/404, konsultasi WhatsApp bertopik dan berkonteks properti, share dengan fallback manual, galeri foto/denah dan navigasi dialog keyboard, CMS HERO foto/video yang memilih media properti siap, serta BANK_PARTNER dengan upload logo private WebP/attestation/version/audit. Rate bank tidak dipakai sebagai bukti kemitraan. Foto/video asli pengguna belum dimasukkan; logo/testimoni/POI asli tetap gate konten. Panduan merupakan source content terkurasi dan belum CMS artikel. Konsultasi tidak menyimpan pertanyaan ke CRM, membuat lead, mengirim pesan otomatis atau mengonfirmasi booking.

Gap audit awal yang ditutup: hero tidak lagi hanya gambar statis pada tampilan utama ketika media CMS dipilih; kemampuan logo rekanan sekarang memiliki schema/upload/render yang terpisah dari rate; backend tour mempunyai positive/public-revocation test, header brosur diperkuat. Integrasi video tetap YouTube consent embed; upload MP4 belum tersedia sesuai baseline SRS. Peta tetap OpenStreetMap dengan consent; tidak mengklaim sudah mengganti provider menjadi Google Maps.

Bukti terkonfirmasi saat snapshot ini: PHPUnit77 tests/579 assertions SQLite8.75s dan PostgreSQL15s pada PHP8.4.26; frontend lint/typecheck passed; unit15 tests427ms. Seluruh26alur browser final lulus; rincian, kegagalan assertion lama dan rerun ada di [buyer-experience-validation.md](buyer-experience-validation.md). Backend readiness sebelumnya juga lulus target30 tests/271 assertions1.502s dan scoped Pint, kemudian masuk suite penuh di atas.

## Audit deploy demo dan perbaikan integritas media — 2026-10-04

Branch `chore/vercel-demo-deployment`. Perubahan berfokus pada kesiapan deploy demo serverless (Vercel + Supabase + Cloudflare R2) dan satu bug integritas data yang ditemukan saat audit.

**Bug integritas media (diperbaiki).** `flamboyan:media-cleanup` mencocokkan direktori `ready/{uuid}` ke kolom `variants` memakai `CAST(variants AS TEXT) LIKE '%ready/{uuid}/%'`. JSON menyimpan garis miring sebagai `\/`, sehingga pola itu **tidak pernah cocok**. Pengukuran pada fixture demo lokal: dari134 direktori `ready` di disk, pencocokan lama mengenali **0** sebagai terpakai sementara pencocokan hasil decode mengenali127. Artinya menjalankan `flamboyan:media-cleanup --execute` pada perilaku lama akan menghapus seluruh134 direktori setelah masa grace, termasuk127 yang masih dirujuk media `READY`/`published`. Perbaikan mengganti pencocokan teks mentah dengan pencocokan path hasil decode di PHP, dan regresi `test_cleanup_keeps_ready_directories_that_are_still_referenced_by_variants` gagal pada perilaku lama serta lulus pada perilaku baru. Pemindaian orphan diuji ulang dengan `--execute` pada database demo: 7 direktori benar-benar tidak dirujuk dan belum dihapus.

**Masalah terpisah yang sudah diperbaiki pada artefak.** Dua varian WebP hilang pada `media 54` (varian1920) dan `media 117` (varian1280) sehingga `/media/{id}/{variant}` mengembalikan404 dan terlihat pada halaman publik. Direktori keduanya berubah pada `2026-10-04T09:53:35Z` dengan2 dari3 berkas tersisa. Penyebabnya **tidak terbukti**: perintah cleanup menghapus satu direktori penuh, bukan satu berkas, dan tidak ada berkas lain di storage yang berubah pada rentang itu. Kedua varian diregenerasi dengan pipeline GD yang sama (ukuran1920x1280 dan1280x853 sesuai record, kualitas82), dan seluruh381 varian fixture sekarang lolos `flamboyan:media-verify` dengan0 objek hilang. Perintah verifikasi itu ditambahkan sebagai kemampuan tetap (read-only, exit non-nol bila ada temuan) agar kasus serupa terdeteksi tanpa membuka galeri.

**Audit dependensi.** `composer audit` bersih. `npm audit` tetap11 entry high dari dua advisory upstream yang sudah terdokumentasi di [dependency-security.md](dependency-security.md); dipastikan ulang bahwa `braces3.0.3` dan `node-forge1.4.0` adalah versi registry terbaru dan belum ada patch, sehingga `npm audit fix --force` hanya akan men-downgrade Nuxt ke3.15.1. Artefak yang benar-benar dikirim (`.vercel/output` dan `.output`) tidak memuat `node-forge`, `braces`, maupun paket `vitest`; 22 paket runtime yang dikirim sudah diperiksa dan seluruhnya dependency resmi Nuxt/Vue/`laravel-echo`.

**Perubahan deployment.** Disk `media` dapat memakai driver `s3` (`MEDIA_DISK_DRIVER`) dengan jalur baca melalui `App\Support\MediaDisk` yang menyalin objek remote ke berkas sementara; `config/view.php` di-publish agar `VIEW_COMPILED_PATH` dapat diarahkan ke `/tmp`; entry point function PHP dan `vercel.json` disiapkan untuk dua layout root Vercel; Nitro memakai preset `vercel`.

**Batasan demo terverifikasi, bukan asumsi.** Unduhan dan pemeriksaan paket `vercel-php@0.9.0` menunjukkan proxy body biner mentah (jumlah chunk tak berujung) sehingga pengiriman multipart tidak dipotong launcher. Uji perilaku tanpa GD pada PHP8.3 membuktikan unggahan tetap diterima `201` lalu ditolak dengan `state FAILED`/`failure_code IMAGE_PROCESSOR_UNAVAILABLE` dan berkas staging dipertahankan agar `retry` berfungsi; adegan dokumentasi yang menyatakan unggahan langsung gagal diperbaiki. Bukti: PHPUnit78 tests/588 assertions lulus pada PHP8.3.35 + GD (Docker), `pint --test` bersih, serta lint/typecheck/unit frontend (15 tests) dan build preset `vercel` lulus. Deployment Vercel/Supabase/R2 nyata, nilai `SESSION_DOMAIN`, ekstensi runtime, dan browser E2E lintas domain belum diverifikasi dan tercantum sebagai checklist di [vercel-demo-deployment.md](vercel-demo-deployment.md).

**Peran (tidak ada perubahan).** Hanya `ADMIN` dan `MARKETING`; tidak ada role ketiga. Matriks izin kanonik tetap di [SRS.md](SRS.md) bagian 2 dan diverifikasi konsisten terhadap seluruh guard backend dan gating UI pada audit ini. Tidak ada migrasi atau dependency baru. Gate produksi di [runbook.md](runbook.md) tetap terbuka; deployment nyata dan `SESSION_DOMAIN` masih perlu diverifikasi mengikuti checklist di [vercel-demo-deployment.md](vercel-demo-deployment.md).

**Ruang lingkup PR ini.** Karena branch ini diturunkan dari `codex/bandung-buyer-experience` (PR #13) dan PR #12, merge ke `main` berbentuk fast-forward sehingga ikut mengintegrasikan seluruh pekerjaan buyer experience, kurasi foto, dan redesign editorial yang sudah divalidasi di [buyer-experience-validation.md](buyer-experience-validation.md). Perubahan spesifik jalur deploy ada pada `apps/api/api/index.php`, `api/index.php`, `apps/api/vercel.json`, `apps/web/vercel.json`, `apps/api/config/view.php`, `apps/api/app/Support/MediaDisk.php`, `apps/api/config/filesystems.php`, dan `docs/vercel-demo-deployment.md`.



## Operasi cloud dan publikasi — 2026-10-05

Pembaruan berikutnya pada branch `codex/brochure-kpr` dari origin/main3257844 menggabungkan commit PR#18 yang masih dibutuhkan, lalu menambahkan katalog komersial/CMS DEVELOPMENT/MASTERPLAN dan pembiayaan bertahap. Sumber pengguna sudah dibaca visual seluruh3halaman PDF dan2JPEG; sembilan tipe dengan152unit rencana direkonsiliasi tanpa menganggap stok/surat legal/bank rekanan terkonfirmasi. CSS/template editorial dipertahankan. Harga program/batas tanggal PDF dipisahkan dari tiga skema cash pengembang yang telah kedaluwarsa pada30September. BCA dipakai sebagai referensi resmi berkriteria, bukan mitra Flamboyan; BTN/Mandiri tidak diimpor tanpa seluruh parameter yang cocok.

Implemented dan diverifikasi lokal: Admin-only editor komersial dengan version/attestation/audit, harga publik/filter/compare berdasarkan tanggal WIB, biaya program bertanggal, skema expired disembunyikan publik, kontak/fasilitas CMS dinamis, masterplan private melalui pipeline GD existing, kalkulator anuitas multi-phase/minimum plafon/tenor/komponen biaya. Pint,94PHPUnit713assertion pada SQLite9.05s/PostgreSQL16.41s,Composer strict/audit0,frontend lint/typecheck/17unit/build lulus. Tujuh kelompok browser lokal lulus termasuk update kontak CMS, guard Marketing, stale409, mobile dan formula multi-phase. Source audit tetap11high dari tooling upstream; runtime audit0. Bukti/perintah/batasan: brochure-kpr-validation.md; riset/reconciliation: brochure-kpr-research.md. Rilis cloud dan impor katalog dilakukan terpisah sesudah deploy source/migrasi, dengan snapshot privat dan tanpa production seed. Hasil cloud akhir dicatat pada PR rilis.

Branch codex/site-operations dari origin/main3257844, membawa perbaikan routing/same-origin PR#17 serta bounded worker media dan pemeriksaan build Git. Runtime cloud aktual mendukung GD: unggah logo via API cloud berhasil, memperbaiki asumsi lama yang bersumber dari daftar ekstensi contoh. MEDIA_PROCESS_IN_REQUEST menghilangkan kebutuhan worker komputer untuk gambar; PDF tanpa scanner tetap fail closed. Dua project Vercel sudah terhubung repo GitHub, tanpa GitHub Actions.

Narasi aplikasi dan database dibersihkan sesuai instruksi pengguna. Foto kurasi tetap beratribusi dan berlabel ilustrasi. Testimonial persona dan rate sintetis dijadikan draft; nama resource cloud tidak diubah. Pemeliharaan terkontrol juga mengganti slug fixture dan catatan sintetis, dengan snapshot privat sebelum perubahan dan audit; endpoint histori tetap tidak menyediakan edit. Aset ilustrasi berteks lama diregenerasi di R2.

Validasi lokal: PHP8.4.26, PostgreSQL17.9, Node24.21.0, 86 PHPUnit/637 assertions pada SQLite dan database PostgreSQL test terpisah (cluster dihentikan sesudah suite); Pint, Composer validate/audit, lint, typecheck,15 unit frontend dan build lulus. Source npm audit masih11 high dari dua advisory upstream tooling; audit artefak runtime0. Bukti deploy/pipeline dan browser dicatat pada site-operations-validation.md setelah selesai. Tidak ada migration/dependency baru atau seed otomatis.

Pengujian cloud tambahan menemukan sesi akun inactive ditolak403 tetapi stamp/login device masih tersisa, dan pemeriksaan terpisah mendapati error login melalui proxy menjadi HTML200. Perbaikan ActiveUser membersihkan sesi sebelum403; regresi gagal pada perilaku lama (stamp masih ada). Hasil suite akhir, deploy Git dan uji ulang dicatat pada site-operations-validation.md.

Hasil akhir: source198acc1 deployed otomatis lewat Git ke kedua alias; native PHP8.5.2/88tes655assertion lulus.7browser cloud inti diulang setelah fix +6kelompok tambahan +4publik lulus;88tes lokal SQLite/PostgreSQL dan15unit frontend lulus, runtime audit0/source11high upstream tetap terbuka. Login salah dan akun inactive mengembalikan422 JSON lewat host web; sesi lama dicabut401, notifikasi recipient-scoped, semua foto beranda termuat. Data uji tambahan dipensiunkan setelah snapshot/audit, data awal tetap utuh. Bukti/detail operasional ada di site-operations-validation.md. PR#18 belum merge; production tracking sementara codex/site-operations.

## Koreksi integrasi aset — 2026-10-15

Importer membandingkan dimensi READY hasil resize, menolak replacement MASTERPLAN sebelum penulisan, dan mensyaratkan acknowledgement worker untuk upload asynchronous. Marker impor hanya tersedia internal; disclosure AI tetap publik. Gambar OG default menggunakan foto gerbang pengguna. 55 galeri terdiri dari35 dokumentasi dan20 AI; empat tipe belum mempunyai foto. Form VIDEO Admin siap untuk tautan YouTube yang diisi kemudian; tidak ada video placeholder. Validasi gabungan dan review final tetap gate sebelum merge/impor lokal.
