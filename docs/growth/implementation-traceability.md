# Traceability implementasi growth

Versi 1.0 · 16 Oktober 2026

Matriks ini mencakup setiap requirement `HOST-01..32`, `SEO-01..36`, `CRM-01..26` termasuk `CRM-14a`, `MEAS-01..12`, `ADS-01..29`, dan `META-01..10`. `V-ADS1` pada spec lama berhenti di ADS-28; acceptance final pada dokumen ini juga mencakup ADS-29.

Status:

- `IMPLEMENT_NOW`: hasil yang tidak memerlukan akun/fakta/pembelian eksternal wajib ada dan diverifikasi pada PR implementasi.
- `EXTERNAL_GATE`: requirement tetap wajib, tetapi bukti final bergantung pada keputusan, akun, paket, domain, fakta bisnis, legal/policy, trafik, atau provider di luar repository.
- `DEFERRED_BY_SPEC`: spesifikasi dengan sengaja memindahkan integrasi ke fase lanjutan; tidak boleh dibuat atau diklaim selesai pada PR ini.

Kolom “bukti PR/gate” menyebut bukti minimum; rincian skenario ada di [implementation plan](implementation-plan.md) dan [delivery verification](delivery-verification.md).

## HOST

| ID | Status | Hasil PR atau gate yang harus ditutup |
| --- | --- | --- |
| HOST-01 | EXTERNAL_GATE | Dua site Hostinger Nuxt+PHP dan staging aktual baru dapat dibuktikan setelah SKU tersedia. |
| HOST-02 | EXTERNAL_GATE | Kecocokan Node24, build/start/restart pada SKU aktual; build lokal/Vercel bukan pengganti. |
| HOST-03 | EXTERNAL_GATE | Versi PHP dan GD/WebP/Fileinfo/mbstring/OpenSSL/PDO_PGSQL pada web+CLI Hostinger. |
| HOST-04 | EXTERNAL_GATE | DNS/TCP/TLS/query Supabase dan outbound HTTPS dari runtime Hostinger. |
| HOST-05 | EXTERNAL_GATE | Cron/persistent worker, quota, overlap, timeout dan heartbeat SKU aktual. |
| HOST-06 | EXTERNAL_GATE | Smoke same-origin auth/CSRF/upload/CSP pada domain Hostinger; contract/test portable dibuat sekarang. |
| HOST-07 | EXTERNAL_GATE | CPU/RAM/disk/inode/bandwidth/build/region dan pengukuran staging SKU. |
| HOST-08 | EXTERNAL_GATE | Penawaran harga awal/renewal/kontrak/domain/backup/add-on dan persetujuan pembelian. |
| HOST-09 | IMPLEMENT_NOW | Explicit two-origin/server config dan same-origin browser boundary; Vercel proof, Hostinger smoke residual. |
| HOST-10 | IMPLEMENT_NOW | BFF public bounded dan bridge auth/internal exact; tidak ada wildcard open proxy. |
| HOST-11 | IMPLEMENT_NOW | Route map method+path lengkap termasuk inquiry context/intake/internal routes; unknown ditolak. |
| HOST-12 | IMPLEMENT_NOW | Hapus ketergantungan `VERCEL===1`; explicit proxy mode, host/forwarded-header tests dan fail-fast config. |
| HOST-13 | IMPLEMENT_NOW | Cookie/CSRF/logout/inactive/role/error contract tests lokal+Vercel; domain final diuji kemudian. |
| HOST-14 | IMPLEMENT_NOW | Runbook public-root/secret/source/storage dan preflight exposure; Hostinger inspection residual. |
| HOST-15 | IMPLEMENT_NOW | Deploy/runbook melarang seed/reset/dump dan mempertahankan Supabase/R2 existing. |
| HOST-16 | EXTERNAL_GATE | Endpoint pooler/IP mode diambil dari dashboard target dan diuji dari Hostinger. |
| HOST-17 | IMPLEMENT_NOW | Production verify-full/CA fail-closed config+preflight; CA/hostname live tetap gate provider. |
| HOST-18 | IMPLEMENT_NOW | Concurrent intake/lock/retry/timeout tests dan no browser DB credentials; limit live dimonitor kemudian. |
| HOST-19 | IMPLEMENT_NOW | Queue/cache/session dan CRM writes tetap koneksi transaksi existing; integration tests. |
| HOST-20 | EXTERNAL_GATE | Recovery/email provider pada Hostinger dan smoke real delivery. |
| HOST-21 | IMPLEMENT_NOW | R2 private, READY+publication checks dan revocation regression; tidak membuka public bucket. |
| HOST-22 | IMPLEMENT_NOW | Media/OG published accessible, unpublished denied, cache/version rules; crawler live residual. |
| HOST-23 | IMPLEMENT_NOW | Multipart/temp/GD/WebP/variant tests dan preflight; limit Hostinger residual. |
| HOST-24 | IMPLEMENT_NOW | PDF scanner tetap fail-closed dan runbook menjelaskan shared tanpa scanner; scanner live external. |
| HOST-25 | IMPLEMENT_NOW | Single-worker/scheduler lock, bounded batch/time, retry/backoff, post-commit tests/runbook. |
| HOST-26 | IMPLEMENT_NOW | Queue separation/lag metrics/polling fallback tanpa Redis baru; p95 live external. |
| HOST-27 | IMPLEMENT_NOW | Env inventory, secret/public split, staging isolation/noindex/auth dan examples tanpa nilai rahasia. |
| HOST-28 | IMPLEMENT_NOW | Checked build dan one-SHA release manifest tanpa GitHub Actions. |
| HOST-29 | IMPLEMENT_NOW | Release/shared-storage layout dan rollback runbook untuk Node/PHP. |
| HOST-30 | IMPLEMENT_NOW | Monitoring contract untuk uptime, latency, 5xx/429, queue, disk, mail, DB, intake tanpa PII. |
| HOST-31 | IMPLEMENT_NOW | Immutable asset cache, no-store auth/intake/consent, nonce/user-state dan expiry-price tests. |
| HOST-32 | EXTERNAL_GATE | SLO 99,5%/p95/error/load harus dibuktikan pada paket Hostinger; local/Vercel baseline dicatat. |

