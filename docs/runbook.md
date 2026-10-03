# Runbook development dan shared hosting

## Prasyarat

PHP8.3+ (extensions ctype,curl,dom,fileinfo,filter,hash,mbstring,openssl,pcre,pdo,session,tokenizer,xml,sqlite atau pgsql), Composer2, Node24.11+ LTS dan npm. Fondasi menggunakan Nuxt4.5.2/Laravel13; versi transitive ditentukan lockfiles dan PHP platform8.3 pada composer.json. Runtime lokal `.tools` hanya alat pengujian di mesin pembuat, tidak bagian repository/installer otomatis.

## Setup lokal

Backend dari `apps/api`:

```sh
composer install
cp .env.example .env
php artisan key:generate
# Buat database/database.sqlite kosong bila belum tersedia, di luar public/.
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate
php artisan flamboyan:create-user
php artisan serve --host=127.0.0.1 --port=8000
```

CLI provisioning meminta nama/email/role dan secret password/konfirmasi secara interaktif; tidak menyediakan registrasi publik. Untuk demo opt-in saja, set `DEMO_PASSWORD` ≥12 karakter pada environment atau `.env` lokal lalu `php artisan db:seed --class=DemoSeeder`. Demo akun `admin@example.test`/`marketing@example.test`; password hanya yang Anda berikan. Seed default tidak membuat account. Demo dilarang production/staging. Jangan menjalankan seed demo pada database bisnis.

Frontend dari `apps/web`:

```sh
npm ci
cp .env.example .env
npm run dev
```

Buka `http://127.0.0.1:3000`. Default Nitro devProxy private routes mengarah ke127.0.0.1:8000; public proxy memakai NUXT_API_BASE. Jika port/host backend berbeda, ubah devProxy config dan env sesuai. `NUXT_PUBLIC_SITE_URL` untuk canonical harus memakai origin frontend sebenarnya. `NUXT_PUBLIC_WHATSAPP_NUMBER` tanpa `+`; kosong menyembunyikan CTA. Default tidak berisi nomor/konten produksi. Sanctum local stateful domain mengizinkan localhost:3000 dan127.0.0.1:3000. `.env` production private APP_DEBUG=false, SESSION_SECURE_COOKIE=true, exact stateful domains, valid APP_URL/frontend URL.

## Validasi

Semua pemeriksaan dijalankan lokal sebelum review PR; GitHub Actions tidak digunakan. Catat tanggal, commit, versi PHP/Node/database, perintah dan hasil pada PR. Validasi runtime deployment yang dipilih sebelum produksi; hasil Windows/PHP8.4 tidak membuktikan PHP8.3/Linux.

