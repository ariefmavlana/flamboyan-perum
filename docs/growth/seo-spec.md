# Spesifikasi SEO komprehensif yang mengikuti Flamboyan

Status: DRAFT / PLANNED. Sumber G-* merujuk [register resmi](README.md). Tujuan: ditemukan untuk kebutuhan pembelian yang sesuai inventori, membantu evaluasi rumah, dan menghasilkan prospek yang dapat ditindaklanjuti. Peringkat, indexation dan akad bukan hasil yang dapat dijamin.

## 1. Arsitektur informasi dan intent

| Halaman existing                     | Intent utama yang diusulkan                        | Isi pembeda dan CTA                                                       | Ketentuan                                           |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| `/`                                  | Brand Flamboyan, pengenalan pilihan hunian         | Brand, proyek aktif, lima tipe, jalur evaluasi                            | Tidak mengambil seluruh topik detail proyek         |
| `/perumahan`                         | Menjelajahi kawasan di bawah brand                 | Proyek aktif vs rencana mendatang                                         | Banjaran jelas berstatus pengenalan                 |
| `/perumahan/bukit-flamboyan-indah-2` | Nama proyek + perumahan Cibiru Wetan/Bandung Timur | Lokasi faktual, akses, dokumentasi, siteplan, tipe dan pembiayaan sah     | Halaman utama kampanye proyek                       |
| `/properti`                          | Memilih/membandingkan tipe rumah                   | Lima tipe, filter dasar, harga aktif, tautan detail                       | Listing agregat; tidak menggandakan narasi proyek   |
| `/properti/{slug}`                   | Tipe tertentu + lokasi + harga/pembiayaan          | Harga/spec, foto, denah, ketersediaan, biaya/syarat, simulasi, konsultasi | Satu URL stabil per tipe/record aktif               |
| `/bandung-timur`                     | Memahami kawasan untuk membeli rumah               | Akses dan fasilitas bersumber, perbedaan wilayah, rujukan proyek          | Tidak mengklaim semua lokasi berada di Kota Bandung |
| `/panduan` dan detail                | Pertanyaan evaluasi pembeli                        | Kunjungan, pemilihan lokasi dan pembiayaan yang sudah tersedia            | Penambahan berdasarkan kebutuhan nyata              |
| `/konsultasi`                        | Konsultasi/pengajuan minat survei                  | WhatsApp Admin + formulir, pilihan satu tipe, ekspektasi tindak lanjut    | Form belum diimplementasikan                        |
| `/privasi`                           | Transparansi pengelolaan data                      | Controller, tujuan, consent, vendor, retensi, hak dan kontak              | Kelengkapan legal menjadi gate publikasi            |
| `/perumahan/banjaran`                | Pengenalan rencana                                 | Informasi terbatas yang telah disetujui                                   | Tidak dijadikan landing paid penjualan BFI2         |

SEO-01: Tetapkan satu primary target page per klaster setelah riset; halaman lain mendukung melalui internal link. Hindari beranda, halaman proyek dan kawasan memiliki judul, deskripsi serta paragraf identik. URL existing dipertahankan kecuali ada mapping dan alasan terukur.

SEO-02: Kata kunci berikut masih hipotesis: brand proyek, perumahan Cibiru Wetan, rumah baru Bandung Timur, tipe 36/60 Bandung Timur, perbandingan tipe 36/90 dan56/90, serta pembiayaan rumah di proyek ini. Ukur volume, CPC, intent dan kompetitor hasil pencarian melalui Keyword Planner/GSC yang sah; jangan mengisi angka perkiraan sebagai fakta.

SEO-03: Frasa iklan/konten boleh membahas akses dari Kota Bandung bila data mendukung. Alamat proyek tetap Kabupaten Bandung. Halaman khusus "rumah di Kota Bandung" tidak dibuat untuk inventori yang lokasinya berbeda. Tidak membuat puluhan halaman kecamatan dengan isi yang hanya diganti nama daerah.

## 2. Kontrak crawl, indexation dan URL

