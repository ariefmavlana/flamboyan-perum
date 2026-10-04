# Deployment demo: Vercel + Supabase + Cloudflare R2

Panduan ini menyiapkan demo publik Flamboyan tanpa VPS: **Nuxt SSR di Vercel**, **Laravel API di Vercel Functions (runtime PHP komunitas)**, **PostgreSQL di Supabase**, dan **media privat di Cloudflare R2**.

Dokumen ini memisahkan **yang sudah diverifikasi** dari **yang belum**. Jangan mengklaim demo siap sebelum checklist di bagian 8 lulus di akun Anda sendiri.

## 1. Ringkasan arsitektur

```text
Pengguna
  │
  ▼
Vercel project "flamboyan-web" (Nuxt SSR, Nitro preset vercel)
  │  ├─ /                → halaman publik SSR
  │  ├─ /login /backoffice/** → staff workspace (SPA, cookie Sanctum)
  │  └─ proxy same-origin (routeRules Nitro): /api/*, /auth/*, /sanctum/*, /media/*, /up
  │                          │
  │  └─ SSR memanggil Laravel langsung via NUXT_API_BASE + signature HMAC
  ▼                          ▼
Vercel project "flamboyan-api" (vercel-php runtime)
  ├─ Supabase Postgres  (data bisnis, session, cache, queue)
  └─ Cloudflare R2      (media privat: staging, varian WebP, brosur)
```

Dua project Vercel yang terpisah (bukan monorepo build) dipilih karena runtime PHP membangun function dari `composer.json` di root project, sehingga `apps/api` harus menjadi root project API.

### Mengapa media tidak ditulis di Vercel

Runtime `vercel-php` yang dipakai **tidak menyediakan ekstensi GD**, dan `config/media.php` mensyaratkan GD (`imagewebp`) untuk membuat varian WebP. ClamAV juga tidak tersedia di function. Karena itu:

- **Pembuatan media (upload → staging → WebP → publikasi) hanya berjalan lokal** memakai Docker yang punya GD.
- **Vercel hanya membaca** media yang sudah ada di R2 melalui endpoint `/media/{id}/{variant}` dan `/api/v1/content/{id}/logo`.

Konsekuensi demo: media yang sudah diproses lokal **tampil normal** di Vercel. Unggahan dari UI diterima (HTTP 201) dalam `PROCESSING`, tetapi tanpa worker akan tetap menunggu. Worker lokal dengan GD dapat menyelesaikan foto/denah. Bila processor dijalankan pada PHP tanpa GD, hasilnya `FAILED`/`IMAGE_PROCESSOR_UNAVAILABLE`; brosur tanpa scanner gagal `SCANNER_UNAVAILABLE`. Staging dipertahankan untuk retry. Perilaku processor tanpa GD dibuktikan lewat uji PHP 8.3, bukan klaim bahwa Vercel otomatis menjalankan job. Katalog, filter, compare, KPR, CRM, histori, notifikasi persisten dan CMS teks tidak memerlukan GD.

## 2. Status verifikasi

