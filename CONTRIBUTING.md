# Kontribusi

Setiap fitur/fix/refactor/dokumentasi mempunyai branch baru dan PR. Main adalah baseline yang sudah direview; inisialisasi repository kosong menjadi satu-satunya commit bootstrap sebelum PR pertama.

```sh
git switch main
git pull --ff-only
git switch -c feat/nama-fitur
# implementasi, test, dokumentasi
git add <berkas-yang-direview>
git commit -m "feat(catalog): describe resulting behavior"
git push -u origin feat/nama-fitur
```

Gunakan `fix/`, `refactor/`, `docs/`, `chore/` sesuai pekerjaan. Jangan gabungkan fitur baru yang tidak terkait. PR menyebut acceptance IDs, pengujian aktual, migrasi, keterbatasan dan rollback. Jangan merge otomatis. Proteksi main melalui review dianjurkan; konfigurasi organisasi/repository memerlukan pengaturan oleh pemilik sebelum kontribusi tim. Jangan mensyaratkan status checks dari GitHub Actions. Branch rules di AGENTS berlaku walaupun server protection belum diaktifkan.

Backend: `composer install`, `vendor/bin/pint --test`, `php artisan test`, `composer validate --strict`, `composer audit`. Frontend: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit --omit=dev`, serta audit artefak runtime. Jalankan validasi secara lokal; GitHub Actions tidak digunakan. Suite backend wajib diuji pada database test SQLite dan PostgreSQL terisolasi. Panduan environment dan audit ada di [runbook](docs/runbook.md). Catat versi runtime, hasil, tanggal dan commit yang diuji; hasil lama tidak boleh diklaim sebagai pengujian ulang perubahan baru. Jalankan hanya lingkungan development/test untuk migrasi/seed; seed demo dilarang di production. Update `docs/implementation-status.md` ketika mengirim fitur.