| Kelas URL                                              | HTTP dan canonical                                                      | Robots/index                                     | Sitemap                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Halaman publik berisi konten sah                       | 200, canonical absolut HTTPS ke URL final sendiri                       | index,follow                                     | Ya jika dipilih dalam IA                  |
| Properti PUBLISHED aktif/terjual dengan konten berguna | 200, canonical sendiri, availability aktual                             | index sesuai keputusan lifecycle                 | Hanya yang eligible                       |
| Draft/arsip/nonexistent                                | 404 existing; 410 hanya jika kebijakan penghapusan permanen disetujui   | Tidak menyerupai listing valid                   | Tidak                                     |
| API/dependency down                                    | 503+retry; jangan menampilkan katalog kosong seolah valid               | Tidak membuat soft404                            | Sitemap503 bila sumber gagal              |
| Login/reset/backoffice/private API                     | Auth/status existing, no-store                                          | noindex; robots bukan pengaman akses             | Tidak                                     |
| Bandingkan dan hasil filter/sort bebas                 | URL state berguna bagi pengguna, canonical/noindex ditetapkan per kelas | Tidak menjadi ruang index tanpa batas            | Tidak                                     |
| Pagination katalog yang benar-benar dibutuhkan         | 200, self-canonical per halaman; page1 konsisten                        | Crawlable dengan anchor link                     | Hanya bila strategi sitemap memerlukannya |
| Halaman pagination invalid/di luar range               | 404                                                                     | Tidak diindex                                    | Tidak                                     |
| Parameter UTM/gclid/gbraid/wbraid/fbclid               | Konten sama; canonical tanpa parameter tracking                         | Tidak diblokir secara blanket hanya karena query | URL bersih saja                           |
| Staging/preview                                        | Auth atau pembatasan akses selain noindex                               | noindex konsisten                                | Tidak diumumkan                           |

SEO-04: Ganti aturan blanket `Disallow: /*?` hanya setelah matriks filter/pagination/tracking selesai ditinjau dan diuji. G-02 mendukung kendali kombinasi filter; parameter iklan dan nomor halaman mempunyai fungsi berbeda. Bila ingin crawler membaca noindex, jangan sekaligus melarang crawl URL tersebut. URL terlanjur terindeks perlu strategi penghapusan bertahap.

SEO-05: Googlebot, AdsBot desktop/mobile dan crawler preview sosial harus dapat mengakses landing, CSS, JS, image dan endpoint publik yang diperlukan. Buktikan dokumentasi serta request nyata; user-agent string saja bukan bukti crawler sah atau dasar bypass autentikasi/WAF/rate limit. Jangan membuka CRM untuk memperbaiki preview.

SEO-06: Satu kebijakan www/non-www, HTTPS, trailing slash dan encoding slug. Redirect satu langkah ke tujuan ekuivalen; hindari redirect semua halaman lama ke beranda. Canonical, og:url, sitemap, JSON-LD, internal link dan URL CTA harus konsisten.

SEO-07: Sitemap hanya URL200 canonical yang ingin diindeks, dari publikasi aktual. `lastmod` mencerminkan perubahan konten bermakna, bukan setiap request. Perubahan harga efektif berbasis tanggal harus mempunyai pemicu pembaruan/invalidasi yang jelas walaupun record tidak diedit hari itu. Tidak memasukkan filter, auth, thank-you, test fixture atau landing duplikat.

SEO-08: Keputusan Banjaran: halaman pengenalan boleh tetap indexable bila informasinya cukup berguna dan statusnya jelas; bila tipis, usulan noindex dan hapus dari sitemap sampai data siap. Keputusan editorial pemilik diperlukan; tidak menganggap rencana sebagai proyek dijual.

## 3. On-page dan struktur data katalog

- SEO-09: Setiap template menetapkan title utama, satu h1 deskriptif, meta description, breadcrumb terlihat dan internal link. Title harus membedakan brand, lokasi dan tipe tanpa mengulang kata kunci; panjang bukan batas ranking yang dijanjikan. Deskripsi CTR diukur, tidak diklaim selalu dipakai Google.
- SEO-10: Deskripsi lima tipe ditulis dari denah/spesifikasi/foto dan kebutuhan pembeli: fungsi ruang, perbedaan luas, harga berlaku, biaya diketahui, kondisi dokumen yang terverifikasi dan langkah kunjungan. Setiap angka harus mempunyai sumber dan tanggal. Luas decimal dan IDR integer tetap sesuai model.
- SEO-11: Harga katalog dan landing berasal dari API yang sama, termasuk masa berlaku dan program. Saat harga belum diketahui tampilkan permintaan konfirmasi; bukan0/gratis. BSI Rp3,7 juta/180bulan hanya ditampilkan pada36/60 beserta DP/biaya/syarat yang telah dikonfirmasi. Simulasi tidak menjadi janji persetujuan bank.
- SEO-12: Published+SOLD tidak otomatis dihapus bila masih membantu pembeli; tampilkan kondisi aktual dan alternatif tersedia. Arsip existing tetap404. Perubahan availability tidak diambil dari lead DEAL secara otomatis. Pembaruan slug, penggabungan listing dan penghapusan harus mempunyai mapping/audit.
- SEO-13: CTA WhatsApp dan form membawa property ID/canonical URL yang tervalidasi. Konten utama SSR tersedia sebelum skrip analytics/consent. Form error, validasi atau tag failure tidak menghilangkan harga, spesifikasi, tautan dan navigasi.

## 4. Structured data dan preview sosial

