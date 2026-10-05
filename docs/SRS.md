# Software Requirements Specification — Flamboyan Perum

## Perluasan kontrak komersial — 2026-10-05

Availability menambah CHECK_REQUIRED: stok belum dikonfirmasi dan structured data tidak mengarang ketersediaan. Properties menambah JSON commercial, offer_price_idr/start/end dan next_price_idr/start melalui migrasi aditif. Harga publik, filter, sort dan compare memakai harga pada hari Asia/Jakarta: program inklusif tanggal mulai/akhir, kemudian harga berikutnya jika sudah mulai, selain itu harga normal. Tidak ada perpanjangan promo otomatis. Nilai IDR integer; area decimal. Publik memakai allowlist eksplisit, tanpa aktor verifikasi atau identitas Marketing.

PATCH commercial hanya ADMIN aktif; verified eksplisit, version guard, fresh actor/property lock, increment version dan audit dalam transaksi. Periode harga/biaya berikutnya harus setelah program; total pembayaran pengembang harus tepat sama dengan pembayaran awal + bulan × angsuran. Skema kedaluwarsa dipertahankan internal, disembunyikan publik. Marketing tidak mengubah konfigurasi ini. MASTERPLAN memakai pipeline gambar private existing dengan batas satu per properti; bukan FLOOR_PLAN.

CMS DEVELOPMENT adalah schema fixed Admin-only, plain text dan WhatsApp berformat 62. BANK_RATE menambah tahapan bulan/bunga, floating, tanggal pemeriksaan, syarat, tenor/plafon/LTV dan biaya opsional; unknown keys ditolak. Jumlah bulan tahapan sama dengan fixed_months dan bunga pertama sama dengan annual_rate. Min/max diperiksa hanya jika keduanya diketahui. Sumber HTTPS; pemeriksaan sumber tidak boleh di masa depan menurut Asia/Jakarta; attestation wajib setiap publikasi/perubahan. Tidak ada klaim bank rekanan dari referensi rate.

Kalkulator memakai anuitas bulanan (bunga tahunan/12); setiap perubahan bunga menghitung ulang dari sisa pokok dan sisa tenor. Floating masa depan adalah asumsi editable. Biaya bank yang diketahui diperlihatkan per komponen; biaya pengembang tidak dijumlahkan otomatis karena potensi tumpang tindih. Batas LTV regulasi bukan persetujuan bank; appraisal pengguna hanya asumsi. Batas sumber tercatat di brochure-kpr-research.md.

Versi 2.2 · 2026-10-04 · Kontrak F0–F2 dan demo dinamis; bukti aktual di implementation-status/acceptance-validation/dynamic-demo-validation.

## 1. Otoritas, stack, dan scope

PRD mendefinisikan produk, SRS mendefinisikan perilaku, ADR menjelaskan tradeoff, `API_DOCS.md` menjelaskan endpoint yang benar-benar tersedia. `implementation-status.md` menentukan coverage saat ini. Original v1.1 di `original/` merupakan arsip, bukan spesifikasi aktif. Semua keputusan tambahan di §2 adalah baseline engineering yang dapat diganti melalui PR; tidak diklaim telah berasal dari guideline awal.

Nuxt 4/Vue 3/TypeScript strict dengan SSR aktif; Laravel 13/PHP ≥8.3, Eloquent, Sanctum cookie; Node 24 LTS target development/build/produksi; PostgreSQL produksi utama, SQLite lokal/instalasi ringan teruji. Composer dan npm lockfile wajib. Validasi dijalankan lokal dan dicatat pada PR; GitHub Actions tidak digunakan. Tidak menggunakan Docker atau microservices. Backend web root `public/`, private configuration/database/storage di luar web root. Website dan API berada pada origin yang sama melalui routing reverse proxy di produksi.

## 2. Keputusan dan permissions

