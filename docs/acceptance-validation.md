# Validasi acceptance operasional

2026-10-03–04 Asia/Jakarta · `codex/operational-acceptance` · dependency PR #8. Validasi lokal tanpa GitHub Actions; tidak merge/deploy atau menyentuh data bisnis. Seluruh fitur telah dipetakan pada `requirements-traceability.md`; gate eksternal bukan fitur planned yang disamarkan.

## Runtime dan pemeriksaan final

Windows11 Pro10.0.26200, Intel i7-1255U (10 cores/12 logical), RAM15.71GiB. PHP8.4.26/GD JPEG-PNG-WebP/PDO SQLite/PDO PostgreSQL; Node24.21.0; Nuxt4.5.2/Nitro2.13.4/Vue3.5.43; PostgreSQL17.9 port54329 cluster test private. Composer platform8.3 tidak membuktikan eksekusi PHP8.3/Linux; runtime hosting wajib diuji ulang.

| Perintah / cwd | Hasil aktual |
|---|---|
| `vendor/bin/pint --test` / apps/api | Passed |
| `php artisan test`, DB_CONNECTION=sqlite DB_DATABASE=:memory: / apps/api | 66 tests/453 assertions,3.25s |
| `php artisan test`, dedicated PostgreSQL test env / apps/api | 66 tests/453 assertions,7.79s |
| `composer validate --strict`, `composer audit` / apps/api | Valid;0 advisories |
| `php artisan route:cache`, `route:clear` / apps/api | Passed; cache cleared |
| `npm run lint`, `typecheck` / apps/web | Passed; ESLint max-warnings0 |
| `npm test` / apps/web | 13 tests/3 files,305ms |
| `npm run build` / apps/web | Passed production node-server; upstream DEP0155 warning retained |
| `npm run test:e2e`, private DEMO_PASSWORD, installed Chrome, E2E_PRODUCTION_ORIGIN / apps/web | 12 passed,1.4min; no retries/skips |
| `npm run audit:source` / apps/web | Exit1,11 high propagated from two upstream advisories; no critical/moderate |
| Create ignored `.output/server` audit lock, `npm run audit:runtime` | Exit0,0 advisories |

SQLite test environment is explicitly reset per process; RefreshDatabase is never pointed at browser/load/business databases. PostgreSQL `flamboyan_foundation_test`, `flamboyan_load_acceptance`, and `flamboyan_restore_acceptance` are separate isolated databases. Runtime binaries/configs/passwords/keys/reports/dumps/output are ignored and not committed.

Browser suite covers public SSR/canonical/missing404/CSRF419, mobile filters/URL/compare/floating KPR/SEO, Admin editorial/map consent, session/keyboard drawer/note/logout, actual queue image upload+SSR sanitized gallery/archive404, scoped catalog/manual assignment/pipeline, generic recovery, real Echo/Pusher SDK on synthetic socket/auth/inbox, reports/privacy access, Admin operations/Marketing denial. Extra **built production SSR** case checks nonce changes per response, no unsafe-eval/script-CSP/page errors during hydration, calculator/comparison and no root overflow at320px; reset no-referrer, login same-origin, API nosniff, unknown Host400. This is not full WCAG/UAT or Safari/Firefox/Edge coverage.

## Load protocol and results

`php tests/acceptance/seed-load.php` only accepts the fixed isolated localhost fixture targets and an empty properties table; no drop/overwrite. Actual seeded dataset:10,000 properties,50,000 leads,33,334 histories. PostgreSQL exact50k report cohort:754.13ms, median7200s; SQLite initial report713.29ms. Both figures are local query evidence, not request SLO or hosting benchmarks.

`node scripts/load-test.mjs` localhost-only, rate≤20/duration≤900s/concurrency≤128,5s timeout, consumed bodies checked for fixture content; skipped requests count as errors. Four equal scenarios: API search/sort list, API detail, production SSR search/sort list, production SSR detail.200 synthetic client IPs test signed propagation and per-client rate limiting; edge trusted127 is explicit acceptance configuration. No business contact/provider traffic. PHP worker pool8 is a transient local Windows model, not a production reverse proxy or microservice. Native OPCache CLI enabled, validated timestamps; API uses PostgreSQL17.9. Shared session/cache/database still required for real horizontal deployment.

