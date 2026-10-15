# Audit lokal, role, dan rencana perbaikan

Tanggal: 14 Oktober 2026 (Asia/Jakarta). Base: `origin/main` commit
`43b92e9f8987904e01ec2225723dd0e0fab1eb70`, diperbarui dengan fetch sebelum
branch awal `codex/local-role-production-audit` dibuat. Karena checkout/branch
kemudian berubah oleh pekerjaan lain, perubahan tugas ini diisolasi pada managed
worktree dengan branch `codex/local-role-verification` dari SHA audit yang sama. Status: **rencana disetujui
pengguna pada 14 Oktober 2026; implementasi/verifikasi berlangsung**. Persetujuan
eksplisit: "Setuju, implementasikan rencana tersebut". Akun menunggu input
password privat pengguna; tidak ada persetujuan AI yang dianggap approval manusia.

## Integrasi verifikasi akhir

Implementasi dipisahkan ke managed worktree `local-role-audit` pada branch
`codex/local-role-verification` karena checkout utama dipakai pekerjaan lain.
Perubahan yang tidak berkaitan dipertahankan. Setelah fetch ulang, branch
fast-forward tanpa konflik ke main `c1cecaf126a909e06257ff721db4465bbac6a355`;
commit upstream memperbarui lockfile Composer, label PropertyCard, dan fixture
DemoSeeder. Dependency mengikuti lockfile tersebut; bukan upgrade pada PR ini.
Semua check yang terdampak diulang pada base baru.

Audit flow existing juga menemukan tombol hapus perbandingan dapat diklik sebelum
hydration selesai. Guard readiness pada `/bandingkan` termasuk perbaikan flow
publik yang sudah disetujui; tidak menambah fitur atau mengubah kontrak API.
Label tes browser lama diselaraskan dengan UI existing (harga IDR, penanggung
jawab, cari properti, deskripsi media); assertion permission/flow tetap berlaku.
Hasil akhir dan gate yang belum lulus tersedia pada
[local-role-production-validation.md](local-role-production-validation.md).
## Kebutuhan dan batas

Pengguna meminta pemeriksaan dan perbaikan login **Tim Flamboyan**, kelengkapan
alur Admin/Marketing/pengunjung, koneksi data, serta pembersihan data/narasi
sintetis sebelum produksi. Pengguna mengonfirmasi pengunjung/pembeli **tanpa
login** sesuai flow existing dan memberikan identitas dua akun tim. Identitas
dan password akun tidak disalin ke dokumen/repository/perintah/log.

Baseline: `PRD.md`, `SRS.md`, `architecture.md`, `implementation-status.md`, dan
`API_DOCS.md`. Hanya role `ADMIN`/`MARKETING`; otorisasi tetap di Laravel.
Tidak menambah akun pembeli, pendaftaran publik, otomatisasi WhatsApp/booking,
microservice, dependensi, seed bisnis, atau perubahan deployment cloud. Tidak
merge PR atau deploy tanpa instruksi pengguna. File pengguna `.commandcode/`,
`apps/web/public/images/EDITED/`, dan `LOGO.jpg` dipertahankan.

## Bukti konteks lokal pada audit awal

- Node 24.21.0/npm 12.2.0; PHP aktif Laragon 8.5.11, Laravel 13.34.0;
  PostgreSQL lokal 17.6. PHP 8.4.26 tersedia tetapi PDO PostgreSQL/SQLite tidak
  aktif pada konfigurasi interpreter tersebut. Audit memakai 8.5.11.
- `.env` Laravel menunjuk PostgreSQL loopback dan environment `local`, bukan
  `.env.local` yang menyimpan konfigurasi cloud. Pembacaan database dilakukan
  dalam transaksi PostgreSQL `READ ONLY`, tanpa menampilkan isi record/kontak.
- Seluruh tabel domain kosong: users/properties/leads/history/notifications/
  CMS/media/audit/jobs/failed_jobs masing-masing **0**. Sepuluh migration
  terpasang; **0** migration pending. Kedua akun yang diminta **belum ada**.
- Marker sintetis **0** pada tabel yang dipindai. Pemeriksaan orphan juga **0**,
  tetapi database kosong bukan bukti hubungan data atau flow bisnis bekerja.
- Web `127.0.0.1:3000/login` 200; API `:8000/up`, catalog/content, dan `/me`
  500 dengan body kosong. Proxy web catalog 503 dan `/me` 500. Root cause proses
  server belum dipastikan.