| Aksi | Public | ADMIN aktif | MARKETING aktif |
|---|---|---|---|
| Public catalog published | Ya | Ya | Ya |
| Internal catalog/read draft | Tidak | Semua | Owner sendiri |
| Create/edit property | Tidak | Semua, owner Marketing aktif | Owner diri sendiri |
| Publish/archive/availability | Tidak | Semua | Owner sendiri |
| Create lead | Tidak | Ya | Tidak |
| Read lead/history | Tidak | Semua | Assignee terkini saja |
| Assign/reassign lead | Tidak | Ya | Tidak |
| Update pipeline/add notes | Tidak | Semua | Assignee terkini |
| Read/mark notification | Tidak | Milik sendiri | Milik sendiri |
| Reports/CMS/users/operations/privacy candidates | Tidak | Ya | Tidak |
| Profile | Tidak | Diri sendiri | Diri sendiri |

Role lain tidak ada. Pengguna inactive ditolak pada setiap protected request, bukan hanya login. Object di luar scope Marketing menghasilkan 404 agar identitas object tidak bocor. Aksi di luar role menghasilkan 403. User ID tidak dipercaya dari frontend; authorization dicek kembali dalam transaksi mutation, setelah lock/version guard.

## 3. Catalog dan publication

| Kelompok | Fields dan validasi |
|---|---|
| Identitas | id bigint, slug unique ≤160 lowercase `[a-z0-9-]`, title ≤160, owner_id FK Marketing aktif; slug immutable via ordinary edit |
| Spesifikasi wajib | house_type ≤80, condition NEW/RESALE, certificate ≤80, location ≤160, address ≤500, description plain text ≤10.000 |
| Numerik | price_idr integer 1..10^12, land_area/building_area decimal(10,2) >0 ≤10^6, bedrooms integer 0..50, bathrooms 1..50 |
| State | publication DRAFT/PUBLISHED/ARCHIVED default DRAFT, availability AVAILABLE/BOOKED/SOLD_OUT default AVAILABLE, featured boolean default false |
| Sistem | version integer default 1, created_at/updated_at UTC; owner/internal timestamp tidak ditampilkan melalui public resource |

Semua core fields required pada foundation create. Empty fields tidak dapat di-publish. Marketing tidak dapat mengganti owner; Admin dapat memilih owner aktif pada create. Transfer owner menggunakan endpoint Admin terpisah dengan version, alasan, Marketing aktif dan audit atomik. No hard-delete katalog melalui API; archive digunakan agar FK lead bertahan. Availability tidak mengubah publication; Deal tidak otomatis menyebabkan SOLD_OUT. ARCHIVED atau DRAFT tidak tersedia public, tidak masuk sitemap, tidak masuk compare.

List: `q` ≤100 pada title/location/address (case insensitive portable); price/area bounds, min bedrooms/bathrooms, condition/certificate/location/availability/featured; allowlisted sorting newest, price_asc/desc, land_asc/desc, building_asc/desc; secondary id sort deterministik; page integer ≥1, per_page 1..48 default12. Bound min≤max menghasilkan 422 jika melanggar. Pencarian memakai bound parameter; `%`/`_` SQL wildcard di-escape. Search ringan dengan LIKE; full text ditambah hanya berdasarkan pengukuran.

URL `/properti/{slug}` stabil. Published 200; lainnya 404. Error upstream bukan 404 palsu: failure menghasilkan 503 atau pesan retry. SSR menyertakan title, description, harga, spesifikasi, canonical absolut dan OG; sitemap index/1000perfile hanya published dan robots disallow backoffice/login/query variations. Sold out tetap 200 dengan label. Structured data RealEstateListing/Offer/House memakai informasi faktual dan tidak menambahkan rating/harga fiktif.

## 4. Media, lokasi, content (F1/F2)