| Item | Status | Bukti |
|---|---|---|
| Nitro build preset `vercel` | Terverifikasi | `NITRO_PRESET=vercel npm run build` sukses, menghasilkan `.vercel/output` (fungsi `__fallback.func`) |
| Suite PHP pada `main` | Terverifikasi ulang 2026-10-04 | `php artisan test`: 80 test, 603 assertion, OK pada PHP 8.4.26 + GD (toolchain lokal `.tools/php`) |
| Stack lokal dua server (API 8000, web 3000) | Terverifikasi ulang 2026-10-04 | `/up` 200, `/api/v1/properties` 200, `/properti` dan detail SSR 200, `/media/{id}/640` 200 `image/webp`, login Admin dan Marketing 200 |
| Format kode backend | Terverifikasi | `vendor/bin/pint --test` PASS pada semua file yang diubah |
| Lint/typecheck/unit frontend | Terverifikasi | `npm run lint`, `npm run typecheck`, `npm test` (15 test) lulus |
| Disk `media` beralih ke driver s3 | Terverifikasi | `MEDIA_DISK_DRIVER=s3` memilih driver s3; tanpa adapter muncul error jelas (lihat 3.1) |
| Proxy function meneruskan body multipart | Terverifikasi dari paket | `vercel-php@0.9.0` `dist/launchers/builtin.js` mem-proxy body mentah; hitungan chunk tak berujung sehingga tidak dipotong |
| Perilaku upload tanpa GD | Terverifikasi | Uji perilaku pada PHP 8.3 tanpa GD: `201` lalu `FAILED`/`IMAGE_PROCESSOR_UNAVAILABLE`, staging dipertahankan |
| Perbaikan integritas media bagian 3.0 | Terverifikasi | Regresi baru gagal pada perilaku lama dan lulus pada perilaku baru |
| Proxy same-origin Nitro pada artefak Vercel | Terverifikasi 2026-10-04 | Build `NITRO_PRESET=vercel` lalu jalankan function hasil build melawan API lokal: `/up` 200, `/sanctum/csrf-cookie` 204 + cookie, `/api/v1/properties` 200, `/media/{id}/640` 200 `image/webp`, `POST /auth/login` 200, lalu `/api/v1/me`, `/api/v1/leads`, `/api/v1/notifications`, `/api/v1/realtime` 200 dengan cookie sesi yang sama |
| Guard `NUXT_API_BASE` | Terverifikasi | `VERCEL=1` tanpa `NUXT_API_BASE` menghentikan build dengan pesan eksplisit |
| Argumen Composer runtime Vercel | Terverifikasi dari paket | `vercel-php@0.9.0` `dist/utils.js`: `composer install --profile --no-dev --no-interaction --no-scripts --ignore-platform-reqs` |
| Ekstensi runtime Vercel tanpa `gd` | Terverifikasi dari daftar resmi | `phpshow.vercel.app/ext/` memuat `pdo_pgsql`, `pgsql`, `intl`, `zip`, `sodium`, `OPcache`; `gd` tidak ada |
| Deploy nyata ke Vercel, koneksi Supabase/R2, routing cookie demo | Terverifikasi 2026-10-05 | SSR, media, Admin/Marketing, reload, CRUD harga dan CRM; [bukti dan batas](vercel-demo-validation.md) |
| `SESSION_DOMAIN` pada deployment demo | Terverifikasi host-only | Nilai null, cookie pada host web; login Admin/Marketing bertahan setelah reload |
| Ekstensi `intl`/`pdo_pgsql` pada runtime Vercel | Belum diverifikasi | Daftar ekstensi README runtime menyertakan `pdo_pgsql`/`pgsql`/`sodium`/`intl`/`zip`/`pcntl`/OPcache, `gd` **tidak ada**; konfirmasi dengan `api/phpinfo.php` sementara |

## 3. Batasan yang wajib diterima sebelum mulai

### 3.0 Integritas media: perbaikan yang sudah di `main`

`flamboyan:media-cleanup` sebelumnya mencocokkan direktori `ready/{uuid}` ke kolom `variants` lewat `LIKE` pada teks JSON mentah, sedangkan JSON menulis garis miring sebagai `\/`. Pencocokan itu tidak pernah berhasil. Pengukuran pada fixture demo lokal: dari **134** direktori `ready`, logika lama mengenali **0** sebagai terpakai, sedangkan logika hasil decode mengenali **127**.

