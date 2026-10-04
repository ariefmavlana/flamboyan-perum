# Rekonsiliasi brosur dan aturan pembiayaan

Pemeriksaan 5 Oktober 2026. Dokumen dan gambar dari pemilik merupakan sumber konten; tidak menjadi bukti persetujuan bank, status sertifikat, stok, atau kondisi pembangunan. Template, CSS, tema dan susunan halaman dipertahankan. Gambar hunian dan masterplan diekstrak dari brosur tanpa menggambar ulang; diberi keterangan ilustrasi developer.

## Dokumen yang dibaca

- `price list bfi2 01092026.pdf`: satu halaman, teks diekstrak dan seluruh tabel diperiksa secara visual. Judul menyebut mulai 18 Agustus 2026, meskipun nama file mengandung 1 September.
- `Brosur BFI.pdf`: dua halaman berbasis gambar; kedua halaman dirender dan dibaca. Halaman 1 memuat masterplan, pembayaran, fasilitas, kontak dan masa promo; halaman 2 memuat sembilan tipe.
- Dua foto WhatsApp bertanggal 4 Oktober 2026: sisi depan/belakang brosur, fasilitas sekitar, rincian enam tipe, opsi mezanin dan ruang belakang. Tanggal penerimaan bukan perpanjangan masa promo.

## Katalog yang direkonsiliasi

Format tipe adalah **bangunan/tanah**, walaupun kepala tabel price list tertulis LT/LB. Rincian luas pada halaman 2 dan foto brosur menentukan pemetaan ini. Semua harga IDR bulat.

| Tipe | Bangunan / tanah m² | Kavling m | Lantai | KT / KM | Rencana unit | Normal | Program sebelum 30 Oktober | Sesudah 30 Oktober |
|---|---|---|---:|---|---:|---:|---:|---:|
| 36/60 | 36 / 60 | 6 × 10 | 1 | 2 / 1 | 61 | 505.000.000 | 456.700.000 | 530.000.000 |
| 36/72 | 36 / 72 | 6 × 12 | 1 | 2 / 1 | 14 | 555.000.000 | 503.500.000 | 580.000.000 |
| 36/90 | 36 / 90 | 7,5 × 12 | 1 | 2 / 1 | 6 | 662.000.000 | 573.700.000 | 687.000.000 |
| 62/70 | 62 / 70 | 7 × 10 | 2 | 3 / 2 | 31 | 715.000.000 | 647.800.000 | 740.000.000 |
| 62/84 | 62 / 84 | 7 × 12 | 2 | 3 / 2 | 12 | 765.000.000 | 702.400.000 | 790.000.000 |
| 69/80 | 69 / 80 | 8 × 10 | 2 | 3 / 2 | 10 | 795.000.000 | 727.750.000 | 820.000.000 |
| 56/90 | 56 / 90 | 9 × 10 | 1 | 3 / 2 | 15 | 750.000.000 | 690.700.000 | 775.000.000 |
| 56/108 | 56 / 108 | 9 × 12 | 1 | 3 / 2 | 2 | 820.000.000 | 760.900.000 | 845.000.000 |
| 62/140 | 62 / 140 | 14 × 10 | 2 | 3 / 2 | 1 | 985.000.000 | 920.800.000 | 1.010.000.000 |

Jumlah 152 adalah **rencana unit**. Angka 36 di depan brosur adalah kuota promo perdana tipe 36/60, bukan pengganti rencana 61 unit tipe tersebut. Jumlah ini tidak membuktikan tersedia/terjualnya kavling. Katalog diimpor dengan `CHECK_REQUIRED`. Sertifikat tidak disebutkan: tidak mengarang SHM/HGB, koordinat, jarak, waktu tempuh atau tanggal serah terima.

Price list menyebut harga **sebelum** 30 Oktober, biaya program **30.10.2026**, dan harga berikutnya **setelah** 30 Oktober. Penerapan konservatif: harga program terakhir 29 Oktober, biaya program terakhir 30 Oktober, harga/biaya berikutnya mulai 31 Oktober; harga pada 30 Oktober memakai harga dasar dengan catatan konfirmasi, bukan memperpanjang promo secara diam-diam. Admin dapat merevisi periode setelah mendapat ketentuan tertulis developer. Pergantian harga menggunakan tanggal Asia/Jakarta pada list, filter, sort, compare dan detail. Kenaikan Rp25 juta dihitung dari **harga normal**, bukan harga promo.

Promo cash Rp399 juta berakhir 30 September. Cash 1 tahun: Rp250 juta + 11 × Rp21 juta = Rp481 juta. Cash 5 tahun: Rp250 juta + 60 × Rp5,5 juta = Rp580 juta. Seluruh skema September disimpan untuk ditinjau Admin; tidak ditampilkan sebagai penawaran aktif. Booking Rp250 ribu harus dikonfirmasi diperhitungkan/dikembalikan atau tidak. Tidak disamakan dengan DP.

Biaya Rp5 juta/Rp25 juta adalah **program developer** yang sumbernya menyebut KPR, BPHTB, AJB, balik nama, asuransi, notaris dan lainnya. Bukan tarif resmi pajak atau jumlah biaya semua bank. Cakupan, tanggungan, pengecualian dan dokumen akad harus dikonfirmasi; calculator tidak menjumlahkan paket ini dengan biaya bank secara otomatis agar tidak menghitung dua kali.

