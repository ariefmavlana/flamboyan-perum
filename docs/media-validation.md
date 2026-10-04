# Validasi dan operasi media

2026-10-03 · `codex/property-media`, dependensi [PR #4](https://github.com/ariefmavlana/flamboyan-perum/pull/4) workspace operasi +PR #3 fondasi. Branch baru dari fetched main, dependency range fast-forward cherry-pick; tanpa merge/Actions.

| Check lokal | Hasil | Batas |
|---|---|---|
| PHP8.4.26/Pint | passed | GD bundled mendukung JPEG/PNG/WebP; Composer ext-gd required |
| PHPUnit SQLite |43 tests /252 assertions passed | Seluruh fondasi/operasi +11 media tests |
| PHPUnit PostgreSQL17.9 |43 tests /252 assertions passed | DB test isolated127.0.0.1:54329 |
| Composer validate --strict/audit | valid /0 advisories | Audit sempat warning repo.packagist timeout, cache fallback; Composer update lock sebelumnya online0; rerun audit online0 tanpa warning +MediaTest11/85 dan Pint passed, bukan bukti hosting/runtimePHP8.3 |
| route:cache/clear | passed | Media auth/file routes |
| ESLint/typecheck/Vitest |0 warnings /passed /5 passed | Node24.21.0/Nuxt4.5.2 |
| SSR build | passed | Warning upstreamDEP0155 tetap tercatat |
| PlaywrightChrome |6 flows passed48.5s | Seluruh fondasi/operasi +real queue worker media/SSR/private preview/archive404 |
| Source/runtime audit |11 high source /0 runtime | Dua root advisories tetap gate; source includes devDependencies |

Red→green: empat test awal404 sebelum routes/schema/pipeline; kemudian lulus. Fault injection enqueue memperlihatkan cache unique-lock tertinggal sesudah rollback dan menghentikan job retry; unique-lock dihapus, durable jobs + processor state guard mempertahankan atomicity/idempotence. Pengujian membuktikan version/media/audit/job rollback dan staging removal saat enqueue/audit gagal, retry berhasil; metadata EXIF marker tidak terdapat pada WebP; duplicate processing tidak mengganti variants; private/draft/archive404; MIME/signature/spoofedSVG/size checks; scanner unavailable+unsafe menolak, clean contract attachment; pagination/20-photo cap; recover explicit dan cleanup dry-run/grace30 hari.

Browser memakai isolated SQLite fixture, API --no-reload, private DEMO_PASSWORD, .tools/browser-photo.jpg generated GD test image dan worker `queue:work database --queue=media --sleep=1 --tries=3 --timeout=60 --max-time=180`. Worker nyata memproses gambar sekitar142ms pada fixture kecil; bukan benchmark40MP/SLO. HTML SSR mencakup gallery alt tanpa identitas Marketing; file WebP/nosniff, preview modal/Escape, archiveURL404. Semua uploaded fixture/media/runtime ignored; bukan konten properti produksi.

## Runtime dan keamanan

GD extension wajib dengan JPEG/PNG/WebP, private persistent local media storage di storage/app/media-private; jangan storage:link disk media. PHP/web proxy upload_max_filesize≥10M/post_max_size≥12M dan body timeout/bounds selaras. Worker memory512MiB awal dan kapasitas hosting perlu diuji untuk40MP; job timeout60, queue retry_after90. Queue media selalu database pada koneksi DB aplikasi yang sama, sehingga job terlihat setelah commit dan enqueue failure dapat rollback row/audit/version. PROCESSING/FAILED belum public; source filename tidak dipakai. Poll10s hanya saat pemrosesan dan berhenti ketika komponen unmount; polling tidak menghapus alt/position/published edit yang belum disimpan.

Brochure memakai trusted MEDIA_SCANNER_BINARY absolute path clamscan, parameter array tanpa shell, PDF/archive scanning, bounded12M/32M, encrypted/exceeds-limit alerts dan45s process timeout. Error/timeout/binary missing→SCANNER_UNAVAILABLE; infected/limit/encryption alert→UNSAFE_FILE; hanya exit0→READY. Gunakan engine maintained+signatures freshclam, validasi clean PDF/EICAR/oversized encrypted fixture di runtime hosting sebelum produksi. Test scanner mocked membuktikan aplikasi fail-closed/attachment, bukan efektivitas antivirus atau parser PDF. Tidak memasang scanner palsu/fallback unscanned. PDF selalu attachment,nosniff,CSP sandbox/no-store; iframe brosur tidak tersedia.

Referensi primary: [PHP GD decoding](https://www.php.net/manual/en/function.imagecreatefromstring.php), [Laravel queue transactions](https://laravel.com/docs/13.x/queues#jobs-and-database-transactions), [ClamAV scanning](https://docs.clamav.net/manual/Usage/Scanning.html), [ClamAV CLI options/return codes](https://github.com/Cisco-Talos/clamav/blob/main/docs/man/clamscan.1.in). Gambar reencode membuang metadata sumber; belum ada auto-orientation EXIF. Admin harus memastikan tampilan benar sebelum publish. Media tanpa alt ditolak.

## Pemeliharaan dan rollback

Worker/cron bounded `php artisan queue:work database --queue=media --stop-when-empty --max-time=50 --tries=3 --timeout=60` dengan lock overlap hosting, hanya bila worker persisten tidak tersedia; interval cron bukan latency instant. Pantau property_mediaFAILED/PROCESSING>15min dan failed_jobs. `php artisan flamboyan:media-recover` dry-run; --execute requeue stalePROCESSING setelah memperbaiki worker. Retry FAILED melalui UI version guard setelah memperbaiki file/scanner; queue:retry saja tidak mengubah stateFAILED. Processor duplicate job no-op saat READY/ARCHIVED.

`php artisan flamboyan:media-cleanup` dry-run. Setelah backup DB+media konsisten terenkripsi dan manifest/checksum diverifikasi, --execute menghapus files archived≥30days, menandai purged_at, mempertahankan row/audit. Unreferenced UUID staging/ready files/dirs yang melewati grace ikut dapat dibersihkan; symlink dilewati. Jangan jalankan cleanup pada data bisnis sebagai bagian test; suite menggunakan Storagefake. Backup harus mencakup semua private source/variants dan schema yang cocok.

Migration000003 hanya additiveproperty_media+FK/index; GD ditambahkan tanpa upgrade paket lainnya. Rollback kode ke artefak operasi dengan tabel/storage dipertahankan aman; jangan migrate:rollback karena menghapus registry media. Recovery schema melalui maintenance+verified snapshot; check version, files/hash dan public/private scope. Providerembed/content licenses/ClamAV hosting/large-image memory/LINUX PHP8.3 belum dibuktikan; produk lainnya tetap mengikuti implementation-plan.md.