## SEO

| ID | Status | Hasil PR atau gate yang harus ditutup |
| --- | --- | --- |
| SEO-01 | IMPLEMENT_NOW | Primary-page/content map dan unique title/copy/internal links; URL existing dipertahankan. |
| SEO-02 | EXTERNAL_GATE | Volume/CPC/intent/SERP competitor dari Keyword Planner/GSC; tidak ada angka karangan. |
| SEO-03 | IMPLEMENT_NOW | Copy membedakan target Kota Bandung dari alamat Kabupaten Bandung; tidak membuat doorway kota. |
| SEO-04 | IMPLEMENT_NOW | Hapus robots blanket query setelah matrix filter/page/tracking tests. |
| SEO-05 | IMPLEMENT_NOW | Public asset/landing access tests untuk crawler classes; bot authenticity/WAF live residual. |
| SEO-06 | IMPLEMENT_NOW | HTTPS/origin/trailing slash/slug/canonical/OG/sitemap/internal/CTA consistency; domain final external. |
| SEO-07 | IMPLEMENT_NOW | Sitemap canonical 200 only, meaningful lastmod, expiry invalidation, no private/filter/test URL. |
| SEO-08 | IMPLEMENT_NOW | Default aman Banjaran noindex+keluar sitemap; index menunggu keputusan editorial pemilik. |
| SEO-09 | IMPLEMENT_NOW | Unique title/H1/description/visible breadcrumb/internal links per template. |
| SEO-10 | IMPLEMENT_NOW | Lima tipe memakai data/spesifikasi/media existing dan sumber/tanggal; fakta unavailable tidak dikarang. |
| SEO-11 | IMPLEMENT_NOW | Harga/promo dari API tunggal; unknown bukan nol; BSI 36/60 only regression. |
| SEO-12 | IMPLEMENT_NOW | SOLD lifecycle, archived 404, slug/mapping/audit semantics dan no auto availability from DEAL. |
| SEO-13 | IMPLEMENT_NOW | Validated property/canonical context pada WA+form; SSR content tetap tanpa analytics. |
| SEO-14 | IMPLEMENT_NOW | WebSite/BreadcrumbList stable IDs/URLs dan visible match tests. |
| SEO-15 | IMPLEMENT_NOW | Factual listing/house/offer schema dari API dengan price/area/image/condition/availability. |
| SEO-16 | EXTERNAL_GATE | Organization schema menunggu identitas legal, brand ownership, NAP, logo dan sameAs disahkan. |
| SEO-17 | DEFERRED_BY_SPEC | Article/VideoObject hanya ditambah ketika artefak lengkap tersedia dan direview. |
| SEO-18 | IMPLEMENT_NOW | Absolute public OG image 200, crop/text/source appropriate dan preview contract. |
| SEO-19 | IMPLEMENT_NOW | Asset inventory/disclosure/alt/caption aktual-vs-ilustrasi dan no private source. |
| SEO-20 | IMPLEMENT_NOW | Responsive WebP/srcset/intrinsic size/LCP priority/lazy gallery/CLS-mobile tests. |
| SEO-21 | IMPLEMENT_NOW | YouTube poster/load/reduced-motion/Data Saver/consent dan no empty video wrapper. |
| SEO-22 | IMPLEMENT_NOW | Per-template lab baseline before/after tags; p75 field CWV tetap external. |
| SEO-23 | IMPLEMENT_NOW | Actual transfer baseline, proposed budgets, 390px/constrained/font/layout/keyboard/form/focus checks. |
| SEO-24 | IMPLEMENT_NOW | Async consent-aware minimum tags; GTM/Meta/map/YouTube impacts isolated. |
| SEO-25 | EXTERNAL_GATE | Legal developer/brand/sales-office NAP/hours/contact/coordinates and channel consistency. |
| SEO-26 | EXTERNAL_GATE | GBP eligibility/signage/service/authority verification; no profile per type. |
| SEO-27 | EXTERNAL_GATE | Access/facility/travel claims need sourced measurement/date; existing opt-in map stays. |
| SEO-28 | EXTERNAL_GATE | Trust/legal/process content needs business/legal sources and redaction approval. |
| SEO-29 | EXTERNAL_GATE | Real review permission and legitimate citation/PR; no fake review/backlink scheme. |
| SEO-30 | IMPLEMENT_NOW | Reviewable content register for owner/intent/URL/source/review/expiry/status; no generic blog CMS. |
| SEO-31 | IMPLEMENT_NOW | Brand→project→type→guide/consultation descriptive HTML link graph. |
| SEO-32 | EXTERNAL_GATE | GSC submitted/indexed/excluded/canonical data after domain/account setup. |
| SEO-33 | EXTERNAL_GATE | GSC impressions/click/CTR/position segmented brand/device after traffic. |
| SEO-34 | EXTERNAL_GATE | GA4 organic engagement only after official account, consent and traffic. |
| SEO-35 | IMPLEMENT_NOW | CRM/report dimensions support organic valid/qualified/visit/akad with unknown/self-report caveat; live data later. |
| SEO-36 | IMPLEMENT_NOW | Monitoring contract for 5xx/404/sitemap/bot/CWV/expiry; live alerts and field data external. |

