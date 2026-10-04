# Flamboyan — arah editorial premium

2026-10-04. Arah dipilih pengguna: **foto besar, tipografi tegas, layout lapang dan berkarakter**. Implementasi berada dalam PR redesign yang sama; belum di-merge atau dideploy.

## Amati → adaptasi

| Situs nyata yang ditinjau | Pengamatan | Adaptasi untuk Flamboyan |
|---|---|---|
| [Aucoot](https://aucoot.com/) | Foto memenuhi hero, nama properti menjadi headline editorial, navigasi sederhana; versi mobile mempertahankan fokus pada gambar | Hero foto lebar, headline serif, batas antarseksi yang tenang dan tindakan utama yang jelas |
| [Inigo](https://www.inigo.com/) | Fotografi dan tipografi memimpin komposisi, warna permukaan hangat, informasi properti ditempatkan seperti editorial | Palet gading–arang, proporsi headline besar, koleksi dengan ritme horizontal lalu dua kolom |
| [Modern House Australia](https://www.modernhouse.co/) | Arsitektur menjadi pusat identitas; judul sangat tegas dan aksen warna hemat | Wordmark baru, aksen terakota terbatas, pengurangan panel dan kartu dekoratif |
| [Pinhome](https://www.pinhome.id/) | Pencarian lokasi mudah ditemukan dan harga/spesifikasi mendukung keputusan pembeli Indonesia | Pencarian tetap hadir di hero, IDR dan spesifikasi tetap terbaca; tidak mengadopsi kepadatan promo/layanan yang di luar lingkup Flamboyan |

Screenshot desktop/mobile ditinjau untuk keempat sumber. The Modern House UK juga dibaca melalui halaman publik, tetapi browser otomatis menerima challenge; tidak mengklaim telah meninjau render browser-nya. Compass tidak menghasilkan render yang dapat dipakai dan tidak menjadi acuan. Screenshot riset berada di ignored `.tools/design-research`; aset situs pesaing tidak dibundel ke aplikasi.

## Keputusan implementasi

- Identitas: wordmark `flamboyan.` dengan DM Serif Display; teks UI Manrope. Font disajikan lokal, tanpa request Google Fonts saat pengguna membuka halaman.
- Warna: latar gading `#f7f5ef`, arang `#292823`, terakota `#873f2d` untuk tindakan. Status tetap memakai label teks dan warna semantik.
- Beranda: hero fotografi lebar dengan pencarian, pengantar editorial, koleksi pilihan, properti sorotan dari CMS, langkah evaluasi, testimonial/rate hanya dari API, lalu kontak Admin. Tidak menambahkan metrik atau klaim penjualan.
- Katalog: dua kolom desktop untuk memberi ruang pada media dan informasi; satu kolom pada layar≤540px. Kartu tanpa bingkai berlebihan, harga tetap menonjol, filter aktif/Back/reset/pagination tetap bekerja.
- Detail: galeri lebar di desktop, deskripsi dan ringkasan dalam dua kolom; mobile mempertahankan harga/kontak sebelum deskripsi. KPR, compare, map consent dan media opsional tetap tersedia.
- Workspace: Manrope, warna permukaan hangat, navigasi dan tabel padat dengan identitas yang sama. Label, role visibility, endpoint dan otorisasi tidak berubah.
- Fokus keyboard, kontrol44px, input mobile16px, hydration guard, Escape, modal native, dan reduced motion dipertahankan.

## Aset, sumber dan penggunaan

### Foto suasana

Foto oleh **Sergei Bezzubov**, [Modern house surrounded by lush tropical foliage](https://unsplash.com/photos/modern-house-surrounded-by-lush-tropical-foliage-Pfp0MP8QB7M). Halaman sumber menyatakan free under [Unsplash License](https://unsplash.com/license); ditinjau 2026-10-04. Dipakai sebagai foto suasana merek, **bukan foto unit dijual**. Caption terlihat dan alt menyatakan ilustrasi, dengan tautan kredit.

Berkas lokal: `apps/web/public/images/editorial-garden-1920.webp` dan `editorial-garden-960.webp`. Sumber pengiriman: `images.unsplash.com/photo-1766937754720-4d30de201fd1`, varian WebP1920/q85 dan960/q80. Tidak menggunakan generator gambar AI. Foto/media properti tetap berasal dari API. Kurasi foto stok untuk fixture demo lokal ditambahkan melalui API media normal sesuai permintaan berikutnya; lihat photo-curation.md. Tidak ada fallback stok bagi unit bisnis.

### Font

[DM Serif Display](https://github.com/google/fonts/tree/main/ofl/dmserifdisplay) dan [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) dari repository resmi Google Fonts. Salinan SIL Open Font License berada di `asset-licenses/dmserifdisplay-OFL.txt` dan `asset-licenses/manrope-OFL.txt`. Berkas font asli disajikan dari `apps/web/public/fonts`; tidak dimodifikasi.

### Copy demo lokal

Copy hero pada database fixture `.tools/dynamic-demo.sqlite` diperbarui melalui UI CMS Admin menjadi “Ruang untuk cerita berikutnya.”, dengan label “FLAMBOYAN · KATALOG DEMO” dan deskripsi yang tetap menyatakan properti demo. Salinan copy sebelumnya tersimpan di ignored `.tools/editorial-cms-before.json`. Ini perubahan fixture lokal, bukan seed produksi atau migrasi. Judul/deskripsi/label tetap dibaca dari API; tidak di-hardcode untuk menimpa CMS.

## Validasi dan batas

Rincian hasil aktual ada pada bagian editorial di `ui-ux-redesign.md`. Screenshot hero diperiksa pada1440/390/320px; gambar lazy-load diperiksa setelah discroll, bukan hanya melalui screenshot halaman panjang yang belum memuat gambar. Overlap testimonial ditemukan dan diperbaiki dengan membatasi grid-area summary hanya di detail-grid. Regresi browser mencakup pemuatan foto dan pemisahan blok testimonial pada320/768/1440px.

Data listing, nama, testimonial dan bank rate tetap dataset sintetis. Foto rumah fixture kemudian diganti dengan fotografi ilustrasi terkurasi, berlabel demo; bukan materi bisnis produksi. Desain tidak mengubah klaim tersebut. Tidak ada font/gambar pesaing yang disalin. Tidak ada dependency aplikasi, migration, endpoint atau otorisasi baru.

Rollback: revert commit editorial dan build ulang Nuxt; jika perlu, kembalikan tiga field copy hero fixture melalui CMS menggunakan snapshot lokal. Tidak perlu rollback database/schema/media listing.


Kurasi fotografi lanjutan: [sumber, lisensi, importer dan rollback fixture](photo-curation.md). Hasil UI final menambahkan foto interior editorial, cover perbandingan dan label ilustrasi.
