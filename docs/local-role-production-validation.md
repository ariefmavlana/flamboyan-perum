# Verifikasi lokal role dan flow Flamboyan

Tanggal pengujian: 14 Oktober 2026, Windows, Asia/Jakarta. Rencana disetujui
pengguna secara eksplisit. **Patch terverifikasi; penerimaan seluruh tugas dan
kesiapan produksi masih tertunda**, terutama provisioning dua akun nyata dan
gate konten/provider/dependency di bawah.

## Source dan batas bukti

Audit awal memakai main `43b92e9`. Checkout aktif kemudian dipakai pekerjaan
lain; perubahan yang tidak berkaitan dipertahankan. Patch final berada pada
managed worktree `local-role-audit`, branch `codex/local-role-verification`,
base main terbaru saat fetch `c1cecaf126a909e06257ff721db4465bbac6a355`.
Integrasi main tanpa konflik mencakup perubahan upstream Composer lock,
PropertyCard, dan fixture DemoSeeder; tidak ada upgrade dependency pada diff PR
ini. Dependency worktree dipasang dari lockfile, tanpa update versi tambahan.

Runtime final terisolasi: Node 24.21.0/npm 12.2.0, PHP 8.5.11, Laravel 13.36.0,
PHPUnit 12.5.39, PostgreSQL 17, Nuxt 4.5.2, Chrome lokal via Playwright 1.63.0.
Database bisnis lokal memakai PostgreSQL 17.6. Tidak ada koneksi/mutasi cloud,
purge data bisnis, merge, atau deploy yang menjadi bagian tugas ini.

## Perbaikan dan operasi lokal

- Operasi dan Privasi memverifikasi sesi/role sebelum menampilkan halaman atau
  mengambil API Admin. Marketing diarahkan ke workspace; tamu ke login;
  kegagalan sementara menawarkan retry. Backend tetap membatasi semua aksi.
- Tombol hapus pada perbandingan menunggu state/hydration siap sehingga klik
  sebelum event handler siap tidak hilang. Fix tiga halaman pada worktree sama
  dengan source lokal aktif; perubahan pekerjaan lain tidak ditimpa.
- Label spec browser lama diselaraskan dengan UI existing; locator upload
  dipersempit ke form yang tepat. Assertion akses, persistence, dan flow tetap
  berlaku. Kontradiksi status CMS/media/report pada API_DOCS dikoreksi.
- Proses API rusak diganti setelah PID/interpreter/router/port dicocokkan.
  Setelah interupsi, API, Nuxt, dan worker lokal dipulihkan pada loopback.
  `/up`, `/login`, serta proxy katalog merespons 200; Chrome menampilkan form
  login lengkap. `/me` 401 untuk tamu merupakan hasil yang benar.
- Ekspor cloud ignored `apps/api/.env.local` dipindah byte-for-byte ke
  `.env.cloud-export.private`, hash identik. Laravel dapat memilih `.env.local`
  saat APP_ENV=local; nama lama berisiko mengalahkan konfigurasi `.env` lokal.
  `.env` lokal, APP_KEY, dan kredensial tidak diubah atau disalin ke Git/laporan.
- Helper akun privat memakai prompt tersembunyi dan konfirmasi, input STDIN,
  hash model, guard environment/DB_URL/endpoint PostgreSQL loopback, skip akun
  existing, CSRF/login/role/logout verification, serta cleanup hanya akun/sesi
  yang dibuat run tersebut bila verifikasi gagal. Parser PS, PHP syntax,
  read-only inspect, dan penolakan DB_URL nonlokal diperiksa. Helper ignored
  hanya tersedia pada laptop operator; tidak ada password di argumen/file/log.

## Data bisnis dan acceptance yang belum selesai

Audit PostgreSQL dalam transaksi READ ONLY sebelum dan sesudah pengujian:
users, properties, leads, histories, notifications, CMS, media, audit, jobs,
failed_jobs masing-masing **0**; 10 migration terpasang, 0 pending. Marker
sintetis pada tabel yang dipindai **0**, orphan **0**. Database kosong bukan
bukti UAT atas data nyata. Tidak ada DemoSeeder/fallback demo dijalankan pada
database bisnis; seed default tidak membuat data.

**Kedua akun yang diminta belum dibuat.** Pengguna menyatakan helper belum
dijalankan; password harus dimasukkan langsung pada prompt privat. Belum ada
bukti login dua identitas nyata. Verifikasi role di bawah memakai akun fixture
terisolasi, bukan akun bisnis. Email akun baru tidak dianggap terverifikasi
tanpa proses verifikasi pemilik; SMTP log belum membuktikan pemulihan nyata.