Fasilitas kawasan dipisahkan dari fasilitas sekitar. Masjid/RTH/olahraga dan fasilitas lainnya ditandai sebagai keterangan/rencana brosur, bukan pemeriksaan lapangan. Nama fasilitas sekitar disalin tanpa jarak. `UPI` dalam daftar tidak diperluas menjadi lokasi kampus tertentu. Masterplan menggunakan jenis media `MASTERPLAN`, terpisah dari denah rumah; warna kavling tidak menjadi status stok.

## Sumber primer KPR dan penerapannya

1. [BI: instrumen makroprudensial](https://www.bi.go.id/id/fungsi-utama/stabilitas-sistem-keuangan/instrumen-makroprudensial/default.aspx) dan [PADG 30/2025](https://www.bi.go.id/id/publikasi/peraturan/Pages/PADG_302025.aspx): pelonggaran LTV/FTV properti berlanjut sampai 31 Desember 2026. Batas maksimum bukan hak setiap pemohon memperoleh kredit; bank tetap menilai agunan dan risiko. Jangan mengubah “tanpa DP developer” menjadi jaminan kredit bank tanpa DP.
2. [OJK: POJK 13/2024 tentang transparansi SBDK](https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Dorong-Pembiayaan-Ekonomi-OJK-Terbitkan-Peraturan-Transparansi-Dan-Publikasi-SBDK-Bagi-Bank-Umum-Konvensional.aspx) dan [publikasi SBDK](https://ojk.go.id/id/kanal/perbankan/pages/Suku-Bunga-Dasar.aspx): SBDK adalah informasi dasar pricing, bukan bunga promo/hasil keputusan kredit individual. Tidak memasukkan SBDK sebagai bunga final calculator.
3. [BCA: KPR Pembelian](https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first), diperiksa 5 Oktober, periode sampai 31 Oktober 2026: referensi fixed 3 tahun 2,75%, minimum tenor 10 tahun; alternatif fixed berjenjang 10 tahun 4% selama 36 bulan, 7,99% selama 36 bulan, 9,99% selama 48 bulan. Tenor maksimum 25 tahun. Floating saat pemeriksaan 11% hanyalah skenario setelah fixed. Provisi 1% plafon; administrasi 0,1% dengan minimum Rp500 ribu/maksimum Rp3 juta; appraisal Rp1,1–1,5 juta. Belum termasuk komponen asuransi/notaris/pajak lainnya. Minimum plafon luar developer kerja sama Rp250 juta diterapkan karena kemitraan proyek belum dibuktikan. Tidak memublikasikan logo/kemitraan BCA.
4. [BTN: KPR Platinum](https://www.btn.co.id/id/individual/kredit-konsumer/produk-kredit/kpr-btn-platinum): rate promo memiliki kelompok pemohon, minimum plafon/tenor, periode dan syarat saldo. Fixed & cap tidak selalu sama dengan bunga fixed pasti di setiap tahap. Informasi ini diteliti, tetapi tidak diimpor sebagai penawaran Flamboyan karena kelayakan program/developer dan floating aktual belum dipastikan.
5. [Mandiri: KPR](https://www.bankmandiri.co.id/kpr): masa tenor, syarat umur/penghasilan dan biaya berbeda menurut pemohon/jenis agunan. Penawaran pegawai institusi/developer tertentu tidak diterapkan ke semua pengunjung. Tidak mengganti bunga produk dengan SBDK Mandiri.

Tidak menganggap proyek ini KPR subsidi/FLPP atau memakai suku bunga flat untuk amortisasi anuitas. Brosur tidak menyebut bank, suku bunga, plafon, appraisal atau masa fixed di balik ilustrasi Rp2,7 juta. Angka ilustrasi disimpan sebagai temuan sumber; tidak dipaksakan menjadi hasil kalkulasi bank.

## Kontrol Admin dan batas kalkulasi

Admin mengatur rate, tahapan fixed, asumsi floating, tenor, batas plafon/LTV bila didukung sumber bank, biaya yang diketahui, sumber HTTPS, tanggal pemeriksaan dan masa berlaku. Rate lama tetap dapat ditinjau internal tetapi tidak tersedia publik setelah kedaluwarsa. Semua perubahan harus diverifikasi ulang, memakai version, fresh active Admin, transaksi dan audit. Marketing tidak dapat mengubah kebijakan ini.

Kernel anuitas memakai sisa pokok dan sisa tenor pada setiap pergantian bunga; suku bunga tahunan produk dibagi 12 untuk perhitungan bulanan sebagaimana konvensi produk. Pembulatan hanya pada tampilan IDR; jadwal mempertahankan presisi internal dan melunasi sisa pokok di bulan terakhir. Angka merupakan estimasi: bank dapat memakai basis hari, pembulatan dan tanggal akad berbeda. Nilai appraisal pengunjung adalah asumsi, bukan penilaian bank. Kolom biaya kosong berarti belum diketahui, bukan gratis. Tidak menghitung persetujuan, skor SLIK atau rasio kemampuan bayar tanpa data/aturan underwriting bank.

Kontak kawasan, fasilitas, spesifikasi tipe, periode harga, biaya program dan skema cash/cicilan developer dapat diperbarui di Admin dengan sumber dan verifikasi. Tidak menambahkan microservice, generic CMS atau GitHub Actions. Rilis produksi Git mengikuti `main`; pekerjaan fitur melalui branch/PR dan pemeriksaan lokal sebelum integrasi.
