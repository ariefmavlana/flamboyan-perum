# Rencana implementasi growth, SEO, CRM dan portabilitas hosting

Versi 1.1 · 17 Oktober 2026 · **APPROVED FOR IMPLEMENTATION BY USER IN THIS THREAD**

Dokumen ini adalah baseline implementasi untuk paket spesifikasi di direktori ini. Instruksi pengguna terbaru mengotorisasi implementasi menyeluruh, commit, push, pembukaan PR, review sampai tidak ada blocker, serta pemeriksaan Vercel sebelum pembelian Hostinger. Pernyataan lama bahwa implementasi belum diotorisasi telah digantikan oleh instruksi tersebut. Otorisasi ini tidak mencakup pembelian, perubahan DNS, pembuatan/penautan akun eksternal, belanja iklan, aktivasi tag dengan ID resmi, atau merge PR.

## 1. Sasaran, hasil dan batas selesai

Perubahan ini harus menghasilkan satu alur yang dapat dibuktikan tanpa mengarang data bisnis:

1. Pengunjung memilih salah satu dari tepat lima properti BFI2 yang diizinkan backend, mengirim konsultasi atau permintaan survei, dan menerima receipt generik hanya setelah data tersimpan.
2. Admin merekonsiliasi inquiry menjadi lead baru, menautkannya ke lead existing, atau menolaknya sebagai spam. Marketing hanya melihat data yang telah menjadi lead dan ditugaskan kepadanya.
3. Lead dapat diberi bukti qualified, kunjungan requested/confirmed/completed/cancelled/no-show, dan akad confirmed/revoked. Semua perubahan memakai optimistic concurrency, histori append-only, transaksi atomik, dan otorisasi backend.
4. Atribusi first-touch/last-non-direct yang eligible mengikuti consent, bertahan lintas navigasi, disanitasi, dan tidak menyimpan PII di browser event. Klik WhatsApp tetap contact intent, bukan lead.
5. Robots, sitemap, canonical, metadata, structured data, halaman proyek/tipe/panduan dan internal linking mengikuti data publik aktual. Query tracking dapat dirayapi untuk membaca canonical/noindex; ruang filter tetap terkendali.
6. Routing Nuxt SSR ke Laravel tidak lagi bergantung pada flag Vercel. Konfigurasi yang sama dapat dipakai Vercel sekarang dan dikualifikasi di Hostinger nanti, dengan allowlist method/path dan tanpa proxy terbuka.
7. Vercel menjadi gate pertama: seluruh validasi lokal lulus, PR Preview sehat, lalu browser rehearsal end-to-end lulus pada dataset terisolasi. Tidak ada pembelian Hostinger sebelum bukti dan limit SKU nyata diperiksa.

`IMPLEMENT_NOW` berarti kode, migrasi aditif, UI, tes, dokumentasi, runbook, dan bukti lokal/Vercel yang tidak memerlukan keputusan eksternal dikerjakan pada PR ini. `EXTERNAL_GATE` berarti requirement tetap wajib tetapi kelulusannya memerlukan paket/domain/akun/fakta/legal/policy yang belum tersedia. `DEFERRED_BY_SPEC` berarti spesifikasi sendiri menunda integrasi itu ke fase lain dan PR ini tidak boleh membuat klaim selesai.

## 2. Konteks dan keputusan yang mengikat

