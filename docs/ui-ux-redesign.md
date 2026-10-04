# UI/UX Flamboyan — katalog dan workspace

2026-10-04 · branch `codex/ui-ux-redesign`, dibuat dari `origin/main` terbaru. Perubahan frontend Nuxt/Vue; tanpa migrasi, dependensi tambahan, perubahan endpoint, merge, atau deployment.

## Masalah dan hasil

Layout publik sebelumnya dipakai kembali untuk backoffice. Navigasi tim memanjang, hierarki heading menyerupai landing page, bentuk panel berbeda-beda, beberapa ringkasan operasi tidak memiliki style, dan tabel laporan tidak memiliki area scroll yang konsisten. Placeholder dekoratif serta campuran label teknis membuat produk terasa tidak utuh.

Layout publik sekarang memiliki header, menu responsif, footer terstruktur, dan tray perbandingan. Beranda mengutamakan pencarian dan katalog sebelum testimonial/rate. Media hero tetap berasal dari CMS/API; jika tidak ada media, tampil panel informasi yang jujur. Kartu memiliki foto bertautan, status, lokasi, harga, spesifikasi dan tindakan yang konsisten. Detail, simulasi KPR, compare, login, recovery, privasi, dan halaman error mengikuti sistem visual yang sama.

Workspace mempunyai sidebar tersendiri, navigasi sesuai role, identitas tim, notifikasi, heading yang lebih padat, filter dan tabel konsisten, serta modal editor. Label publikasi/ketersediaan/peran/jenis konten tampil dalam bahasa pengguna. Kesehatan layanan memakai grid ringkasan; profil memakai form dengan lebar terkontrol. Data, version guard, otorisasi dan transaksi tetap ditangani API yang sama.

## Aturan visual dan interaksi

- Font sistem Segoe UI/Arial, tanpa ketergantungan font eksternal. Teks utama gelap, permukaan putih/netral, aksen hijau untuk tindakan. Token warna dan kontrol berada di `apps/web/app/assets/main.css`.
- Tombol/form minimum 44px; input mobile 16px. Grid katalog 3/2/1 kolom. Konten publik maksimum1328px; sidebar desktop228px; pada≤900px workspace memakai menu disclosure.
- Menu memiliki label, `aria-expanded`, `aria-controls`, close setelah perpindahan route, Escape dan pemulihan fokus. Tombol SSR menunggu hydration agar klik pertama tidak hilang. Menu disclosure tidak bertindak sebagai modal/focus trap.
- Modal native mempertahankan Escape/fokus, backdrop, scroll sendiri dan scroll-lock halaman. Tabel memiliki region berlabel dan tabindex untuk akses keyboard; pada layar sempit dapat digeser di dalam region, disertai petunjuk.
- Focus ring terlihat, skip link, reduced motion, state loading/error/empty, status berlabel teks. Warna bukan satu-satunya petunjuk status. Galeri, embed consent, brochure, KPR, compare dan histori mempertahankan perilaku sebelumnya.
- Tidak menambahkan foto palsu, testimonial, metrik, kemitraan bank atau fallback dataset. Ilustrasi dan teks demo dari database tetap berlabel sintetis; kualitas konten demo bukan bukti konten bisnis produksi.

## Validasi

Runtime aktual: Windows, PHP8.4.26, Node24.21.0, Nuxt4.5.2, Vue3.5.43, PostgreSQL17.9, Chrome terpasang melalui Playwright. Hasil akhir berikut sudah dijalankan pada branch ini. Pengujian menggunakan database demo lokal `.tools/dynamic-demo.sqlite`, PHPUnit SQLite `:memory:`, dan PostgreSQL17.9 cluster khusus `.tools/ui-pg-data`/database `ui_redesign_test` pada127.0.0.1:15432. Seluruh runtime, screenshot, log dan credential berada di ignored paths.


