# Draft pemberitahuan privasi Bukit Flamboyan Indah 2

**Untuk ditinjau pemilik; belum disahkan dan belum mengaktifkan formulir, tracking, atau anonimisasi produksi.** Versi usulan `2026-10-17-draft-1`. Nama publik dan kontak dapat mengikuti CMS yang diterbitkan Admin; nama publik bukan pernyataan identitas badan hukum yang belum dikonfirmasi.

## Pengelola dan kontak

Layanan konsultasi situs dikelola dengan nama publik Bukit Flamboyan Indah 2. Kontak pertanyaan dan permintaan privasi: WhatsApp 0822-1479-5024. Pertanyaan dapat dikirim 24 jam setiap hari; balasan menyesuaikan ketersediaan Admin. Permintaan kunjungan masih memerlukan konfirmasi, bukan booking otomatis.

## Informasi dan tujuan

Formulir meminta nama, nomor WhatsApp, pilihan tipe, tujuan konsultasi, serta pesan dan preferensi kunjungan bila diisi. Informasi digunakan untuk menanggapi permintaan, menghubungkan pertanyaan berulang yang relevan, dan menindaklanjuti minat hunian melalui Admin serta Marketing yang ditugaskan. Jangan memasukkan KTP, dokumen rekening, kata sandi, data kesehatan atau rincian finansial sensitif pada pesan formulir.

Pilihan menerima promosi bersifat opsional. Menolak promosi, analitik atau pengukuran iklan tidak menghalangi konsultasi. Pilihan cookie dan izin menerima promosi diperlakukan terpisah. Nama, nomor WhatsApp dan pesan tidak dikirim sebagai parameter event analitik browser. Klik WhatsApp atau pengiriman form tidak dihitung sebagai akad.

## Akses dan penyedia

Catatan inquiry/CRM tidak tersedia kepada pengunjung. Akses dibatasi Admin dan Marketing sesuai penugasan. Infrastruktur menggunakan hosting aplikasi, Supabase untuk database dan Cloudflare R2 privat untuk media. Perpindahan hosting ke Hostinger baru akan dilakukan setelah verifikasi. Media katalog yang dipublikasikan dapat dilihat publik; kontak calon pembeli tetap internal.

WhatsApp memproses informasi saat pengunjung menggunakan layanannya. Situs mempunyai video YouTube dan media tertanam sebagaimana dijelaskan pada halaman privasi aktual. Bila Google Analytics/Ads atau Meta kelak diaktifkan, pilihan analitik/marketing menentukan teknologi opsional yang dimuat. Penyedia, pengaturan data dan pemrosesan lintas negara harus ditinjau sebelum notice final; versi ini tidak mengesahkan tracker atau transfer data baru. Tidak ada pengunggahan kontak/offline conversion/CAPI dalam fase pertama.

## Usulan penyimpanan dan minimisasi

| Data | Usulan dan pemicu |
| --- | --- |
| Inquiry belum direkonsiliasi | Anonimisasi kontak/pesan setelah 30 hari sejak dibuat; menjadi EXPIRED. |
| Inquiry ditolak sebagai spam | Anonimisasi setelah 7 hari sejak keputusan penolakan. |
| Inquiry telah ditautkan/diterima | Anonimisasi salinan kontak/pesan setelah 90 hari sejak rekonsiliasi, atau saat lead terkait dianonimkan. Lead dapat tetap diperlukan untuk tindak lanjut yang sah. |
| Lead berstatus DEAL/LOST | Tinjauan Admin untuk anonimisasi setelah 24 bulan tanpa aktivitas; tidak otomatis menghapus lead aktif atau dokumen transaksi yang memiliki kewajiban penyimpanan tersendiri. |
| Konteks kampanye di browser | Maksimal 30 hari setelah consent yang sesuai; dibersihkan saat penolakan/pencabutan pilihan opsional. Tidak menyimpan click ID provider pada fase ini. |
| Pilihan consent browser | Maksimal 180 hari, dengan pembaruan pilihan bila versi berubah. |

Anonimisasi menghapus kontak serta meredaksi catatan terkait sesuai kemampuan aplikasi. Metadata audit yang diminimalkan dan penanda idempotency dipertahankan untuk integritas histori serta pencegahan duplikasi; ini bukan janji seluruh metadata dihapus. Umur backup, log dan metadata audit/tombstone, dasar pemrosesan, serta pengecualian transaksi **masih harus ditetapkan sebelum persetujuan final**. Durasi usulan merupakan pilihan operasional untuk ditinjau, bukan klaim minimum hukum.

## Permintaan dan perubahan

Pengunjung dapat menghubungi Admin untuk permintaan informasi, pemeriksaan, koreksi atau penghapusan kontak. Tim memverifikasi permintaan secara proporsional dan mencatat penanganannya; tidak meminta dokumen identitas melalui formulir publik. Permintaan dengan data transaksi atau kewajiban penyimpanan perlu ditinjau sebelum tindakan. Penarikan pilihan opsional berlaku bagi pengukuran berikutnya; tidak menjanjikan penghapusan data provider terdahulu tanpa proses yang sesuai.

Sebelum diterbitkan sebagai notice final, pemilik perlu menetapkan identitas pengelola yang bertanggung jawab, dasar pemrosesan, durasi backup/log/audit, pengecualian transaksi, prosedur permintaan, serta pengaturan penyedia. Setelah isi disahkan, samakan versi notice dan konfigurasi backend sebelum membuka intake.

Referensi untuk peninjauan: [UU 27/2022 pada JDIH Kemkomdigi](https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/). Rujukan ini tidak menjadikan draft sebagai hasil pemeriksaan kepatuhan atau menetapkan angka retensi di atas sebagai kewajiban hukum.
