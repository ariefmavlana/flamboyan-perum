# Spesifikasi Google Search dan Meta Ads

Status: DRAFT / PLANNED. Arah pengguna: Google Search lebih dulu, total Rp500.000 satu bulan, calon pembeli Kota Bandung, BFI2, WhatsApp+form, tujuan akhir akad. Sumber resmi berada pada [register](README.md); proses lead mengikuti [CRM](measurement-crm-spec.md).

## 1. Anggaran dan batas keberhasilan

| ID     | Keputusan/requirement                                    | Konsekuensi                                                                                                                         |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ADS-01 | Rp500.000 total awal untuk satu bulan                    | Google media mendapat alokasi awal; Meta paid0; tidak mengikuti budget historis Rp2juta                                             |
| ADS-02 | Hosting dan domain di luar anggaran media                | Harga paket, renewal, pajak dan biaya pembayaran harus dilaporkan terpisah                                                          |
| ADS-03 | Belum jelas Rp500.000 termasuk pajak/biaya tagihan       | Sebelum aktivasi, konfirmasi biaya aktual; default konservatif total uang keluar≤Rp500.000, sehingga media bersih dapat lebih kecil |
| ADS-04 | Target bisnis sampai akad                                | Bukan target minimum akad yang dijamin dalam bulan pertama; ukur funnel dan cohort                                                  |
| ADS-05 | Tidak ada estimasi CPC, CPL atau jumlah lead tanpa riset | Gunakan Keyword Planner/akun dan data aktual; skenario diberi label asumsi                                                          |

G-08 menjelaskan average daily budget, limit bulanan kalender umumnya30,4×daily dan kemungkinan belanja harian hingga 2× daily. Rp500.000/30,4≈Rp16.447 adalah kalkulasi teoritis media tanpa pajak/biaya, **bukan rekomendasi memasukkan angka tersebut tanpa memeriksa tagihan**. Cap30 hari bergulir juga tidak otomatis sama dengan limit bulan kalender.

ADS-06: Tetapkan tanggal mulai/akhir eksplisit, timezone Asia/Jakarta bila akun mengizinkan pilihan awal, media bersih setelah biaya diketahui, dan satu pemilik kontrol spend. Periksa apakah campaign total budget tersedia untuk tipe kampanye/akun; jika tidak, gunakan daily budget konservatif+end date+monitoring cumulative. Jangan mengasumsikan end date atau automated rule menjamin nol latency/overspend.

ADS-07: Alert/review spend pada80% dan90% dari cap uang keluar; hentikan sebelum cap bila ada delivery/reporting lag. Review harian selama uji kecil, rekonsiliasi billing dan pajak, catat setiap perubahan budget. Jangan mengubah daily budget berkali-kali tanpa menghitung ulang sisa anggaran; pemilik menyetujui aktivasi/billing secara terpisah setelah hasil setup reviewable.

## 2. Setup akun dan kepemilikan

ADS-08: Pemilik bisnis memiliki domain, Google Ads, GA4, GTM, Search Console dan nanti Meta Business/Ad Account/Page/Instagram/Dataset. Konfirmasi mana yang sebenarnya belum ada; jawaban "belum setup ads" tidak menjadi alasan membuat duplikat Google/Meta/GBP. Inventaris dulu; akses tim paling minimum,2FA, recovery dan billing owner jelas.

ADS-09: Buat/tag/link properti dan akun yang benar, filter testing/internal traffic, simpan ID publik pada konfigurasi proyek dan token privat di secret storage. Tidak memakai akun developer pribadi sebagai pemilik tunggal bisnis. Currency/timezone diperiksa sebelum akun yang sulit diubah dibuat.

ADS-10: Checklist approval sebelum aktivasi: domain/hosting lolos, landing/form/CRM usable, notice/consent sah, harga/media sah, tracker diuji, destination crawler dapat mengakses, billing/cap terkonfirmasi dan petugas follow-up tersedia. Setup/draft campaign tidak otomatis memberikan otorisasi belanja.

## 3. Google Search: struktur bulan pertama

