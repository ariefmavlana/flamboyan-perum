# Verifikasi deployment demo — 2026-10-05

Demo tersedia di https://flamboyan-web.vercel.app; API di https://flamboyan-api.vercel.app. Deployment memakai Vercel Hobby, Supabase Free di Singapore, dan bucket R2 privat Standard `flamboyan-media-demo`. Tidak mengaktifkan Pro trial atau upgrade berbayar. Kuota gratis bukan jaminan bebas biaya tanpa batas; R2 menagih pemakaian yang melampaui free tier.

## Sumber deployment dan perbaikan

Web dibangun dari commit `6bbf027` pada `feat/vercel-same-origin-proxy`, yang memuat proxy Nitro same-origin. API memakai snapshot sumber yang sama ditambah fix entry PHP pada PR ini. PR dibuat pada branch baru `codex/fix-vercel-api-base-path` dari `origin/main` terbaru (`3257844`) dan menyertakan konfigurasi proxy frontend yang sama agar deployment dapat direproduksi dari satu PR. Tidak melakukan merge.

Runtime PHP memberikan `SCRIPT_NAME=/api/index.php`. Symfony menganggap `/api` sebagai base URL sehingga `/api/v1/properties` diarahkan ke `/v1/properties` dan 404. Normalisasi `SCRIPT_NAME` dan `PHP_SELF` ke `/index.php` pada entry function menjaga prefix aplikasi. Regresi memanggil entry asli dengan metadata Vercel dalam proses PHP terpisah: satu kasus API gagal sebelum fix; API/auth/media seluruhnya lulus setelah fix. Kontrak endpoint dan schema database tidak berubah.

Snapshot upload diperiksa: 267 file sumber, tanpa `.env`, `.tools`, vendor, node_modules, atau kredensial. Secret hanya berada pada file lokal yang diabaikan Git dan environment terenkripsi Vercel. Tabel Laravel tidak diakses frontend melalui Supabase Data API; autentikasi dan otorisasi tetap Laravel.

## Hasil pengujian lokal

Windows, PHP 8.4.26 dengan GD, PostgreSQL 17.9, Node 24.21.0. Database pengujian PostgreSQL tersendiri pada localhost:15533, bukan Supabase demo; cluster dihentikan setelah pengujian. Tidak memakai GitHub Actions.

| Perintah | Hasil | Durasi |
|---|---|---|
| `php vendor/bin/pint --test` | Lulus | 1.10s |
| `php artisan test` pada SQLite in-memory | 83 test / 609 assertion lulus | 8.27s |
| Suite sama pada PostgreSQL test terisolasi | 83 test / 609 assertion lulus | 16.18s durasi suite |
| `php composer.phar validate --strict` | Lulus | 1.50s |
| `php composer.phar audit` | 0 advisory | 2.55s |
| `npm run lint` setelah proxy disertakan | Lulus, 0 warning | 3.43s |
| `npm run typecheck` setelah proxy disertakan | Lulus | 5.71s |
| `npm test` setelah proxy disertakan | 15 test lulus | 1.13s |
| `npm run build` | SSR build lulus | 14.19s |
| `VERCEL=1 NUXT_API_BASE=... NITRO_PRESET=vercel npm run build` | Vercel build proxy final lulus | 10.73s |
| `npm audit --json` | Exit 1, 11 high propagated entries yang sudah diketahui | 3.16s |
| `npm audit --prefix .output/server --omit=dev --json` | Exit 0, 0 advisory | 0.98s |
| `npm audit --prefix .vercel/output/functions/__fallback.func --omit=dev --json` | Artefak Vercel final exit 0, 0 advisory | Dijalankan setelah lock runtime dibuat |

Audit source tetap menjadi gate produksi, sesuai [dependency-security.md](dependency-security.md). Tidak ada perubahan dependency atau downgrade untuk menyembunyikan temuan. Deployment cloud web memakai preset Vercel dan build berhasil; runtime PHP menggunakan builder komunitas `vercel-php@0.9.0`. Versi binary PHP cloud dan seluruh ekstensi tidak diperiksa lewat phpinfo publik.

## Pengecekan deployment nyata