`property_media`: property_id, kind PHOTO/FLOOR_PLAN/VIDEO/TOUR/BROCHURE, private staging/variants atau validated URL, alt, position, state, published flag, mime/size. Tidak perlu tabel terpisah untuk setiap jenis file. Lokasi/koordinat optional pada property; POI editorial JSON bounded20 berisi nama/kategori/jarak meter/source HTTPS/source_date; selalu dibaca bersama satu detail, belum membutuhkan query lintas POI. CMS HERO/TESTIMONIAL/BANK_RATE terstruktur dengan version, publication, position, Admin attestation dan audit; generic CMS/versioning bukan requirement awal.

Photo/floorplan: JPEG/PNG/WebP ≤5MiB, ≤40MP, tiap dimensi≤20000px, maksimum20 foto dan5 denah aktif per unit; PDF brosur ≤10MiB satu aktif; tanpa SVG/HTML/executable/upload video. MIME + signature + decode gambar, random storage name, jangan percaya filename klien; strip EXIF, generate responsive variants di background. Upload authorization owner/Admin, staging private, baru expose sanitized media published. PDF diunduh attachment dengan nosniff dan malware scan sebelum produksi. Batas request/server selaras batas file. Replace/archive media memakai audit; cleanup setelah grace 30 hari dan backup.

Video awal hanya YouTube tervalidasi, bukan arbitrary iframe HTML. Tour melalui HTTPS allowlist provider yang dicatat konfigurasi; embed sandbox/permission minimal. Baseline maps iframe resmi OpenStreetMap setelah consent, sandbox/lazy/no-referrer dengan attribution provider dan external fallback; restricted key bila nanti memakai API berbayar; POI manual dengan sumber, tanpa klaim radius otomatis. Missing media/brosur tidak menampilkan kontrol rusak. Tidak ada server-side fetch arbitrary URL (menghindari SSRF).

## 5. CRM, dedup, dan concurrency

Lead fields: id, name (≤160), whatsapp_number (canonical E.164 tanpa `+`, 8..15 digit), property_id required FK, assigned_marketing_id nullable FK, status NEW_LEAD default, version default1, assigned_at nullable UTC, first_followed_up_at nullable UTC, timestamps. Input Indonesia `08…`→`628…`; `+`/spasi/kurung/dash dihapus, karakter lain ditolak. Nomor valid-format bukan bukti kepemilikan/nomor aktif.

Unique `(whatsapp_number, property_id)` berlaku seluruh record; duplicate menghasilkan409 tanpa menimpa history. Satu kontak untuk properti berbeda boleh menjadi lead berbeda. Create duplicate bukan merge. Leads tidak hard-delete melalui API. Target privacy operation dapat meng-anonymize berdasarkan kebijakan retention yang disahkan; bukan exception tersembunyi untuk histori.

| Status sekarang | Tujuan diizinkan |
|---|---|
| NEW_LEAD | FOLLOWED_UP atau LOST |
| FOLLOWED_UP | SURVEY_LOKASI atau LOST |
| SURVEY_LOKASI | PEMBERKASAN_KPR atau LOST |
| PEMBERKASAN_KPR | DEAL atau LOST |
| DEAL / LOST | Tidak ada |

Mutation status membutuhkan assignee aktif, version, dan note ≤2.000; LOST note wajib alasan. Assignment pertama/reassignment Admin saja, target role Marketing active; terminal409; reassignment wajib reason. Assignment ke penerima yang sama ditolak409 tanpa event baru. Reassignment tidak mengubah status/first follow-up. Set assigned_at sekali untuk KPI. User inactive tidak menerima assignment dan tidak dapat mutation. Notes 1..2.000 karakter, append-only pada stage apa pun termasuk terminal untuk informasi lanjutan.

Request update/assignment/status/note menyertakan `version` yang dibaca klien. Service menjalankan DB transaction, refresh object/scoped authorization, conditional `UPDATE ... WHERE id=? AND version=?`, increment version; jika0 row →409. PostgreSQL row lock menserialkan operasi pada object; conditional update tetap wajib agar SQLite tidak bergantung pada `lockForUpdate`. History dan notifications ditulis sesudah update dalam transaksi yang sama. Deadlock retries terbatas; tidak mengulang request eksternal atau side effect nontransaksional. Klien409 reload data lalu meminta pengguna menilai ulang, tidak blind retry.