| ID     | Pengaturan awal usulan                                                                                        | Alasan/validasi                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ADS-11 | Satu kampanye Search BFI2, fokus intent pembelian                                                             | Konsentrasi anggaran kecil                                                                               |
| ADS-12 | Kota Bandung; Location option Presence                                                                        | Menjangkau orang di/sering berada di Kota Bandung; G-09; data lokasi bukan jaminan presisi100%           |
| ADS-13 | Alamat iklan/landing tetap Cibiru Wetan, Kabupaten Bandung                                                    | Tidak menyesatkan calon pembeli tentang lokasi proyek                                                    |
| ADS-14 | Search saja; Display dan partner Search tidak dipakai pada uji awal bila pengaturan tersedia                  | Biaya/relevansi dapat ditelusuri lebih mudah; konfirmasi UI akun                                         |
| ADS-15 | Satu ad group komersial awal; brand terpisah hanya bila volume/biaya mendukung                                | Jangan memecah ke lima kampanye per tipe atau banyak audiens                                             |
| ADS-16 | Phrase/exact kandidat; broad/ekspansi agresif ditahan                                                         | Close variants tetap perlu search-term review                                                            |
| ADS-17 | Bahasa mengikuti audiens dan isi Indonesia; jadwal mengikuti kapasitas respons pemilik                        | Jam pasti belum ditentukan; jangan mengarang jam kantor                                                  |
| ADS-18 | Usulan Maximize Clicks dengan max CPC yang dihitung dari riset, atau manual CPC bila tersedia dan lebih tepat | Tanpa primary bisnis terverifikasi, jangan mengoptimalkan Smart Bidding ke klik WA yang diberi nama lead |

Setiap setting merupakan proposal yang harus diperiksa pada akun aktual. Jangan mengaktifkan auto-applied recommendations yang dapat memperluas jaringan, keywords, bidding atau anggaran tanpa review. Tidak memakai Performance Max, Display atau YouTube paid pada fase Rp500.000.

### 3.1 Kandidat intent dan landing

| Intent/kandidat kata kunci, belum tervalidasi    | Landing utama                                   | Pesan yang relevan                                 |
| ------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------- |
| Bukit Flamboyan Indah2 dan varian ejaan sah      | Halaman proyek                                  | Identitas, lokasi, tipe dan konsultasi             |
| rumah baru Cibiru Wetan / perumahan Cibiru Wetan | Halaman proyek                                  | Fakta proyek dan akses bersumber                   |
| rumah dijual Bandung Timur                       | Halaman proyek atau katalog sesuai hasil riset  | Pilihan tipe dan harga terverifikasi               |
| rumah tipe 36/60 Bandung Timur                   | Detail36/60                                     | Spesifikasi, harga, denah dan program yang benar   |
| tipe lain yang punya demand terukur              | Detail tipe yang sesuai                         | Data API terbaru, bukan harga36/60 pada semua tipe |
| pembiayaan rumah proyek                          | Detail/proyek dengan bagian pembiayaan dan form | Syarat berlaku, simulasi bukan keputusan kredit    |

ADS-19: Landing existing diperkaya terlebih dahulu. Semua iklan tidak diarahkan ke beranda secara seragam. URL filter ber-query bukan pengganti halaman bernilai, tetapi parameter UTM/click ID tidak dilarang untuk landing paid. Redirect harus menjaga konteks tracking yang diizinkan dan canonical tetap bersih.

ADS-20: Kandidat negatives awal: sewa, kontrakan, lowongan, desain, gambar denah gratis, software, jual tanah bila tidak cocok inventori. Verifikasi tiap term; jangan menambahkan "murah", "subsidi", "KPR" atau lokasi relevan sebagai negative tanpa memahami intent dan produk. Review search terms yang tersedia; platform mungkin tidak membuka semua kueri.

### 3.2 Materi iklan dan kualitas landing

ADS-21: Responsive Search Ads menyatakan proyek/lokasi/tipe sesuai landing. Asset sitelink yang sah: pilihan tipe, lokasi proyek, panduan pembiayaan, konsultasi. Jumlah headline/description dan batas karakter diverifikasi pada UI sebelum upload. Landing cepat/mobile, CTA terlihat, harga/syarat konsisten dan form mudah dipakai.

Contoh arah copy untuk review, bukan penawaran siap tayang:

- "Bukit Flamboyan Indah2" / "Pilihan Rumah di Cibiru Wetan" / "Konsultasi Tipe dan Kunjungan".
- "Lihat denah, spesifikasi dan informasi pembiayaan. Hubungi Admin untuk harga berlaku serta rencana survei."

ADS-22: Copy angka hanya setelah verifikasi masa berlaku. Program BSI Rp3,7 juta/180bulan harus menyebut eligibility36/60 dan konteks DP/biaya; jangan memakai klaim tanpa DP, pasti disetujui, ready stock, bebas banjir, sertifikat tertentu, investasi pasti untung atau jumlah unit tersisa tanpa bukti. Nama bank bukan bukti kemitraan formal.

