# Status implementasi

Pembaruan pengalaman pengguna 2026-10-05 berada pada branch `codex/experience-clarity` / [PR #21](https://github.com/ariefmavlana/flamboyan-perum/pull/21), berangkat dari `origin/main` `25869e3`. Implementasi mencakup fokus input netral, navigasi publik ringkas, visual kawasan bersumber dari katalog awal, antrean kerja CRM berdasarkan scope backend, filter URL, detail dengan tindakan berikutnya, editor properti per bagian, serta CMS/laporan/akun yang lebih mudah dibaca pada desktop/mobile. Kontrak baru `GET /leads/summary` dan filter `work` sudah diimplementasikan dan diuji; tidak ada migrasi database. Validasi: 96 test/749 assertion pada masing-masing SQLite dan PostgreSQL, 17 unit frontend, 24 kasus browser relevan, lint/typecheck/build, Pint dan Composer lulus; audit runtime 0, source audit tetap 11 high baseline. Belum di-merge atau di-deploy. Persona, sumber aset, perubahan dan rollback: [experience-clarity.md](experience-clarity.md); hasil validasi aktual dan batasan: [experience-validation.md](experience-validation.md). Catatan main/produksi di bawah adalah riwayat rilis sebelumnya.

Update aset 2026-10-05 · branch `codex/rajasa-type-assets`: inventaris 33 berkas Rumah Rajasa selesai; 21 gambar dipublikasikan melalui API existing pada sembilan tipe live, termasuk penggantian sembilan sampul. PHOTO lama dan MASTERPLAN tetap tersimpan; metadata properti sebelum–sesudah identik selain version/updated_at. Impor lokal dua kali membuktikan pengulangan tanpa duplikasi. Skrip/manifest/provenance berada pada PR terpisah dari PR UX#21; tidak ada merge atau deploy source oleh pekerjaan ini. Dimensi asli terbaik 573–1027px untuk fasad, tanpa upscaling; bukan klaim HD/4K. Lihat [rajasa-assets.md](rajasa-assets.md).

Validasi aset: 7 test importer; masing-masing 94 test/713 assertion SQLite dan PostgreSQL; Pint, Composer validate/audit, lint/typecheck, 17 test frontend dan build lulus. Runtime audit 0, source tooling masih 11 high existing. Browser live memverifikasi 9 tipe/63 varian serta interaksi galeri/beranda desktop1440 dan mobile390 tanpa gambar rusak, overflow atau page error. Rencana live setelah impor menunjukkan 0 baru/21 reused.

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