`lead_histories`: lead_id FK, actor_id FK, type CREATED/ASSIGNED/REASSIGNED/STATUS_CHANGED/NOTE_ADDED/CONTACT_UPDATED, from_status/to_status nullable, from_assignee/to_assignee nullable FK, note nullable, created_at UTC. Catatan menjadi event histori sehingga tidak perlu duplikasi `lead_notes`. No update/delete route; API readonly descending created_at,id dan paginated50 maksimum100. Histori create selalu ada. Penonaktifan actor tidak menghilangkan nama/id historis; account deletion dicegah oleh FK sebelum proses privacy terkontrol tersedia.

## 6. Notifications

Notification: id UUID, recipient_id FK user, kind LEAD_ASSIGNED/LEAD_STATUS_CHANGED, lead_id FK, history_id FK unique bersama recipient_id, read_at nullable, created_at UTC. Payload hanya ID dan jenis; tidak memasukkan nomor/nama lead pada push. Assignment menghasilkan satu notification penerima; status change menghasilkan notification semua Admin aktif kecuali actor. Tandai read idempotent hanya notification milik sendiri; list per-page20 maksimum100, unread_count exact. Akses ke lead tetap diperiksa lagi ketika notifikasi diklik (assignee dapat berubah).

Persisted delivery melalui API menjadi sumber kebenaran. Queued push (Pusher + Echo private `users.{id}` channel) menggunakan job database dalam transaksi yang sama, hanya terlihat worker setelah commit; retry/backoff bounded, monitoring failed_jobs, dedup UUID, reconnect refresh dan polling60s selalu berjalan. Tidak ada server WebSocket self-hosted. Worker persisten target push p95≤5s; cron-only hingga60s tidak boleh disebut instantaneous; paket hosting/provider wajib membuktikan target itu. Push failure tidak membatalkan transaksi CRM yang sudah sukses.

## 7. API, authentication, dan keamanan

Version `/api/v1`. Success `{data}` atau paginator `{data,links,meta}`; catalog public allowlist eksplisit; internal role/owner fields hanya pada endpoint terproteksi. Error `{message,errors?,request_id}`; 401 session,403 role,404 missing/scoped object,409 version/duplicate/transition conflict,419 CSRF,422 validation,429 throttle,500 sanitized. Request ID dibuat server UUID dan ditambahkan header/error; bukan nomor WA/user-controlled log text. Accept JSON dipaksakan untuk API. SQL/detail stack hanya local debug.

Auth: Sanctum first-party session cookie melalui endpoint web POST `/auth/login`, POST `/auth/logout`, GET `/sanctum/csrf-cookie`; API `auth:sanctum`. Bearer token tidak didukung fondasi. Login validates email/password; rejects inactive, regenerates session; logout invalidates session/regenerates CSRF. Production session Secure/HttpOnly/SameSite=Lax, 120 menit idle. Browser tidak menyimpan bearer token di localStorage. Stateful domains/CORS exact origin, credentials true jika beda origin pada lokal. Public SSR hanya memanggil public API tanpa forwarding credential. Backoffice client-side fetch setelah login; no-store/noindex.

Limits baseline: login5/min per normalized email+IP; public120/min perIP; internal120/min peruser; setup counter store durable/shared sesuai hosting. Form max body, query/field allowlist, plain-text render escaping, no v-html, parameterized queries, mass-assignment allowlist, no public registration/demo production account. Foundation rate limits konservatif dapat disetel berdasarkan load; tidak dipercaya sebagai perlindungan DDoS platform.

Account provisioning/recovery: Admin CLI/operasi authenticated dengan password prompt; jangan password di argument/log; reset verified identity + expiring single-use token/link via verified mail/operasi owner terkontrol; revocation existing sessions; last active Admin tidak dapat dinonaktifkan. Production launch blocked jika delivery recovery belum diverifikasi. TLS, nonce CSP sesuai embed allowlist, frame-ancestors, nosniff, Referrer-Policy, host/proxy trust spesifik diuji lokal dan pada hosting. Login/backoffice memakai same-origin agar Sanctum dapat mengenali GET sesi; reset/forgot-password no-referrer; tidak mengirim referrer internal ke origin eksternal.