ADS-23: Review kebijakan destination, misleading claims, housing, financial-services bila pembiayaan dipromosikan, dan advertiser verification pada akun/wilayah yang sebenarnya. Jangan menyalin pembatasan regional AS/Kanada sebagai ketentuan Indonesia atau menganggap iklan rumah bebas dari semua kebijakan lain.

### 3.3 Tracking dan bidding

- ADS-24: Enable auto-tagging Google bila sesuai setup. UTM konsisten: source=google, medium=cpc, campaign=`bfi2_search_kota_bandung_<periode>`, content=kode ad group/varian iklan, term=keyword yang diizinkan; tidak memasukkan nama staf/kontak. Campaign registry menghubungkan ID platform dengan kode laporan.
- ADS-25: KlikWA, permintaan CTA dan form diterima adalah observasi sesuai event contract. Lead valid/qualified/kunjungan/akad berasal dari CRM. Jalur WA manual menyisakan unknown attribution; laporan harus menampilkan keterbatasannya.
- ADS-26: Pilih primary conversion bisnis setelah ada sumber/volume yang andal dan pengujian import. Offline conversions/enhanced conversions bukan fitur fase1; G-10 menjadi rujukan desain lanjutan. Tidak mengunggah daftar kontak hanya karena Admin memiliki nomor WA.

## 4. Meta: rancangan lengkap, belanja tahap awal Rp0

META-01: Siapkan inventaris Business Portfolio, Page, Instagram profesional, Ad Account dan Pixel/Dataset; verifikasi pemilik/domain/access jika diperlukan akun. Tidak mengaktifkan pembayaran/kampanye atau membuat aset duplikat tanpa inventaris.

META-02: Susun konten organik berbasis aset sah: dokumentasi kawasan, tur tipe, denah/perbedaan luas, proses kunjungan, penjelasan pembiayaan dan pertanyaan pembeli. Reels vertikal/carousel menggunakan crop yang benar dan caption aksesibel; label ilustrasi/AI dipertahankan. Detail ukuran/placement/format final diverifikasi saat upload.

META-03: Setiap tautan organik diberi source yang benar: instagram/facebook, medium=organic_social; paid_social khusus iklan. Jangan memberi semua placement Facebook source=instagram. Konten mencantumkan lokasi proyek faktual, CTA konsultasi dan syarat penawaran yang sama dengan website.

META-04: Pixel melalui GTM pada fase yang disepakati; consent marketing, pageview SPA, ViewContent dan custom contact intent diuji. CSP harus mengizinkan koneksi/gambar provider yang diperlukan pada jalur GTM; konfigurasi pixel ID kosong tidak boleh diam-diam memblokir request. Tidak memuat pixel langsung dan GTM pixel bersamaan.

### 4.1 Pilihan kampanye paid berikutnya

| Jalur                     | Kebutuhan                                                          | Batas atribusi                                                                      |
| ------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Website consultation/form | Landing+form+validasi CRM dan event yang reliabel                  | Pixel mengamati situs; qualified tetap CRM                                          |
| Click-to-WhatsApp         | AkunWA/asset link dan proses respons yang memenuhi syarat platform | Pengunjung dapat tidak membuka situs; website pixel bukan sumber seluruh percakapan |
| Instant Form Meta         | Notice/proses consent, ingestion terlindungi, dedup CRM, SLA       | Integrasi baru terpisah; di luar fase1 dan tidak diasumsikan sudah ada              |

META-05: Ketika budget baru disetujui, pilih satu jalur dan satu kampanye dengan1–2 ad set maksimum sesuai budget aktual. Target awal Kota Bandung; jangan mengaktifkan banyak minat/retargeting/lookalike tanpa volume, eligibility dan tujuan. Eksklusi lead/customer list hanya jika pengolahan dan kebijakan sah.

META-06: Persyaratan Housing Special Ad Category, opsi audiens, wilayah, usia, placement dan verifikasi akun harus diperiksa langsung di dokumentasi/Ads Manager saat setup. Sumber Meta tidak dapat diverifikasi penuh pada penelitian ini (lihat README); tidak mengasumsikan ketentuan AS berlaku global dan tidak mencoba menghindari kategori wajib.