Konsekuensinya: menjalankan `flamboyan:media-cleanup --execute` pada perilaku lama akan **menghapus seluruh 134 direktori** setelah masa grace, termasuk 127 direktori yang masih dirujuk media `READY`/`published`. Perbaikan yang mengganti pencocokan teks mentah dengan pencocokan path hasil decode sudah ada di `main` (`7b984bd`, diintegrasikan lewat PR #15/#16).

Yang harus dilakukan:

- Jangan jalankan `flamboyan:media-cleanup --execute` pada versi lama kode ini.
- Setelah memakai versi baru, jalankan tanpa `--execute` lebih dulu dan periksa jumlah *unreferenced* sebelum menghapus apa pun.
- Periksa dampak yang sudah terjadi: bandingkan path varian di `property_media` terhadap berkas yang benar-benar ada. Tidak ada pemulihan otomatis; media yang hilang perlu diproses ulang atau diganti.
- Saat memindahkan fixture demo ke R2, unggah media yang sudah terbukti ada agar bucket dan metadata tetap sinkron.

Catatan investigasi: pada fixture demo pernah ditemukan `media 54` (varian 1920) dan `media 117` (varian 1280) hilang sehingga mengembalikan 404. Direktori keduanya berubah pada `2026-10-04T09:53:35Z` dengan 2 dari 3 berkas tersisa. Penyebabnya **tidak terbukti** dan bukan perintah `media-cleanup` (perintah itu menghapus satu direktori penuh, bukan satu berkas); tidak ada berkas lain di storage yang berubah pada rentang waktu tersebut. Kedua varian sudah diregenerasi dengan pipeline GD yang sama (ukuran dan kualitas identik), dan `flamboyan:media-verify` sekarang melaporkan `381` varian diperiksa dengan `0` objek hilang. Gunakan perintah itu (read-only, exit non-nol bila ada temuan) sebelum demo dan setelah setiap pemulihan/pemindahan storage; perintah ini mengabaikan media yang sudah dipurgasi secara sengaja (`purged_at` terisi) karena objeknya memang sengaja dihapus.

### 3.1 Adapter S3 wajib ada di bundle

`config/filesystems.php` kini memilih driver `s3` dari disk `media` bila `MEDIA_DISK_DRIVER=s3`, dan itu memerlukan `league/flysystem-aws-s3-v3` plus `aws/aws-sdk-php` (±20 MB). Tambahkan sebagai dependensi PHP:

```sh
cd apps/api
composer require league/flysystem-aws-s3-v3:^3.35
```

Runtime `vercel-php` menjalankan `composer install --no-dev --no-scripts --ignore-platform-reqs` saat build, jadi dependency ini otomatis terpasang di function dan `ext-gd` tidak memblokir build (lihat 3.5). Adapter sudah tercatat di Composer lock; jangan commit `vendor/`, sesuai aturan repository.

### 3.2 Cookies staff mengharuskan satu origin

`useStaffApi.ts` memakai cookie `XSRF-TOKEN` dan `credentials: 'include'`. Karena itu halaman login dan seluruh `/backoffice/**` harus menuju API pada **hostname yang sama**, dan `SANCTUM_STATEFUL_DOMAINS` memuat host web tanpa skema. Proxy di bagian 6 tidak opsional untuk fitur staff. `EnsureFrontendRequestsAreStateful` hanya mengenali host web dari header `Origin`/`Referer`, jadi nilai ini harus memuat host web persis (tanpa skema); host `*.vercel.app` yang belum terdaftar membuat login tampak berhasil tetapi sesi tidak dikenali pada request berikutnya.

### 3.3 `DemoSeeder` menolak `APP_ENV=production`

`DemoSeeder::run()` menghentikan proses bila environment bukan `local`/`testing`. Deployment demo ini karena itu memakai `APP_ENV=local` dengan **`APP_DEBUG=false` wajib**. Dengan `APP_ENV=local`, guard `TRUSTED_HOSTS` di `EdgeSecurity` tidak aktif, jadi jangan pakai konfigurasi ini untuk data bisnis. `APP_ENV=local` juga membuat konfigurasi produksi di `OperationalHealth` (`production_configuration`) selalu bernilai benar, sehingga `/ready` hanya mengukur database, storage, dan backlog queue.

### 3.4 Filesystem ephemeral dan tanpa worker

Function Vercel tidak punya disk persisten dan tidak punya proses latar. Karena itu semua state harus di Supabase/R2, `VIEW_COMPILED_PATH` serta cache config/route harus menunjuk `/tmp`, dan README/runbook bagian "Node persisten" tidak berlaku untuk topologi ini (Nitro dijalankan sebagai function, bukan proses Node persisten).

### 3.5 Build Vercel mengabaikan `platform` dan `ext-gd`

Sumber runtime `vercel-php@0.9.0` (`dist/utils.js`) menjalankan Composer dengan argumen tetap:

```text
composer install --profile --no-dev --no-interaction --no-scripts --ignore-platform-reqs
```

Dua implikasi yang tidak boleh diasumsikan sebaliknya:

- `composer.json` mewajibkan `ext-gd` dan mengunci `config.platform.php` ke `8.3.0`, tetapi runtime menjalankan PHP 8.5; `--ignore-platform-reqs` membuat keduanya tidak pernah memblokir build.
- `--no-scripts` berarti hook `post-autoload-dump` (termasuk `artisan package:discover`) **tidak dijalankan saat build**. Berkas tidak boleh bergantung pada penemuan paket di waktu build; provider didaftarkan lewat `bootstrap/providers.php` dan konfigurasi di-cache saat runtime.

Runtime tidak menyediakan ekstensi `gd` (daftar resmi `phpshow.vercel.app/ext/` memuat `pdo_pgsql`, `pgsql`, `intl`, `zip`, `sodium`, `OPcache`, tetapi **tidak ada** `gd`), dan tidak ada ClamAV. Semua derivasi di Langkah 4 mengikuti batas ini.

## 4. Prasyarat

- Akun Vercel (plan Hobby), akun Supabase (plan Free), akun Cloudflare (R2, plan Free).
- Repositori `ariefmavlana/flamboyan-perum` terhubung ke Vercel.
- Docker Desktop (atau runtime kontainer lain) di mesin Anda untuk provisioning data demo, karena function Vercel tidak punya GD.
- Git: gunakan branch PR ini untuk normalisasi entry PHP dan proxy Nitro. Fondasi media/adapter sudah ada pada `main` melalui PR #15/#16; jangan menganggap fix deployment sudah di-merge sebelum PR disetujui.
- Alternatif tanpa kontainer: toolchain PHP lokal yang punya ekstensi `gd`, `pdo_pgsql`, `pgsql`, `sqlite3`, `zip`, `intl` seperti `.tools/php` yang dipakai proyek ini. Ini hanya alat pengujian mesin pembuat, bukan bagian instalasi otomatis ([runbook](runbook.md) bagian prasyarat). Perintah di Langkah 4 dapat dijalankan dengan `php` lokal tersebut alih-alih Docker.

## 5. Perubahan kode yang menyiapkan jalur deploy

Seluruh berkas berikut sudah ada di `main`.

| File | Perubahan |
|---|---|
| [apps/api/api/index.php](../apps/api/api/index.php) | Entry point function PHP (memuat `public/index.php`) |
| [api/index.php](../api/index.php) | Entry point alternatif bila root project Vercel = repository root |
| [apps/api/app/Support/MediaDisk.php](../apps/api/app/Support/MediaDisk.php) | Abstraksi disk media: lokal memakai path langsung, remote menyalin ke berkas sementara |
| [apps/api/app/Http/Controllers/MediaController.php](../apps/api/app/Http/Controllers/MediaController.php) | Memakai `MediaDisk` (sebelumnya `Storage::disk('media')->path()`) |
| [apps/api/app/Http/Controllers/ContentController.php](../apps/api/app/Http/Controllers/ContentController.php) | Idem untuk logo bank |
| [apps/api/app/Services/MediaProcessor.php](../apps/api/app/Services/MediaProcessor.php) | Scanner memakai berkas sementara pada disk remote |
| [apps/api/app/Console/Commands/CleanupMedia.php](../apps/api/app/Console/Commands/CleanupMedia.php) | Pemindaian orphan hanya pada disk lokal, dan pencocokan direktori `ready` memakai path hasil decode (perbaikan kehilangan media) |
| [apps/api/app/Console/Commands/VerifyMedia.php](../apps/api/app/Console/Commands/VerifyMedia.php) | Pemeriksaan integritas media read-only yang dipakai di checklist bagian 8 |
| [apps/api/config/filesystems.php](../apps/api/config/filesystems.php) | Disk `media` dapat memakai driver `s3` via `MEDIA_DISK_DRIVER` |
| [apps/api/config/view.php](../apps/api/config/view.php) | Mem-publish konfigurasi view agar `VIEW_COMPILED_PATH` dapat diarahkan ke `/tmp` |
| [apps/web/vercel.json](../apps/web/vercel.json) | Konfigurasi build Nuxt di Vercel (`NITRO_PRESET=vercel`) |
| [apps/web/nuxt.config.ts](../apps/web/nuxt.config.ts) | `routeRules` proxy same-origin ke `NUXT_API_BASE` saat `VERCEL=1`, plus guard build bila `NUXT_API_BASE` kosong |

Perubahan ini tidak mengubah perilaku default: tanpa `MEDIA_DISK_DRIVER`, disk media tetap `local` dan seluruh suite tetap lulus (`php artisan test`: 80 test, 603 assertion pada `main`).

## 6. Langkah deploy

### Langkah 1 — Supabase (database)

1. Buat project baru, catat regionnya, dan simpan database password.
2. Ambil connection string **Session pooler** (host pooler, port `5432`). Hindari transaction pooler (port `6543`) karena pooled transaction tidak mendukung prepared statement yang dipakai driver PostgreSQL Laravel.
3. Bentuk nilai `DB_URL`:

```text
pgsql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres?sslmode=require
```

Encoding password dengan URL (mis. `@` menjadi `%40`). Jangan menaruh nilai ini di chat, issue, atau dokumen.

Storage Supabase tidak dipakai untuk media karena batas file Free 50 MB dan disk media memakai diskrit `media` tersendiri di R2.

### Langkah 2 — Cloudflare R2 (media)

1. Aktifkan R2, buat bucket privat (mis. `flamboyan-media-demo`). Jangan aktifkan public access.
2. Buat API token R2 dengan izin Object Read & Write untuk bucket tersebut. Catat:
   - `Access Key ID` → `AWS_ACCESS_KEY_ID`
   - `Secret Access Key` → `AWS_SECRET_ACCESS_KEY`
   - Bucket → `AWS_BUCKET`
   - Endpoint `https://<account-id>.r2.cloudflarestorage.com` → `AWS_ENDPOINT`
   - `AWS_DEFAULT_REGION=auto`
   - `AWS_USE_PATH_STYLE_ENDPOINT=false` (R2 memakai virtual-host style pada endpoint tersebut)
3. CORS **tidak diperlukan**: semua berkas diambil melalui Laravel (`/media/...`), bukan langsung dari browser ke R2. Bucket tetap privat.

### Langkah 3 — Project Vercel untuk API

1. **Add New → Project**, pilih repo yang sama.
2. **Root Directory: `apps/api`**. framework preset: **Other**.
3. `apps/api/vercel.json` sudah ada di repo (runtime `vercel-php@0.9.0`, semua route ke `api/index.php`). Verifikasi isinya:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/index.php": {
      "runtime": "vercel-php@0.9.0"
    }
  },
  "routes": [
    { "src": "/(.*)", "dest": "/api/index.php" }
  ]
}
```

4. Environment variables (Production):

| Variabel | Nilai |
|---|---|
| `APP_NAME` | `Flamboyan Perum` |
| `APP_ENV` | `local` (lihat 3.3 — bukan `production`) |
| `APP_DEBUG` | `false` (wajib) |
| `APP_KEY` | hasil `php artisan key:generate --show` (jangan di-regenerate setelah deploy) |
| `APP_URL` | `https://<project-api>.vercel.app` |
| `FRONTEND_URL` | `https://<domain-web>` |
| `LOG_CHANNEL` | `stderr` |
| `VIEW_COMPILED_PATH` | `/tmp/views` |
| `APP_CONFIG_CACHE` | `/tmp/config.php` |
| `APP_ROUTES_CACHE` | `/tmp/routes.php` |
| `APP_EVENTS_CACHE` | `/tmp/events.php` |
| `APP_SERVICES_CACHE` | `/tmp/services.php` |
| `APP_PACKAGES_CACHE` | `/tmp/packages.php` |
| `DB_URL` | connection string Supabase (Langkah 1) |
| `DB_CONNECTION` | `pgsql` |
| `CACHE_STORE` | `database` |
| `SESSION_DRIVER` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `SESSION_SECURE_COOKIE` | `true` |
| `SESSION_SAME_SITE` | `lax` |
| `SANCTUM_STATEFUL_DOMAINS` | host web tanpa skema, mis. `flamboyan-demo.vercel.app` |
| `SESSION_DOMAIN` | **set hanya bila perlu** — biarkan kosong agar host-only; isi host web tanpa skema (mis. `flamboyan-demo.vercel.app`) hanya jika cookie tidak ter-scope dengan benar |
| `MEDIA_DISK_DRIVER` | `s3` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | kredensial R2 |
| `AWS_BUCKET` / `AWS_ENDPOINT` / `AWS_DEFAULT_REGION` | dari Langkah 2 (`auto`) |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `false` |
| `API_PROXY_SECRET` | ≥32 byte acak, **nilai sama** dengan project web |
| `TRUSTED_HOSTS` | `<project-api>.vercel.app` |
| `TRUSTED_PROXY_IPS` | kosong |
| `MEDIA_SCANNER_BINARY` | kosong (brosur gagal tertutup) |
| `REALTIME_ENABLED` | `false`; `true` tanpa kredensial Pusher membuat `/ready` gagal |
| `ANALYTICS_ENABLED` | `false` |