- Arsitektur tetap Nuxt SSR + Laravel REST modular monolith. Tidak menambah microservice, generic repository, event bus, Redis, atau layanan queue baru.
- Database tetap Supabase PostgreSQL dan media tetap Cloudflare R2 private. Tidak ada migrasi ke database Hostinger, MySQL, public bucket, atau static-only Nuxt.
- Fokus penjualan dan intake hanya BFI2. Target audiens iklan adalah Kota Bandung, tetapi alamat proyek tetap Cibiru Wetan, Kabupaten Bandung.
- Budget media satu bulan adalah total Rp500.000; Google Search lebih dulu; Meta paid Rp0. PR ini tidak membuat akun, memasukkan billing, atau menayangkan iklan.
- WhatsApp Admin tetap jalur langsung. Form situs menjadi jalur tambahan dan tidak diwajibkan sebelum WhatsApp.
- Pipeline existing tidak berubah: `NEW_LEAD → FOLLOWED_UP → SURVEY_LOKASI → PEMBERKASAN_KPR → DEAL`, dengan `LOST` terminal. Qualification, visit, dan akad adalah bukti/proyeksi terpisah; tidak mengubah status pipeline otomatis.
- Public DTO tidak memuat identitas Marketing atau data CRM. Semua waktu disimpan UTC dan ditampilkan Asia/Jakarta; IDR integer dan luas decimal tetap berlaku.
- Lima ID properti BFI2 disediakan melalui konfigurasi privat/release manifest setelah diverifikasi Admin. Judul, slug, atau substring tidak pernah menjadi boundary otorisasi.
- Banjaran diperlakukan konservatif `noindex,follow` dan dikeluarkan dari sitemap sampai pemilik memutuskan kontennya cukup untuk index. Status pengenalan tetap terlihat bagi pengguna.
- Kebijakan retensi/legal, domain, paket Hostinger, jam layanan, PIC, NAP/GBP, identitas entitas, serta akun Google/Meta tetap gate. Implementasi menyediakan kontrol yang default-off atau manual sampai gate ditutup.

## 3. Non-goals

Tidak termasuk WhatsApp Business Platform, scraping WhatsApp, chatbot, booking berbayar, pembayaran, aplikasi kredit, akun pembeli, Meta Instant Form ingestion, offline conversion upload, enhanced conversions, Meta CAPI, GTM server-side, retargeting, customer list, ads API automation, Performance Max, Display/YouTube paid, generic blog CMS, multi-project data model, perubahan pipeline untuk pembeli tunai, atau janji ranking/lead/akad. Tidak membeli Hostinger/domain, mengubah DNS, membuat GBP, mengaktifkan tracker resmi, mengunggah kontak, atau membelanjakan anggaran.

## 4. Desain data dan invariant

Migrasi harus aditif dan kompatibel dengan code rollback. Nama fisik final boleh disesuaikan dengan konvensi Laravel existing, tetapi kontrak berikut tidak boleh berkurang.

### 4.1 `lead_inquiries`

- Primary key internal; `receipt` UUID/opaque unique; `idempotency_key_hash` unique; `request_payload_hash`; replay/tombstone expiry.
- `property_id`, normalized `name`, normalized nullable `whatsapp_number`, `purpose` (`CONSULTATION|VISIT_REQUEST`), optional `preferred_visit_at` UTC, optional plain-text `message` maksimal 1.000 karakter.
- `privacy_notice_version`, `marketing_opt_in` default false, optional `attribution_id` yang menunjuk record minimum hasil validasi token.
- State `PENDING|RESOLVED|REJECTED_SPAM|EXPIRED`; action memisahkan ACCEPT_NEW dan LINK_EXISTING; nullable `lead_id`; optimistic `version`; `resolved_by`, `resolved_at`, alasan terkontrol, timestamps UTC.
- Public response hanya receipt. Tidak ada public GET receipt, dedup result, state, lead ID, assignee, atau histori.

### 4.2 `lead_attributions` dan token konteks

- First/last-touch disimpan di client secara versioned setelah consent. Saat form dikirim, fixed BFF relay memanggil Laravel untuk memvalidasi konteks itu dan mengembalikan token opaque terenkripsi yang berisi payload bounded, consent scope/version/time, capture method dan expiry. Laravel membuka serta memvalidasi token kembali pada intake; tidak ada secret di client. Context belum dipersist sebelum inquiry; setelah intake valid, data minimum menjadi `lead_attributions` yang terhubung ke inquiry/lead.
- Taxonomy bounded: source, medium, campaign, content, term maksimal 120 karakter sesudah sanitasi. `gclid`, `gbraid`, `wbraid`, `fbclid` dan identifier provider lain dibuang dari URL/context dan tidak disimpan atau diunggah pada fase ini.
- Context dari client tetap berprovenance `CLIENT_PROVIDED`; self-report `SELF_REPORTED`; unknown valid. Tidak dipromosikan menjadi bukti platform terverifikasi.
- Token tidak berisi PII atau campaign plaintext; konteks bounded berada dalam ciphertext. Direct visit tidak menimpa last non-direct.