## CRM

| ID | Status | Hasil PR atau gate yang harus ditutup |
| --- | --- | --- |
| CRM-01 | IMPLEMENT_NOW | Contact-intent event remains distinct from inquiry/lead/visit. |
| CRM-02 | IMPLEMENT_NOW | Inquiry exists only after durable commit+receipt; no client-only success. |
| CRM-03 | IMPLEMENT_NOW | Admin resolve establishes valid lead; spam/duplicate are separate. |
| CRM-04 | IMPLEMENT_NOW | Explicit rubric/version/actor/reason qualification; FOLLOWED_UP does not imply qualified. |
| CRM-05 | IMPLEMENT_NOW | Requested/confirmed/completed/cancelled/no-show visit states remain distinct. |
| CRM-06 | IMPLEMENT_NOW | DEAL remains pipeline state; Admin akad confirmation has date/reference/history and revoke. |
| CRM-07 | IMPLEMENT_NOW | CMS Admin WhatsApp with type/project/canonical context works without form/marketing consent. |
| CRM-08 | IMPLEMENT_NOW | WA click creates no lead; manual Admin source selection supports paid/organic/social/referral/direct/unknown. |
| CRM-09 | IMPLEMENT_NOW | Any optional reference is random/no PII and documented as best-effort, not guaranteed matching. |
| CRM-10 | IMPLEMENT_NOW | SELF_REPORTED/UNKNOWN provenance; no scraping, browser-number matching or false paid attribution. |
| CRM-11 | IMPLEMENT_NOW | Service form works with analytics/marketing denied; opt-in categories separate. |
| CRM-12 | IMPLEMENT_NOW | Validate→commit→202→success/WA; storage failure503/error/retry and no success event. |
| CRM-13 | IMPLEMENT_NOW | Admin inquiry inbox and idempotent/versioned ACCEPT_NEW/LINK_EXISTING/REJECT_SPAM; Marketing boundary. |
| CRM-14 | IMPLEMENT_NOW | Existing phone+property dedup, repeat inquiry link, terminal protection and no duplicate conversion. |
| CRM-14a | IMPLEMENT_NOW | Private stable-ID BFI2 allowlist, max-five public options and tamper/archive/title-change tests. |
| CRM-15 | IMPLEMENT_NOW | No public receipt GET; generic submission/replay response prevents enumeration. |
| CRM-16 | IMPLEMENT_NOW | ≥128-bit idempotency key, payload hash, same receipt replay, mismatch409, TTL/tombstone tests, no PII localStorage. |
| CRM-17 | IMPLEMENT_NOW | Transactional allowlist/publication validation, normalization, limits, origin/CSRF/throttle/durable contact-HMAC controls. |
| CRM-18 | IMPLEMENT_NOW | No CAPTCHA without evidence; trusted proxy boundary and no form/contact logs. |
| CRM-19 | IMPLEMENT_NOW | Resolve transaction writes lead/history/notification/link/attribution atomically; concurrency and stale rollback tests. |
| CRM-20 | IMPLEMENT_NOW | Third-party notify after commit, retry idempotency, inbox survives provider failure, receipt after commit. |
| CRM-21 | IMPLEMENT_NOW | Config-gated dry-run/execute privacy cleanup, minimization and backup caveat; policy values remain external. |
| CRM-22 | IMPLEMENT_NOW | Scoped dashboard counts inquiry/valid/qualified/visit/DEAL/akad by period/channel/campaign/type/method. |
| CRM-23 | IMPLEMENT_NOW | Cohort vs activity/spend separation, CPL/CPQL/outcome semantics and denominator-null tests. |
| CRM-24 | IMPLEMENT_NOW | Sample/unmatched/unknown/consent-loss/duplicate/spam/response/pending metrics and CRM dedup caveat. |
| CRM-25 | EXTERNAL_GATE | Human SLA, hours, PIC/backup, reminders and LOST process require owner decision; technical age metrics ship now. |
| CRM-26 | IMPLEMENT_NOW | Long-cycle cohort report supports post-day-30 outcomes; 90-day duration remains configurable proposal. |