| Pemeriksaan | Hasil aktual |
|---|---|
| Pint `php vendor/bin/pint --test` | Passed |
| PHPUnit SQLite `php artisan test --compact` | 71 tests /504 assertions,19.37s |
| PHPUnit PostgreSQL, perintah sama dengan env test terisolasi | 71 tests /504 assertions,99.41s |
| Composer `validate --strict` / `audit` | Valid /0advisory |
| Frontend `npm run lint` / `npm run typecheck` | Passed, ESLint0warning |
| `npm test` | 13tests/3files passed,586ms |
| `npm run build` | Passed; upstreamDEP0155 masih muncul |
| 13 regresi browser lama,8spec | Semua passed, tanpa skip |
| UI responsif/keyboard,2flow tambahan | Passed;8halaman publik+8workspace ×320/768/1440px,37screenshots,3.7menit |
| Pemulihan404,1flow tambahan | Passed;404 asli, heading, nooverflow320px, tombol kembali dan home hydrated;3.3s |
| Acceptance final builtSSR | 2tests passed,8.6s;CSP nonce/hydration/compare/KPR320px dan permissions operasi |
| `npm audit --json` | Exit1,11high propagated entries upstream;0critical/moderate |
| Audit `.output/server --omit=dev` final | Exit0,0advisory |
| `git diff --check` | Passed |

Total16alur browser berbeda lulus. Suite lama dijalankan per berkas dengan isolasi cache fixture: foundation11.88s, evaluation16.47s, operations15.92s, media19.97s, dynamic-demo8.79s, realtime8.16s, supervision9.42s, acceptance9.33s (durasi CLI, termasuk startup). Acceptance diulang8.6s runner pada build final setelah guard error ditambahkan. `E2E_PRODUCTION_ORIGIN=http://127.0.0.1:3102`, API8000, dev3000, worker media aktif. Password dibaca dari file private ke environment, tidak dicetak atau di-commit. Sebelum cacheclear setiap spec, path database diverifikasi tepat ke fixture dynamic-demo; tidak melonggarkan rate limiter.