### 4.3 Outcome dan operasi lead

- `lead_outcomes` qualification fields: satu proyeksi per lead dengan boolean/current state, rubric version, alasan, actor, version; setiap perubahan menambah histori `QUALIFICATION_CHANGED`.
- `lead_visits`: planned UTC, state `REQUESTED|CONFIRMED|COMPLETED|CANCELLED|NO_SHOW`, actor, version, timestamps. Preferensi publik tidak langsung menjadi `CONFIRMED`.
- `lead_outcomes`: satu proyeksi per lead untuk akad current state/date/reference ringkas/actor/version. Confirm hanya saat lead `DEAL`; correction/revoke menjadi event baru, tidak menghapus histori.
- Histori existing ditambah type `INQUIRY_LINKED`, `QUALIFICATION_CHANGED`, `VISIT_CHANGED`, `AKAD_CONFIRMED`, `AKAD_REVOKED`, `ATTRIBUTION_CORRECTED`. Payload histori tidak menyalin nomor, isi formulir, dokumen, atau click ID.
- Inquiry resolve, lead/history/notification, attribution link, dan projection update berada pada satu koneksi dan satu transaksi. Unique constraints menjadi arbiter race; retry tidak membuat duplikat.

### 4.4 Retensi

- Sediakan command dry-run dan execute eksplisit untuk inquiry/context yang menampilkan hitungan saja, tidak memuat PII. Scheduler tetap disabled sampai O-05 disahkan.
- Durasi 30/7/30/90 hari dan 24 bulan pada spec diperlakukan kandidat konfigurasi, bukan policy aktif. Execute menolak berjalan tanpa nilai konfigurasi eksplisit dan acknowledgement operator.
- Linked inquiry meminimalkan salinan kontak setelah rekonsiliasi tanpa memutus receipt, audit, atau relasi lead. Backup expiry dan anonymization existing dicatat di runbook.

## 5. Kontrak API final untuk implementasi

Semua mutation authenticated memakai CSRF/session existing. Semua internal response `no-store`; scoped miss tetap 404; stale version 409 tanpa side effect.

Public intake mempunyai tiga gate konfigurasi default-off: enable intake, approved privacy-notice version, dan tepat lima stable property IDs. Jika salah satu tidak valid, options/context/intake gagal aman tanpa dummy. Relay POST Nuxt menerima JSON berbatas ukuran hanya dari same-origin `Origin`, tidak meneruskan cookie browser, meneruskan hanya header yang diizinkan serta signature server, dan tidak menerima path/upstream dari payload.