## MEAS

| ID | Status | Hasil PR atau gate yang harus ditutup |
| --- | --- | --- |
| MEAS-01 | IMPLEMENT_NOW | GTM-only provider loader; no direct Pixel duplicate; no tags on private/PII routes. |
| MEAS-02 | IMPLEMENT_NOW | Official Consent Mode v2 default-before-load and update for four signals; browser tests. |
| MEAS-03 | IMPLEMENT_NOW | Analytics/marketing category separation, versioned persistence, reload/revoke and post-revoke behavior. |
| MEAS-04 | IMPLEMENT_NOW | Consent-gated first touch/last non-direct across navigation; direct does not overwrite. |
| MEAS-05 | IMPLEMENT_NOW | Bounded taxonomy sanitization; no email/phone/token/free query/referrer/message forwarding. |
| MEAS-06 | IMPLEMENT_NOW | Phase1 strips and never stores/uploads click IDs; encryption/upload remains future gate. |
| MEAS-07 | IMPLEMENT_NOW | Signed context links inquiry→lead internally with CLIENT_REPORTED provenance; no fingerprinting. |
| MEAS-08 | IMPLEMENT_NOW | Promo/cookie/provider permissions are distinct, versioned and revocable; no hash-as-anonymous claim. |
| MEAS-09 | IMPLEMENT_NOW | One canonical action path registry and no duplicate GA4/direct goal design; account goal review external. |
| MEAS-10 | IMPLEMENT_NOW | Search readiness/runbook forbids fake lead bidding and records later bidding decision. |
| MEAS-11 | IMPLEMENT_NOW | SPA/hydration/refresh/retry/status dedupe and stable business event identity tests. |
| MEAS-12 | DEFERRED_BY_SPEC | No consumer upload, enhanced conversions, offline import or CAPI in phase1. |

