# Validasi pengalaman pembeli Bandung Timur — 2026-10-04

Branch `codex/bandung-buyer-experience` dibuat dari `origin/main` pada `4816063`. Lima commit desain/fotografi PR #12 dibawa dengan cherry-pick, kemudian fitur pembeli dan kesiapan CMS dilengkapi. PR baru membawa seluruh perubahan terhadap main; PR #12 tidak di-merge otomatis. Arsip kebutuhan `docs/original/` tidak berubah.

## Lingkungan dan hasil

Windows lokal, Node 24.21.0, Nuxt 4.5.2, Vue 3.5.40, PHP 8.4.26, PostgreSQL 17.9, Playwright 1.63.0 memakai Chrome lokal. API 8000 dan dev 3000 menggunakan database khusus `.tools/dynamic-demo.sqlite`; artefak SSR dibangun ulang dan berjalan pada 3102 dengan konfigurasi CSP produksi. PHPUnit PostgreSQL memakai cluster terisolasi 15432/database `ui_redesign_test`, bukan database demo/instalasi pengguna.

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Format backend | `php vendor/bin/pint --test` | Lulus suite penuh; perubahan akhir dua field Seeder juga lulus pemeriksaan file. |
| Backend SQLite | `php artisan test --compact` | 77 tests, 579 assertions, 8.75s. |
| Backend PostgreSQL | Perintah sama, env testing/pgsql pada cluster 15432 | 77 tests, 579 assertions, 15.00s. |
| Seeder setelah penyelarasan lokasi | `php artisan test --filter=DemoDatasetTest --compact` | SQLite 5 tests/51 assertions, 3.325s; PostgreSQL 5/51, 5.726s. |
| Composer | `composer validate --strict`; `composer audit` | Valid; 0 advisori. Pengulangan memakai safe.directory khusus proses, tanpa mengubah konfigurasi global. |
| Frontend | `npm run lint`; `npm run typecheck`; `npm test` | Lulus; lint 0 warning; 15 unit / 4 files, 399ms. |
| Build | `npm run build` | Lulus; server bundle 2.94MB / 749kB gzip. Warning upstream Vue/Nitro DEP0155 tetap tercatat. |
| Browser | `playwright test tests/e2e/<spec> --reporter=line` | 26 alur lulus setelah perbaikan assertion hero statis; rincian di bawah. |
| Audit source | `npm audit --json` | 11 high, 0 critical/moderate; temuan toolchain upstream tetap terbuka. |
| Audit runtime | Lock hanya di ignored `.output/server`, lalu `npm audit --omit=dev --json` | 0 advisori. Tidak mengubah source lockfile/dependency. |
| Script demo | `node --check scripts/localize-demo-market.mjs`, lalu eksekusi opt-in guarded | 24 identitas seed tervalidasi dan 24 location/address dipatch melalui API; snapshot private sebelum mutasi. |
| Diff/originals | `git diff --check`; diff `docs/original/` terhadap main | Bersih; original tidak berubah. |

Tidak ada dependency, migrasi, GitHub Actions, merge atau deployment baru. Hasil SQLite/PG penuh di atas dilakukan sebelum koreksi dua field teks Seeder; setelah koreksi, suite Seeder di kedua mesin dijalankan ulang. Perubahan test-only assertion terakhir diperiksa ESLint scoped dan browser terkait; build aplikasi tidak berubah.

## Bukti browser

Suite dijalankan per spec dan enam tes UI secara terpisah dengan satu worker. Cache hanya pada fixture khusus dibersihkan antar-invokasi agar login 5/min dan API 120/min tidak mengacaukan suite; rate limit aplikasi tidak diturunkan. Media memakai worker lokal nyata. Acceptance memakai `E2E_PRODUCTION_ORIGIN=http://127.0.0.1:3102`, sehingga pengujian CSP produksi tidak di-skip.