| Method dan path | Akses | Kontrak minimum |
| --- | --- | --- |
| `GET /api/v1/inquiries/options` | Public, BFF GET allowlist | `200 {data:[{property_id,title,canonical_path}]}` maksimal lima record allowlisted+PUBLISHED; source failure 503; tidak ada fallback dummy |
| `POST /api/v1/inquiries/context` | Public hanya melalui fixed BFF relay | Menerima taxonomy sanitized + consent snapshot/timestamp, menghasilkan token opaque terenkripsi+expiry; tidak menerima PII/click ID dan tidak mengklaim verifikasi platform |
| `POST /api/v1/inquiries` | Public hanya melalui fixed BFF relay | Header `Idempotency-Key` ≥128-bit; body field sesuai spec; 202 `{accepted:true,receipt}` setelah commit; 422, 429, 503; replay identik mengembalikan receipt sama; key sama/payload beda 409 generik |
| `GET /api/v1/internal/inquiries` | Admin aktif | Pagination, state filter, data minimum rekonsiliasi, version; tidak dapat diakses Marketing |
| `POST /api/v1/internal/inquiries/{id}/resolve` | Admin aktif | `{action,version,reason?,lead_id?,assigned_marketing_id?}`; action `ACCEPT_NEW|LINK_EXISTING|REJECT_SPAM`; action/payload divalidasi ketat |
| `PATCH /api/v1/internal/leads/{id}/qualification` | Admin atau assignee aktif | `{qualified,reason,version}`; rubric versi 1 dicatat server pada histori; tidak mengubah pipeline |
| `POST /api/v1/internal/leads/{id}/visits` | Admin atau assignee aktif | Membuat REQUESTED/CONFIRMED yang sah dengan planned time/reason; version lead dan transaksi/histori atomik |
| `PATCH /api/v1/internal/leads/{id}/visits/{visitId}` | Admin atau assignee aktif | Transisi state visit yang diizinkan + lead version (guard bersama semua mutation); visit version dikembalikan untuk audit; completed bukan akibat status pipeline saja |
| `POST /api/v1/internal/leads/{id}/akad-confirmation` | Admin aktif | `{confirmed:boolean,occurred_at?,reference?,reason,version}`; confirmed=true mensyaratkan DEAL; event koreksi append-only |
| `GET /api/v1/internal/reports` | Admin/Marketing scoped existing | Memperluas response secara aditif dengan inquiry, valid, qualified, visit, DEAL, akad, attribution method, unknown/unmatched dan denominator-null semantics |

Endpoint context tambahan menutup gap pada proposal awal: `attribution_token` tidak dapat divalidasi jika tidak ada proses mint server-side. BFF hanya meneruskan path dan body yang fixed; secret enkripsi/proxy tidak pernah berada di runtime public. Token memberi integritas konteks `CLIENT_REPORTED`, bukan bukti klik platform. Expiry dan replay tidak boleh membuat retry form kehilangan atribusi yang sama.

## 6. Alur UI

### 6.1 Publik `/konsultasi`

- SSR tetap menampilkan konten, WhatsApp dan canonical tanpa menunggu JavaScript/tag.
- Form mengambil options dari endpoint, tidak mempercayai slug/judul/query sebagai property ID. Query existing boleh melakukan preselection hanya jika ID/slug cocok dengan option resmi.
- Field: nama, nomor WhatsApp, satu tipe, purpose, preferred visit optional, message optional, notice version, opt-in marketing optional. Jelaskan bahwa preferred time bukan booking dan larang data identitas/finansial rinci.
- Consent layanan tidak bergantung consent analytics/marketing. Submit dengan semua optional tracking ditolak harus tetap berfungsi.
- Client membuat idempotency key per form instance, menyimpannya hanya dalam memory/session lifecycle yang tidak memuat PII, menahan double submit, dan hanya memancarkan `inquiry_submitted` setelah 202. Error mempertahankan input in-memory dan tidak memancarkan sukses.
- Setelah sukses tampilkan receipt acknowledgement tanpa menampilkan ID/status lead, lalu opsi WhatsApp. Refresh tidak memancarkan event ulang.

### 6.2 Workspace

- Admin mendapat inbox inquiry dengan pending count, filter, detail minimum, state, attribution provenance, dan tiga aksi resolve. Setiap modal menampilkan versi dan menangani 409 dengan reload.
- ACCEPT_NEW dapat memilih Marketing aktif secara opsional; LINK_EXISTING hanya menerima lead visible yang nomor+property cocok setelah normalisasi atau memerlukan alasan koreksi yang eksplisit. REJECT_SPAM wajib alasan.
- Lead detail/drawer menampilkan qualification, daftar visit, outcome akad, dan histori baru. Marketing hanya untuk assigned lead; akad hanya Admin.
- Dashboard/report tidak menampilkan kontak pada chart/export default. Denominator nol adalah `null`/“belum ada”, bukan Rp0 atau 0% palsu.

## 7. Consent, atribusi dan event

