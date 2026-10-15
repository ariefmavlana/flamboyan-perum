# Akun produksi dan KPR BNI/BSI — 16 Oktober 2026

Revisi ini menggantikan pernyataan 15 Oktober bahwa program BSI Rp3,7 juta berlaku untuk semua tipe. Pemilik membatasi program tersebut ke **36/60** dan mengonfirmasi BNI/BSI sebagai bank rekanan. Pemilik juga menyatakan tabel penawaran bank belum tersedia; parameter harus dapat diisi Admin kemudian, tanpa tarif hardcoded atau dummy.

## Perhitungan dan sumber primer

Diperiksa 16 Oktober 2026:

- [BNI Griya Pembelian](https://www.bni.co.id/id-id/individu/pinjaman/bni-griya/bni-griya-pembelian) memberi ketentuan pembelian rumah dan tenor sampai 30 tahun; promo Q3 mensyaratkan dokumen lengkap paling lambat 30 September 2026. Angka promo itu tidak diimpor sebagai tarif proyek.
- [Simulasi resmi BNI wondrX](https://wondrx.bni.co.id/simulasi_kpr) memakai harga, DP dan tenor. Kernel anuitas memakai pokok `P = harga aktif − DP`, bunga bulanan `r = bunga tahunan/1200`, `A = P*r/(1−(1+r)^−n)`. Pada perubahan bunga, angsuran dihitung ulang dari sisa pokok dan sisa bulan; bunga floating masa depan merupakan skenario eksplisit. Bunga nol memakai `P/n`.
- [BSI Griya](https://www.bankbsi.co.id/produk&layanan/produk/bsi-griya) membedakan murabahah (jual beli dengan harga dan margin disepakati) dan MMQ (kepemilikan bersama berkurang). Simulator murabahah **angsuran sama** memakai `(harga − DP + total margin akad)/bulan`; tidak mengubah margin flat tahunan menjadi bunga efektif, tidak meniru MMQ atau angsuran berjenjang, dan tidak mengarang alokasi pokok/margin bulanan.
- [Special Price BSI](https://www.bankbsi.co.id/index.php/promo/mudah-punya-rumah-dengan-margin-spesial-dan-dapatkan-rekening-bsi-emas-tanpa-diundi) terbatas pada segmen nasabah/developer terpilih. Tidak dianggap otomatis berlaku di Flamboyan.

Harga selalu memakai `price_idr` publik yang sudah memperhitungkan program harga/tanggal WIB. Pembulatan tampilan IDR tidak mengubah saldo internal. Biaya, akad, appraisal, kemampuan bayar, pembulatan/jadwal final mengikuti penawaran bank; kalkulator bukan persetujuan kredit. Program pemilik Rp3,7 juta ×180=Rp666 juta hanya informasi angsuran 36/60, bukan harga rumah atau dasar mengarang DP/margin.

## Pengisian Admin dan kontrak API

Admin → Konten publik → Pembiayaan BSI & BNI:

- `REFERENCE_ONLY`: informasi bank sebelum penawaran tersedia; tanpa nominal angsuran, tenor maupun margin.
- `FIXED_INSTALLMENT`: BSI, `house_types: ["36/60"]`, angsuran bulanan dan tenor. Backend menolak tipe/bank lain; record legacy tanpa scope tidak dipublikasikan.
- `MURABAHAH_QUOTE`: BSI, tepat satu `house_types`, `price_idr`, `down_payment_idr`, `total_margin_idr`, `tenor_months`. Harga/DP/margin IDR integer, 0≤DP<harga, margin≥0, tenor 12–360 bulan kelipatan12. Ini penawaran angsuran sama, bukan MMQ/berjenjang. Angsuran dihitung, tidak diisi dengan angka terpisah yang dapat bertentangan. Pilihan penawaran pada detail hanya tersedia bila tipe dan harga aktif sama; harga berubah memerlukan penawaran baru.

Admin → Konten publik → Referensi KPR menyediakan bunga/tahapan fixed, floating, masa berlaku, batas tenor/plafon/LTV, sumber dan biaya BNI existing. Kalkulator hanya menawarkan referensi BNI. BSI tidak memakai bunga konvensional. Tanpa penawaran, tidak ada bunga/margin default 8%/12%; pengguna dapat memasukkan parameter penawaran sendiri yang diberi label. DP awal20% hanya asumsi eksplisit yang dapat diubah, bukan minimum bank.

Semua perubahan memakai endpoint CMS existing `/api/v1/internal/content`, Admin fresh lock, attestation publikasi, optimistic version409 dan audit atomik. Public `financing_programs` memakai allowlist dan menambah field di atas, tanpa identitas pemilik/Marketing/aktor. Tidak ada migrasi/dependency baru. Data program awal di manifest diimpor ke CMS, bukan menjadi fallback katalog atau angka kalkulator.

## Seeder akun produksi

Default `DatabaseSeeder` tetap kosong. Jalankan eksplisit `php artisan db:seed --class=ProductionAccountSeeder --force` pada target yang sudah diperiksa. Rahasia `PROVISION_ADMIN_PASSWORD` dan `PROVISION_MARKETING_PASSWORD` disediakan lewat environment privat sebelum bootstrap (atau secret manager yang sesuai), bukan argumen CLI, repo, log, atau body PR. Seeder membuat Andre `andre@admin.com` ADMIN dan Marketing1 `marketing1@arief.com` MARKETING, aktif, dengan password hashed. Tidak membuat properti/CRM/media/konten demo. Seluruh password divalidasi sebelum transaksi. Akun existing role/status cocok dipertahankan beserta passwordnya; konflik membatalkan seluruh transaksi. Tidak dijalankan otomatis pada build/deploy.

Produksi existing memakai dua akun operasional beralamat lama. Peralihan email/password dilakukan melalui operasi owner terkontrol memakai AccountOperations existing agar ID, kepemilikan properti dan histori tetap utuh; audit, optimistic version dan pencabutan sesi/reset token tetap berlaku. Tidak membuat akun duplikat atau meninggalkan akun beralamat fixture aktif. Seeder kemudian dijalankan ulang sebagai pemeriksaan idempotensi pada kedua akun target.

## Validasi dan rollout

Bukti lokal dan hasil rollout dicatat setelah pemeriksaan selesai. PHP8.4.26, Node24.21.0 dan PostgreSQL17 test terisolasi. Tidak menjalankan suite RefreshDatabase terhadap produksi. Snapshot metadata akun tanpa password/hash/token dan snapshot konten privat sebelum perubahan akun/konten, transaksi dan pemeriksaan ulang harus mendahului apply. GitHub Actions tidak digunakan. Produksi Vercel mengikuti merge ke main setelah PR direview dan kedua build lolos.

Rollback source: revert PR dan redeploy Git. Rollback CMS: pulihkan payload dari snapshot melalui operasi versioned/audited, tetap batasi BSI Flat ke36/60. Jangan mengaktifkan kembali kredensial lama secara otomatis atau restore seluruh database di atas aktivitas bisnis baru; perbaikan akun melalui prosedur owner dan revocation sesi.


Hasil lokal final: Pint lulus; PHPUnit **121 tests/970 assertions** pada SQLite memory (14,392s) dan PostgreSQL17 database test terisolasi (23,421s, cluster dihentikan). Composer validate strict lulus/audit0. Node24.21.0: lint0warning, typecheck, **50 unit/11file**, build node-server/proxy lulus (12,17s pada build harness terakhir). Importer19tes lulus. Audit source tetap FAIL11high/0critical yang sudah ada; audit artefak runtime0. Tidak ada perubahan dependency/lockfile source.

Browser Chrome390px: kelima tipe memiliki BNI/BSI, Flat hanya36/60, tanpa tarif dummy/overflow; angsuran anuitas cocok harga aktual; penawaran BSI dibuat melalui UI Admin dan dipakai kalkulator dengan parameter terkunci; penawaran dengan harga berbeda disembunyikan. Sembilan pemeriksaan lulus, 0 pageerror. Harness awal dikoreksi untuk document root/port build proxy, locator tombol dan header Sanctum; burst gambar sempat memicu limiter test. Uji akhir memakai cache fixture tersendiri yang dibersihkan, tanpa meminta gambar yang tidak termasuk cakupan KPR. Tidak mengubah limiter aplikasi atau mengklaim pengujian media/cross-browser/WCAG penuh. Vitest awal di sandbox terhalang EPERM rename cache; pengulangan di luar sandbox lulus.

Operasi akun produksi selesai 16 Oktober 2026 00:42:44 WIB: dua akun diperbarui melalui AccountOperations, ID1/2 dan role dipertahankan, sesi/reset token lama dicabut, hash diverifikasi di proses tanpa diekspor, dan seeder opt-in dijalankan sebagai uji idempotensi. Tidak ada akun beralamat lama tersisa. Pemeriksaan HTTP login200, logout204 dan sesi401 lulus untuk kedua akun; akses daftar akun Admin200/Marketing403. Password dikirim lewat stdin, tidak disimpan dalam berkas/source/log. Snapshot akun hanya metadata tanpa password/hash/token. Publikasi CMS dan verifikasi deployment dilakukan sesudah merge; hasilnya dicatat pada PR.