META-07: Review kreatif melarang fakta palsu, klaim finansial, testimonial palsu, atau personal-attribute copy yang melanggar kebijakan. Buat register kreatif berisi aset, hak, source, tipe, masa berlaku penawaran, caption, landing, tujuan event dan status review. Penawaran expired memicu pause/update, bukan menunggu akhir bulan.

### 4.2 CAPI dan kualitas data fase lanjut

META-08: CAPI baru dipertimbangkan bila ada event backend otoritatif, consent dan business case terukur. Gunakan queue/outbox konkret pada Laravel existing, token server-only, HTTPS, minimisasi/hash sesuai ketentuan provider, dedup identity browser/server, retry/idempotency, revoke dan audit. Jangan mengirim event sebelum lead tervalidasi agar volume terlihat besar.

META-09: Sebelum implementasi CAPI, verifikasi versi API, dukungan event/parameter, jendela dedup/atribusi, pemrosesan data dan Test Events pada akun. Event Match Quality bukan satu-satunya KPI; keterkaitan ke lead sah dan tidak ada data bocor lebih utama. CAPI tidak menggantikan consent atau membuat tracking100%.

META-10: Retargeting hanya sesudah audiens eligible/cukup, consent sesuai, frequency dan creative rotation direncanakan serta budget disetujui. Jangan menyusun funnel paid berlapis dengan anggaran awal yang seluruhnya sudah dialokasikan ke Search.

## 5. Rencana30 hari dan evaluasi

| Waktu relatif       | Kegiatan                                                                                 | Keluaran yang dapat diperiksa                                         |
| ------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Sebelum hari1 media | Hosting/domain/consent/form/CRM, inventaris akun, keyword/review billing, preview        | Semua gate launch lulus; jadwal start baru ditetapkan sesudahnya      |
| Hari1–3             | Launch Search terbatas setelah approval; cek spend, destination, query, form dan respons | Bukti tag+rehearsal lead, tidak ada fakta salah atau error kritis     |
| Hari4–7             | Review query/geografi/duplikat/spam; perbaiki relevansi yang jelas                       | Laporan biaya, lead valid dan unknown; negatives beralasan            |
| Minggu2             | Audit landing dan follow-up, review biaya per hasil yang tersedia                        | Hindari mengubah banyak variabel sekaligus                            |
| Minggu3             | Satu perubahan kreatif/intent/landing jika evidence cukup                                | Catatan eksperimen sebelum/sesudah, ukuran sampel dan caveat          |
| Minggu4             | Tutup media sesuai cap; rekonsiliasi spend+CRM                                           | Keputusan lanjut/pause/revisi; Meta paid tetap memerlukan budget baru |
| Sesudah media       | Follow-up cohort dan konfirmasi survei/akad                                              | Outcome cohort diperbarui; tidak berhenti mengukur pada hari30        |

ADS-27: Setiap laporan memuat belanja aktual/tagihan, impressions/clicks/CTR/CPC, form diterima, WAintent, lead valid, qualified, kunjungan confirmed/completed, DEAL, akad confirmed, spam/duplicate/unknown dan sample size. Nol hasil tidak diubah menjadi angka ROI positif. Akad tanpa provenance tetap hasil bisnis tetapi tidak diklaim berasal dari Ads.

ADS-28: Kriteria pause langsung: cap mendekati batas tanpa ruang biaya, landing/form rusak, promo salah/expired, akun dipakai pihak tidak berwenang, privacy/PII leakage, atau petugas tidak dapat menindaklanjuti. Hasil sedikit pada satu hari bukan otomatis bukti campaign buruk; review kapasitas data, CPC dan economics terlebih dahulu.

ADS-29: Target CPL/CPQL atau nilai akad maksimal ditetapkan setelah margin kontribusi per penjualan, close rate dan kapasitas follow-up diketahui. Jangan memakai harga rumah sebagai revenue/purchase value yang sudah diterima. Forecast berbentuk skenario: clicks=netmedia/CPC, leads=clicks×validatedlead-rate, akad=leads×close-rate; semua input belum terukur diberi label asumsi dan bukan janji.

## 6. Acceptance dan pembatasan

Search phase1 lulus kesiapan bila account ownership/billing/geo/network/keyword/landing/consent/conversiongoal/cap dan petugas mempunyai bukti. Penayangan serta hasil bulan pertama dilaporkan terpisah dari setup. Meta phase1 dinyatakan **rancangan/kesiapan**, bukan kampanye aktif; paid, CAPI, Instant Form dan WhatsApp Platform tetap fase lanjutan.