- GTM adalah satu-satunya loader provider. Hapus jalur direct Meta Pixel; `NUXT_PUBLIC_META_PIXEL_ID` tidak mengaktifkan loader kedua. Meta kelak dikonfigurasi melalui GTM setelah gate akun/policy.
- Sebelum GTM dimuat, push Consent Mode v2 `default` dengan seluruh storage/ad personalization denied. Setelah pilihan, push `update` terpisah untuk analytics dan marketing. Consent analytics saja tidak menyalakan marketing; marketing saja tidak otomatis menjadi consent analytics.
- Persist preference ber-version; revoke mengubah state dan mencegah event berikutnya. Karena tag yang sudah dimuat tidak dapat “di-unload”, container wajib menghormati consent update; hal ini dibuktikan di Preview/Tag Assistant sebelum ID resmi dipasang.
- Capture campaign hanya setelah consent yang relevan. Simpan first touch dan last non-direct dalam storage versioned tanpa PII; nilai disaring untuk email, nomor, token, control char, query/referrer mentah, dan batas 120 karakter. Click ID provider dibuang dan parameter sensitif dihapus dari URL sebelum analytics. TTL mengikuti konfigurasi policy default-off.
- Page view SPA memakai satu mekanisme saja. Event browser: existing events + `inquiry_submitted`; outcome CRM tidak dikirim provider pada fase ini. Receipt, contact, message, click ID, actor, private route, dan internal IDs sensitif tidak menjadi dimension/event.
- CSP dibangun dari jalur GTM aktif; tidak menambahkan host Meta berdasarkan pixel ID yang tidak dimuat. Login, reset, backoffice, dan halaman response yang membawa PII tidak memuat tag.

## 8. SEO dan konten

- Ganti robots blanket query block dengan rule untuk private paths saja; compare/filter tetap noindex melalui header/meta, sedangkan tracking query dapat dirayapi untuk melihat canonical bersih. AdsBot/preview memperoleh public CSS/JS/image/landing yang sama tanpa bypass auth.
- Sitemap pages berisi home, project BFI2, listing, Bandung Timur, panduan eligible, konsultasi, privasi; Banjaran keluar sampai keputusan index; property sitemap hanya PUBLISHED yang eligible, canonical 200, lastmod bermakna. Source failure tetap 503.
- Setiap template mempunyai unique title, description, satu H1, visible breadcrumb/internal links, canonical/og:url konsisten. Lima type pages memakai data API yang sama; tidak menyalin harga/promo ke source statis.
- Structured data tetap factual: WebSite/BreadcrumbList dan RealEstateListing/House/Offer hanya field tersedia. Organization ditahan sampai identitas legal/NAP disahkan; Article/VideoObject hanya jika data lengkap.
- Perkuat halaman proyek, perbandingan tipe, pembiayaan, panduan kunjungan, konteks kawasan, dan proses menuju akad menggunakan fakta yang sudah ada. Fakta baru yang belum tersedia tampil sebagai ajakan konfirmasi, bukan placeholder seolah benar.
- Tambahkan content register reviewable untuk halaman statis/dinamis: owner role, intent, target URL, source file/API, review date, expiry/next review, status. Ini bukan generic blog CMS.
- Uji OG image 200, alt/disclosure aktual-vs-ilustrasi, intrinsic sizes, LCP image priority, responsive galleries, 390 px, keyboard/focus. Lighthouse hanya bukti lab; CWV field tetap external.

## 9. Portabilitas Vercel dan Hostinger

