# Mengelola katalog dan pembiayaan

Masuk melalui `/login` dengan akun ADMIN. MARKETING mengelola properti sendiri dan lead assigned; konfigurasi komersial serta CMS kawasan/bank hanya dapat disimpan ADMIN. Password tidak dicantumkan pada dokumentasi repository.

## Spesifikasi, harga dan pembayaran

1. Buka workspace → Properti, cari tipe, kemudian pilih **Edit properti** pada baris yang sesuai.
2. Harga pada form utama adalah harga dasar/normal. Pada bagian **Spesifikasi, harga & pembayaran**, isi lantai, dimensi kavling, jumlah unit rencana dan fitur dari sumber. Jumlah rencana bukan stok. Status **Konfirmasi unit** dipakai bila stok belum diperiksa.
3. Isi harga program beserta tanggal mulai/akhir. Harga berikutnya mempunyai tanggal mulai sendiri, setelah akhir program. Nilai kosong berarti tidak ada jadwal tersebut. Publik memakai harga sesuai hari Asia/Jakarta; filter, sort, detail dan compare memakai harga yang sama. Jangan mengisi tanggal perpanjangan tanpa ketentuan developer.
4. Biaya program developer mempunyai tanggal mulai/akhir dan biaya berikutnya tersendiri. Jelaskan cakupan dan pengecualian. Nominal kosong berarti belum diketahui, bukan gratis; biaya ini tidak otomatis ditambahkan ke biaya bank.
5. Bila ada skema cash/cicilan developer, isi pembayaran awal, jumlah bulan, angsuran dan total, masa berlaku, kuota dan sumber. Total harus sama dengan pembayaran awal + bulan × angsuran. Skema cash harus bulan/angsuran0; skema cicilan minimal1bulan. Skema expired dapat dilihat Admin tetapi tidak ditampilkan publik.
6. Tinjau sumber, tanggal dan catatan, centang verifikasi, lalu **Simpan spesifikasi & pembayaran**. Mengubah field membatalkan centang verifikasi. Jika muncul409, muat ulang dan tinjau perubahan terbaru sebelum menyimpan kembali.

Katalog awal mengikuti sembilan tipe/152unit rencana pada dokumen pengguna. Promo cash September disimpan sebagai arsip; price list memiliki periode berbeda. Harga30Oktober tidak eksplisit: saat ini memakai harga normal dengan catatan konfirmasi. Detail rekonsiliasi ada di [brochure-kpr-research.md](brochure-kpr-research.md).

## Kawasan, kontak dan media

Pada workspace → Konten, pilih **Kawasan & kontak**. Kelola nama proyek/pengembang/alamat, WhatsApp format62, situs, jumlah rencana/tipe, fasilitas kawasan dan fasilitas sekitar (satu item per baris), sumber/tanggal/catatan. Bedakan rencana kawasan dari fasilitas yang sudah diperiksa. Jangan mengarang koordinat, jarak atau waktu tempuh. Record terverifikasi dan published pertama menurut urutan menjadi konfigurasi publik, termasuk CTA WhatsApp; perubahan terlihat tanpa rebuild.

Foto/desain brosur diberi label ilustrasi. Upload **Masterplan** sebagai jenis terpisah dari **Denah**, karena peta kavling bukan denah bangunan. Editor media memakai R2 private melalui API; gambar diproses menjadi WebP oleh function cloud, kemudian pilih publication yang diperlukan. Unpublish/archive mencabut akses publik. PDF memerlukan scanner malware; scanner belum tersedia di hosting ini, sehingga unggahan PDF tidak dapat dipublikasikan. Jangan melewati pemeriksaan itu. Konten PDF yang relevan sudah direkonsiliasi menjadi data katalog; promo lama tidak dijadikan brosur aktif.

## Referensi KPR bank

Pada workspace → Konten, edit jenis referensi bunga bank. Isi nama bank/produk, sumber resmi HTTPS, tanggal pemeriksaan, tanggal mulai/akhir, bunga awal dan total bulan fixed. Rate hanya tampil publik saat terverifikasi, published dan berada dalam masa berlaku.

Jika fixed bertahap, isi setiap durasi bulan dan bunga. Bunga tahap pertama harus sama dengan bunga awal; jumlah seluruh durasi harus sama dengan bulan fixed. Contoh referensi yang diteliti:36bulan4%,36bulan7,99%,48bulan9,99%, sehingga fixed120bulan. Kalkulator menghitung ulang dari sisa pokok pada bulan37/73, bukan dari plafon awal. Asumsi floating sesudah fixed dapat diubah pengunjung; rate saat pemeriksaan bukan jaminan rate masa depan.

Isi syarat produk/kelompok pemohon, minimum/maksimum tenor dan plafon, serta LTV hanya jika didukung sumber. LTV adalah batas terhadap nilai appraisal, bukan jaminan bank menyetujui tanpa DP. Referensi BCA memakai minimum plafon luar developer kerja sama karena kemitraan proyek belum dibuktikan. Jangan memublikasikan logo/kemitraan dari referensi rate saja.

Komponen biaya opsional: provisi, administrasi persentase/minimum/maksimum, appraisal minimum/maksimum. Kosongkan nilai yang belum diketahui. Asuransi, notaris, pajak atau biaya lain yang tidak terhitung tetap dijelaskan pada syarat; kalkulator tidak menyatakan total biaya pasti dan tidak menjumlahkan paket developer secara otomatis. Perpanjangan atau perubahan rate membutuhkan pemeriksaan sumber dan verifikasi ulang. Tombol simpan tidak memeriksa otomatis apakah tautan bank masih memuat penawaran yang sama.

## Perubahan kode

Perubahan isi Admin/CMS langsung tersimpan di Supabase/R2. Perubahan aplikasi memakai branch baru dari main terbaru, Conventional Commit, validasi lokal dan PR. Sesudah PR lolos review dan merge diotorisasi, Vercel membangun produksi dari `main`; build yang gagal tidak mengganti alias. Tidak memakai GitHub Actions atau seed produksi.
