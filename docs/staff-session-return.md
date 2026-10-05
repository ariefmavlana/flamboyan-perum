# Kembali ke workspace tanpa login ulang

## Root cause dan bukti

Laporan: setelah Admin/Marketing memilih **Lihat website** di sidebar, tautan **Tim Flamboyan** pada footer meminta login lagi.

Reproduksi sebelum perbaikan memakai Chrome dan sesi nyata pada fixture SQLite lokal. Login berhasil, navigasi ke `/properti`, lalu `GET /api/v1/me` tetap **200**. Setelah footer diklik, URL berhenti di `/login`; assertion kembali ke `/backoffice` gagal. Jadi sesi Laravel tidak hilang dan sidebar tidak melakukan logout.

Dua penyebab frontend: `layouts/default.vue` menautkan footer langsung ke `/login`, sementara `pages/login.vue` selalu menampilkan formulir tanpa memeriksa sesi. `useStaffSession` sebelumnya hanya dipakai oleh workspace. Akibatnya sesi valid ditampilkan seolah belum login, termasuk kunjungan langsung/bookmark `/login`.

## Perilaku hasil perbaikan

- Footer menuju pintu workspace `/backoffice` untuk semua pengunjung. Backend tetap memeriksa sesi dan hak akses.
- `/login` memeriksa identitas melalui GET `/api/v1/me` setelah client mount. Formulir tidak tampil selama pemeriksaan.
- Sesi valid menuju `/backoffice` dengan history replacement. Workspace menampilkan kemampuan Admin/Marketing sesuai identitas backend, tanpa POST login kedua.
- Respons 401 (sesi tidak berlaku) dan 403 dari endpoint identitas (akun tidak aktif/role ditolak) menjadi status tamu. Formulir login baru tampil; tidak ada redirect berulang. Refresh workspace juga mengarahkan penolakan identitas 403 ke login.
- Gangguan jaringan/5xx tetap error dengan tombol **Coba lagi**, bukan dianggap logout atau permintaan password. Retry dapat memulihkan sesi valid.
- Hasil pemeriksaan yang selesai setelah halaman login ditinggalkan tidak menarik pengguna kembali ke workspace.
- Logout dan revocation tetap berlaku, termasuk ketika tab lain masih menyimpan identitas client lama. Tidak menambah token/localStorage, memperpanjang masa sesi, mengubah cookie, atau mengabaikan validasi backend.

Perubahan terpusat di tiga file frontend: footer, login, dan composable sesi. Pemanggil `refresh()` existing tetap menerima throw pada error/redirect; opsi read-only `redirectOnGuest:false` khusus login mengembalikan `null` untuk 401/403. Public SSR tetap tidak meneruskan cookie atau menyertakan identitas tim. Tidak ada perubahan endpoint, migrasi, dependency atau backend.

Pola navigasi/history dan state mengikuti dokumentasi resmi [Nuxt 4 navigateTo](https://nuxt.com/docs/4.x/api/utils/navigate-to) dan [useState](https://nuxt.com/docs/4.x/getting-started/state-management). State client membantu UI; sesi backend tetap sumber kebenaran. Skill debugger digunakan untuk reproduksi sebelum fix dan regresi sesudahnya; Context7 tidak tersedia pada sesi ini sehingga referensi framework diperiksa melalui dokumentasi resmi.

## Bukti validasi 2026-10-05

Windows, Node24.21.0, PHP8.4.26, PostgreSQL17, Chrome lokal via Playwright. API fixture `.tools/experience-browser.sqlite`, bukan database cloud; preview build berjalan pada `http://127.0.0.1:3000`.

| Perintah/pemeriksaan | Hasil |
|---|---|
| Playwright `session-return.spec.ts --grep 'admin: active'` sebelum fix | Gagal sesuai bug: `/me`200 tetapi footer berakhir di `/login` |
| Playwright `session-return.spec.ts` setelah fix | 6 lulus, 25,8s |
| `php vendor/bin/pint --test` | Lulus |
| `php artisan test`, SQLite | 94 test /713 assertion, 10,20s |
| `php artisan test`, PostgreSQL test isolated15533 | 94 test /713 assertion, 17,79s |
| `composer validate --strict` / `composer audit` | Valid /0 advisory |
| `npm run lint` / `npm run typecheck` | Lulus; 6,56s /9,79s pada rangkaian build |
| `npm test` / `npm run build` | 17 test lulus; 1,32s /14,55s perintah |
| Audit generated runtime `--omit=dev` | 0 vulnerability |
| `npm audit` source tree | 11 high existing pada tooling transitive; bukan audit bersih |

Enam kasus browser mencakup kedua role, sidebar→publik→footer pada desktop/mobile390, reload publik, `/login` langsung di tab baru, tepat satu POST login, navigasi Admin disembunyikan bagi Marketing, visitor, cookie hilang, logout tab lain, pemeriksaan tertunda, kegagalan503/retry, dan403 tanpa loop. Screenshot kembali ke workspace mobile tersimpan pada test-results lokal. Suite awal sesudah fix memiliki dua masalah tes: reload sebelum navigasi Nuxt selesai dan locator status yang juga mencocokkan announcer Nuxt. Sinkronisasi URL/locator diperbaiki; suite final lulus. Tidak menghapus assertion perilaku aplikasi. Browser runner mengeluarkan warning lingkungan NO_COLOR/FORCE_COLOR; bukan warning lint/build aplikasi.

## Rilis dan rollback

Branch `codex/staff-session-return` dibuat dari `origin/main` terbaru. Fix tersedia pada preview lokal; situs live belum berubah sampai PR direview/merge dan pipeline Git selesai. Tidak merge atau deploy source pada pekerjaan ini. Rollback source melalui revert commit PR dan build ulang; tidak membutuhkan perubahan data atau pencabutan sesi pengguna.
