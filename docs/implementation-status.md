# Status implementasi

Tanggal 2026-10-04 · branch `codex/dynamic-demo-data` · F0–F2 + acceptance operasional + dummy dinamis sesuai instruksi pengguna. Kode seluruh kelompok requirement tersedia dan dipetakan di requirements-traceability.md; produksi tetap gated. Implemented berarti kode+validasi lokal yang disebut di bawah tersedia; tidak berarti semua kebutuhan rilis terpenuhi. Bagian historis merekam hasil masing-masing PR, bukan status fitur terkini.

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

## Acceptance operasional (PR #9)

Lihat acceptance-validation.md dan requirements-traceability.md:66 tests/453assertions SQLite+PostgreSQL,13 unit tests,12 browser flows termasuk production CSP/320px, lint/type/build/Pint/Composer/cache passed. Dataset10kproperty/50klead;15min/20scheduledrps/18krequests/0errors, API p95≤165.85ms/SSR≤428.19ms pada8nativePHPworkers+OPCache/PostgreSQL lokal. Native encrypted consistent SQLite+media restore dan PG isolated restore lulus. Tidak mengklaim throughput SQLite/shared-hosting, uptime99.5%, fullWCAG/cross-browser, realSMTP/Pusher/ClamAV/offsite/policy.

PR #3 fondasi, #4 workspace, #5 media, #6 evaluasi, #7 realtime, #8 supervisi/privacy dan #9 acceptance membentuk stack review. Main masih bootstrap, tidak ada merge/deployment/Actions. Nomor sementara pengguna6287776734038; hostingHostinger/Rumahweb paket/domain belum dipilih. Runtime audit0/Composer0; source11high dari dua upstream advisories tetap gate. Source originals unchangedSHA; app artifacts/runtime/private fixtures/keys/passwords tidak dicommit.

## Dataset dinamis terbaru (PR #10)

Lihat demo-data.md dan dynamic-demo-validation.md. Default generator menyediakan24properties/72leads/3Marketing/7CMS/48media generatif yang diproses worker native pada database demo baru. E2E boleh menambah/mengubah data sehingga jumlah workspace setelah pengujian berbeda. Data tetap tersimpan dan berubah melalui UI/API; tidak ada katalog/CRM hardcoded, reseed saat reload, atau fallback mock. Semua konten diberi label sintetis; attestation CMS lokal bukan verifikasi bisnis. Seed menolak domain berisi data dan production/staging; rollback rows/jobs/staging dan pemulihan clock/config diuji.

Validasi final: Pint,71tests/504assertions masing-masingSQLite5.78s/PostgreSQL12.24s,Composer strict/audit0,routecache/clear; lint0/typecheck/build,13unit299ms, seluruh13browser flows pada8spec dengan cache fixture diisolasi antar-berkas dan worker aktif. Gallery SSR controls sekarang menunggu hydration; test histori tidak mengandalkan catatan seed tertentu. Audit source11high/exit1, runtime0/exit0; warning build upstreamDEP0155 tetap dicatat. Tidak ada migrasi/API breaking change, dependency baru, merge, deployment atau Actions. PR dataset bergantung pada PR #9 agar diff review tetap terfokus.

[PR #10](https://github.com/ariefmavlana/flamboyan-perum/pull/10) terbuka siap review pada branch baru `codex/dynamic-demo-data`, base `codex/operational-acceptance`. Workflow stack #3→#10 belum di-merge. Konektor GitHub tidak memiliki izin membuat PR (403); PR berhasil dibuat melalui GitHub API dengan kredensial Git lokal yang sudah digunakan untuk push, tanpa menyimpan/menampilkan token.