## 8. KPR/compare (F2)

Calculation kernel dasar dapat diuji pada F0. IDR input integer1..10^12; DP0..price; tenor1..30 tahun; annual rate0..30%. Principal price−DP. `r=annualRate/100/12`, `n=years*12`; bila principal0 maka payment0, bila r0 maka P/n; lainnya `P*r/(1-(1+r)^(-n))`. Schedule membulatkan tampilan IDR, kalkulasi internal presisi double dengan final balance clamp0; totals konsisten dengan actual schedule. Floating adalah skenario rate eksplisit, bukan prediksi rate. Fixed-to-floating memakai amortization bulan-per-bulan dan sisa pokok pada reset; harus diimplementasi dan diuji sebelum opsi ditampilkan. Tidak termasuk provisi/admin/asuransi/pajak; selalu berlabel estimasi bukan penawaran bank.

Bank rate target record bank, product, annual_rate, effective_date, valid_until, fixed_months, source_url dan updated_by; Admin kurasi manual, expired tidak dipilih sebagai current offer. Compare max3 published IDs, duplicate dihapus, missing unpublished ditandai bukan expose internal. Client selection local only dan tidak menyimpan PII.

## 9. Data design dan indeks

Core tables F0: users, properties, leads, lead_histories, user_notifications serta Laravel sessions/cache/jobs. Foreign keys restrict user/property deletion; no cascaded audit deletion. Users email unique; property slug unique; lead phone+property unique; index public `(publication,created_at,id)`, `(publication,price_idr,id)`, owner; leads `(assigned_marketing_id,status,id)` dan `(status,created_at)`; histories `(lead_id,created_at,id)`; notifications `(recipient_id,read_at,created_at)` + `(recipient_id,history_id)` unique. Numeric currency stored bigint; public serialization string menghindari kehilangan precision, area decimal string. Constraints enum menggunakan PHP enums + validation (portable schema string); DB role/state integrity lewat application/tests, future native DB CHECK membutuhkan parity migrasi.

UTC ISO8601 response, UI format id-ID Asia/Jakarta. No DB-specific enum/ILIKE/json-query di core; DB constraints + transactions test SQLite dan PostgreSQL. SQLite FK enabled, private persistent disk; satu writer, timeout terukur, tidak horizontal-scale SQLite. PostgreSQL dipilih ketika membutuhkan multi-instance, lock/concurrency lebih tinggi, remote DB, atau SQLite busy errors/latency pada load. Tidak menambahkan Redis/search cluster sebelum profiling membuktikan kebutuhan.

## 10. Nonfunctional dan deployment

NFR-UI-001..004: premium/readable, responsive320px+, keyboard/focus, WCAG2.2AA target; browser dua versi terbaru Chrome/Edge/Firefox/Safari. NFR-SEO-001..005: SSR published, metadata, crawlable specs, stable slug, OG/canonical F0 dan sitemap/schema F1/F2. Performance/load/availability targets dan backup defaults mengikuti PRD§9; target bukan bukti kelulusan.

Health `/up` liveness tanpa secret; `/ready` DB/private-storage/queue/config readiness generic200/503; `/api/v1/internal/operations` Admin-only metadata sanitized. Tidak memanggil provider pada setiap probe. Logs JSON request_id/route-pattern/status/duration_ms tanpa query/body/phone/password/SQL/credential. Retention30 hari usulan; monitor eksternal alert5xx>1%/5min, queue backlog>5min, backup missing>26h. Backup timestamp hanya bukti operator, bukan otomatisasi atau verifikasi isi arsip. Hosting SLO dinilai via uptime monitor dan laporan error.