- Ganti `VERCEL === '1'` dengan explicit server setting, misalnya `NUXT_API_PROXY_ENABLED=true`, yang berlaku pada Vercel dan Hostinger. Build production gagal bila proxy enabled tanpa `NUXT_API_BASE`, proxy secret, allowed host, atau required origin.
- Jangan memakai wildcard proxy. Generate route map method+path yang mencakup contract existing dan endpoint baru; unknown route/method, encoded traversal, external origin, dan client-supplied forwarded headers ditolak.
- Public BFF tetap handler bounded dengan signature dan tanpa cookie. Auth/internal bridge menjaga cookie/CSRF dan error status JSON. `/ready` ditambahkan ke health bridge bila contract Laravel memang tersedia.
- Tambahkan preflight nonsecret yang memeriksa runtime version/extensions, env presence, writable temp, outbound DNS/TLS/DB/R2 capability, route health, dan queue configuration tanpa mencetak secret.
- Siapkan runbook build/release untuk dua site, public root Laravel, shared storage, migrations one-writer, scheduler lock, queue bounded, rollback, backup/restore, monitoring dan CSP/cookie smoke. Tidak membuat klaim SKU Hostinger lolos.
- Vercel Preview tetap bukti pertama portabilitas. Hostinger qualification sesudah pembelian tetap harus membuktikan HOST-01..32 dan menutup konflik persistent worker vs cron.

## 10. Urutan pengiriman

Urutan berikut menjaga compatibility dan memungkinkan rollback code tanpa kehilangan inquiry baru.

1. **Foundation contract:** migrasi aditif, enum/model/policy, config allowlist, public options, attribution mint, idempotent intake, retention command dry-run, feature tests SQLite/PostgreSQL.
2. **CRM reconciliation:** Admin inbox, resolve transaction, qualification, visits, akad, history/notification, scoped report, optimistic concurrency dan privacy cleanup tests.
3. **Public experience:** form accessible/responsive, durable receipt states, WhatsApp independent path, scoped workspace UI, unit/browser behavior.
4. **Measurement:** consent default/update, category separation, persistence/revoke, campaign context/token, event dedupe/no-PII, GTM-only CSP.
5. **SEO/content:** robots, sitemap lifecycle, Banjaran safety default, metadata/schema/internal links/content register/media assertions.
6. **Deployment portability:** explicit proxy mode, exact route map, environment examples, preflight/runbooks, local production smoke.
7. **Full verification and review:** full checks, independent read-only full-diff review, thermo-nuclear review, fix all blockers, repeat affected checks.
8. **External workflow:** commit Conventional Commits, push, draft PR, attach evidence, wait for Vercel Preview checks, inspect Preview, update PR until review has no blocker. Do not merge.

Material scope beyond these slices returns to design. Fixes necessary to satisfy a listed acceptance criterion remain in approved scope.

## 11. Security dan privacy acceptance

- Authorization is backend-only; Admin-only inquiry/akad and assigned Marketing scope have positive and negative tests, including inactive session and reassignment loss of access.
- Public rate limiting has IP and contact-HMAC layers backed by durable store where available; proxy IP is trusted only from configured proxies. Generic duplicate responses prevent phone+property enumeration.
- Logs/errors/audit output contain request ID and class/status only: no name, phone, message, receipt, token, click ID, query/referrer, secret, SQL, or form body.
- Body/content-type/field limits, plain-text normalization, published+allowlisted property validation inside transaction, and output encoding are mandatory. CAPTCHA remains absent unless abuse evidence justifies separate review.
- Encryption keys and secrets remain external. `.env`, dump, database, upload, vendor, node_modules, runtime files, Preview URLs with credentials, and screenshots containing CRM data are never committed.
- Database rollback is forward-compatible: retain new tables/columns on code rollback. Never restore production DB over valid new inquiries. Reconcile receipts after any incident.

## 12. Observability dan operasi

Minimum metrics: inquiry accepted/rejected/error/429 by non-PII reason, pending age, resolve action, idempotent replay/conflict, lead race, queue oldest age/failure, form dependency 503, auth 401/403/404/409, SSR/API latency, sitemap/robots status, 5xx, CSP reports, and purge dry-run counts. Campaign reports show spend only after external billing data exists.

Alert candidates and owner must be recorded in runbook: intake 5xx or zero accepted during known traffic, pending over agreed SLA, queue stuck, sitemap/landing 5xx, promo expiry, media/OG failure, auth regression, CSP block spike, DB connection saturation, and privacy cleanup failure. No alert payload includes PII.

## 13. Verifikasi wajib

### Lokal