## ADS

| ID | Status | Hasil PR atau gate yang harus ditutup |
| --- | --- | --- |
| ADS-01 | EXTERNAL_GATE | Rp500.000 one-month Search media cap is enforced only during account activation; Meta paid remains zero. |
| ADS-02 | EXTERNAL_GATE | Hosting/domain actual costs reported outside media budget. |
| ADS-03 | EXTERNAL_GATE | Tax/payment fee and net media amount confirmed before billing. |
| ADS-04 | IMPLEMENT_NOW | Funnel/report distinguishes month-one signals from long-cycle akad; no guarantee. |
| ADS-05 | EXTERNAL_GATE | CPC/CPL/volume from Keyword Planner/account data; no repository estimate. |
| ADS-06 | EXTERNAL_GATE | Start/end/timezone/budget mechanism/owner confirmed in actual account. |
| ADS-07 | EXTERNAL_GATE | 80%/90% spend review, daily reconciliation and activation approval are campaign operations. |
| ADS-08 | EXTERNAL_GATE | Account/domain inventory, ownership, least access, 2FA/recovery/billing. |
| ADS-09 | EXTERNAL_GATE | Create/link official account properties and secure IDs; repo only supplies empty config. |
| ADS-10 | EXTERNAL_GATE | Domain/hosting/form/privacy/content/tracker/billing/staff launch checklist must all pass. |
| ADS-11 | EXTERNAL_GATE | One actual BFI2 Search campaign. |
| ADS-12 | EXTERNAL_GATE | Actual Kota Bandung Presence setting. |
| ADS-13 | IMPLEMENT_NOW | Website/ad-copy register preserves factual Cibiru Wetan, Kabupaten Bandung address. |
| ADS-14 | EXTERNAL_GATE | Actual Search-only/network settings and UI verification. |
| ADS-15 | EXTERNAL_GATE | Actual one-ad-group structure; brand split only on data. |
| ADS-16 | EXTERNAL_GATE | Actual phrase/exact setup and close-variant review. |
| ADS-17 | EXTERNAL_GATE | Language/schedule tied to approved staff hours. |
| ADS-18 | EXTERNAL_GATE | Bidding/max CPC selected from actual research; no fake conversion bidding. |
| ADS-19 | IMPLEMENT_NOW | Project/type landing enrichment, clean canonical, tracking preservation and no all-home routing. |
| ADS-20 | EXTERNAL_GATE | Negative keywords and search-term review in account. |
| ADS-21 | IMPLEMENT_NOW | Fast/mobile factual landing, sitelink destinations and reviewable copy register; RSA upload external. |
| ADS-22 | IMPLEMENT_NOW | Content tests/register block unsupported financial/location/stock claims and enforce BSI 36/60. |
| ADS-23 | EXTERNAL_GATE | Destination/housing/financial/advertiser policy review on actual account/region. |
| ADS-24 | IMPLEMENT_NOW | UTM taxonomy/campaign registry/context capture; auto-tagging and platform IDs external. |
| ADS-25 | IMPLEMENT_NOW | Event/report mapping distinguishes WA/form/valid/qualified/visit/akad and unknown. |
| ADS-26 | DEFERRED_BY_SPEC | Primary conversion import, offline conversion and enhanced conversion wait for later approved phase. |
| ADS-27 | IMPLEMENT_NOW | Report schema covers spend placeholder, media metrics and full CRM outcomes/sample/caveats; live spend external. |
| ADS-28 | EXTERNAL_GATE | Actual pause operations for cap, breakage, false offer, account/privacy/follow-up failure. |
| ADS-29 | EXTERNAL_GATE | CPL/CPQL/economic scenarios require margin, close rate and measured CPC; no house-price revenue claim. |

## META