| Spec / kelompok | Alur | Durasi hasil Playwright |
|---|---:|---:|
| foundation | 3 | 8.2s |
| operations | 2 | 10.7s |
| evaluation | 2 | 11.1s |
| media | 1 | 16.3s |
| dynamic-demo | 1 | 5.8s |
| realtime | 1 | 5.8s |
| supervision | 1 | 5.6s |
| acceptance | 2 | 5.9s |
| gallery-experience | 3 | 8.1s |
| cms-assets | 2 | 12.1s |
| buyer-journey | 2 | 8.4s |
| ui-design: navigation/workspace/404/filters/mobile-detail/images | 6 | 23.8s/10.6s/3.0s/2.7s/3.0s/8.2s |

Cakupan baru: share manual ketika clipboard ditolak; canonical/OG; konsultasi kontekstual, topik pembiayaan dan properti tidak tersedia;6 route × 3 viewport tanpa overflow; sitemap/article SSR/404; foto/denah/ArrowLeft/ArrowRight/Escape/fokus; pemuatan video/tour setelah persetujuan; hero nyata dari CMS dan posisi tombol video 320/768/1440; logo upload sanitasi→publish→SSR/binary200→unpublish404. Tidak mengirim WhatsApp atau mengonfirmasi jadwal. Provider embed dan realtime memakai stub/protocol fixture; itu tidak membuktikan provider produksi.

Satu tes visual lama awalnya gagal karena mengharuskan alt foto hero stok yang tetap. Hero sekarang memakai media CMS, sehingga assertion diganti menjadi hero terlihat dengan alt bermakna; loop tetap memeriksa seluruh gambar benar-benar selesai decode dan testimonial tidak tumpang tindih. Test CMS terpisah memastikan media/alt yang dipilih benar-benar tampil. Rerun test visual lulus 8.2s; 25 alur lainnya sudah lulus. Runner PowerShell pertama yang keliru membuka npx tanpa argumen tidak dihitung sebagai pengujian; hasil di tabel berasal dari pemanggilan CLI Playwright sebenarnya.

Bukti runtime private: `.tools/buyer-e2e-*.log`, `.tools/buyer-build.log`, audit JSON, `.tools/buyer-review/`, dan output Playwright. Bukan konten yang di-commit. Pemeriksaan visual manual mencakup home, Bandung Timur, panduan, konsultasi dan detail/galeri melalui browser; batas layar 320–1440px. Render ulang empat halaman (home, Bandung Timur, panduan, konsultasi) pada 320/390/768/1440px menghasilkan 16 kombinasi tanpa overflow; semua gambar berhasil decode dan CTA konsultasi terlihat setelah hydration. Ini bukan klaim audit WCAG lengkap atau seluruh perangkat/browser.

## Kesiapan aset dan batas rilis

Foto/denah pemilik dapat memakai upload media existing; hero dipilih dari media siap di CMS. Video mengikuti YouTube tervalidasi dan consent embed; upload MP4 langsung belum ada sesuai baseline. PDF tetap membutuhkan scanner ClamAV nyata; tour memakai provider allowlist. Logo bank memerlukan izin dan hubungan kemitraan yang telah diverifikasi, bukan hasil menyalin logo referensi. Artikel panduan saat ini source content, bukan CMS blog.

Alamat rinci, koordinat/POI, fasilitas/waktu tempuh, legalitas unit, foto/video/testimoni/logo/rate nyata harus diverifikasi sebelum mengganti data demo. Katalog lokal berlabel Bandung Timur (demo); koordinat/POI fixture tetap data pengujian. Domain/HTTPS/SMTP/Pusher/ClamAV/worker/offsite-backup/privacy/UAT dan advisori source tetap gate sesuai PRD/runbook. Tidak mengklaim aplikasi sudah sempurna atau siap produksi hanya karena pengujian lokal lulus.

## Rollback

Tidak ada migrasi. Sebelum rollback kode, unpublish konten BANK_PARTNER dan kosongkan media_id HERO baru bila perlu lewat CMS/version terbaru. Revert commit perubahan baru atau PR sesuai kondisi merge yang disetujui; simpan database dan media private. File logo lama tetap private dan tidak dihapus otomatis. Koreksi lokasi fixture dikembalikan per id/slug melalui PATCH dengan version terbaru dari snapshot `.tools/demo-market-before.json`; jangan mengembalikan seluruh database. Aset/editorial PR #12 yang dibawa dapat direview terpisah dari kemampuan baru.
