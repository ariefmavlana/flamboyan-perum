# Status implementasi

Tanggal 2026-10-03 · branch `fix/foundation-validation` · F0 fondasi siap direview, MVP/produksi belum lengkap. Implemented berarti kode+validasi lokal yang disebut di bawah tersedia; tidak berarti semua kebutuhan rilis terpenuhi.

| Requirement / fitur | Status F0 | Tahap berikutnya / batas |
|---|---|---|
| Stack Nuxt4.5.2/Laravel13, lockfiles/runtime | Implemented | PHP8.3 compatible platform; hosting belum dipilih |
| FR-PUB-001 Hero | Implemented | Ilustrasi CSS orisinal; foto hero aktual F1/CMS |
| FR-PUB-002 Search | Implemented basic | title/location/address; advanced filter UI F2 |
| FR-PUB-003/029 WhatsApp | Implemented/config-gated | Link+context tested; nomor produksi harus owner isi |
| FR-PUB-004 Featured | Implemented | Hanya published featured; Admin UX flag F1 |
| FR-PUB-005 Social proof | Planned | Konten sah + CMS F2; tidak membuat testimonial palsu |
| FR-PUB-010 Listing/cards | Implemented | Semua spesifikasi inti + availability; tanpa identitas Marketing |
| FR-PUB-011/012 Filter/sort | Implemented API/basic UI | API full allowlist; UI search/price/sort, remainder F2 |
| FR-PUB-013 Compare | Planned | Max3 contract; UI/data selection F2 |
| FR-PUB-020/021 Detail/specifications | Implemented | SSR HTML/canonical/OG + missing404; no upstream soft404 |
| FR-PUB-022..025 Gallery/video/tour/plan | Planned | Safe upload/media/embed F1/F2; current UI explicit no-photo state |
| FR-PUB-026/027 Maps/POI | Planned | Editorial/provider/content gate F2 |
| FR-PUB-028 Brochure | Planned | PDF pipeline/scan/content F1/F2 |
| FR-PUB-030..035 KPR | Partial | Annuity kernel automated; no bank selection/floating/chart UI F2 |
| FR-BO-PROP-001..003 Catalog/spec/availability | Implemented API | Scoped create/edit/version; no transfer/delete; full UX F1 |
| FR-BO-PROP-004 CMS | Planned | Structured content, no generic CMS F2 |
| FR-BO-PROP-005 Profile | Planned | Own-name profile/admin email-role workflow F1 |
| Auth/active-user/role | Implemented | Cookie session/CSRF/login/logout/provision CLI; reset/recovery/deactivation UX F1 |
| FR-CRM-001 Create lead | Implemented API | Manual Admin, normalized phone, unique perproperty; full form UX F1 |
| FR-CRM-002 Assignment | Implemented API | Single active assignee/reassign reason/atomic notification; dropdown UX F1 |
| FR-CRM-003 Monitoring | Implemented basic | Scoped list/status API + table; search/richer supervision F1/F2 |
| FR-CRM-004 Reports | Planned | Cohort/median/pending definitions recorded, implementation F2 |
| FR-MKT-001 Table | Implemented | Scoped list/pagination/read+status+notes; basic property ID presentation |
| FR-MKT-002/003 Pipeline/notes | Implemented | Ordered transitions+LOST reason+terminal guard+versions |
| FR-MKT-004/005 History drawer | Implemented | Native modal keyboard/Escape + descending history actor/status/note; reassignment event fields in API |
| FR-RT-001/002 Persistent notification | Implemented | Assignment→Marketing; status→Admin; recipient scope |
| FR-RT-003 Push/Echo | Planned | No realtime claim; current manual refresh; queued provider+poll/reconnect F1 |
| FR-RT-004 Read/unread | Implemented | Exact unread count, own recipient list/read idempotent |
| SEO canonical/metadata | Implemented | Sitemap/robots/query policy/structured data F1/F2 |
| Validasi lokal / branch+PR | Implemented | GitHub Actions dihapus sesuai instruksi pengguna; bukti lokal wajib sebelum review; main protection belum dikonfigurasi |
| DB/migration parity | SQLite + PostgreSQL17.9 validated locally/PHP8.4.26 | Masing-masing18 tests/95 assertions; PHP8.3/Linux belum diuji; runtime deployment harus diverifikasi sebelum produksi |
| Production/backups/privacy/performance | Gate open | Actual hosting/load/restore/retention/provider/content evidence required |