5. Deploy. Setelah selesai, uji `https://<project-api>.vercel.app/up` dan `https://<project-api>.vercel.app/api/v1/properties`.

Deployment nyata membuktikan Symfony menganggap `/api` sebagai mount point karena runtime memanggil `/api/index.php`. Akibatnya `/api/v1/properties` menjadi `/v1/properties` dan 404. Entry `apps/api/api/index.php` kini menormalkan metadata sebelum memuat Laravel:

```php
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
```

Regresi memanggil entry asli dalam proses PHP terpisah dengan metadata runtime Vercel. Kasus prefix API gagal sebelum fix dan lulus setelah fix; auth/media tetap benar. Jangan mengubah URL publik menjadi `/api/api/v1/...` untuk menghindari masalah ini.

### Langkah 4 — Provisioning data demo (dari mesin lokal, butuh GD)

Seluruh perintah di bawah dijalankan dari **root repo** dengan proses yang punya ekstensi GD. Database dan media yang sama dipakai API di Vercel. Pilih salah satu jalur: kontainer dari image `flamboyan-php-test` di bawah, atau PHP lokal yang ekstensinya lengkap (toolchain `.tools/php` proyek ini sudah terbukti menjalankan `migrate`, seed, dan worker pada demo lokal).

```powershell
# 1. Migrasi schema ke Supabase
docker run --rm -e APP_ENV=local -e APP_KEY=<app-key> -e DB_CONNECTION=pgsql `
  -e DB_URL=<db-url> -e MEDIA_DISK_DRIVER=s3 `
  -e AWS_ACCESS_KEY_ID=<r2-key> -e AWS_SECRET_ACCESS_KEY=<r2-secret> `
  -e AWS_BUCKET=<bucket> -e AWS_ENDPOINT=<r2-endpoint> -e AWS_DEFAULT_REGION=auto `
  -v "${PWD}:/app" -w /app/apps/api php:8.3-cli php artisan migrate --force

# 2. Seed demo (password demo >=12 karakter, lewat environment; jangan di argumen)
#    Gunakan image yang punya GD (lihat catatan di bawah).
docker run --rm -e APP_ENV=local -e APP_KEY=<app-key> -e DB_CONNECTION=pgsql `
  -e DB_URL=<db-url> -e MEDIA_DISK_DRIVER=s3 `
  -e AWS_ACCESS_KEY_ID=<r2-key> -e AWS_SECRET_ACCESS_KEY=<r2-secret> `
  -e AWS_BUCKET=<bucket> -e AWS_ENDPOINT=<r2-endpoint> -e AWS_DEFAULT_REGION=auto `
  -e DEMO_PASSWORD=<password-demo-privat> -e DEMO_MEDIA=true `
  -v "${PWD}:/app" -w /app/apps/api flamboyan-php-test `
  php artisan db:seed --class=DemoSeeder

# 3. Proses media yang menunggu di queue (WebP dibuat lokal, ditulis ke R2)
docker run --rm -e APP_ENV=local -e APP_KEY=<app-key> -e DB_CONNECTION=pgsql `
  -e DB_URL=<db-url> -e MEDIA_DISK_DRIVER=s3 `
  -e AWS_ACCESS_KEY_ID=<r2-key> -e AWS_SECRET_ACCESS_KEY=<r2-secret> `
  -e AWS_BUCKET=<bucket> -e AWS_ENDPOINT=<r2-endpoint> -e AWS_DEFAULT_REGION=auto `
  -v "${PWD}:/app" -w /app/apps/api flamboyan-php-test `
  php artisan queue:work database --queue=media --stop-when-empty --tries=3 --timeout=60
