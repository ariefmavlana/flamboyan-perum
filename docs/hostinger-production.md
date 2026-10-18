# Rilis Hostinger

Pemilik memilih pada 18 Oktober 2026: build Nuxt native dari push `main`, ditambah cron API setiap menit. Keduanya mencapai commit yang sama secara bertahap; perpindahan frontend dan API **tidak atomik bersama**. Setiap PR wajib kompatibel dengan versi API/frontend sebelumnya. Perubahan kontrak yang memutus kompatibilitas, migrasi, credential dan script deployment memerlukan rilis operator terpisah. Tidak memakai GitHub Actions, token Hostinger tambahan, webhook publik atau akses tulis repository dari server.

## Batas dan instalasi

PHP 8.4 dengan pdo_pgsql, GD WebP dan pcntl. Nuxt memakai Node yang memenuhi engines package-lock. Kode API, vendor, config, log dan storage berada di luar document root. Hanya entry point publik Laravel dan .htaccess berada pada hostname API; Nuxt memakai domain utama dan bridge same-origin. Supabase memakai verify-full dengan CA provider; R2 tetap private. APP_KEY tidak dibuat ulang. Tidak ada seed atau migrasi otomatis.

Operator membuat root privat `$HOME/flamboyan` (0700), `shared/.env` (0600), shared storage dan release awal yang sudah terverifikasi. `current` harus symlink relatif `releases/<40-hex-SHA>`. Salin script dalam `ops/hostinger` ke `shared` dengan mode 0600. Variabel ops opsional: FLAMBOYAN_ROOT (path absolut), HOSTINGER_PHP_BIN dan HOSTINGER_COMPOSER_BIN (path executable, bukan command string). Ini bukan secret configuration; jangan simpan credential pada repository.

Cron account, masing-masing setiap menit, menggunakan path absolut aktual (command hPanel maksimal 255 karakter):

```sh
/bin/sh /home/ACCOUNT/flamboyan/shared/api-cron.sh
/bin/sh /home/ACCOUNT/flamboyan/shared/queue-cron.sh notifications
/bin/sh /home/ACCOUNT/flamboyan/shared/queue-cron.sh media
/bin/sh /home/ACCOUNT/flamboyan/shared/queue-cron.sh default
```

Script API mengambil hanya origin main dari repository publik yang di-allowlist ke bare repository privat. Lock serialisasi menolak overlap. Force push/non-descendant, path/remote tidak sesuai, artefak existing yang ambigu, dependency install gagal, migration pending atau readiness gagal mempertahankan pointer lama. Artefak staged tidak dihapus otomatis. Composer memakai lock, tanpa plugin/script/dev dependency; package discovery dan cache eksplisit. Readiness memeriksa runtime, production/config/session, query PostgreSQL verify-full, tidak ada migration pending dan health provider. Promosi API memakai rename symlink atomik setelah cache memakai path final. API cron dibatasi timeout240s + kill-after10s. Native build Nuxt tetap dapat selesai lebih dahulu; ini memerlukan kompatibilitas yang dipilih pemilik, bukan jaminan zero-downtime pada perubahan kontrak.

Satu nama staging tetap per SHA menahan pengulangan setelah kegagalan; cron tidak membuat pohon vendor baru setiap menit. Operator memeriksa artefak gagal dan mengarantina staging itu sebelum retry pada SHA yang sama. Total entri release dibatasi tiga: aktif, rollback, dan satu kandidat termasuk yang gagal. Kapasitas penuh menahan deploy untuk pemulihan operator. Sesudah promosi, di bawah lock yang sama script memangkas direktori SHA lama dengan pemeriksaan nama40hex, physical path dan tanpa symlink; aktif dan satu rollback selalu dipertahankan. Log deploy ditimpa per run setelah memperoleh lock wrapper. Perubahan queue bootstrap pada target SHA ditolak sampai operator memasang file shared yang identik. Seluruh perilaku baru ini masih menunggu review ulang dan belum diaktifkan pada cron API produksi.

## Queue pilihan B

Target dequeue p95 <=120 detik pada kapasitas yang diuji, tanpa janji push <=5 detik. Tiga queue diberi worker dan lock terpisah agar prioritas notification tidak menahan media/default. Worker stop-when-empty/max-time50s/max-jobs50; max-time diperiksa antarjob. Timeout fallback30s dikalahkan timeout job media60s/notification15s. Outer timeout120s + kill-after10s lebih kecil dari database retry_after180s. Wrapper mempertahankan lock selama child masih hidup. pcntl_alarm harus aktif; uji forced timeout/retry dan overlapping execution terisolasi diperlukan, bukan asumsi dari flag.

Metadata privat queue-events.jsonl hanya memuat waktu, queue, ID job, pid dan exit integer; tanpa payload, nama, kontak atau isi notifikasi. Retensi/rotasi log dan kapasitas disk harus dipantau sebelum volume tinggi. PDF baru tetap fail-closed jika scanner/proc_open tidak tersedia. Inert job membuktikan cadence/dequeue, bukan throughput gambar besar atau delivery push.

## Verifikasi, rollback dan batas

Catat SHA main, build Nuxt, current API, hasil auth/CSRF serta cookie foto publik, status/isi SSR, objek R2/video, canonical/robots/sitemap, queue pending/failed dan hash script terpasang. Uji push PR dokumentasi/ops yang kompatibel sampai kedua komponen mencapai SHA main. Perubahan lokal yang belum commit/push tidak menjadi input deployment.

Rollback memakai lock deploy yang sama: hentikan auto-promotion sementara, pilih artefak API kompatibel sebelumnya, lakukan readiness, ganti current atomik, lalu redeploy build Nuxt yang cocok melalui hPanel. Jangan memundurkan database atau memulihkan dump di atas lead baru. Pemulihan ambiguity/force-push harus operator; tidak ada hard reset atau penghapusan otomatis. Pertahankan release lama, backup dengan checksum dan bukti restore. Setelah investigasi, aktifkan cron kembali. Perubahan script ops sendiri harus direview dan disalin ulang oleh operator; cron tidak memperbarui bootstrap deployment-nya sendiri.

Pada pemasangan awal, SMTP masih log, growth/tag/Ads belum aktif dan indexability ditahan hingga smoke selesai. Selesaikan verifikasi email/SMTP, IDs akun dan persetujuan privasi/retensi/iklan sebelum mengklaim fitur tersebut aktif. Pemeriksaan Chrome melihat challenge otomatis Hostinger; keberhasilan setelah challenge serta error challenge harus dicatat terpisah dari status awal403.