## Validasi lokal

- PHPUnit: 18 tests,95 assertions lulus pada SQLite/PHP8.4.26, termasuk duplicate/owner/scoping/status/reassign/version/read-idempotency/transaction rollback dan demo-production guard.
- Suite yang sama juga lulus18 tests/95 assertions pada PostgreSQL17.9 dengan cluster lokal terisolasi dan PHP8.4.26; tidak mengubah database instalasi yang sudah ada.
- Pint, Composer validate --strict dan Composer audit lulus; route:cache/route:clear berhasil.
- Frontend Node24.21.0: npm ci, ESLint `--max-warnings 0`, Nuxt typecheck, Vitest4.1.11/5 tests, Playwright3 flows, SSR build lulus pada validasi akhir. Browser flows meliputi raw SSR+canonical404+missing-CSRF419, mobile search/layout, session login/drawer/note/Escape/logout pada fixture terisolasi.
- Public API/detail HTTP smoke sukses200 dan spesifikasi ada pada HTML sebelum client JavaScript. Screenshot desktop/mobile ditinjau lokal; bukan audit accessibility/UAT lengkap.
- Advisory Vitest diperbaiki melalui versi patched4.1.11. Audit source lengkap termasuk devDependencies menghasilkan11 high propagated entries dari dua upstream advisories tanpa patch,0 moderate/critical; tetap menjadi gate keamanan produksi. Audit artefak runtime0 advisory dan tidak memuat paket tooling tersebut. Build mempunyai warning upstream DEP0155. Detail ada di dependency-security.md.
- Tidak ada klaim bahwa hosting produksi, load/SLO, actual backup/restore, legal privacy atau push provider telah diuji. Semua gate mempunyai pemilik/bukti di PRD§10/runbook.
- [PR #3](https://github.com/ariefmavlana/flamboyan-perum/pull/3) terbuka dan siap review pada branch baru, membawa fondasi yang belum di-merge, aturan tanpa Actions, fix Vitest dan validasi akhir. [PR #1](https://github.com/ariefmavlana/flamboyan-perum/pull/1)/[PR #2](https://github.com/ariefmavlana/flamboyan-perum/pull/2) ditutup sebagai superseded, tanpa merge. Tidak ada syarat memperbaiki billing atau menjalankan ulang Actions. Bukti commit/runtime/perintah dan batasan ada pada validation.md; siap review tidak berarti siap produksi atau otorisasi merge.

## Urutan PR lanjutan

1. `fix/dependency-tooling-advisories` saat patch upstream tersedia, scan/test ulang; jangan downgrade framework secara paksa.
2. `feat/admin-catalog-crm-ui`: owner-aware CRUD, create/assign form/dropdown, active-user provisioning/recovery/profile serta account deactivation policy.
3. `feat/property-media`: safe staging/variants/uploads/brochure, verified CMS content.
4. `feat/realtime-notifications`: managed provider/Echo private channels/queue+retry/fallback+monitoring.
5. `feat/property-evaluation`: compare, KPR UI/dates/scenarios/chart, maps/POI.
6. `feat/admin-reporting`: cohort/median/pending, query correctness/performance.
7. `chore/production-readiness`: hosting evidence/load/UAT/security/restore/content/privacy/SEO checks.

Nama branch berikutnya merupakan saran workflow, bukan branch yang sudah dibuat. Setiap pekerjaan baru dari main terbaru dan PR sendiri sesuai AGENTS; fondasi sekarang satu perubahan koheren dengan beberapa Conventional Commits.