Deploy: build artifacts reproducible lockfiles, backup sebelum migrasi, maintenance bila perlu, composer install no-dev, generate protected APP_KEY sekali, cache config/routes, migrate force, restart SSR/worker terkelola, smoke URL dan persistent data. Cron `schedule:run` setiap menit; bounded queue work cron dengan overlap lock jika worker tidak tersedia. Schema expand/contract; rollback kode hanya pada schema compatible; destructive DB rollback lewat restore teruji dan menerima konsekuensi RPO. Database/media di shared persistent path, tidak dalam direktori release yang diganti. SQLite backup native backup API/snapshot coordinated, bukan copy live DB/WAL sembarang.

## 11. Coverage seluruh requirement sumber

| Source ID/area | PRD | Kontrak SRS |
|---|---|---|
| FR-PUB-001/002/003/004/005 Hero/search/CTA/featured/social proof | P-01 | §3–4 |
| FR-PUB-010 Listing | P-02 | §3 |
| FR-PUB-011/012 Search/sort | P-03 | §3 |
| FR-PUB-013 Compare | P-06 | §8 |
| FR-PUB-020/021 Detail/specs | P-04 | §3 |
| FR-PUB-022/023/024/025 Photos/video/tour/plan | P-04/P-08 | §4 |
| FR-PUB-026/027 Maps/POI | P-08 | §4 |
| FR-PUB-028 Brochure | P-04 | §4 |
| FR-PUB-029 WhatsApp | P-05 | §3 dan API_DOCS |
| FR-PUB-030..035 KPR | P-07 | §8 |
| FR-BO-PROP-001..003 Catalog/specs/availability | I-02 | §2–3 |
| FR-BO-PROP-004 Content | I-09 | §4 |
| FR-BO-PROP-005 Profile | I-01/I-09 | §2/7 |
| FR-CRM-001..003 Creation/assignment/monitoring | I-03/I-04 | §5 |
| FR-CRM-004 Conversion | I-08 | PRD§8 |
| FR-MKT-001 Table | I-05 | §2/5 |
| FR-MKT-002/003 Pipeline/notes | I-05/I-06 | §5 |
| FR-MKT-004/005 Drawer/timeline | I-06 | §5 |
| FR-RT-001..004 Notification/delivery/state | I-07 | §6 |
| API/permissions/audit/validation/errors | I-01..I-07 | §2/3/5/7/9 |
| Hosting/DB/persistence/backup/security/SEO | PRD§9–10 | §7/9/10 |

Fitur yang kontraknya lengkap tetapi belum dibangun tetap planned di status file.

## 12. Definition of done dan gate

Demo lokal: `DemoSeeder` memakai generator acak tanpa fixed RNG seed, default24properties/72leads/3Marketing, konfigurasi bounded6..100/6..500/1..10. Data tersimpan lewat Eloquent dan workflow CRM/media yang sama dengan aplikasi; histori/notifikasi persisten/version serta job media mengikuti transaksi domain. CMS demo diberi attestation Admin lokal dan label sintetis, bukan verifikasi bisnis. Foto/denah digambar saat seed lalu diproses worker native; gagal seed membatalkan rows/jobs dan membersihkan staging yang dibuatnya. Existing domain data ditolak, password eksplisit≥12, production/staging ditolak, push eksternal dinonaktifkan sementara dan dipulihkan. API/SSR selalu membaca database; tidak ada reseed otomatis atau mock response produk. Galeri SSR menonaktifkan kontrol interaktif sampai hydration selesai.

F0: migrations/auth/public visibility/scoped CRM/atomic history/notification/versioning terbukti melalui suite otomatis yang dijalankan lokal; lint/typecheck/build lulus, errors bermakna, dokumentasi status, branch commit push PR. Fitur F1/F2: acceptance PRD + negative/scoped/empty/error/keyboard tests + provider configuration + operasi relevan. Production: F1 release scope selesai, suite SQLite/PostgreSQL lokal lulus pada runtime deployment yang dipilih dan bukti commit/runtime tercatat, load/UAT/security/restore dan hosting evidence, valid content/privacy/provider decisions. Open deployment facts tetap gate eksplisit dengan pemilik; tidak dihilangkan dengan mengubah kata menjadi 'done'.