| ID     | Data terstruktur                       | Kontrak                                                                                                                      |
| ------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| SEO-14 | WebSite dan BreadcrumbList existing    | ID/URL stabil; breadcrumb sama dengan yang terlihat                                                                          |
| SEO-15 | RealEstateListing/House/Offer existing | Harga aktif IDR, luas, image, kondisi dan availability hanya fakta yang benar-benar tersedia                                 |
| SEO-16 | Organization/entitas bisnis            | Hanya setelah nama legal, pemilik brand, alamat/kontak, logo dan sameAs disahkan; schema bisnis mengikuti entitas sebenarnya |
| SEO-17 | Article/VideoObject opsional           | Hanya pada artikel/video yang memenuhi struktur dan konten; tanggal, penulis atau durasi tidak dibuat-buat                   |

Validasi JSON dan schema.org terpisah dari uji Rich Results Search. G-11 mendeskripsikan fitur Google yang didukung; markup RealEstateListing tidak dipasarkan sebagai jaminan rich snippet. Tidak menambah Product, rating, FAQ atau review markup semata untuk mengejar bintang/ruang hasil pencarian.

SEO-18: OG/Twitter image memakai aset sah dan URL absolut yang200 tanpa login. Tetapkan dimensi/teks dan crop yang terbaca; gunakan foto yang sesuai tipe atau kawasan, bukan rumah lain. Uji preview WhatsApp/Facebook terhadap URL bersih. Preview publik tidak boleh membawa source media private atau campaign contact.

## 5. Media, video, accessibility dan performa

- SEO-19: Inventaris aset aktual vs ilustrasi/AI, hak penggunaan, caption, tipe dan tanggal dokumentasi. Pertahankan disclosure yang sudah ada. Alt menggambarkan isi foto secara relevan; dekoratif memakai alt kosong. Nama file tidak mengganti label fakta fisik.
- SEO-20: Pertahankan WebP responsif, srcset/sizes, ukuran intrinsik/aspect-ratio. Hero/LCP tidak di-lazy-load secara keliru; foto berikutnya dan galeri di bawah fold dapat lazy. Audit carousel/banner terhadap CLS, bandwidth dan memori mobile.
- SEO-21: Video YouTube existing dinilai dengan poster, pemuatan terarah, reduced-motion/Data Saver dan biaya pihak ketiga. Perubahan autoplay mengikuti keputusan UX terbaru pemilik; optimasi harus mempertahankan fungsi yang disetujui. Halaman video khusus hanya bila video merupakan konten utama yang bernilai, bukan wrapper kosong.
- SEO-22: Target lapangan p75 mobile: LCP≤2,5 detik, INP≤200ms, CLS≤0,1 sesuai target proyek/G-03. Ukur per template dan device, sebelum/sesudah tag. Lighthouse lab tidak dinyatakan sebagai kelulusan field; bila CrUX belum cukup, laporkan kekurangan data dan gunakan RUM berizin.
- SEO-23: Anggaran usulan template: ukur berat transfer aktual lalu tetapkan cap JS/image yang disetujui sebelum optimasi. Jangan mengarang angka baseline. Uji mobile390 dan koneksi terbatas, font lokal, layout stabil, keyboard, form labels/errors, focus dan WCAG2.2AA existing.
- SEO-24: Batasi tag pada tujuan yang diperlukan, async dan consent-aware; hindari menambah widget/chat/peta otomatis untuk alasan SEO. Dampak GTM, Meta, map dan YouTube dicatat terpisah agar penyebab regresi dapat ditemukan.

## 6. Local SEO dan kepercayaan

- SEO-25: Sahkan identitas pengembang/brand/kantor penjualan, NAP, jam pelayanan, kontak dan koordinat. Konsistenkan website, profil bisnis, Instagram dan iklan. NAP kantor dan alamat proyek harus dibedakan bila berbeda.
- SEO-26: Google Business Profile hanya dibuat/diakui untuk bisnis atau kantor penjualan yang memenuhi G-05. Tidak membuat profil setiap tipe rumah/rumah contoh demi Maps. Verifikasi signage, pelayanan tatap muka dan kewenangan pemilik; lokasi virtual tidak diperlakukan kantor operasional.
- SEO-27: Fasilitas/akses menggunakan sumber atau pengukuran yang dapat diperiksa, mode perjalanan dan tanggal bila relevan. Waktu tempuh harus diberi konteks; tidak menyebut "5menit ke tol" tanpa bukti. Maps opt-in existing dipertahankan.
- SEO-28: Trust content: pengembang yang sah, cara konsultasi/kunjungan, proses pembelian, sumber penawaran dan tanggal review, privasi dan kontak. Dokumen legal dipublikasikan hanya dalam bentuk yang telah disetujui/redacted; berkas konsumen dan nomor identitas tidak menjadi konten SEO.
- SEO-29: Review/testimonial hanya dari pengalaman asli dengan izin; tidak membeli ulasan, membuat persona atau memaksa ulasan positif. Referral/PR/citation dilakukan ke direktori/mitra relevan yang sah; hindari paket backlink/PBN atau pertukaran tautan massal menurut G-04.

