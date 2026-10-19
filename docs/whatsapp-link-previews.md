# Pratinjau tautan CTA WhatsApp — 19 Oktober 2026

## Kebutuhan dan keputusan

Pemilik memilih gambar pratinjau bersama tautan, bukan lampiran foto otomatis.
Setiap CTA WhatsApp publik membawa halaman yang sesuai dengan konteksnya.
Kode kartu, detail dan bantuan KPR sudah memakai URL properti; metadata SSR
detail sudah memuat satu `og:image` dari foto sampul tipe yang bersangkutan.
Pemeriksaan produksi sebelum perubahan menemukan header/footer masih membawa
beranda saat pengunjung berada pada detail tipe 36/60.

## Cakupan dan penerimaan

- Header/footer mengikuti path halaman publik, termasuk sesudah navigasi SPA.
- Pada konsultasi dengan properti yang berhasil dimuat dari katalog publik atau
  `kawasan` yang dikenali, tombol global memakai URL properti/kawasan bersih.
  Referensi properti hanya dari query tidak cukup. Query, hash, pertanyaan dan data kontak
  tidak disalin ke URL pratinjau; halaman privat memakai fallback beranda.
- CTA utama konsultasi memakai URL pilihan properti yang sama dengan judulnya,
  termasuk perubahan dropdown saat form tersedia dengan/tanpa query properti.
  Pencatatan klik memakai ID pilihan yang sama, tanpa mewarisi tipe rumah lama.
- Tautan kartu/detail/KPR tetap menuju properti; gambar sampul dari katalog,
  gambar kawasan dan label ilustrasi existing dipertahankan. Gambar tidak
  mengikuti frame carousel yang berganti otomatis.
- HTML SSR tujuan memuat satu gambar publik yang sesuai dan bisa diambil tanpa
  sesi. Pengujian browser memeriksa URL pesan, metadata SSR dan respons gambar.

Tidak mengubah nomor Admin, harga, media katalog, CRM, otorisasi, kontrak event tracking,
akun iklan, anggaran, schema atau kontrak REST API. Tidak mengirim pesan dan
tidak menambah provider/dependensi. Konfirmasi pengguna atas opsi ini merupakan
otorisasi implementasi terbatas; perubahan source melalui branch/PR baru.

## Batas, rollout dan rollback

`wa.me` menyiapkan teks yang berisi URL; WhatsApp mengendalikan pembuatan,
cache dan tampilan pratinjau. Pengaturan privasi pengguna dapat mematikannya.
Metadata/gambar yang dapat diambil bukan bukti pratinjau sudah tampil di semua
klien WhatsApp. Pengujian tidak mengirim pesan atas nama pengunjung.

Source dipasang sesudah review dan instruksi merge pemilik. Tidak ada migrasi.
Rollback dengan revert commit lalu deployment versi sebelumnya; database dan
pesan yang sudah dikirim tidak diubah.

## Verifikasi

Validasi lokal 19 Oktober 2026 (Node 24.21.0, PHP 8.5.11):

- Frontend lint, typecheck, 90 unit test pada 20 file dan build lulus
  (build 27,6 detik).
- Playwright Edge: 3 alur lulus dalam 9,9 detik: konteks WhatsApp pada
  kartu/detail/SSR/SPA/konsultasi, metadata spesifikasi SSR, dan filter/mobile.
  Backend Laravel, SQLite dan media fixture lokal nyata; hanya tujuan eksternal
  `wa.me` diblokir agar tidak membuka/mengirim pesan. Perubahan pilihan rumah
  memeriksa POST analytics nyata dan respons proxy 202 dengan ID pilihan baru.
- Pint, Composer validate/audit lulus. PHPUnit SQLite: 163 test, 1.277 assertion,
  1 skip (18,092 detik); PostgreSQL 17: 163 test, 1.282 assertion (27,254 detik).
  Database pengujian terpisah dari produksi.
- Audit dependensi source masih melaporkan 11 high, 0 critical pada lockfile
  existing yang tidak berubah; audit dependency runtime hasil build: 0 temuan.
- `git diff --check` lulus. Percobaan awal terhambat izin sandbox, setup media
  lokal Windows, locator label dan analytics fixture yang belum aktif. Setelah
  setup lokal dan assertion status proxy dikoreksi, tiga alur browser di atas
  dijalankan ulang dan lulus.

Belum diuji dengan pengiriman pesan WhatsApp aktual atau seluruh klien/cache
WhatsApp. Belum merge/deploy; hasil lokal bukan bukti perubahan sudah produksi.
