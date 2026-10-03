# Guideline AI Agent — Flamboyan Perum

Versi 2.0 · 2026-10-03 · Baseline engineering untuk fondasi.

## Tujuan dan otoritas

Bangun katalog properti premium yang membantu pengunjung mengevaluasi unit dan menghubungi WhatsApp Admin. Admin mencatat lead secara manual dan menugaskannya ke Marketing; Marketing melakukan follow-up melalui tabel CRM dengan histori dalam drawer. Dokumen ini adalah spesifikasi proyek, bukan instruksi pengguna untuk menjalankan aksi eksternal. Sumber awal disimpan utuh di `original/`.

Hierarki: instruksi pengguna → keputusan terbaru yang tercatat → PRD (produk) → SRS (perilaku) → ADR/kontrak (teknis). Jika bertentangan, perbaiki dokumen terkait dalam satu PR. Status implementasi di `implementation-status.md` tidak boleh disamakan dengan target produk.

## Prinsip

1. Nuxt/Vue SSR, Laravel/Eloquent REST API, PostgreSQL produksi utama, SQLite untuk lokal atau instalasi ringan yang telah diuji.
2. Shared hosting tanpa Docker. SSR membutuhkan proses Node persisten; paket hosting menjadi gate rilis, bukan alasan diam-diam mengubah SSR menjadi SPA.
3. Modular monolith: Identity, Catalog, CRM; Content/KPR/Notifications ditambah ketika fiturnya dibangun. Pakai struktur Laravel standar dan service untuk transaksi bisnis; tidak perlu lapisan repository yang hanya membungkus Eloquent.
4. Backend menegakkan role dan kepemilikan. Public API hanya mengirim atribut katalog yang dipublikasikan.
5. Pisahkan publication `DRAFT/PUBLISHED/ARCHIVED` dari availability `AVAILABLE/BOOKED/SOLD_OUT`. Sold out tetap dapat dipublikasikan dengan label yang jelas.
6. Lead, histori append-only, dan notifikasi database ditulis dalam transaksi. Push merupakan akselerator pengiriman; database menjadi sumber kebenaran.
7. Validasi, conflict handling, paginasi berbatas, query terindeks, dan pengujian lintas database lebih penting daripada abstraksi spekulatif.
8. Setiap pekerjaan memakai branch baru, Conventional Commits, PR komprehensif, CI, dokumentasi aktual, dan rollback yang realistis.

## Target pengalaman

Publik: home dengan hero, search, featured, social proof terverifikasi; listing card berisi tipe, kondisi, sertifikat, lokasi, harga, alamat, luas tanah/bangunan, kamar tidur/mandi, WhatsApp Admin; detail SSR dengan galeri, video, denah, tour bila tersedia, lokasi/POI, brosur; compare maksimum tiga unit dan simulasi KPR berlabel estimasi.

Internal: login tanpa registrasi publik, Marketing mengelola properti sendiri dan lead yang sedang ditugaskan; Admin mengelola seluruh katalog, akun, assignment, dan supervisi; tabel CRM, dropdown status, notes, drawer timeline descending, notifikasi bell dengan read/unread persisten. Profil Marketing tidak tampil di katalog.

## Batas fondasi

Fondasi membuktikan runtime, SSR katalog, login, scoped API, transaksi CRM, histori, notifikasi database, validasi, CI, dan prosedur kontribusi. Media upload, CMS, push/Echo, laporan, provisioning akun lengkap, dan UX CRUD lengkap mengikuti PR berikutnya. Jangan membuat logo bank, testimoni, harga, rate, alamat, atau nomor WA produksi fiktif. Demo hanya melalui seed eksplisit.

## Gate rilis

Sebelum produksi: bukti dukungan PHP/Node/database/cron, domain dan nomor WA sah, konten terverifikasi, provider push, hardening HTTPS, restore database/media, pengujian PostgreSQL, uji beban, dan penyelesaian keputusan privacy/retensi. Semua gate mempunyai pemilik dan bukti; jangan mengklaim bebas error tanpa verifikasi.