- `vendor/bin/pint --test`, PHPUnit full on SQLite and isolated PostgreSQL, focused concurrency/idempotency/rollback tests, `composer validate --strict`, `composer audit`.
- Frontend lint with zero warnings, typecheck, unit tests, production build, source dependency audit and runtime artifact audit reported separately.
- Browser flows on production build: form denied-consent, options failure, validation, retry/idempotency, Admin resolve three paths, Marketing scope, qualification/visit/akad, report denominator, WA independent, consent combinations/revoke/reload/SPA, no PII dataLayer/network, robots/sitemap/canonical/404/503/mobile/keyboard.
- `git diff --check`, migration status, route list review, secret scan, untracked-file review. Existing `.commandcode` user files remain untouched and excluded from commit.

### Vercel-first

1. Confirm Preview SHA equals PR head and both Nuxt/API deployments are healthy.
2. Confirm Preview uses isolated test Supabase/R2 and test accounts before any mutation. If this cannot be proved, restrict Preview to public/read-only HTTP inspection and mark write rehearsal blocked; never test form/CRM against production data implicitly.
3. Inspect public pages, HTML SSR, headers/CSP/canonical/robots/sitemap, assets/media, API error propagation, mobile 390 px, and console/network errors.
4. On isolated Preview, run the complete campaign→form→inbox→lead→qualified→visit completed→DEAL→akad→report rehearsal plus WhatsApp/unknown attribution.
5. Test consent with tag test IDs/Preview only, verifying no request before grant, category separation, revoke, no duplicate pageview, and no PII.
6. Record URLs redacted as needed, deployment IDs/SHA, timestamps WIB, commands, test counts/durations, screenshots without CRM data, limitations, and rollback.

### Review gates

- Independent reviewer examines staged, unstaged and untracked full diff plus migration/authorization/concurrency/privacy/tests/docs.
- Karena perubahan menyentuh deployment, secret configuration, network policy, CSP, database migration dan queue, `thermo-nuclear` harus lulus pada diff final. Changed diff after review invalidates the approval and requires rerun.
- PR has no unresolved blocker, requested changes, failing Vercel check, conflict, or unexplained skipped required validation. AI review is evidence, not human approval or merge authority.

## 14. Rollout, rollback dan feature gates

- Ship schema first, then backward-compatible API, then UI. Form/intake, attribution capture, official tags, and retention scheduler use separate default-off flags. Public options may be enabled only after five IDs verified on target DB.
- Enabling intake requires approved notice version, verified options, Admin coverage, successful isolated rehearsal, monitoring, and rollback owner. Enabling provider tags additionally requires official account IDs, consent/legal signoff, CSP/Tag Assistant proof, and no PII review.
- Code rollback disables form/attribution/tag flags and deploys prior release while retaining schema and accepted data. Admin continues existing manual CRM and WhatsApp. No destructive migration down.
- Vercel rollback uses prior validated deployment; one scheduler/worker writer remains active. Hostinger rollback is documented but not executed before purchase/cutover authorization.
- Ads pause rules remain external operations: broken landing/form, wrong/expired offer, privacy leak, unauthorized account use, follow-up unavailable, or approaching monetary cap.

## 15. Definition of done for this PR

The implementation PR may be called technically complete only when all `IMPLEMENT_NOW` rows in [traceability](implementation-traceability.md) have code/docs and passing evidence, full local checks and required reviews pass on the final diff, and Vercel-first evidence is recorded. `EXTERNAL_GATE` and `DEFERRED_BY_SPEC` rows must remain explicitly open and cannot be relabeled complete. The PR is not merged, Hostinger is not purchased, DNS is not changed, and ads are not activated without a later user instruction.

Kontrak wire final dan pilihan nama fisik mengikuti [backend-api-contract.md](backend-api-contract.md). Guard legal/retensi, jenis provenance CLIENT_REPORTED/ADMIN_REPORTED/UNKNOWN, report dua cohort, pagination dan koreksi outcome dijelaskan di sana. [validation.md](validation.md) memisahkan bukti yang benar-benar dijalankan dari gate yang masih terbuka.