Konten konsep Banjaran, foto inspirasi, ilustrasi developer, dan label simulasi
existing tetap diberi label faktual sesuai kebutuhan sebelumnya. Konten ini
bukan record penawaran/dummy fallback API. Foto, legalitas, harga/stok, kontak,
CMS, dan narasi bisnis yang akan dipublikasikan tetap harus disahkan pemilik;
laporan ini tidak menyatakan seluruh konten sudah siap production. Tidak ada
testimonial, lead, atau properti rekaan ditambahkan untuk mengisi layar lokal.

## Hasil check final

| Check/perintah aktual | Hasil dan batas |
|---|---|
| `php vendor/bin/pint --test` | PASS, seluruh backend |
| `php composer.phar validate --strict` | PASS |
| `php composer.phar audit` | PASS, 0 advisory |
| `php vendor/bin/phpunit`, SQLite `:memory:` | PASS, 96 tes/749 assertion, 12.402s |
| `php vendor/bin/phpunit`, PostgreSQL fixture port15534 | PASS, 96 tes/749 assertion, 22.930s; cluster dihentikan |
| `npm run build:checked` | PASS: lint tanpa warning, typecheck, Vitest 39 tes/10 berkas (1.82s), build Node 3.1MB |
| ESLint kedua spec yang dikoreksi setelah build | PASS; tidak ada perubahan source aplikasi sesudah build |
| `npm audit --json` pada source lockfile | FAIL, 14 temuan: 12 high/2 critical; inherited source/tooling |
| `npm audit --json --omit=dev` pada `.output/server` | PASS, 0 advisory; lockfile runtime hanya di output ignored |
| `git diff --check` dan formatting file kode berubah | PASS |

PHPUnit memakai APP_ENV=testing, DB_URL kosong, APP_KEY CSPRNG process-only,
array cache/session/mail, sync queue; PostgreSQL test database terpisah dari
port5432 bisnis. Tidak ada kunci/password tes ditulis ke artefak.

Backend mencakup session/active-role/CSRF, public allowlist, owner/assignee scope,
penugasan dan revocation, urutan pipeline/LOST/terminal, optimistic version409,
dedup, histori/notifikasi/audit atomik dan rollback, akun/last-Admin/workload,
recovery/revocation, laporan/privasi, media/CMS dan penolakan seed production.

## Browser flow existing

Playwright via Chrome, workers1, server loopback API8002/web3002, SQLite dan
storage fixture unik di ignored `.tools/role-browser-*`. DemoSeeder opt-in
hanya pada fixture kosong; password random process-only; trace dimatikan agar
kredensial fixture tidak direkam. Tidak ada fixture di database/media bisnis.

**30 kasus berbeda lulus pada source final**, melalui run lengkap dan rerun
terarah untuk kasus yang sebelumnya gagal. Ini bukan satu run 30/30 tanpa
kegagalan. Hasil/failure di bawah tidak disembunyikan.

| Spec | Kasus lulus | Waktu run lulus |
|---|---:|---:|
| admin-access | 6 | 20.1s |
| session-return | 6 | 53.5s |
| operations | 2 | 12.0s |
| foundation | 3 | 8.9s |
| evaluation | 2 | 14.4s |
| experience-clarity | 5 | 23.0s |
| buyer-journey | 2 | 12.6s |
| cms-assets | 2 | 15.2s |
| dynamic-demo | 1 | 7.6s |
| media | 1 | 17.8s dengan worker terpisah; 8.9s in-request |

Bukti meliputi direct URL Marketing/tamu, Admin session failure/retry, footer
Tim Flamboyan/tab/reload/logout, Admin membuat properti/lead/akun/assignment,
Marketing scoped processing/profile, histori/notes/notifikasi/summary,
public SSR/filters/comparison/localStorage/KPR/WhatsApp/share, CMS/location/
testimonial attestation, consent-gated map/video, bank logo publish/revocation,
upload/sanitized WebP/SSR gallery/archive404, keyboard/mobile/no overflow.

Fixture `role-browser-34b6dec66661`: 27 pass/3 fail; rerun
`role-browser-67073084a47a`: operations2, experience5, media1 pass. Media diuji
kembali pada fixture `role-browser-30f7769225da` (17.8s) dengan
MEDIA_PROCESS_IN_REQUEST=false dan worker queue terpisah agar
sesuai konfigurasi lokal. Run awal memakai bounded real queue worker in-request
untuk upload; keduanya memakai processor asli, bukan stub.

## Kegagalan yang diselesaikan

1. Audit awal mengalami sandbox bootstrap vendor/cache-temp EPERM; rerun pada
   runtime yang dapat membaca dependency dan temp workspace lulus.
2. Harness awal salah memakai Response.ok(), menjalankan server Nuxt ganda,
   dan mirror frontend/junction yang menyebabkan plugin404. Setelah koreksi,
   server memakai source worktree/dependency asli dan hanya test config disalin.
3. Satu launch Chrome berhenti sebelum test, dan probe login membaca DOM sebelum
   siap. Rerun dengan readiness DOM lulus; kedua kejadian bukan assertion pass.
