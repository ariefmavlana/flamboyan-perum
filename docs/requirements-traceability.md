# Traceability requirement dan bukti

Baseline aktif PRD/SRS 2.1, 2026-10-03. Seluruh kelompok requirement sumber dipertahankan dalam SRS§11. Tabel ini memetakan implementasi dan batas bukti; status gate tidak diubah menjadi selesai hanya karena kode tersedia. Sumber awal tetap utuh di `original/`; review/resolusi awal ada di `review.md`.

| PRD / ID sumber | Implementasi | Bukti lokal | Gate produksi |
|---|---|---|---|
| P-01, FR-PUB-001..005 | Home SSR, hero/featured, CMS/testimonial/rates verified, WA | EvaluationTest; evaluation/browser; public allowlist | Konten/izin testimonial, identitas bank/kemitraan bila ditampilkan |
| P-02/P-03, FR-PUB-010..012 | PublicProperty, filter/sort/paginator; listing UI URL/back | FoundationTest; mobile/filter browser; load list | Kapasitas hosting dan traffic lapangan |
| P-04, FR-PUB-020..025/028 | Detail SSR, canonical/OG, private media/WebP/galeri/denah/video/tour/PDF | MediaTest; real-worker upload/archive/browser; SSR HTML | Media asli berizin, scanner ClamAV maintained, provider embed |
| P-05, FR-PUB-003/029 | WhatsApp config terpusat + judul/canonical; analytics opt-in | SSR/discovery browser; SupervisionTest | Nomor sementara 6287776734038 dikonfirmasi sebelum go-live |
| P-06, FR-PUB-013 | Compare SSR ≤3 IDs, missing/public scope, local IDs | EvaluationTest; evaluation browser | UAT pemilik |
| P-07, FR-PUB-030..035 | KPR pure fixed/floating reset, schedule/chart, rate editorial dated | KPR unit tests; floating/browser/CSP production | Rate bank berlaku dan sumber, bukan penawaran bank |
| P-08, FR-PUB-026/027 | Coords/POI bounded, OSM consent/attribution/fallback | EvaluationTest; consent browser | Sumber POI aktual, provider/terms/access jaringan |
| I-01/I-09, FR-BO-PROP-005 | Sanctum cookies/CSRF, users/provision/profile/recovery/security stamps | OperationsTest; SecurityAndAtomicityTest; account/CSRF/recovery browser | SMTP real delivery, HTTPS/cookie/host/reverse-proxy pada domain asli |
| I-02, FR-BO-PROP-001..003 | Scoped catalog CRUD/owner transfer/version/archive/availability | FoundationTest/OperationsTest; operations browser | Katalog asli lengkap/owner aktif |
| I-03/I-04, FR-CRM-001..003 | Admin manual create/dedup/contact correction/assignment | FoundationTest/OperationsTest; operations browser | Prosedur tim dan verifikasi kontak; tanpa otomatisasi WhatsApp |
| I-05/I-06, FR-MKT-001..005 | Scoped pipeline/notes/history drawer; terminal/version guard | FoundationTest; atomicity fault injection; drawer keyboard/Escape browser | UAT peran dan accessibility lengkap |
| I-07, FR-RT-001..004 | Persisted inbox + durable DB jobs + own private Echo/Pusher/dedup/reconnect/poll | RealtimeTest; official signing vector; real SDK synthetic WebSocket browser | Pusher credentials/receipt≤5s dan worker dedicated pada hosting |
| I-08, FR-CRM-004 | Cohort/assignee vs actor/conversion/median/pending Admin report | SupervisionTest; report browser; exact50k cohort benchmark | Interpretasi KPI disepakati, pengukuran hosting |
| I-09, FR-BO-PROP-004 | Admin CMS fixed schemas/attestation/version/audit | EvaluationTest; editorial browser | Konten terverifikasi tanpa logo/testimoni/rate fiktif |
| PRD§8/privacy | Daily PII-free aggregates defaultoff, read-only candidates, policy/password/version-controlled CLI redaction | SupervisionTest includes atomic redaction and mutation lock | Notice/policy/retention/hold/ledger/backup expiry disahkan owner |
| NFR-SEO-001..005 | SSR specs, canonical/OG/JSON-LD, robots, published sitemap index | Evaluation/SSR browser; fixture published/draft checks | Domain canonical, Search Console dan crawl aktual |
| NFR-UI-001..004 | Bahasa ID, IDR/m²/Jakarta, responsive320+, focus/labels/native drawer/consent | 12 browser flows including production CSP/320px; manual visual evidence earlier PRs | Full WCAG2.2AA/UAT; dua versi Chrome/Edge/Firefox/Safari belum seluruhnya diuji |
| Security/operations/performance | Signed per-client SSR proxy, exact trust/host, nonce CSP, JSON logs, ready/Admin ops, backup alert | OperationalTest/client-IP unit; browser production; bounded load and encrypted restore evidence | Linux/PHP8.3 chosen runtime, TLS/routing/storage/monitoring/offsite/RPO/RTO/upstream advisory |
| Contribution | Separate Conventional Commit branches, PR stack, local validation, no Actions | PR #3→#9, validation documents; originals preserved | Review dan instruksi merge pengguna; branch protection setting |

Referensi hasil final: `acceptance-validation.md`; bukti tiap tahap: `validation.md`, `operations-validation.md`, `media-validation.md`, `evaluation-validation.md`, `realtime-validation.md`, `supervision-validation.md`. Runbook menjelaskan konfigurasi dan rollback. Simulasi provider tidak membuktikan layanan produksi; backup fixture tidak membuktikan offsite atau retensi bisnis. Target yang membutuhkan keputusan/layanan eksternal tetap mempunyai pemilik di PRD§10.