```sh
# apps/api
vendor/bin/pint --test
php artisan test
composer validate --strict
composer audit
# apps/web
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

PHPUnit default menggunakan SQLite `:memory:`. Untuk PostgreSQL, buat database test khusus dan kredensial private, lalu set `DB_CONNECTION=pgsql`, `DB_DATABASE=<database-test>`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, dan `DB_PASSWORD` pada environment proses shell sebelum `php artisan test`. Nilai environment tersebut mengungguli default phpunit.xml. Gunakan nama database yang berbeda dari development/demo/bisnis: `RefreshDatabase` dapat menghapus dan membuat ulang tabel. Jangan menjalankan suite terhadap database produksi atau database development yang ingin dipertahankan. Jalankan suite pada kedua driver, catat versi database dan hasil; tutup cluster pengujian sementara setelah selesai. Konfigurasi test tidak di-commit.

Playwright: backend local+DemoSeeder seeded harus berjalan, DEMO_PASSWORD environment sesuai seed, `npx playwright install chromium` lalu `npm run test:e2e`; config menjalankan/reuse frontend dev server. Windows boleh set PLAYWRIGHT_EXECUTABLE ke browser Chrome terpasang untuk local test. Test CRM menambahkan note pada demo lead, sehingga jangan menunjuk database produksi. Unit frontend tidak memuat Playwright specs.

Audit artefak setelah build, dari `apps/web`:

```sh
npm install --prefix .output/server --package-lock-only --ignore-scripts --no-fund --no-audit
npm audit --prefix .output/server --omit=dev
```

Lock audit hanya dibuat pada `.output` yang diabaikan Git. Audit source (`npm audit --omit=dev`) dan runtime dilaporkan terpisah; audit runtime bersih tidak menghapus temuan source. Kegagalan audit harus dicatat dan ditinjau sebelum produksi, bukan disembunyikan atau dilewati.

## Gate hosting dan rilis

Pemilik hosting harus membuktikan PHP/extensions, private deploy/config path, Composer atau uploaded vendor artifact, Node24 process persisten+restart+routing HTTPS, DB PostgreSQL atau SQLite private persistent disk, cron permenit, media shared storage, resource quota, outbound push dan log/backup access. SSR HTML diuji pada domain produksi. Paket tanpa Node persisten tidak lulus; jangan mengganti menjadi SPA tanpa revisi requirement.

Routing produksi: `/api/*`,`/auth/*`,`/sanctum/*`,`/up` ke Laravel public/index.php; lainnya Nuxt Node SSR. `/login` adalah halaman Nuxt. Static `_nuxt` boleh CDN setelah privacy/cache policy; protected API/HTML tidak di-cache. Public API+SSR same-origin; Node dapat memakai private backend URL. Host-provided Apache/LiteSpeed/Passenger routing disesuaikan paket dan diuji; tidak menyediakan file server palsu sebelum stack hosting diketahui.

Urutan release: (1) review bukti validasi lokal+security+scope+content/privacy, (2) consistent encrypted database+media backup dan checksum, (3) upload release terpisah dari persistent storage/.env, (4) composer install --no-dev --prefer-dist --optimize-autoloader, build Nuxt di mesin build terkontrol, (5) maintenance bila schema perlu, (6) php artisan migrate --force, config:cache, route:cache, (7) restart Node/PHP/worker sesuai hosting, (8) smoke SSR/public/login/scoped mutation/history, (9) cek persistence dan monitoring, (10) akhiri maintenance setelah sehat. APP_KEY tidak di-regenerate pada deploy.

Backup sebelum setiap migrasi plus daily; remote encrypted retention7 daily/4 weekly/3 monthly. PostgreSQL gunakan consistent pg_dump dan restore ke isolated DB; SQLite gunakan native backup API/online backup atau maintenance checkpoint terkoordinasi. Jangan copy live `.sqlite` sendirian saat WAL/journal aktif. Backup media manifest+checksum menyertai database; simpan konfigurasi recovery/key secara private dan terpisah. RPO24h/RTO8h adalah target usulan yang harus dibuktikan, bukan SLA hosting saat ini.

Restore drill triwulanan: provision isolated target, recover secrets securely, restore DB+media snapshot kompatibel, cek counts/FK/history/media checksum, jalankan smoke tanpa push/WA bisnis, ukur durasi, catat evidence dan hapus PII drill melalui operasi terkontrol. Tidak menjalankan restore ke produksi otomatis dari pipeline.

Rollback: gunakan artefak commit sebelumnya hanya jika schema compatible; jangan blind `migrate:rollback` pada data aktif. Jika migrasi destruktif, gunakan maintenance + restore snapshot konsisten yang telah diuji, communicate data-loss sesuai RPO, lalu verifikasi. F0 migration awal hanya pada DB kosong; rollback menghapus tabel domain dan seluruh datanya, sehingga tidak boleh dijalankan pada instalasi bisnis tanpa backup.

## Operasi dan evolusi

Cron schedule:run permenit; queued push/media F1 membutuhkan managed worker atau bounded cron queue:work dengan lock overlap. Push target≤5s membutuhkan worker persisten; cron-only interval60s tidak memenuhi itu. Monitor liveness `/up`, target readiness DB/storage/queue sebelum produksi, alert5xx>1%/5min, queue backlog>5min, missed backup>26h. Logs request_id/status/latency tanpa password/phone/body CRM. Retention dan alert channels disetujui owner sebelum go-live.

Production database PostgreSQL lebih disukai; uji suite lokal+load nyata pada runtime deployment yang dipilih. SQLite hanya satu instalasi ringan; migrasikan saat kebutuhan multi-instance, lock-contention/latency atau kuota terlampaui. F0 tidak mempunyai push provider, media uploads, account recovery atau reports lengkap; status file menjadi checklist release. Dependency advisory terpisah di `dependency-security.md` wajib ditangani/review sebelum production approval.