Full run passed **18,000 requests/0errors/0skipped**,900.1703s wall,19.9962 achieved requests/s (scheduled20rps, last batch drain included),all HTTP200 and fixture bodies verified. No live provider traffic. Per scenario4,500requests:

| Scenario | p50 ms | p95 ms | p99 ms | max ms | Result |
|---|---|---|---|---|---|
| API search/sort list | 131.21 | 165.85 | 245.21 | 325.06 | ≤500ms passed |
| API detail | 116.83 | 147.67 | 230.15 | 287.25 | ≤500ms passed |
| Production SSR search/sort list | 162.68 | 258.17 | 301.26 | 433.74 | ≤1500ms passed |
| Production SSR detail | 308.30 | 428.19 | 477.02 | 619.57 | ≤1500ms passed |

Error0% is below1%. Local NFR load target passed on this worker/database configuration; not proof of hosting capacity, uptime/monthly99.5%, field Web Vitals, full media-heavy workload, concurrency writes/CRM races or offsite guarantees. Multi-IP rate bucket propagation did not collapse allSSR into loopback. New guard rejects NaN/noninteger inputs before requests/report writing; validation command initially had an array-output assertion mistake, corrected to joined text and rejection verified. Formatting afterward did not change measured workload.

Failed diagnostic runs are retained as limitations: single PHP CLI worker smoke400requests/333errors (83.25%,timeouts); an incorrect PHP router working directory produced fatal200 HTML and failed body checks; corrected8-worker SQLite smoke400/5errors (1.25%,QueryException); PostgreSQL without OPCache smoke400/38errors (9.5%,timeouts). Native OPCache+8 PG workers smoke400/0errors; p95 API list238.15/detail223.70ms, SSR list247.97/detail416.68ms. These20s smoke runs do not replace full15min acceptance. SQLite WAL/busy_timeout5000/synchronousFULL improve the documented lightweight installation; full target load is validated on PostgreSQL, not claimed for SQLite.

## Restore evidence

`php tests/acceptance/backup-drill.php` performed a **native SQLite consistent backup**, media manifest+SHA256, native Sodium authenticated secretstream (1MiB framed chunks with final tag), decrypt/explicit3-file extraction, DB/media checksum equality,10k/50k counts, integrity_check=ok and foreign_key_check clean. One-byte tampering was rejected and partial decrypted output deleted. Elapsed0.707s. Random ephemeral key is never printed and destroyed; private drill copies cleaned after review. This script is local evidence with synthetic media, not a production backup scheduler/key management product.

PostgreSQL17.9 `pg_dump --format=custom` + `pg_restore --no-owner --no-acl` to separate empty restore DB completed1.7391035s. Restored10,000properties/50,000leads/33,334histories,0 orphan property references,0 orphan history references; schema/FK constraints restored. Native dump SHA256:AB3A1222734B9D2910D5DAFC435179674BDE54E8027F2A8AD8C90C11828D3CED. PG dump itself was private local and unencrypted; encryption is demonstrated by the SQLite+media drill. No production/offsite/retention/RPO24h/RTO8h claim.

## Corrections found by validation

Initial eager trusted-proxy config lookup failed before Laravel console bootstrap; corrected to request-time middleware subclass. Unsupported bootstrap closure signature rejected before tests; no workaround weakening trust. Production320px browser found346px root overflow from grid min-content; minmax(0,...)/child min-width0 corrected and production retest passed. Referrer-policy initially no-referrer on login/backoffice removed Sanctum stateful GET detection; a restart alone did not fix it. Final same-origin policy for login/backoffice plus no-referrer recovery restores sessions and avoids external referrer disclosure; all12 flows passed. No failed run is labelled passed. Tooling NO_COLOR/FORCE_COLOR warning remains recorded.

## Release gates and rollback

Hostinger/Rumahweb package/domain not chosen. Need real PHP/Node/extensions/OPCache, HTTPS/routing/trusted-IP/config, managed workers, SMTP delivery, Pusher latency, maintained ClamAV, production dataset/media/rates/permission, approved notice/retention/ledger, monitoring/offsite/key custody/retention and chosen runtime/UAT/load evidence. Source advisories remain open per dependency-security.md. No new schema migration in this PR; compatible rollback retains expanded privacy schema/guards and atomically reverts paired Nuxt/API proxy/header changes/config. Do not rollback migration000006 or enable pre-privacy mutations. Stop acceptance workers; no automatic production restore or PR merge.