Reproduksi frontend dari `apps/web`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx playwright test tests/e2e/<spec>.spec.ts`. Spec baru `ui-design.spec.ts` mempunyai3flow. Gunakan `DEMO_PASSWORD` private, Chrome melalui `PLAYWRIGHT_EXECUTABLE` bila perlu, dan SSR final untuk acceptance. Audit artefak dilakukan setelah `npm install --prefix .output/server --package-lock-only --ignore-scripts --no-fund --no-audit`; lock hasil build tetap ignored. Source lockfile tidak berubah.

Putaran awal mengungkap klik menu sebelum hydration (diperbaiki), layout operasi tanpa style (diperbaiki), serta halaman recovery-invalid tanpa heading (diperbaiki). Satu edit recovery sementara gagal build karena penutup tag; source telah diperbaiki lalu lint/typecheck/build/flow recovery diulang. Pengujian visual awal memotret sebelum API selesai, kemudian diperketat untuk menunggu data/hydration; timeout matrix diperbesar menjadi180detik untuk48navigasi. Tidak mengklaim run gagal sebagai passed. PostgreSQL historis gagal startup pada port Windows terblokir dan akun `postgres` tidak ada; suite final menggunakan cluster baru terisolasi dengan role khusus. Build perantara memiliki warning timing plugin saat mesin sibuk; build final hanya menyisakan upstreamDEP0155. Playwright mencatat konflik envNO_COLOR/FORCE_COLOR dari runner.

Screenshot diperiksa untuk beranda desktop/mobile, detail320px, CRM desktop, katalog desktop, operasi, laporan mobile, dan editor properti320px. Seluruh48kombinasi halaman/viewport diperiksa no-horizontal-overflow, heading dan kesiapan input. Screenshot tersimpan di `.tools/ui-e2e/design`, tanpa meng-commit data demo/contact screenshot. Ini bukan audit WCAG lengkap, pengujian pembaca layar, Safari/Firefox/iOS, provider nyata atau UAT bisnis. Tidak mengulang load/restore karena tidak ada perubahan backend/storage.
## Risiko dan rollback

Stylesheet global diganti sehingga seluruh halaman ikut berubah. Verifikasi mencakup halaman publik/internal dan alur browser, namun tidak membuktikan audit WCAG lengkap atau Safari/Firefox/iOS nyata. Ilustrasi, nama dan copy sintetis tetap berasal dari dataset demo; foto/konten properti berizin diperlukan untuk penilaian produksi. Advisory tooling upstream tetap mengikuti `dependency-security.md`.

Rollback melalui revert commit PR ini lalu build/restart Nuxt. Tidak ada database atau media yang perlu di-rollback. Jangan menjalankan reset/reseed/migrate:fresh pada database aplikasi. PHPUnit PostgreSQL memakai cluster baru karena akun cluster historis tidak teridentifikasi; cluster historis telah dihentikan kembali tanpa perubahan data. GitHub Actions tidak dijalankan.

## Referensi implementasi

Perilaku watcher route dan template refs mengikuti [Vue watchers](https://vuejs.org/guide/essentials/watchers) dan [Vue template refs](https://vuejs.org/guide/essentials/template-refs). Tidak menambahkan library navigasi atau ikon; ikon inline SVG satu komponen dengan himpunan nama bertipe.

## Referensi template dan penyesuaian persona

Ditinjau pada 2026-10-04 dari sumber resmi:

- [Nuxt UI Dashboard](https://dashboard-template.nuxt.dev/customers), dengan [lisensi MIT di repository resmi](https://github.com/nuxt-ui-templates/dashboard/blob/main/LICENSE). Acuan workspace: navigasi yang berkelompok, heading/tindakan utama yang jelas, toolbar dekat dengan hasil, serta tabel yang mudah dipindai. Implementasi Flamboyan tetap menggunakan komponen Vue yang ada dan kontrol 44px.
- [Houzez listing templates](https://houzez.co/listing-templates/) dan [property detail](https://houzez.co/features/property-detail-page/), produk properti dari vendor resminya. Acuan susunan informasi bagi calon pembeli: pencarian, hasil, galeri, harga, spesifikasi dan kontak. Ini hanya referensi pola UX; tidak mengambil source, foto, ikon, font atau aset berbayar Houzez, serta tidak memasang WordPress/Elementor.

Tidak menyalin kode template ataupun menambahkan dependensi. Brand Flamboyan tetap menggunakan warna hijau tenang, permukaan netral, tipografi sistem, bahasa Indonesia, harga IDR, dan kontak Admin. Profil agen/identitas Marketing dari template tidak diterapkan karena public allowlist melarangnya. Fitur template yang belum tersedia di Flamboyan tidak ditampilkan.

Penyempurnaan dalam PR yang sama: filter utama dan spesifikasi berada dalam satu panel; hasil mempunyai heading/jumlah yang jelas dan label filter aktif yang dapat dihapus satu per satu. Penghapusan mempertahankan filter lain dan sort, menghapus page agar hasil kembali ke halaman pertama, serta mendukung Back. Harga/kontak berada sebelum deskripsi/lokasi dalam urutan mobile dan DOM; di desktop ringkasan tetap menempel di kolom kanan. Sidebar membedakan Aktivitas, Pengelolaan dan Akun sesuai role. Jumlah lead dan reload ditempatkan dalam satu baris di atas tabel.

### Validasi penyempurnaan template

Masih pada runtime Windows/Node24.21.0/Nuxt4.5.2/Vue3.5.43/Chrome dan fixture lokal yang sama. `npm run lint` (0 warning), `npm run typecheck`, `npm test` (13 tests,400ms), serta `npm run build` lulus. Build masih melaporkan upstream DEP0155. Audit source diulang:11 high/0 critical; audit artefak runtime baru:0 advisory. Tidak ada dependency/source lockfile yang berubah.

`npx playwright test tests/e2e/ui-design.spec.ts` final:5 tests lulus dalam34.7s. Matrix48 kombinasi tetap diperiksa; navigasi workspace sekarang menggunakan menu aplikasi dan mengharuskan tidak ada respons API error. Dua regresi baru menguji hapus satu filter/preservasi filter lain/sort/reset page/Back/reset seluruh query, serta posisi harga/kontak sebelum deskripsi di320px. Screenshot final ada di ignored `.tools/ui-refinement/design-final`; desktop katalog/detail/CRM dan mobile katalog/panel harga diperiksa visual.

Regresi terkait diulang per spec dengan cache fixture terisolasi: foundation3 tests/7.5s, evaluation2/10.4s, operations2/10.0s, acceptance2/7.0s. Acceptance memakai build baru pada3102. Total14 alur browser lulus pada putaran penyempurnaan ini; bukti backend dan4 alur browser lain dari putaran awal tetap berlaku karena kode backend tidak berubah. Tidak mengklaim backend diulang pada putaran ini.

Run awal matrix gagal karena reload penuh24 halaman internal menabrak limiter120request/menit; trace mengonfirmasi429. Test diperbaiki memakai navigasi menu dan pemeriksaan status API, tanpa mengubah limiter. Test filter awal memiliki locator label ambigu dan diperbaiki dengan exact match. Satu transformasi sementara test harness menghasilkan sintaks tidak valid; sudah diperbaiki sebelum run final. Lint awal melarang dynamic delete; query sekarang disusun dengan filter entri. Semua hasil gagal ini tidak dihitung sebagai passed.