| ID | Status | Hasil PR atau gate yang harus ditutup |
| --- | --- | --- |
| META-01 | EXTERNAL_GATE | Inventory/ownership/domain/access of Portfolio/Page/Instagram/Ad Account/Dataset before creation. |
| META-02 | EXTERNAL_GATE | Organic content publishing requires approved assets/crops/captions; content register structure ships now. |
| META-03 | IMPLEMENT_NOW | Organic-social vs paid-social UTM taxonomy and factual location/offer/CTA contract. |
| META-04 | IMPLEMENT_NOW | GTM-only marketing-consent Pixel readiness, SPA/dedupe event contract and CSP path; official ID proof external. |
| META-05 | EXTERNAL_GATE | New budget and one paid campaign/1–2 ad sets only after later approval. |
| META-06 | EXTERNAL_GATE | Housing category/audience/region/age/placement/account rules verified in current Ads Manager/docs. |
| META-07 | EXTERNAL_GATE | Creative policy and asset-rights review before upload; register template ships now. |
| META-08 | DEFERRED_BY_SPEC | CAPI/outbox/provider upload is not built in phase1. |
| META-09 | DEFERRED_BY_SPEC | CAPI version/event/dedup/Test Events verification follows a separately approved implementation. |
| META-10 | DEFERRED_BY_SPEC | Retargeting waits for eligibility, consent, audience volume, rotation and new budget. |

## Acceptance mapping

| Verification | Covered requirement | Exit condition for this PR |
| --- | --- | --- |
| V-HOST1..4 | HOST-01..32 | Portable code/runbooks/tests complete; Vercel evidence recorded; Hostinger-only rows remain openly gated. |
| V-SEO1..3 | SEO-01..36 | Code/content/contract assertions pass; domain/account/NAP/field rows remain openly gated. |
| V-CRM1..3 | CRM-01..26 + CRM-14a | SQLite+PostgreSQL concurrency/transaction/scope tests and full browser rehearsal pass. |
| V-MEAS1..2 | MEAS-01..12 | Consent combinations, network/CSP/SPA/dedupe/no-PII pass; provider upload remains absent. |
| V-ADS1 | ADS-01..29 | Website/report/readiness artifacts complete; no account, billing, activation or spend claimed. |
| V-META1 | META-01..10 | GTM/CSP/taxonomy readiness complete; account/policy/paid and deferred integrations remain open. |

No row may move from `EXTERNAL_GATE` or `DEFERRED_BY_SPEC` to complete based only on source code, mocks, an AI review, or a green Vercel build.


## Pemetaan bukti implementasi

| Kelompok | Artefak dan verifikasi konkret |
| --- | --- |
| HOST portable runtime/boundary | Nuxt api-routing/api-bridge/bounded-body/client-ip, Laravel EdgeSecurity/DeploymentIsolation/GrowthPreflight; API routing unit, security-routing browser, auth live fixture; Hostinger runtime aktual tetap external gate |
| SEO crawl/canonical/sitemap | catalogSeo, properti index, robots/sitemaps, Property.publicLastModified dan EvaluationController; acquisition/SEO unit, GrowthInquiryTest pagination+WIB lastmod, browser public smoke; account/field/crawler authenticity tetap external |
| SEO konten/ads landing | content-register.md dan template/properti/kawasan/panduan existing; source/facts/rights/expiry dan legal gates dinyatakan; tidak menggandakan landing per kecamatan |
| CRM intake/reconcile | GrowthGate, InquiryController/Service/Resource, migration, konsultasi dan permintaan UI; GrowthInquiryTest dan growth-intake/growth-live browser |
| CRM outcome/report/privacy | LeadOutcomeWorkflow/Controller, LeadReport, LeadPrivacy, CleanupGrowthInquiries, hasil/laporan UI; GrowthOutcomeTest, Supervision existing, pagination dan confirmed→completed assertion |
| MEAS consent/attribution/event | consent plugin, useConsent/useAcquisitionContext/useAnalytics, acquisition pure helpers; acquisition unit, consent-tracking dan 503→202 one-event browser; container resmi tetap gate |
| ADS/META readiness | paid-acquisition-spec, tracking-setup, content-register, campaign taxonomy/manual-source/report; official accounts/billing/provider policy/tag publishing/spend tidak diklaim dilakukan |
| Preview / final review | preview-isolation-runbook dan validation.md; bukti project/branch/SHA, independent review/hash dan checks dicatat pada PR untuk commit tepat |

Kode existing yang tidak berubah tetap diuji melalui suite penuh (media/private publication, komersial/BSI, auth/roles/CSRF, notifikasi dan histori). Scope dimensi baru ditambahkan secara aditif. Tidak ada requirement external/deferred yang dinyatakan lulus hanya berdasarkan kode atau mock.
