# Validasi dataset dummy dinamis

2026-10-04 Asia/Jakarta · branch `codex/dynamic-demo-data` · dependensi PR #9. Branch dibuat dari main terbaru `e9ca01a` lalu membawa dependensi dengan fast-forward cherry-pick; main kembali difetch sebelum commit dan tetap bootstrap. Tidak merge, deploy, atau GitHub Actions.

Feature commit `5f04b04` sudah dipush. [PR #10](https://github.com/ariefmavlana/flamboyan-perum/pull/10) open/non-draft, base `codex/operational-acceptance`; commit dokumentasi sesudahnya hanya menambahkan tautan/status PR. Konektor create PR menghasilkan403 insufficient integration permission; jalur GitHub API dengan kredensial Git lokal berhasil. Token tidak dicetak/disimpan dan tidak diperlukan perubahan izin integrasi untuk menyelesaikan PR ini.

## Perubahan dan bukti

Demo satu properti/lead tetap diganti generator Faker/GD pada database kosong. Default24properties/72leads/3Marketing/7CMS/48media. Nama/slug/harga/lokasi/spesifikasi, persona/rate dan ilustrasi dihasilkan baru per database; login alias lokal tetap sebagai pintu akses. Data dipersistenkan, bukan reseed per request. CRM menggunakan `LeadWorkflow`, media menggunakan `MediaOperations`/database queue/worker native. Notifikasi inbox tetap dibangun atomik; push eksternal dimatikan hanya selama seed lalu dipulihkan.

Dataset workspace dibuat pada file SQLite private baru `.tools/dynamic-demo.sqlite`, terpisah dari fixture browser sebelumnya, PHPUnit, load dan restore. Migrasi9schema dan seed default berhasil (seed3,027s). Worker `--stop-when-empty` memproses48media menjadiREADY dan antrean kosong. E2E berikutnya dapat menambah/mengedit lead/property/media/CMS; angka default bukan klaim jumlah akhir setelah CRUD. Private `.env` lokal diarahkan ke database baru; file/password/uploads tidak masuk Git.

Browser `dynamic-demo.spec.ts` mengambil properti dari live API, mengedit judul/harga lewat Admin UI, memeriksa public API/raw SSR, membuka detail, reload, lalu memulihkan nilai asli lewat API dengan versi terbaru. Tidak mengintercept respons katalog/CRM. Pengujian lain mengambil fixture/Marketing/histori dari API aktual agar tidak bergantung judul, slug, harga, lokasi atau catatan seed tertentu. Galeri menonaktifkan kontrol SSR sampai hydrated, mencegah klik yang hilang sebelum handler aktif.

## Pemeriksaan aktual

Runtime Windows11/PHP8.4.26, Node24.21.0, PostgreSQL17.9 cluster terisolasi, Nuxt4.5.2/Nitro2.13.4/Vue3.5.43; Chrome terpasang melalui Playwright. Composer platform8.3 bukan bukti eksekusi8.3/Linux.

| Pemeriksaan | Hasil akhir |
|---|---|
| Pint | Passed |
| PHPUnit SQLite `:memory:` | 71tests/504assertions,5.78s |
| PHPUnit PostgreSQL dedicated test DB | 71tests/504assertions,12.24s |
| Composer validate strict / audit | Valid /0advisory |
| Route cache / clear | Passed |
| ESLint max-warnings0 / Nuxt typecheck | Passed |
| Vitest | 13tests/3files,299ms |
| Production SSR build | Passed; upstreamDEP0155 warning dicatat |
| Playwright | Seluruh13flows pada8spec lulus, tanpa skip; jumlah durasi runner per berkas57.2s, tidak termasuk CLI/cache/startup |
| Source dependency audit | Exit1,11high propagated entries;0moderate/critical |
| Output runtime dependency audit | Exit0,0advisory |

PHPUnit lima kasus baru menguji dataset dan API edit persisten/public allowlist/report, penolakan seed kedua tanpa overwrite, ilustrasi berbeda+native sanitized media, fault-injected late rollback rows/jobs/files dan pemulihan clock/config, konfigurasi/jumlah/password/lingkungan invalid. Production guard tetap diuji oleh suite keamanan. Password seed kini dibaca melalui config demo; konfigurasi test eksplisit tidak tertimpa `.env` private.

## Reproduksi

Perintah backend dari `apps/api` menggunakan PHP runtime yang dipilih:

```sh
php vendor/bin/pint --test
# SQLite: environment DB_CONNECTION=sqlite DB_DATABASE=:memory:
php artisan test --compact
# PostgreSQL: set private env DB_CONNECTION/DB_DATABASE/DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD khusus test
php artisan test --compact
composer validate --strict
composer audit
php artisan route:cache
php artisan route:clear
```

Suite menggunakan `.tools/php/php.exe` dan Composer.phar lokal (ignored), bukan dependency installer repository. PostgreSQL test port54329/database `flamboyan_foundation_test`; password private, tidak ditulis pada argumen atau dokumen. RefreshDatabase tidak menunjuk database demo. Jangan menyalin override database test ke proses API/worker.

Frontend dari `apps/web`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; `npm audit --json`, lalu `npm install --prefix .output/server --package-lock-only --ignore-scripts --no-fund --no-audit` dan `npm audit --prefix .output/server --omit=dev --json`. Audit JSON/lock output disimpan hanya pada ignored artifacts. Source11high tetap gate yang dirinci dependency-security.md; tidak memakai audit suppression atau force downgrade.

Browser: API port8000/database demo khusus, Nuxt dev3000, builtSSR3102, native media worker aktif. Set `DEMO_PASSWORD` private sesuai seed, `PLAYWRIGHT_EXECUTABLE` Chrome jika diperlukan, dan `E2E_PRODUCTION_ORIGIN=http://127.0.0.1:3102`. Jalankan `npx playwright test tests/e2e/<berkas>.spec.ts` untuk seluruh8berkas: acceptance(2), dynamic-demo(1), evaluation(2), foundation(3), media(1), operations(2), realtime(1), supervision(1).

Sebelum setiap berkas, jalankan `php artisan cache:clear` **hanya dengan database/cache fixture khusus yang sama**. Validasi ini mengecek resolved path tepat `.tools/dynamic-demo.sqlite` sebelum loop. Login5/min/internal120/min tetap aktif dalam setiap flow; cache diisolasi antar-flow berkas agar login akun yang sama tidak berbagi counter. Counter aplikasi produksi tidak dibersihkan, rate limit tidak dinaikkan, dan tidak ditambahkan endpoint test. Gunakan jeda60detik sebagai alternatif isolasi. BuiltSSR acceptance benar-benar dieksekusi, bukan diskip.

## Kegagalan yang ditemukan dan batas

Putaran awal gabungan13flows gagal4: klik galeri sebelum hydration dan rate limit yang dibagi antar-skenario (UI429 kemudian login gagal). Sesudah guard gallery dan isolasi cache, test histori masih mengasumsikan catatan penugasan seed ada pada lead yang baru diedit/redacted; assertion diganti actor/count histori dari API. Rerun backend dengan `.env` private menemukan putenv test tidak mengungguli config environment; seeder/config/test diperbaiki, lalu seluruh71tests diulang pada kedua DB. Satu run media terhenti karena bounded worker mencapai max-time; worker diaktifkan kembali, lalu media/operations/realtime/supervision lulus. Hasil gagal tidak diklaim sebagai kelulusan; tabel merekam verifikasi akhir setiap berkas pada kode final.

Provider realtime protocol dan scanner fault tests tetap memakai test doubles untuk kontrak/negative paths, bukan mock dataset runtime. Tidak membuktikan realSMTP/Pusher≤5s/ClamAV, fullWCAG/cross-browser/UAT, hostingHostinger/Rumahweb, domain, content permissions, kebijakan privacy/offsite recovery. Load/restore sebelumnya ada di acceptance-validation.md; tidak mengulang15min load atau mengklaim performa hosting dari perubahan seeder lokal ini.

## Migrasi, risiko dan rollback

Tidak menambah migration, endpoint, response field, dependency, atau breaking change API. Demo hanya local/testing dengan password eksplisit dan domain kosong; counts bounded, gagal late seed rollback, staging private. Attestation CMS demo tidak memverifikasi rate/testimonial nyata; selalu berlabel simulasi dan dilarang pada produksi/staging.

Rollback kode dengan revert commit feature setelah review. Untuk kembali ke dataset lama, hentikan API/worker, pulihkan koneksi/path `.env` private ke database demo sebelumnya, lalu restart seluruh proses; database lama tetap dipertahankan. Tidak menjalankan reseed/migrate:fresh, tidak otomatis menghapus file media, tidak menyentuh database bisnis. Password, fixture DB, upload/runtime/log/screenshot tidak dicommit.