```

`flamboyan-php-test` adalah image lokal dengan GD. Ekstensi yang wajib ada agar perintah 1–3 berhasil: `gd` (WebP), `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `curl`, `zip`, `intl`. Buat image berikut, lalu `docker build -t flamboyan-php-test .`. Image contoh ini hanya menambahkan GD di atas basis resmi; sesuaikan bila runtime dasar tidak menyertakan `pdo_pgsql`/`intl`.

```dockerfile
FROM php:8.3-cli
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd \
    && rm -rf /var/lib/apt/lists/*
```

Langkah 2 dan 3 memerlukan `vendor/` lokal (jalankan `composer install` di `apps/api`, atau `docker run ... composer install`) dan akses keluar ke Supabase serta R2.

**Foto kurasi (opsional).** Untuk 72 foto Unsplash terekam di [photo-curation.md](photo-curation.md), jalankan API lokal di Docker (bukan `php artisan serve` tanpa GD) yang menunjuk database dan R2 yang sama, lalu:

```powershell
$env:CURATE_DEMO_PHOTOS="1"; $env:DEMO_PASSWORD="<password-demo-privat>"; node scripts/curate-demo-photos.mjs
```

Script menolak berjalan bila `APP_ENV` bukan local/testing, koneksi bukan SQLite, atau path DB bukan `.tools/dynamic-demo.sqlite`. Karena itu kurasi foto **hanya** dapat dijalankan pada fixture SQLite lokal; setelah selesai, pindahkan `ready/` dan `content-logos/` ke bucket R2 dengan `aws s3 sync` atau rclone. Metadata `variants` menyimpan path `ready/<uuid>/...`, jadi cukup memindahkan struktur objek tanpa mengubah database. Level A (ilustrasi sintetis) tidak memerlukan ini.

