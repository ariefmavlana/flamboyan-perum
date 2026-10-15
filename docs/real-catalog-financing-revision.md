# Revisi lima tipe dan pembiayaan — 15 Oktober 2026

Instruksi pemilik menggantikan katalog sembilan tipe dan referensi BCA sebelumnya. Tipe aktif: **36/60, 36/90, 56/90, 62/70, 69/80**. Pemilik mengonfirmasi draf `weje` sebagai data uji dan angsuran BSI **Rp3.700.000/bulan selama 180 bulan untuk semua lima tipe**. DP, plafon dan biaya belum diberikan; total Rp666.000.000 adalah jumlah angsuran, bukan harga rumah. Harga/spesifikasi existing kelima tipe tidak diganti dengan asumsi.

## Riset BNI

Diperiksa 15 Oktober 2026 melalui sumber primer:

- [BNI Griya Pembelian](https://www.bni.co.id/id-id/individu/pinjaman/bni-griya/bni-griya-pembelian) mencakup pembelian rumah baru dengan tenor rumah tinggal hingga 30 tahun, bergantung kemampuan bayar dan batas usia. Pengajuan proyek ini memerlukan penawaran berdasarkan tipe/harga, DP, appraisal dan dokumen pembeli, termasuk Surat Pemesanan Rumah. Tarif Q3 di halaman resmi mensyaratkan kelengkapan dokumen paling lambat 30 September 2026; tidak dianggap berlaku pada 15 Oktober.
- [Promo wondrX 2026](https://wondrx.bni.co.id/program-promo/program-bni-griya-khusus-pengajuan-melalui-website-bni-wondrx-2026-2b72bchfq) menampilkan periode hingga 31 Desember, tetapi syarat pengajuan masih menyebut 30 September. Program terbatas pada developer peserta; Bukit Flamboyan Indah 2/PT Batu Wangi Indah tidak tercantum dalam daftar yang ditampilkan. Karena tanggal tidak konsisten dan cakupan proyek belum terbukti, bunga promonya tidak dimasukkan sebagai tarif Flamboyan.

BNI ditampilkan sebagai informasi produk dengan tarif proyek menunggu konfirmasi. Kalkulator anuitas tetap berupa asumsi manual terpisah. Tidak mengarang bunga, DP minimum, floating atau biaya BNI; tidak mengubah angsuran BSI menjadi bunga efektif rekaan.

## Implementasi

Schema CMS `FINANCING_PROGRAM` menggunakan SiteContent existing, Admin-only, attestation publikasi, optimistic version dan audit transaksi. Metode `FIXED_INSTALLMENT` mewajibkan nominal/tenor integer positif; `REFERENCE_ONLY` melarang keduanya. Unknown keys ditolak, source HTTPS opsional, tanggal pemeriksaan tidak boleh di masa depan. Public DTO memakai allowlist tanpa identitas aktor. Tidak ada migration atau dependency baru.

Komponen pembiayaan digunakan di kawasan dan detail properti. CTA mempertahankan konteks Bukit Flamboyan Indah 2 serta topik pembiayaan. BANK_RATE existing tetap mendukung referensi anuitas resmi bertanggal, sementara record BCA lama dihapus dari konfigurasi proyek. Data awal yang telah direkonsiliasi ada di `scripts/flamboyan-financing-programs.json`; publikasinya melalui dua POST CMS setelah backend/web PR ini terdeploy, bukan seed produksi. Sampai saat itu, informasi BSI dan status BNI sudah tercantum pada HERO live.

## Pembersihan live

Selesai **2026-10-15 13:30:16 Asia/Jakarta** pada database produksi melalui TLS verify-full. Snapshot privat ignored dibuat sebelum perubahan, dibatasi ACL akun pemilik; SHA-256 canonical dataset `75b9235d07a7e8e73621ca66f0a8c81152b2f55a2785a032d60c1789d85162b8`. Bukti/jurnal privat berada di `.tools/revision-20261015`.

| Data | Dihapus | Tersisa |
|---|---:|---:|
| Properti | 29 (24 seed, 4 tipe dicabut, draf weje) | 5 published |
| Lead sintetis | 72 | 0 |
| Histori lead sintetis | 338 | 0 |
| Notifikasi sintetis | 198 | 0 |
| Akun Marketing uji tambahan | 2 | 2 akun operasional total |
| Konten placeholder/referensi BCA | 8 | HERO + DEVELOPMENT |
| Media terkait listing yang dihapus | 135 record | 80 record, termasuk 55 gambar EDITED |
| Audit khusus fixture | 346 | Audit bisnis/operasi tetap tersimpan |

Pengenalan fixture memakai snapshot seed terdahulu, slug/tipe, nomor sintetis `628000…`, akun uji exact dan konfirmasi pemilik untuk weje. Rencana gagal bila dataset berubah. Snapshot, lock tabel singkat, pemeriksaan hash ulang, delete FK berurutan, pembaruan konten versi dan audit dilakukan dalam satu transaksi. Rehearsal pertama tertahan akibat nama koneksi clone pada tooling privat; dihentikan dan hash dataset terbukti identik dengan snapshot. Nama koneksi dibetulkan, rehearsal berhasil dengan rollback, kemudian apply berhasil. Tidak ada endpoint penghapusan histori atau perubahan aturan CRM.

Objek R2 tidak dihapus: tetap privat untuk pemulihan terkontrol. Lima sampul dan lima denah diperiksa visual; seluruh 60 file EDITED yang tercantum manifest cocok SHA sumber (58 gambar + 2 video tertunda). Seluruh 55 gambar live cocok receipt impor byte-for-byte; per tipe: 9/8/10/14/9 PHOTO dan masing-masing satu FLOOR_PLAN. Semua gambar berada di folder sumber tipe yang sesuai. Folder mentah yang disalin ulang ke public diarsipkan reversibel ke `.tools/revision-20261015/owner-EDITED` agar sumber/MP4 tidak ikut build. Angka 152 unit dipertahankan sebagai rencana brosur lama dengan keterangan eksplisit, bukan stok hasil revisi.

## Validasi

Runtime: PHP 8.4.26, PHPUnit 12.5.39, Node 24.21.0, PostgreSQL 17 lokal terisolasi. Hasil final dicatat pada status implementasi dan PR. Kredensial, database, snapshot, sumber mentah dan output runtime tidak di-commit. GitHub Actions tidak digunakan.

| Pemeriksaan yang dijalankan | Hasil |
|---|---|
| `php vendor/bin/pint --test` | Lulus |
| `php vendor/bin/phpunit` (SQLite memory) | 116 tes/932 assertion, 17,131s |
| `php vendor/bin/phpunit` (PostgreSQL test lokal) | 116 tes/932 assertion, 28,364s; cluster dihentikan |
| `php composer.phar validate --strict` / `audit --format=json` | Valid / 0 advisori |
| `node --test scripts/import-flamboyan-assets.test.mjs` | 19 lulus |
| `npm run lint`, `typecheck`, `test`, `build` | Lulus; 48 unit/11 file |
| `npm audit` / audit runtime `.output/server --omit=dev` | Source FAIL 11 high/0 critical existing; runtime 0 |
| Browser kandidat via CUA | Lima tipe; BSI 3,7 juta/180 bulan; BNI tanpa angka rekaan; CTA dengan kawasan/topik; Admin/Marketing empty state; form BSI/BNI dan conditional fields |
| API live melalui sesi/CSRF | Kedua peran: login200, 5 properti, 0 lead/notification; logout204, sesi401; list akun Admin200/Marketing403 |
| HTTP/hash gambar live | 55/55 cocok receipt; 0 gambar rusak |

Pengujian PHPUnit awal di sandbox tidak bisa membaca bootstrap vendor; dijalankan ulang di luar sandbox pada SQLite memory, tanpa mengubah proteksi aplikasi. Fixture tes baru awalnya memakai akun inactive dan menghasilkan403; fixture dikoreksi sesuai kontrak akun aktif sebelum suite final. Pemeriksaan browser manual tidak diklaim sebagai seluruh suite Playwright/cross-browser/WCAG. Riset BNI belum menghasilkan penawaran bank khusus proyek; konfirmasi komersial itu tetap diperlukan.

Rollback source: revert PR dan redeploy melalui Git. Rollback data harus meninjau snapshot privat, memastikan belum ada lead/record bisnis baru yang berbenturan, lalu memulihkan record terpilih dalam urutan FK dan transaksi dengan audit baru. Jangan restore seluruh database di atas aktivitas bisnis baru. R2 retained memungkinkan pemulihan media tanpa upload ulang; primary account/password tidak diubah oleh cleanup.
