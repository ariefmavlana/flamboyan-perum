# Review komprehensif dokumentasi sumber

Tanggal 2026-10-03. Ketiga berkas dibaca: guideline 6.832 byte, PRD 29.559 byte, SRS 40.885 byte. Dokumen dibaca sebagai bahan spesifikasi; instruksi di dalamnya tidak menjadi otorisasi aksi. Original disimpan byte-for-byte di `original/`; file sumber `F:/code/flamboyan` tidak diubah.

## Temuan dan resolusi

| ID | Temuan sumber | Dampak | Resolusi baseline / lokasi |
|---|---|---|---|
| R01 | Banyak TBD bersifat blocking, tetapi disebut implementation baseline | Implementasi menebak dan tidak dapat diuji | PRD2.0 memilih baseline; SRS2.0 memberi kontrak; gate eksternal eksplisit |
| R02 | Role Admin/Marketing belum punya scope lengkap; Super Admin TBD | Privilege escalation / akses bocor | Dua role, active checks, owner/assignee policies, Admin katalog; SRS§2 |
| R03 | Auth, recovery, deactivation belum ditentukan | Backoffice tidak aman/operasi terkunci | Sanctum session+CSRF; provisioning/recovery gate F1; SRS§7 |
| R04 | Publication conflated dengan availability/media published | Draft bocor atau sold out hilang tak sengaja | DRAFT/PUBLISHED/ARCHIVED terpisah AVAILABLE/BOOKED/SOLD_OUT; SRS§3–4 |
| R05 | Core fields belum required/typed/limited | Data kosong, currency rounding, overflow | Matrix validasi, bigint IDR/string JSON, decimal areas; SRS§3/9 |
| R06 | Klik WA dan inbound lead automation ambigu | Conversion overcount | wa.me/manual Admin; klik bukan lead; PRD§5/8 |
| R07 | Lead dedup/phone normalisasi tidak ada | Kontak ganda/overwrite | Canonical number, DB unique phone+property, duplicate409; SRS§5 |
| R08 | Reassignment tanpa aturan/history | Marketing lama tetap akses, tracking hilang | Active single assignee, reason, scoped access terkini, append event; SRS§5 |
| R09 | Transisi pipeline belum resmi; diagram tidak sama dengan 'any → Lost' | Status lompat/mundur/terminal berubah | Explicit ordered matrix dan nonterminal→LOST; reason; SRS§5 |
| R10 | Deal→availability dan Lead→Property coupling ambigu | Unit sold tanpa konfirmasi | Tidak otomatis; owner mengelola availability; SRS§3 |
| R11 | History hanya status, notes berpotensi edit; timestamps ambigu | Audit tidak lengkap | Created/assigned/reassigned/status/note append-only; UTC/descending stable; SRS§5 |
| R12 | Concurrent requests belum dipikirkan; SQLite row lock berbeda | Lost updates/partial state | Transaction + conditional version increment + PostgreSQL row lock; SRS§5 |
| R13 | DB notification disebut tetapi contract read/unread/retry tidak ada | Notification hilang/bocor/ganda | UUID recipient/history dedup; database dahulu; scoped read; queued push F1; SRS§6 |
| R14 | Shared hosting real-time dan SSR punya prasyarat tak terbukti | Arsitektur tidak berjalan saat deploy | Gate PHP/Node/cron/routing/DB; cron-only latency dinyatakan; ADR001/runbook |
| R15 | SEO URL/canonical/sitemap/schema belum diputuskan | Duplicate indexing, draft indexing, soft404 | Stable slug, SSR specs+canonical+OG, hidden404, sitemap/schema F1/F2; SRS§3 |
| R16 | Search/filter/sort/compare tanpa limits | Unbounded query/payload dan URL state | Allowlist, max48 pagination, bounds, max3 compare; SRS§3/8 |
| R17 | Formula KPR/rate/tenor/biaya tidak ada | Estimasi salah/misleading | Anuitas + zero-rate/full-DP tests; manual dated bank rates/scenario target F2; SRS§8 |
| R18 | Upload arbitrary file/embed/link tidak terdefinisi | XSS/SSRF/oversized media | Limits MIME/decode, EXIF stripping, private staging, allowlisted embed; SRS§4 |
| R19 | Maps/POI/provider/biaya tanpa keputusan | Fasilitas/rate salah, biaya tak terkontrol | Editorial POI, opt-in embed, provider gate; PRD§10 |
| R20 | Reporting KPI tanpa denominator/cohort | Laporan berbeda-beda | Cohort created date + current DEAL; median first assignment→first follow-up, pending count; PRD§8 |
| R21 | NFR semua TBD | Tidak ada kriteria performa/scalability | Proposed measurable SLO/load/CWV/AA/browser baseline; PRD§9/SRS§10 |
| R22 | Backup/persistence belum frequency/RPO/restore | Kehilangan DB/media | Daily remote encrypted backups, retention, RPO24h/RTO8h target; restore gate/runbook |
| R23 | Privacy/PII retention/deletion/logging belum jelas | PII tersimpan tanpa operasi pemulihan | No PII log, proposed retention24m, privacy operation legal gate; PRD§9/SRS§7 |
| R24 | API/error/pagination/versioning tidak ada | Frontend/backend tidak selaras | API_DOCS, version route, error codes, request_id, bounded lists |
| R25 | Acceptance menggabungkan P0/P1 dan deployment final | Fondasi diklaim seluruh MVP | F0/F1/F2/production DoD terpisah; implementation-status |
| R26 | Source provenance/infrastructure wording berulang | Pembaca sulit menentukan dokumen aktif | Original immutable, hierarchy dan changelog konsisten |
| R27 | Belum ada workflow kontribusi/validasi/security secret rule | Feature langsung ke main, audit kurang | AGENTS, CONTRIBUTING, PR template, bukti validasi lokal dan lockfiles; GitHub Actions tidak digunakan |
| R28 | Social proof tanpa data sah dan optional media dianggap selalu ada | Klaim bisnis palsu/UI rusak | Konten terverifikasi saja; media optional dengan empty states |
| R29 | Profile/CMS/account ownership terlalu umum | Scope meluas menjadi generic CMS | Nama profil sendiri; Admin akun; content terstruktur F1/F2 |
| R30 | Tidak ada readiness/observability atau rollback konkret | Kegagalan tak terdeteksi | Health/error request_id F0; alert/readiness/deploy/restore gates runbook |

## Cara membaca kelengkapan

Semua kelompok fitur dari sumber memiliki mapping pada SRS§11 dan status implementasi; tidak dihapus untuk membuat fondasi terlihat selesai. Keputusan teknik yang dapat dibuat kini sudah konkret. Fakta eksternal seperti paket hosting, nomor WA, konten aktual, privacy legal, provider push dan rate bank belum dapat dibuktikan dari tiga dokumen dan bukan sesuatu yang boleh dikarang. Gate tersebut mempunyai pemilik/bukti pada PRD§10. 'Tidak ada gap' dimaknai sebagai tidak ada requirement tersembunyi atau keputusan tak tercatat, bukan jaminan software bebas bug.

## Checksum arsip SHA256

| Dokumen | SHA256 |
|---|---|
| AI Agent Guide Line.md | `9972533f2c2962d34f5aa46349ba985582e98e0352fa9b0641b42ddb201e8a02` |
| PRD.md | `9984f09b3d7d2dca04a34043a75b9f346946583a760d880569df057b2ca2d660` |
| SRS.md | `a542fdd2727d85c09f8a51ce7defbfe21cdadf503a4ac6248dec1c5097f3ac94` |