**Brosur dan logo bank.** Karena derivasi lokal memakai GD, unggahan BROCHURE dan `POST /api/v1/internal/content/{id}/logo` tetap dapat diproduksi dari mesin lokal selama API lokal menunjuk Supabase dan R2 yang sama. Untuk brosur, `MEDIA_SCANNER_BINARY` harus diarahkan ke ClamAV lokal, karena tanpa itu hasilnya `SCANNER_UNAVAILABLE`. Tidak ada pengganti proses ini di dalam function Vercel.

### Langkah 5 — Project Vercel untuk web

1. **Add New → Project**, repo yang sama, **Root Directory: `apps/web`**, framework preset **Nuxt** (terdeteksi).
2. Environment variables (Production):

| Variabel | Nilai |
|---|---|
| `NUXT_API_BASE` | `https://<project-api>.vercel.app` |
| `NUXT_API_PROXY_SECRET` | nilai **sama** dengan `API_PROXY_SECRET` API |
| `NUXT_TRUSTED_PROXY_IPS` | kosong |
| `NUXT_ALLOWED_HOSTS` | `<domain-web>`, dan tambahkan `<project-web>.vercel.app`; host di luar daftar balas 400 |
| `NUXT_TOUR_HOSTS` | `my.matterport.com` |
| `NUXT_PUBLIC_SITE_URL` | `https://<domain-web>` |
| `NUXT_PUBLIC_WHATSAPP_NUMBER` | nomor demo Anda (digit internasional tanpa `+`) |
| `NUXT_PUBLIC_ANALYTICS_ENABLED` | `false` |