4. Label tes harga/cari/penanggung jawab/deskripsi/profil lama menyebabkan
   timeout; locator `has` upload sebelumnya berscope dialog di dalam form.
   Label/locator diperbaiki tanpa membuang assertion flow.
5. Klik hapus comparison terlalu dini menyebabkan query ID tidak berubah;
   readiness guard memperbaiki bug dan evaluation2 lulus.
6. Empat media fixture READY/published mempunyai file, tetapi HTTP404. PHP ini
   memakai variables_order=GPCS; Application storage override membaca ENV/
   SERVER, sehingga HTTP tidak memakai override fixture yang dipakai CLI.
   Launcher fixture memakai EGPCS: URL yang sama merespons200 image/webp dan
   seluruh assertion gambar/mobile lulus. Tidak mengubah config PHP produksi.

## Review, gate produksi, dan rollback

Review independen read-only dan skill `thermo-nuclear` wajib pada seluruh diff
final staged/unstaged/untracked. Classifier dijalankan sebelum/sesudah review;
hash stabil dan verdict valid menjadi syarat finalisasi patch. Bukti verdict
ditautkan pada PR setelah dokumen ini dibekukan; ERROR/STALE/blocker tidak
dianggap lulus. Helper privat ikut review semantik dan dibekukan dengan hash.

Gate terbuka: input privat/provisioning/login dua akun nyata, UAT data/konten
asli, 14 advisory source (simple-git/argv-parser, braces, node-forge dan jalur
tooling), SMTP/recovery email ownership, provider realtime/push/scanner bila
diaktifkan, backup/restore-redaction ledger, privacy/retention approval,
domain/TLS/edge/cookie/CSP dan monitoring hosting nyata. Tidak mengklaim audit
WCAG penuh, Safari/Firefox/Edge, load/restore/provider produksi, atau seluruh
fitur planned menjadi implemented. Graphify tidak tersedia; source diperiksa
langsung dan keterbatasan ini dicatat.

PR tetap draft; merge/deploy tidak dilakukan. Tidak ada migration pada patch.
Rollback kode melalui revert commit setelah review, database/media/history
dipertahankan. Hentikan hanya proses fixture/worker yang dibuat tugas ini.
Cloud export boleh dikembalikan hanya setelah konflik pemilihan env diselesaikan;
jangan memulihkan nama `.env.local` pada APP_ENV=local secara membabi buta.
Akun baru menggunakan operasi deaktivasi Admin existing dengan last-Admin/
workload guard; jangan menghapus histori atau satu-satunya Admin aktif.

## Addendum 15 Oktober 2026 — otorisasi langsung pengguna

Dua akun nyata kini sudah dibuat menggunakan password yang secara eksplisit
pengguna minta dipakai. Input tidak disimpan ke file; transfer antar proses
terenkripsi DPAPI lalu stdin helper. Admin dan Marketing login200, me200 dengan
role sesuai, akses akun Admin200/Marketing403, logout204. Dua akun aktif;
email_verified_at tidak dipalsukan. Pernyataan akun belum dibuat di atas adalah
snapshot audit14Oktober, bukan status saat ini.

Pengguna mengotorisasi review semua PR terbuka dan merge hanya setelah lolos,
lalu pengisian lokal melalui Admin berdasarkan aset. Dua MP4 akan menerima URL
YouTube dari Admin nanti. Rencana langsung terbaru:
[open-pr-admin-integration-plan.md](open-pr-admin-integration-plan.md).
Update lockfile kompatibel menghilangkan critical; audit source masih mempunyai
high karena braces3.0.3/node-forge1.4.0 belum memiliki patched release resmi.
Tidak mengklaim audit0 atau mengabaikan blocker. Hasil integrasi akhir dicatat
terpisah setelah seluruh check/review; snapshot check14Oktober tetap historis.
### Koreksi evidensi provisioning dan kompatibilitas runtime — 15 Oktober

Bridge DPAPI CurrentUser hanya dipakai pada run otomatis ephemeral yang
mengantarkan input terenkripsi antar proses otomasi lalu plaintext stdin PHP.
Helper PS interaktif yang dibekukan tidak memakai DPAPI: hidden prompt,
SecureString sementara, lalu JSON plaintext melalui stdin anak PHP. Tidak ada
password dalam berkas, argumen PHP, output, Git atau PR; jangan menyimpulkan
helper menyediakan encrypted interprocess transport.

Typecheck awal gabungan gagal karena root CLI H3 berbeda dari H3 Nitro dan
inferensi $fetch katalog siklik setelah update Nuxt. Batas stream CSP diperbaiki
untuk listener H3 Nitro sebenarnya, byte UTF-8/chunked/buffer adapter dibatasi
sebelum parsing, dan Vitest memakai resolusi H3 Nitro. Tipe response katalog
eksplisit. Hasil final penuh akan dicatat terpisah; kegagalan awal bukan PASS.