## 7. Strategi konten yang dapat dikerjakan

Prioritas berdasarkan kelengkapan fakta dan peluang aktual, bukan kuota artikel. CMS existing bukan blog generik; kebutuhan editorial tambahan harus dirancang sebagai perubahan terpisah dengan workflow review/publish.

| Urutan | Keluaran                                             | Sumber wajib                                                | Konversi yang dibantu                                   |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| 1      | Halaman proyek lengkap dan lima halaman tipe berbeda | Katalog, foto/denah, alamat, harga, syarat sah              | Konsultasi tipe dan kunjungan                           |
| 2      | Perbandingan36/60 vs36/90 dan tipe lain yang relevan | Luas/ruang/harga API dan kebutuhan pengguna                 | Memilih satu tipe; gunakan fitur bandingkan             |
| 3      | Perencanaan pembiayaan proyek                        | Penawaran BNI/BSI yang berlaku dan kalkulator existing      | Konsultasi DP/tenor; bukan aplikasi kredit              |
| 4      | Panduan kunjungan dan pertanyaan pembeli             | Kondisi lokasi, jadwal layanan, proses survei terkonfirmasi | Permintaan kunjungan                                    |
| 5      | Kawasan/akses Cibiru Wetan dan konteks Bandung Timur | Data geografi, akses/fasilitas bersumber                    | Evaluasi lokasi bagi warga Kota Bandung                 |
| 6      | Proses menuju akad                                   | Proses bisnis terverifikasi dan review pihak berkompeten    | Ekspektasi dokumen/proses, tanpa nasihat legal personal |

SEO-30: Content record minimal mempunyai owner/editor, intent, target URL, sumber fakta, tanggal review, status DRAFT/REVIEW/PUBLISHED, masa berlaku penawaran dan next-review. Konten pembiayaan/legal ditinjau pihak yang berkompeten. Koreksi fakta segera diprioritaskan; artikel AI massal tidak menggantikan pengetahuan proyek.

SEO-31: Internal linking membentuk brand→proyek→tipe→panduan/konsultasi serta artikel→tipe relevan. Anchor deskriptif dan tautan HTML biasa. Jangan menjadikan semua artikel pintu menuju satu URL tanpa nilai sendiri; G-04 membatasi doorway/scaled content abuse.

## 8. Pengukuran dan operasi SEO

| ID     | Metrik                                                                   | Sumber/kadensi                        | Interpretasi                                                   |
| ------ | ------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------- |
| SEO-32 | URL submitted/indexed, alasan excluded, canonical dipilih Google         | Search Console mingguan selama launch | Sitemap bukan bukti semua halaman terindeks                    |
| SEO-33 | Impression, click, CTR, posisi per query/page/device                     | GSC; pisahkan brand dan nonbrand      | Bandingkan periode sebanding; posisi agregat bukan KPI tunggal |
| SEO-34 | Landing organik, engagement terpilih dan contact intent                  | GA4 setelah consent                   | Data tidak mencakup seluruh pengunjung                         |
| SEO-35 | Lead valid, qualified, kunjungan aktual, akad terverifikasi dari organik | CRM/provenance bulanan dan cohort     | Unknown/self-reported tetap ditandai; bukan atribusi pasti     |
| SEO-36 | 5xx/404 tidak disengaja, sitemap, bot access, CWV dan harga expired      | Monitoring teknis, review mingguan    | Alert langsung untuk outage/kebocoran/fakta harga salah        |

Baseline30 hari pertama disimpan tanpa janji kenaikan persentase. Evaluasi konten/indexasi setelah data cukup; akad dilacak melampaui bulan media. Buat backlog berdasarkan bukti: halaman penting tidak terindeks, query relevan ber-CTR rendah, konten yang membantu prospek, serta gap informasi nyata.

## 9. Acceptance minimum

Semua template publik memiliki HTML SSR, canonical, metadata unik, heading dan link yang diperiksa; lima tipe memakai data terbaru; zero URL internal/draft di sitemap; query tracking tidak diblokir blanket; pagination/filter mengikuti matriks; origin produksi tunggal;404/503 benar; schema faktual; preview sosial dan seluruh media publik valid; tidak ada data CRM pada HTML/event/schema.

Kelengkapan konten, GSC, audit crawl, pengukuran field dan hasil bisnis mempunyai bukti terpisah pada [rencana verifikasi](delivery-verification.md). SEO komprehensif berarti setiap bagian punya owner, acceptance dan tindak lanjut; tidak ada klaim selesai hanya karena metadata dipasang.