`apps/web/vercel.json` di repo sudah mengeset `NITRO_PRESET=vercel` lewat build env, sehingga output Nitro menjadi function Vercel. `NUXT_API_BASE` wajib terisi pada build Production: build berhenti dengan pesan jelas bila kosong.

### Langkah 6 — Satukan origin untuk cookie staff

Tidak perlu mengedit `vercel.json`. Proxy same-origin sudah dikonfigurasi di [apps/web/nuxt.config.ts](../apps/web/nuxt.config.ts): ketika `VERCEL=1`, `routeRules` mem-proxy `/api/**`, `/auth/**`, `/sanctum/**`, `/media/**`, dan `/up` ke `NUXT_API_BASE` **pada runtime**, sehingga origin tetap milik host web.

Alasan memakai `routeRules`, bukan `rewrites` di `vercel.json`:

- Vercel **tidak melakukan substitusi environment variable** di dalam `vercel.json`. Menulis `https://<project-api>.vercel.app` secara literal akan mengirim permintaan ke host yang tidak ada.
- Proxy Nitro berjalan sebelum SSR, jadi permintaan browser maupun permintaan SSR internal tetap sampai ke Laravel, sekaligus menjaga cookie Sanctum tetap ter-scope ke host web.

Build gagal lebih awal bila salah konfigurasi: dengan `VERCEL=1` dan `NUXT_API_BASE` kosong, build berhenti dengan pesan `NUXT_API_BASE wajib diset pada build Vercel agar proxy same-origin berfungsi.`

Konsekuensi yang sudah diuji pada artefak build `NITRO_PRESET=vercel` (bukan asumsi):

| Uji | Hasil |
|---|---|
| `GET /up` melalui proxy | 200 |
| `GET /sanctum/csrf-cookie` | 204 dan cookie `XSRF-TOKEN` |
| `GET /api/v1/properties` | 200, JSON data demo |
| `GET /media/{id}/640` | 200 `image/webp` |
| `POST /auth/login` (Origin/Referer host web) | 200 |
| Cookie hasil login | `laravel-session` ter-set di host web |
| `GET /api/v1/me`, `/api/v1/leads`, `/api/v1/notifications`, `/api/v1/realtime` dengan cookie itu | 200 |

Cookie host-only sudah teruji pada deployment nyata: browser mengakses semua route staff melalui `flamboyan-web.vercel.app`, sementara Nitro menghubungkan API. Admin dan Marketing bertahan setelah reload. Jika origin berubah, perbarui allowlist Sanctum/host dan build ulang web karena tujuan proxy ditentukan saat build.

Catatan: `/login` dan `/backoffice/**` di-render SPA (`ssr: false`) dan CSP memakai nonce per respons dari [apps/web/server/plugins/security.ts](../apps/web/server/plugins/security.ts). Bila halaman login tampak kosong di deployment, itu indikasi CSP/routeRules, bukan kegagalan backend.

### Langkah 7 — Deploy ulang dan uji

Deploy ulang project web setelah `NUXT_API_BASE` terisi, lalu verifikasi dengan checklist bagian 8.

## 7. Rollback

