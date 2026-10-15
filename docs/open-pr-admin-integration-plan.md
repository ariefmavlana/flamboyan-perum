# Review PR dan pengisian Admin — 15 Oktober 2026

Otorisasi langsung pengguna: pakai password akun yang telah diberikan; review
semua PR secara komprehensif, merge hanya setelah lolos, lalu isi data melalui
Admin berdasarkan aset pemilik. User menetapkan dua MP4 menunggu input link
YouTube oleh Admin; jangan membuat URL atau VIDEO record placeholder.

## Kebutuhan, konteks, dan batas

- PR30 security, PR31 assets, PR32 role semuanya mengarah main c1cecaf; status
  Vercel API/web awal success, 0 review GitHub/komentar. Persetujuan AI bukan
  review/approval manusia palsu. Main tidak diubah sebelum gate terpenuhi.
- Dua akun nyata lokal sudah dibuat melalui helper local-only, password stdin
  process-memory. Run otomatis ini memakai bridge DPAPI CurrentUser sementara
  sebelum plaintext stdin ke PHP; helper PS interaktif terpisah hanya memakai
  hidden prompt/SecureString lalu plaintext stdin, bukan DPAPI. Keduanya tidak
  menulis password ke file/Git atau argumen PHP.
  Login200, me200/role cocok, Admin users200, Marketing users403, logout204.
- Sumber privat: 55 JPEG galeri (35 dokumentasi/20 AI), Siteplan, logo, dua foto
  gerbang, dua MP4. Seluruh56 hash manifest gallery+siteplan cocok. Tabel brosur
  yang direkonsiliasi menyuplai9 tipe, luas, kamar, harga/tanggal, rencana152unit.
  Sertifikat/stok/foto empat tipe yang belum diketahui tidak boleh dikarang.
- Data bisnis ditulis hanya melalui sesi Admin/API existing, bukan SQL/model
  bypass. Marketing penanggung jawab Arief. Tidak membuat calon pembeli,
  histori, testimonial, rekanan/logo bank, atau rate sintetis. Local-only;
  perubahan database/provider cloud tidak termasuk instruksi ini.

## Perbaikan hasil independent read-only review

1. PR30: bounded body reader sebelum parsing CSP (termasuk chunked/tanpa CL),
   sanitasi allowlist directive+URL origin tanpa credentials/path/query/hash;
   gate TLS PostgreSQL pada config efektif yang sudah diparse dari DB_URL;
   dokumentasi dan tes kompatibilitas logout saat sesi menjadi terenkripsi.
2. PR31: perbandingan processed dimensions max1920 mengikuti processor asli,
   hash/source dimensions tetap; strip marker ED/RR hanya dari resource publik;
   importer menolak penggantian masterplan aktif (tidak mengarsipkan data lama
   tanpa pemulihan); prasyarat worker dan timeout dijelaskan; OG mengikuti
   aset pemilik. Kapasitas foto sesuai empty local catalog, bukan cloudexisting.
3. PR32: pembaruan dependency kompatibel tanpa force/downgrade, perbarui bukti
   akun nyata. Audit source tetap dicatat FAIL bila upstream belum patched;
   tidak menaikkan metadata versi palsu atau mengabaikan advisory agar hijau.

## Acceptance, keamanan, rollout dan rollback

Jalankan Pint, Composer strict/audit, PHPUnit SQLite dan PostgreSQL test isolated,
frontend lint/type/unit/build, importer tests dan browser flows pada integrated
tree (incl real-sized images/worker/marker/private Admin). Review independen
full diff dan thermo-nuclear hash stabil diperlukan; blocker tidak boleh
dianggap PASS. Merge conditional hanya jika syarat yang sebenarnya terpenuhi;
tidak ada bypass review, force-push, atau GitHub Actions.

Sesudah merge yang lolos: local main memakai tree yang sudah diuji, simpan
perubahan lokal tak berkaitan/asset/env, pasang dependency dari lock, restart
hanya proses proyek. Snapshot DB+private media konsisten sebelum datawrite.
Admin create9core DRAFT -> komersial bersumber -> publish CHECK_REQUIRED ->
foto/siteplan dan CMS faktual, lalu verifikasi Admin/Marketing/public/SSR tanpa
data tim bocor. Tipe tanpa foto memakai empty state yang jujur; videoform siap
untuk URL Admin nanti. Import resumable, optimistic version, tanpa write retry
otomatis. Snapshot/private result tidak masuk Git.

Rollback source: revert patch/merge yang dimaksud, jangan menghapus database.
Rollback media: unpublish marker baru dan pulihkan posisi existing memakai
versi terbaru; tidak restore DB menyeluruh setelah CRM berubah. Accountdeactivate
memakai last-Admin/workload guard. Session encryption rollout/rollback dapat
memerlukan login ulang. Gate hosting/provider/backup/privacy dan unpatched
source dependencies tetap eksplisit; keberhasilan lokal bukan jaminan universal
zero-error atau audit production/provider yang belum dijalankan.
