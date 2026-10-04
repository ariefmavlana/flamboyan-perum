# Backend Flamboyan

Ikuti aturan root `../../AGENTS.md` dan dokumen proyek di `../../docs`.

Gunakan Laravel/Eloquent standar, session Sanctum, Form validation, public DTO allowlist dan service untuk transaksi CRM. Jangan memasang generator/Boost atau runtime global hanya untuk memenuhi scaffold bawaan; PHP/Composer lokal sudah disiapkan sesuai kontrak proyek.

Jalankan `vendor/bin/pint --test`, `php artisan test`, `composer validate --strict`, dan `composer audit` secara lokal. Jalankan suite yang sama pada SQLite dan PostgreSQL menggunakan database test terisolasi; catat versi PHP/database yang benar-benar diuji. Jangan menggunakan GitHub Actions. Persistensi/history/notifications tidak boleh ditulis sebagian. Tambah regression test untuk perubahan akses atau workflow.