Changelog: 1.1 2026-09-30 shared hosting/DB; 2.0 2026-10-03 menutup ambiguity baseline, physical schema/contracts/state/security/acceptance dan traceability, menjaga seluruh fitur sumber.

2.1 2026-10-03 melengkapi implementasi F0–F2/acceptance operasional;2.2 2026-10-04 menambahkan kontrak seed generatif persisten, guard/rollback dan batas dummy lokal sesuai instruksi pengguna.

FR-RT-003 sekarang implemented/config-gated: job persisten pada transaksi aplikasi, worker sesudah commit, private user channel authorization+CSRF, payload IDs/kind tanpa PII, bounded retry, dedup/reconnect/poll60s dan inbox navigation. Target≤5s wajib dibuktikan dengan worker persisten/provider/hosting nyata; simulated provider tests tidak membuktikan latency delivery produksi. Polling tetap menyelaraskan unread state saat WebSocket sehat.

FR-CRM-004 implemented: cohort Admin UI/API, bounded range, denominator/sample/pending age dan current assignee vs firstfollow-up actor. Daily funnel opt-in/PII-free bukan atribusi pesan WhatsApp. Privacy candidates readonly+CLI policy/password/version/terminal-controlled redaction tersedia tanpa API mengedit histori. Retensi24 bulan masih proposed sampai owner mengesahkan; tidak ada otomatisasi redaksi data bisnis.

## Addendum 2026-10-04 — Kontrak pengalaman pembeli dan aset editorial

Addendum baseline2.2 untuk instruksi persona Indonesia middle-to-high/Bandung Timur. Route baru `/bandung-timur`, `/panduan`, `/panduan/{slug}`, `/konsultasi` menggunakan Nuxt SSR. Panduan adalah tiga record source terkurasi (kunjungan-rumah, memilih-lokasi, merencanakan-pembiayaan); bukan CMS generik atau rekomendasi pembiayaan personal. Slug tidak tersedia404; halaman baru masuk sitemap dengan canonical origin konfigurasi.

Konsultasi membaca parameter `properti` berupa slug valid dan `tujuan`; properti dibaca melalui API publik existing. Topik kunjungan/ketersediaan/pembiayaan dan pertanyaan≤600 karakter membentuk tautan WhatsApp di client. Tidak ada endpoint baru untuk menyimpan pertanyaan, membuat lead, mengirim pesan atau booking. Data unavailable/error menahan tautan berkonteks properti sampai valid. CRM tetap manual Admin; klik WhatsApp bukan lead atau deal. Share canonical memakai native share, clipboard lalu input salin manual, dengan hydration/busy guard dan cancel yang jelas.

Galeri mengelompokkan PHOTO/FLOOR_PLAN, menghitung gambar valid, menjaga pilihan ketika media berubah, mendukung prev/next dan panah keyboard pada dialog, Escape/fokus. Denah memakai tampilan utuh; iframe VIDEO/TOUR hanya setelah pilihan pengguna dan permission minimal. Upload MP4/video binary tetap di luar kontrak. Foto/denah/brosur tetap mengikuti batas dan pipeline §4.

CMS HERO payload menambahkan `media_id` nullable optional. Pilihan eksplisit harus PHOTO/VIDEO READY+published, milik property_id yang PUBLISHED. Validasi dilakukan di transaksi setelah pemeriksaan actor; public `hero.media` memakai PropertyMedia allowlist. Omit/null memilih cover foto legacy; media eksplisit yang kemudian tidak eligible menghasilkan null, bukan membocorkan data private. Metadata `media_id` internal tidak diteruskan sebagai public payload bebas.