1. Di Vercel, **Promote to Production** deployment sebelumnya pada masing-masing project (web dan API). Keduanya harus di-rollback bersamaan karena kontrak `/api/v1` dan secret proxy berpasangan.
2. Tidak ada migrasi baru pada PR ini, jadi tidak ada rollback schema.
3. Untuk menghentikan akses publik, nonaktifkan deployment web dan API. API mempunyai alias publik sendiri; menghapus domain web saja tidak mematikan API.
4. Data demo di Supabase/R2 bersifat sekali pakai: hapus project Supabase dan bucket R2 bila demo berakhir.

## 8. Checklist verifikasi demo

Semua item harus dibuktikan di deployment nyata sebelum demo dibagikan:

- [ ] `GET /up` pada project **API** mengembalikan 200, dan `GET /ready` mengembalikan 200 (readiness menulis dan menghapus objek uji di R2; 503 berarti kredensial atau bucket salah).
- [ ] `GET /api/v1/properties` (melalui host web) mengembalikan daftar properti demo — membuktikan proxy `routeRules` aktif.
- [ ] Beranda dan `/properti` merender SSR (lihat HTML sumber, bukan hanya setelah hydration).
- [ ] Detail properti menampilkan foto dari R2 (`/media/{id}/640` mengembalikan `image/webp`).
- [ ] `/konsultasi` menampilkan kontak/link WhatsApp; lead dicatat manual oleh Admin, sesuai kontrak. Klik WhatsApp tidak otomatis membuat lead.
- [ ] `GET /sanctum/csrf-cookie` men-set cookie pada host web; `POST /auth/login` dengan `admin@example.test` berhasil dan `/backoffice` dapat dibuka lalu bertahan setelah reload.
- [ ] Perubahan data (mis. ubah harga properti) terlihat setelah reload halaman publik (membuktikan Supabase, bukan cache).
- [ ] `APP_DEBUG=false` terbukti: memicu 404/500 tidak menampilkan stack trace.
- [ ] Galeri detail, compare, simulasi KPR, laporan CRM, dan lonceng notifikasi dapat dibuka; lonceng menampilkan status sinkronisasi berkala (realtime nonaktif).
- [ ] `php artisan flamboyan:media-verify` melaporkan `0` objek hilang (read-only; exit non-nol bila ada temuan). Jalankan sebelum demo dan setelah memindahkan storage ke R2.
- [ ] Ekstensi runtime terkonfirmasi lewat `api/phpinfo.php` sementara (`pdo_pgsql`, `pgsql`, `sodium`, `mbstring`, `openssl`, `curl`) dan `gd` **tidak ada**, lalu **hapus berkas tersebut**.
- [ ] Batas media terdokumentasi: unggahan UI menunggu worker lokal; processor tanpa GD/scanner gagal tertutup. Logo bank memerlukan GD. Jangan menyatakan job cloud otomatis selesai.
- [ ] Tidak ada kredensial di repo: `git status` bersih dari `.env`, kunci R2, dan `DB_URL`.

## 9. Kuota gratis yang perlu dipantau

| Layanan | Batas Free (per 2026-10) | Risiko pada demo ini |
|---|---|---|
| Vercel Hobby | 4 CPU-hours aktif, 100 GB Fast Data Transfer, 1 juta CDN request, 100 cron/project | SSR function per request; pantau pemakaian CPU |
| Supabase Free | DB 500 MB, egress 5 GB, 1 GB file storage, project **di-pause setelah 1 minggu tanpa aktivitas**, maksimal 2 project aktif | Demo yang lama tidak dibuka akan pause dan gagal saat pertama diakses |
| Cloudflare R2 | 10 GB storage, 1 juta Class A, 10 juta Class B, egress gratis | Cukup besar untuk 72 foto dan varian WebP |
| Vercel Functions duration | Hobby hingga 60 detik | Provokasi cukup untuk halaman publik dan mutasi CRM |

Kuota platform berubah cepat; verifikasi di dashboard masing-masing saat mendaftar.

## 10. Yang belum boleh diklaim

Demo ini **bukan** deployment produksi. Gate produksi di [runbook.md](runbook.md) tetap tidak terpenuhi: tidak ada backup terjadwal dan termonitor, tidak ada scanner malware aktif, tidak ada proses persisten untuk worker, `APP_ENV` bukan `production`, tidak ada eksekusi `flamboyan:media-cleanup --execute` terjadwal, dan data demo bukan data bisnis. Gunakan hanya untuk tujuan demo/portofolio, dengan data sintetis, dan tanpa kredensial atau data pribadi nyata.
