# Dataset dummy dinamis

Dataset lokal memakai database dan API aplikasi sebenarnya. `DemoSeeder` menghasilkan nilai baru untuk setiap database kosong, kemudian data bertahan sampai diubah melalui back office/API. Reload tidak mengacak ulang data. Tidak ada katalog/CRM hardcoded, intercept respons produk, atau fallback dummy saat backend gagal.

## Persiapan

1. Siapkan database **khusus demo yang kosong**, terpisah dari database bisnis dan PHPUnit. Set `APP_ENV=local`, koneksi/path database yang tepat pada environment backend. Install `composer install` dengan dev dependencies (Faker sudah tersedia); PHP GD harus mendukung PNG/WebP.
2. Jalankan `php artisan migrate`. Lewati provisioning `flamboyan:create-user` karena seed menyediakan akun sendiri. Jangan memakai `migrate:fresh` terhadap database yang ingin dipertahankan.
3. Isi `DEMO_PASSWORD` private dengan minimal12 karakter pada environment proses atau `.env` lokal. Jangan mengirim password ke chat, menaruhnya dalam command argument, atau commit `.env`.
4. Jalankan dari `apps/api`:

```sh
php artisan db:seed --class=DemoSeeder
php artisan queue:work database --queue=media --stop-when-empty --tries=3 --timeout=60
php artisan serve --no-reload --host=127.0.0.1 --port=8000
```

Jalankan frontend `npm run dev` dari `apps/web`, lalu buka `http://127.0.0.1:3000`. Pertahankan worker `php artisan queue:work database --queue=media --sleep=1 --tries=3 --timeout=60` di terminal lain jika akan menambah media melalui UI. Seluruh proses harus memakai database/media storage yang sama. Jika `media.queue` disesuaikan, worker harus memakai nama queue tersebut. Konfigurasi proxy/domain/WA tetap mengikuti runbook.

## Isi dan konfigurasi

| Environment | Default | Batas |
|---|---|---|
| `DEMO_PROPERTIES` | 24 | integer6..100 |
| `DEMO_LEADS` | 72 | integer6..500 |
| `DEMO_MARKETING` | 3 | integer1..10 |
| `DEMO_MEDIA` | true | boolean; false melewati ilustrasi/queue |

Satu Admin dan tim Marketing memakai alias login lokal `admin@example.test`, `marketing@example.test`, lalu `marketing-2@example.test` dan seterusnya. Nama mereka dihasilkan generator; password hanya nilai private yang Anda set. Alias login sengaja stabil agar demo dapat dibuka, sementara data bisnis tidak bergantung pada nilai fixture tetap.

Properti memiliki judul/slug/lokasi/alamat/harga/spesifikasi acak, owner, variasi publication/availability/featured. Lead sintetis memiliki nomor dummy, variasi enam status, sebagian belum ditugaskan, histori, versi dan notifikasi persisten yang dibangun melalui `LeadWorkflow`. Tidak ada pengiriman pesan WhatsApp; seed menonaktifkan push eksternal sementara lalu memulihkan konfigurasi. Inbox tetap terisi melalui workflow normal.

Default media: dua ilustrasi baru per properti (PHOTO dan FLOOR_PLAN). GD menggambar bentuk/warna/label sintetis berbeda; pipeline upload/staging/job database/worker normal menghasilkan WebP sanitized. Media baru tampil publik setelah READY dan published sesuai allowlist. Ini ilustrasi, bukan foto properti atau denah bersertifikat.

CMS berisi satu hero, tiga persona testimonial dan tiga rate simulasi dengan label demo, tanggal, serta source URL `example.com` sebagai placeholder sintetis. Attestation Admin lokal memungkinkan menguji publikasi CMS; tidak membuktikan izin testimonial atau rate bank sebenarnya. Tidak membuat video/tour/brosur/maps/POI palsu. Fitur tersebut dapat diuji dengan input/provider sah melalui UI dan tetap memiliki gate konten/scanner/provider produksi.

## Persistensi, kegagalan dan regenerasi

Edit judul/harga di Katalog lalu buka detail publik dan reload: API/SSR membaca nilai terbaru dari database. CRM/report/inbox membaca data persisten yang sama. Seed bukan proses per request dan bukan data temporer frontend.

Seed menolak production/staging, password kosong/pendek, jumlah di luar batas, dan tabel domain yang sudah terisi. Seed kedua tidak menimpa perubahan pengguna. Jika gagal di tengah proses, transaksi membatalkan rows/jobs dan membersihkan hanya staging yang dibuatnya; clock/config dipulihkan. Worker tidak boleh menggunakan database PHPUnit `:memory:`.

Untuk menghasilkan dataset baru, hentikan server/worker demo, buat **database kosong dengan nama/path baru**, pindahkan konfigurasi seluruh proses, lalu migrate+seed+worker. Pertahankan database/media lama bila masih dibutuhkan. Tidak ada perintah reset/destructive otomatis atau seed demo default. Data/file runtime demo tidak di-commit atau dibawa ke produksi. Produksi memakai database bersih yang diprovision dengan akun/konten bisnis sah; konten demo tidak memenuhi gate rilis.

## Pengujian

`DemoDatasetTest` memeriksa workflow, perubahan API, public allowlist, laporan, penolakan reseed, media native, rollback rows/jobs/files, serta pemulihan clock/config. Playwright membaca properti/Marketing dari API aktual; skenario `dynamic-demo.spec.ts` mengubah judul/harga melalui UI, membuktikan raw SSR+reload, lalu memulihkan nilai lewat API versioned.

Gunakan fixture browser khusus dan worker aktif. Rate limiter aplikasi tetap login5/min dan internal120/min. Untuk suite cepat, pisahkan per berkas spec dan bersihkan cache **fixture khusus** di antara berkas, atau tunggu window60 detik. Jangan membersihkan cache bisnis. Perintah dan hasil aktual ada di dynamic-demo-validation.md; mock provider protocol/fault injection pada pengujian bukan data mock produk.