CMS BANK_PARTNER payload `{name≤120,website:HTTPS≤2048}`; metadata logo server-only pada JSON existing. Admin upload multipart file/version/verified ke `/api/v1/internal/content/{id}/logo`; JPEG/PNG/WebP≤2MiB/4MP/dimensi≤4000, decode dan sanitize WebP sisi terpanjang≤640. Fresh active Admin, version guard, attestation dan audit atomik; transaction failure membersihkan file baru. Normal PATCH mempertahankan logo, private path tidak masuk JSON dan internal record hanya menambah logo_uploaded. Public `/api/v1/content/{id}/logo` memeriksa verified+published+file setiap request, no-store/nosniff; signed proxy allowlist dibatasi ID numerik. Public content.bank_partners hanya partner eligible; tidak seeding kemitraan fiktif. Tidak ada migrasi/dependency baru. File logo lama tetap private dan memerlukan review backup/retensi operator sebelum cleanup.

Acceptance tambahan: HERO photo/video selection dan revocation/scoping, logo validation/stale/role/rollback/metadata/public file, tour positif dan PDF response headers; browser perlu membuktikan dialog/consent, CMS→SSR, konsultasi dan fallback share. Kontrak terperinci ada di API_DOCS.md; hasil validasi aktual serta batas produksi ada di aucoot-adaptation.md dan catatan final PR.

## Addendum 2026-10-05 — Media pada function dan pipeline Git

MEDIA_PROCESS_IN_REQUEST opt-in (default false). Setelah transaksi media/job database commit, API menjalankan satu job queue media melalui Worker Laravel dengan backoff10s/maxTries3/timeout45s. Hasil upload/retry memuat state terbaru; staging, audit, optimistic version dan job durable tetap berlaku. Mode worker persisten tidak berubah bila flag false. Pemrosesan browser yang tertunda memakai POST terautentikasi/CSRF/scoped, bukan efek samping GET. Setiap request mengonsumsi maksimal satu job; antrean global FIFO dapat mendahulukan unggahan lain, dan browser melakukan polling10s sambil editor terbuka. Kegagalan terdeteksi tetap FAILED dengan tombol retry; scanner yang tidak tersedia tidak menerbitkan PDF.

Build web menjalankan lint/typecheck/unit/build. Hook Composer vercel menginstal dev tools sementara, menjalankan Pint/PHPUnit SQLite terisolasi/validate/audit, menghapus dev tools sebelum bundle, lalu migration forward --force --isolated hanya bila VERCEL_ENV=production dan VERCEL_RUN_MIGRATIONS=1. Preview tidak memigrasi database. Full PostgreSQL/browser/dependency audits tetap gate lokal pada PR. Tidak ada reseed di build atau runtime; seed sintetis tetap dilarang di production.

Sesi akun inactive/role tidak didukung harus dibersihkan saat request internal ditolak403, termasuk auth device, payload sesi dan token CSRF. Denial tidak boleh menyisakan state yang membuat guest login dialihkan seolah login sukses; security-stamp mismatch tetap401.

Endpoint /auth/* merupakan API JSON meskipun ditempatkan pada web middleware untuk sesi/CSRF. Exception tidak bergantung header Accept; proxy yang membuang header tersebut tidak boleh mengubah error login/recovery menjadi redirect HTML200.
# Addendum kejelasan alur — 2026-10-05

Summary CRM memakai agregasi database dalam scope visibleTo yang sama dengan daftar; jumlah bukan turunan pagination. `work` memfilter pekerjaan aktif tanpa record anonim/terminal. Kontrak di API_DOCS. Frontend menyimpan filter/pagination CRM di URL, memiliki retry/error terpisah untuk ringkasan/riwayat, dan menolak respons daftar yang sudah kedaluwarsa. Pembatasan peran, version guard, atomisitas mutasi dan histori append-only tetap berlaku. Hero tanpa media pilihan eksplisit memakai aset ilustrasi kawasan; pemilihan foto/video eksplisit dan pencabutan publication tetap mematuhi public allowlist. Fokus netral tetap terlihat, termasuk navigasi keyboard dan forced-colors.