- Probe sementara loopback `:8001` memakai interpreter, source, router Laravel,
  dan database yang sama: `/up`, catalog/content **200 JSON**; `/me` **401 JSON**
  untuk tamu. Probe tidak mengganti/menghentikan proses pengguna.
- `DatabaseSeeder` default tidak membuat akun/data. `DemoSeeder` hanya
  local/testing, opt-in password, menolak database domain nonkosong, dan tidak
  merupakan fallback aplikasi. Tests/seeder sintetis tidak boleh dijalankan
  terhadap database bisnis dan tidak membuktikan data produksi bersih.
- Source public masih memakai foto inspirasi untuk rencana Banjaran/panduan,
  dan ilustrasi developer untuk Flamboyan. Label tersebut faktual; mengganti
  tulisan menjadi "foto asli" tanpa sumber tidak dibenarkan. Banjaran adalah
  konsep yang sebelumnya disetujui, belum katalog penjualan. Konten/foto asli
  dan data bisnis lokal tetap belum diisi/diverifikasi.
- Graphify tidak terpasang dan graph existing tidak ada; audit memakai source
  langsung dan reviewer independen, tanpa mengklaim hasil knowledge graph.

## Temuan reviewer independen

1. **P2, guard halaman Admin belum konsisten.** `operasi.vue` dan `privasi.vue`
   memanggil API Admin tanpa memeriksa role terlebih dahulu. Marketing dengan
   URL langsung melihat judul/prosedur Admin dan error 403. Backend menolak
   akses sehingga tidak ditemukan kebocoran data protected. Halaman akun,
   laporan, dan konten sudah memeriksa role. Perbaikan dibatasi ke kedua halaman
   dengan pola session/redirect existing dan regresi browser URL langsung.
2. **P2, kontrak API kontradiktif.** `API_DOCS.md` bagian batas menyatakan
   CMS/media/report belum diimplementasikan, padahal route dan bagian lanjutan
   dokumen menjelaskan endpoint existing. Koreksi status tanpa mengklaim SMTP,
   push provider, scanner, atau gate produksi sudah terverifikasi.

Reviewer memeriksa guards aktif/backend, scope owner/assignee, transaksi CRM,
public DTO, account management, dan tests. Model dua role sesuai SRS. Ini audit
source, bukan UAT seluruh fungsi pada database bisnis.

## Rencana implementasi yang diusulkan

1. Pulihkan proses API lokal yang menghasilkan 500 dengan runtime/router yang
   sudah terbukti sehat; identifikasi proses/port milik proyek sebelum restart.
   Verifikasi same-origin CSRF, sesi, `/me`, login/logout, error salah password,
   dan footer Tim Flamboyan pada desktop/mobile. Jangan mengubah APP_KEY,
   mengarahkan lokal ke cloud, atau menonaktifkan backend guards.
2. Provision dua akun yang diminta hanya bila belum ada, menggunakan mekanisme
   password privat/interaktif. Role/active status eksplisit; email tidak dianggap
   terverifikasi tanpa verifikasi pemilik. Jangan menimpa akun/password existing.
   Password tidak masuk argumen, transcript, atau file. Bila input privat
   diperlukan, user memasukkannya pada prompt lokal yang disembunyikan.
3. Perbaiki guard kedua halaman Admin. Backend tetap memvalidasi permission;
   UI Marketing menuju workspace yang diizinkan tanpa mengambil data Admin.
   Kegagalan jaringan tidak dianggap session valid atau anonymous secara palsu.
4. Pertahankan database bisnis lokal tanpa dummy. Tidak perlu purge/reset karena
   tabel domain kosong. Data uji hanya pada SQLite/PostgreSQL fixture terisolasi.
   Jangan membuat properti, lead, testimonial, bank, harga, stok, atau klaim
   bisnis rekaan untuk mengisi layar. Label ilustrasi/simulasi yang faktual tetap
   jujur; jika seluruh foto inspirasi harus hilang, perlukan sumber foto nyata
   atau keputusan menyembunyikan bagian konsep, bukan sekadar menghapus label.
5. Jalankan regresi role dan flow existing pada fixture terpisah: Admin mencatat
   lead/properti, assignment ke Marketing, Marketing hanya melihat milik/assigned,
   status berurutan/LOST reason/terminal, notes/history/notification atomik,
   konflik version 409, reassignment dan revocation, CMS/report/account Admin.
   Pengunjung hanya published catalog, filter/detail/compare/KPR/WhatsApp;
   draft/archived 404, tanpa identitas tim/CRM, tanpa fallback demo.
