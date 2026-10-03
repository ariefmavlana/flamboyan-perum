# Runbook development dan shared hosting

## Prasyarat

PHP8.3+ (extensions ctype,curl,dom,fileinfo,filter,hash,mbstring,openssl,pcre,pdo,session,tokenizer,xml,gd dengan JPEG/PNG/WebP,sqlite atau pgsql), Composer2, Node24.11+ LTS dan npm. Fondasi menggunakan Nuxt4.5.2/Laravel13; versi transitive ditentukan lockfiles dan PHP platform8.3 pada composer.json. Runtime lokal `.tools` hanya alat pengujian di mesin pembuat, tidak bagian repository/installer otomatis.

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

Buka `http://127.0.0.1:3000`. Default Nitro devProxy private routes mengarah ke127.0.0.1:8000; public proxy memakai NUXT_API_BASE. Jika port/host backend berbeda, ubah devProxy config dan env sesuai. `NUXT_PUBLIC_SITE_URL` untuk canonical harus memakai origin frontend sebenarnya. `NUXT_PUBLIC_WHATSAPP_NUMBER` tanpa `+`; kosong menyembunyikan CTA. Default nomor sementara pengguna 6287776734038; konten properti nyata tetap perlu diisi dan diverifikasi. Sanctum local stateful domain mengizinkan localhost:3000 dan127.0.0.1:3000. `.env` production private APP_DEBUG=false, SESSION_SECURE_COOKIE=true, exact stateful domains, valid APP_URL/frontend URL.

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
npm run audit:source
```

PHPUnit default menggunakan SQLite `:memory:`. Untuk PostgreSQL, buat database test khusus dan kredensial private, lalu set `DB_CONNECTION=pgsql`, `DB_DATABASE=<database-test>`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, dan `DB_PASSWORD` pada environment proses shell sebelum `php artisan test`. Nilai environment tersebut mengungguli default phpunit.xml. Gunakan nama database yang berbeda dari development/demo/bisnis: `RefreshDatabase` dapat menghapus dan membuat ulang tabel. Jangan menjalankan suite terhadap database produksi atau database development yang ingin dipertahankan. Jalankan suite pada kedua driver, catat versi database dan hasil; tutup cluster pengujian sementara setelah selesai. Konfigurasi test tidak di-commit.

Playwright: backend local+DemoSeeder seeded harus berjalan, DEMO_PASSWORD environment sesuai seed, `npx playwright install chromium` lalu `npm run test:e2e`; config menjalankan/reuse frontend dev server. Windows boleh set PLAYWRIGHT_EXECUTABLE ke browser Chrome terpasang untuk local test. Test CRM menambahkan note pada demo lead, sehingga jangan menunjuk database produksi. Unit frontend tidak memuat Playwright specs. Bila database fixture/backend diatur melalui environment proses shell, jalankan `php artisan serve --no-reload --host=127.0.0.1 --port=8000`: mode reload Laravel dapat membuang override environment dan membaca ulang `.env`, sehingga seed dan server menunjuk database berbeda.

Audit artefak setelah build, dari `apps/web`:

```sh
npm install --prefix .output/server --package-lock-only --ignore-scripts --no-fund --no-audit
npm run audit:runtime
```

Lock audit hanya dibuat pada `.output` yang diabaikan Git. Audit source (`npm run audit:source`, seluruh dependency termasuk devDependencies) dan runtime dilaporkan terpisah; audit runtime bersih tidak menghapus temuan source. Kegagalan audit harus dicatat dan ditinjau sebelum produksi, bukan disembunyikan atau dilewati. Audit dengan `--omit=dev` pada source saja tidak cukup karena dapat melewatkan kerentanan test tooling.

## Gate hosting dan rilis

Pemilik hosting harus membuktikan PHP/extensions, private deploy/config path, Composer atau uploaded vendor artifact, Node24 process persisten+restart+routing HTTPS, DB PostgreSQL atau SQLite private persistent disk, cron permenit, media shared storage, resource quota, outbound push dan log/backup access. SSR HTML diuji pada domain produksi. Paket tanpa Node persisten tidak lulus; jangan mengganti menjadi SPA tanpa revisi requirement.

Routing produksi: `/api/*`,`/auth/*`,`/sanctum/*`,`/media/*`,`/up` ke Laravel public/index.php; lainnya Nuxt Node SSR. `/login` adalah halaman Nuxt. Static `_nuxt` boleh CDN setelah privacy/cache policy; protected API/HTML tidak di-cache. Public API+SSR same-origin; Node dapat memakai private backend URL. Host-provided Apache/LiteSpeed/Passenger routing disesuaikan paket dan diuji; tidak menyediakan file server palsu sebelum stack hosting diketahui.

Urutan release: (1) review bukti validasi lokal+security+scope+content/privacy, (2) consistent encrypted database+media backup dan checksum, (3) upload release terpisah dari persistent storage/.env, (4) composer install --no-dev --prefer-dist --optimize-autoloader, build Nuxt di mesin build terkontrol, (5) maintenance bila schema perlu, (6) php artisan migrate --force, config:cache, route:cache, (7) restart Node/PHP/worker sesuai hosting, (8) smoke SSR/public/login/scoped mutation/history, (9) cek persistence dan monitoring, (10) akhiri maintenance setelah sehat. APP_KEY tidak di-regenerate pada deploy.

Backup sebelum setiap migrasi plus daily; remote encrypted retention7 daily/4 weekly/3 monthly. PostgreSQL gunakan consistent pg_dump dan restore ke isolated DB; SQLite gunakan native backup API/online backup atau maintenance checkpoint terkoordinasi. Jangan copy live `.sqlite` sendirian saat WAL/journal aktif. Backup media manifest+checksum menyertai database; simpan konfigurasi recovery/key secara private dan terpisah. RPO24h/RTO8h adalah target usulan yang harus dibuktikan, bukan SLA hosting saat ini.

Restore drill triwulanan: provision isolated target, recover secrets securely, restore DB+media snapshot kompatibel, cek counts/FK/history/media checksum, jalankan smoke tanpa push/WA bisnis, ukur durasi, catat evidence dan hapus PII drill melalui operasi terkontrol. Tidak menjalankan restore ke produksi otomatis dari pipeline.

Rollback: gunakan artefak commit sebelumnya hanya jika schema compatible; jangan blind `migrate:rollback` pada data aktif. Jika migrasi destruktif, gunakan maintenance + restore snapshot konsisten yang telah diuji, communicate data-loss sesuai RPO, lalu verifikasi. F0 migration awal hanya pada DB kosong; rollback menghapus tabel domain dan seluruh datanya, sehingga tidak boleh dijalankan pada instalasi bisnis tanpa backup.

## Operasi dan evolusi

Cron schedule:run permenit; queued push/media F1 membutuhkan managed worker atau bounded cron queue:work dengan lock overlap. Push target≤5s membutuhkan worker persisten; cron-only interval60s tidak memenuhi itu. Monitor liveness `/up`, target readiness DB/storage/queue sebelum produksi, alert5xx>1%/5min, queue backlog>5min, missed backup>26h. Logs request_id/status/latency tanpa password/phone/body CRM. Retention dan alert channels disetujui owner sebelum go-live.

Production database PostgreSQL lebih disukai; uji suite lokal+load nyata pada runtime deployment yang dipilih. SQLite hanya satu instalasi ringan; migrasikan saat kebutuhan multi-instance, lock-contention/latency atau kuota terlampaui. Media private/queue/gallery tersedia; push provider dan reports masih mengikuti status implementasi; recovery akun tersedia dan pengiriman SMTP produksi masih membutuhkan konfigurasi serta verifikasi; status file menjadi checklist release. Dependency advisory terpisah di `dependency-security.md` wajib ditangani/review sebelum production approval.

## Workspace akun dan pemulihan

Set FRONTEND_URL ke origin frontend trusted; konfigurasi SMTP private dan verifikasi pengiriman recovery pada akun test sebelum go-live. Admin menandai identity_verified hanya setelah memeriksa identitas melalui prosedur tim. Broker token berlaku60 menit dan sekali pakai; tautan menggunakan no-referrer/no-store/noindex. CLI bootstrap juga meminta attestation identitas, default tidak terverifikasi. Nomor sementara pengguna6287776734038 boleh dikosongkan melalui NUXT_PUBLIC_WHATSAPP_NUMBER agar CTA disembunyikan.

Sebelum migration operasi, periksa duplikasi case-insensitive email secara privat dan selesaikan secara manual tanpa menghapus histori. Preflight migration menolak duplikasi sebelum perubahan schema. Backup konsisten wajib; audit tidak dihapus melalui API. Demotion/deactivation Marketing diblokir bila masih memiliki katalog non-ARCHIVED atau assigned lead nonterminal; transfer/archive dan reassign/resolve dahulu. Admin aktif terakhir tidak dapat dicabut. Detail migrasi/rollback ada di operations-validation.md.

## Operasi media private

Aktifkan GD JPEG/PNG/WebP; set upload_max_filesize≥10M dan post_max_size≥12M pada PHP serta batas proxy yang selaras. Persistent storage/app/media-private harus berada di luar web root, dapat ditulis API/worker, dan disertakan backup. Jangan storage:link disk media. Production `/media/*` diarahkan ke Laravel, karena handler memeriksa publication dan state pada setiap request.

Jalankan worker database `php artisan queue:work database --queue=media --sleep=1 --tries=3 --timeout=60` terkelola; restart setelah deploy. Jika hanya tersedia cron, gunakan bounded worker --stop-when-empty --max-time=50 dengan lock overlap hosting. Uji memory/timeout untuk batas40MP; target awal worker512MiB belum membuktikan kapasitas paket. Sumber tetap private; hanya variants WebP READY dan published dapat dilihat publik. YouTube/tour memerlukan consent dan tour HTTPS host terdaftar pada MEDIA_TOUR_HOSTS.

Set MEDIA_SCANNER_BINARY absolute path engine clamscan maintained dengan signatures freshclam. Brosur gagal tertutup bila scanner tidak tersedia; jangan publish sebelum clean/unsafe/encrypted/limit fixture diuji pada hosting. Perintah aplikasi dan batas scanner ada di media-validation.md. Bukan cukup hanya memeriksa binary ada.

Pantau media FAILED/PROCESSING>15 menit dan failed_jobs. `php artisan flamboyan:media-recover` dry-run; --execute setelah masalah worker diperbaiki. Retry FAILED melalui UI versioned. `php artisan flamboyan:media-cleanup` dry-run; --execute hanya setelah backup DB+media konsisten/checksum terverifikasi, grace30 hari. Tidak menghapus registry/audit. Test menggunakan Storagefake dan browser demo terisolasi.

Untuk reproduksi browser media, siapkan JPEG uji milik sendiri pada path private dan set E2E_MEDIA_FILE ke absolute path tersebut; default repository test adalah `.tools/browser-photo.jpg`, fixture lokal yang tidak di-commit. Worker media dan API harus menunjuk DB demo yang sama. Jangan memakai konten/DB bisnis untuk suite.
## Editorial, evaluasi, dan SEO

Admin mengelola Konten publik: HERO/TESTIMONIAL/BANK_RATE. Setiap publish membutuhkan attestation sumber/kebenaran/izin baru; rate expired/future tidak muncul publik. Hero pertama posisi/ID, gambar hanya sanitized cover dari properti published. Bank references bukan bukti kemitraan; jangan mengisi testimonial/rate/POI fiktif untuk menghilangkan empty state. Lokasi/POI melalui editor properti scoped/versioned, ≤20 dengan sumber HTTPS/tanggal/jarak meter. Embed OpenStreetMap consent/lazy menyertakan attribution provider; verifikasi terms/access jaringan hosting dan mobile serta alternatif external link sebelum rilis.

Pastikan NUXT_PUBLIC_SITE_URL origin domain canonical yang benar. Routing /robots.txt,/sitemap.xml,/sitemaps/* ke Nuxt; API /api/v1/sitemap ke Laravel. Submit root index ke Search Console, verifikasi canonical/published-only/page scope/lastmod pada domain asli. JSON-LD faktual tidak menjamin rich result. Compare IDs lokal saja; KPR estimasi manual/fixed-floating bukan penawaran bank. Migration000004 additive: backup konsisten dahulu, rollback kode media dengan schema dipertahankan; detail/bukti di evaluation-validation.md.
## Operasi notifikasi privat

Default REALTIME_ENABLED=false memakai persisted inbox+poll60s. Untuk push set REALTIME_ENABLED=true, PUSHER_APP_ID/PUSHER_APP_KEY/PUSHER_APP_SECRET/PUSHER_APP_CLUSTER pada private environment API. Jangan commit nilai credential. Echo mengambil key publik melalui API authenticated; app secret tidak ke browser. Production CSP/connect-src dan jaringan harus mengizinkan ws-{cluster}.pusher.com TLS; frontend same-origin auth memakai CSRF.

Worker persisten `php artisan queue:work database --queue=notifications,media --sleep=1 --tries=3 --timeout=60` atau pisahkan queue notifications timeout15 agar media berat tidak menghambat push. Target≤5s membutuhkan worker dedicated. Database queue wajib koneksi DB aplikasi. Restart worker setelah deploy. Pantau failed_jobs dan oldest job age>5min; signed URL/secret tidak berada dalam exception delivery. Perbaiki provider/worker lalu `php artisan flamboyan:notifications-recover` (dry-run); --execute hanya requeue unsent usia30s..24h, skip pending queue. Inbox lebih lama tetap tersedia; jangan replay seluruh riwayat ke provider. At-least-once berarti event bisa duplikat; client dedup/reconciliation bukan exactly-once.

Migration000005 additive push_sent_at+index, backup dahulu. Rollback kode ke evaluasi aman bila kolom dipertahankan; nonaktifkan push/stop worker notifications dan pertahankan inbox. Jangan destructive rollback aktif. Uji provider real, receipt≤5s, deactivation/disconnection/reconnect dan provider outage pada akun test sebelum go-live; belum tersedia credentials/hosting untuk evidence itu.