Pengujian Chrome melalui Playwright memakai akun sintetis demo dan origin publik, tanpa cookie login dashboard penyedia. Delapan kelompok alur browser serta empat kelompok pengecekan publik tambahan lulus; tidak ada page error pada delapan kelompok pertama.

- Public API hanya memuat 16 properti published dari total 24, tanpa owner/Marketing; akses CRM anonim ditolak 401.
- Detail dan katalog mempunyai data di HTML SSR; detail yang tidak ada mengembalikan 404. Foto R2 memberikan `image/webp`; 12 gambar card pada halaman katalog mobile selesai dimuat. Screenshot detail desktop dan katalog mobile ditinjau.
- Compare dan layout mobile tanpa overflow; KPR fixed/floating dan DP penuh bekerja. Sitemap memuat properti published dan robots melarang backoffice.
- Login Admin dan Marketing dari UI berhasil; sesi tetap bekerja setelah reload dengan cookie host-only pada web (`SESSION_DOMAIN=null`). Logout kembali ke login.
- Admin membaca 72 lead sintetis, membuka histori, dan menyimpan catatan yang muncul kembali. Marketing hanya menerima lead assigned miliknya; endpoint akun Admin mengembalikan 403.
- Perubahan harga lewat API versioned tersimpan dan muncul pada public API; harga dikembalikan. Dua perubahan tersebut tetap mempunyai audit sesuai kontrak.
- Halaman katalog internal, laporan, CMS dan akun terbuka; endpoint laporan, notifikasi dan konfigurasi realtime mengembalikan 200.
- `/up` 200 dan `/ready` API 200 setelah queue dikosongkan: database dan probe tulis/baca/hapus R2 bekerja.
- 72 foto ilustrasi beratribusi dan 24 denah sintetis diproses lokal ke R2. Foto sintetis lama dipertahankan tetapi tidak dipublikasikan. `flamboyan:media-verify --json` memeriksa 360 varian dan melaporkan 0 objek hilang.

Laporan, screenshot, helper provisioning dan kredensial berada di `.tools` yang diabaikan Git. Tidak ada data bisnis atau kontak client yang dimasukkan. Catatan pengecekan ditambahkan pada histori dataset sintetis; harga fixture dipulihkan.

## Cara memakai demo

1. Buka URL web untuk katalog, detail, compare dan simulasi KPR.
2. Buka `/login` dengan `admin@example.test` atau `marketing@example.test`. Password ada pada file lokal privat `.tools/demo-access.txt`, bukan dokumen repository.
3. Admin dapat mengelola katalog, prospek/assignment, histori, CMS dan laporan. Marketing mengelola data yang dimiliki atau assigned kepadanya.
4. Media baru memerlukan worker lokal dengan GD yang menunjuk database/bucket demo; function Vercel tidak menjalankan worker persisten. SMTP dan push provider belum dikonfigurasi: email tidak terkirim dan notifikasi memakai polling.

Vercel Hobby dibatasi untuk penggunaan pribadi nonkomersial menurut [ketentuan Hobby](https://vercel.com/docs/plans/hobby); pilihan ini mengikuti permintaan pengguna tanpa Pro trial. Untuk penggunaan komersial, ketentuan provider tetap berlaku. Supabase Free dapat pause setelah seminggu tidak aktif; buka dan periksa `/ready` sebelum presentasi. R2 Standard menyediakan free tier, dengan biaya jika terlampaui. Sumber: [Supabase pricing](https://supabase.com/pricing), [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## Risiko dan rollback

Ini demo dengan `APP_ENV=local`, `APP_DEBUG=false`, data sintetis, tanpa backup terjadwal, scanner atau worker persisten. Pengecekan ini bukan bukti produksi, beban, uptime, pengiriman email, atau push realtime. Tidak menyediakan endpoint phpinfo publik.

Fix tidak memiliki migrasi. Revert commit entry PHP atau pilih deployment API sebelumnya untuk rollback kode; rollback tersebut mengembalikan masalah prefix API. Provisioning data/media tersendiri, tidak diubah oleh rollback kode. Hentikan deployment melalui dashboard bila demo harus tidak dapat diakses; jangan menghapus project Supabase/bucket tanpa instruksi pemilik. Tidak melakukan merge PR.