6. Koreksi API/status implementasi, catat bukti baru, review independen terhadap
   full diff, jalankan security review `thermo-nuclear` untuk provisioning/akses
   dan operasi runtime, lalu buka PR. Status draft bila check wajib belum selesai
   atau security/dependency blocker masih ada. Tidak merge/deploy.

## Acceptance dan verifikasi

| Acceptance | Bukti yang harus tersedia |
|---|---|
| Login dua role nyata di lokal | Akun sesuai identitas pengguna, aktif, hash password; sign-in lewat web origin; `/me` role benar; logout/revocation diuji |
| Marketing scoped | Backend 403 untuk aksi Admin/404 object luar scope; direct URL Admin tidak menampilkan workspace Admin |
| Integritas CRM | Mutasi + history + persisted notification commit bersama, dedup/concurrency/terminal/reassignment diuji |
| Public data aman | Allowlist published; tidak memuat identitas Marketing/kontak CRM/dummy/testimonial rekaan |
| Lokal bersih | Inventaris domain sebelum/sesudah; fixture tidak tercampur; tidak menjalankan DemoSeeder terhadap DB bisnis |
| Konten faktual | Data bisnis terverifikasi atau empty state; media ilustrasi tetap diberi label yang benar |
| Checks lengkap | Pint, PHPUnit SQLite **dan** PostgreSQL test terisolasi, Composer validate/audit, lint/typecheck/unit/build, browser flows, dependency audit |
| Review | Reviewer read-only full staged/unstaged/untracked diff + security verdict valid, diff tidak berubah sesudah review |

Validasi audit awal (bukan bukti perubahan telah selesai):

- PHPUnit langsung `vendor/bin/phpunit`, explicit `APP_ENV=testing`,
  `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, `DB_URL=''`, array cache/session/
  mail dan sync queue: **96 tests/749 assertions**, PHP 8.5.11, 19.975s.
  Rerun di luar sandbox karena bootstrap vendor tidak dapat dibuka pada attempt
  pertama; database bisnis PostgreSQL tidak dipakai suite ini.
- Frontend `npm run lint` dan `npm run typecheck`: lulus.
- `npm test`: **39 tests/10 files**, 1.59s. Attempt pertama gagal sebelum test
  karena sandbox EPERM rename cache temp; rerun memakai TEMP/TMP dalam ignored
  `.tools/tmp` lulus tanpa mengubah kode/tests.
- Pint `--test`: lulus. Composer validation/audit, PostgreSQL test suite,
  build/browser flow dan dependency audit belum lengkap saat dokumen dibuat.

## Risiko, rollout, dan rollback

| Risiko | Pengendalian |
|---|---|
| Fixture/test menghapus DB bisnis | Driver/database fixture eksplisit, environment testing, DB_URL kosong; larangan menjalankan RefreshDatabase pada database lokal bisnis/cloud |
| Password atau cloud credentials bocor | Tidak menyalin isi `.env.local`; prompt privat, hash, tidak ada argumen/log/transcript password |
| Akun mengunci tim keluar | Tidak mengganti APP_KEY/password existing; guard last active Admin existing; uji sesi/revocation di fixture |
| Restart menghentikan layanan lain | Cocokkan PID/executable/port/router proyek; batasi loopback, stop hanya proses milik tugas/proyek |
| Dummy disamarkan menjadi konten nyata | Tidak mengganti label asal foto/attestation secara palsu; tidak mengisi dataset bisnis sintetis |
| Kelulusan test disalahartikan sebagai siap produksi | Pisahkan hasil lokal dari gate konten nyata, recovery SMTP, worker/push/scanner, backup/restore, privasi dan domain/TLS |

Rollout: lokal dahulu; kode melalui branch/PR dari main terbaru. Katalog/lead/CMS
nyata diisi pemilik bisnis lewat UI existing setelah sumber terverifikasi.
Produksi tetap memerlukan gate runbook; `MAIL_MAILER=log`, push belum dikonfigurasi,
dan media lokal tanpa worker/in-request belum memadai untuk klaim operasi penuh.

Rollback: revert commit perbaikan UI/dokumen; tidak direncanakan migration atau
data purge. Matikan hanya probe/helper yang dibuat tugas ini dan kembalikan
launcher lokal bila diperlukan. Untuk akun baru, deaktivasi lewat operasi Admin
existing dengan workload/last-Admin guard; jangan menghapus history/audit atau
menonaktifkan satu-satunya Admin. Backup konsisten diperlukan sebelum perubahan
data existing jika ruang lingkup berikutnya membutuhkannya.
