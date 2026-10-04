# Kurasi fotografi Flamboyan

2026-10-04. Arah visual: hunian tropis, cahaya alami, kayu/linen/batu, hijau taman dan warna hangat. Foto sumber ditinjau langsung; rendering arsitektur dan kandidat dengan crop yang buruk disisihkan.

## Sumber dan lisensi

Semua sumber berikut menyatakan **Free to use under the Unsplash License**, ditinjau 2026-10-04. [Lisensi Unsplash](https://unsplash.com/license). Bukan aset Unsplash+ dan bukan hasil generator gambar. Manifest sumber CDN, fotografer, ID dan deskripsi berada di [scripts/demo-photos.json](../scripts/demo-photos.json).

| Foto | Fotografer/sumber | Penggunaan |
|---|---|---|
| Teras rumah di antara taman tropis | [Duc Van](https://unsplash.com/photos/ivCOe4FjNVA) | Eksterior demo |
| Fasad putih dengan taman hijau | [You Le](https://unsplash.com/photos/I7fSJgJh3w8) | Eksterior demo |
| Rumah modern dengan balkon dan pohon palem | [Rodrigo Rodrigues](https://unsplash.com/photos/Oh921Hu-V48) | Eksterior demo |
| Kamar tidur bernuansa batu, rotan, dan linen | [Marvin Meyer](https://unsplash.com/photos/fBdlytm6Hp8) | Interior demo |
| Ruang duduk dengan cahaya sore yang hangat | [Polina Kuzovkova](https://unsplash.com/photos/iq2CirhoVck) | Interior demo |
| Kamar tidur dengan kayu alami dan kanopi linen | [Alexander Davies](https://unsplash.com/photos/bZiEqGxDtAw) | Interior demo |
| Halaman dalam rumah dengan kolam dan material alami | [Marvin Meyer](https://unsplash.com/photos/cjhuXRtRT0Y) | Eksterior demo |

Foto ruang duduk Polina juga disajikan sebagai aset editorial lokal WebP960/1920 di beranda, dengan kredit terlihat dan tautan sumber. Hero Sergei Bezzubov tetap digunakan; sumbernya ada di [editorial-direction.md](editorial-direction.md). Total delapan foto sumber termasuk hero.

## Data demo dan penyajian

- Seluruh24 properti DemoSeeder lokal mendapat3 foto (72 entri media): satu eksterior dan dua interior. Pool foto digunakan ulang sebagai ilustrasi; bukan satu set dokumentasi rumah yang sama. Harga, lokasi, ukuran dan isi demo tidak menyatakan bahwa bangunan di foto ditawarkan.
- Foto diimpor melalui API Admin dengan CSRF, version guard, validasi file, worker dan audit normal. Varian WebP640/1280/1920 berasal dari pipeline media. Tidak ada hotlink, URL-fetch backend atau fallback stok yang menimpa foto bisnis.
- Alt setiap foto dimulai dengan “Ilustrasi demo ·”, menyertakan deskripsi, fotografer, Unsplash ID, dan “Bukan foto unit dijual.” Kartu, sorotan dan perbandingan menampilkan label ilustrasi berdasarkan keterangan media; galeri menampilkan kredit lengkap.
- Foto sintetis lama hanya di-unpublish setelah semua pengganti READY; tidak dihapus. Denah sintetis tetap berlabel denah demo. Properti di luar pola dan marker DemoSeeder tidak disentuh. Status published/draft/archived tidak berubah.
- Kartu list hanya menerima cover menurut kontrak existing; detail menerima galeri lengkap. UI tetap mempunyai empty state jika media unit belum tersedia.

## Mengulangi kurasi lokal

Jalankan setelah setup [demo-data.md](demo-data.md), frontend3000, API dan worker media aktif. Script hanya menerima APP_ENV local/testing, koneksi SQLite, dan DB_DATABASE absolut yang menunjuk ke .tools/dynamic-demo.sqlite dalam checkout ini. Dependensi dev web harus sudah terpasang.

Set environment CURATE_DEMO_PHOTOS=1 dan DEMO_PASSWORD melalui mekanisme lokal privat, lalu jalankan node scripts/curate-demo-photos.mjs dari root. Jangan menyimpan password dalam source, argumen CLI, atau dokumentasi. Script memeriksa opt-in sebelum mengunduh atau melakukan mutasi.

Script memilih slug demo-16karakter, judul Rumah Demo, dan description DATA DEMO sekaligus. Tidak melakukan reseed atau reset database. Foto yang sudah ada dicocokkan dengan alt; run ulang melanjutkan tanpa duplikasi. Request dijeda agar di bawah120/minute. Jika worker gagal/berhenti, cover lama tetap tersedia dan script berhenti untuk diperbaiki.

Sumber unduhan dan snapshot metadata media sebelum kurasi tersimpan dalam ignored .tools/curated-photos. Media hasil upload berada dalam storage privat normal; tidak di-commit. Hanya dua aset editorial statis yang dibundel.

## Rollback

Revert perubahan UI/aset lalu build ulang untuk rollback tampilan. Untuk fixture, melalui Media Manager aktifkan kembali published/position media lama sesuai before-ID.json dan nonaktifkan foto ber-alt Ilustrasi demo; semuanya menggunakan versi properti terbaru. Tidak menghapus media, mengembalikan seluruh DB, atau menjalankan migrate:fresh. Tidak ada migrasi/schema/API baru.
