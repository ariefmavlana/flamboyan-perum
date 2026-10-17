# Product Requirements Document — Flamboyan Perum

## Input Indonesia dan banner multi-foto — 16 Oktober 2026

Seluruh form kuantitas/harga publik dan workspace memakai titik ribuan otomatis, desimal koma, serta nilai kosong yang tetap berbeda dari nol. Input mendukung pengetikan, tempel dan edit di tengah; nomor kontak, tanggal dan kode tidak diubah. Admin dapat memilih dan mengurutkan hingga lima foto banner. Banner dan galeri memakai transisi, loop serta kontrol jeda yang sama; video tetap tersedia terpisah.

## Banner, gerakan dan bantuan pembeli — 16 Oktober 2026

Beranda menampilkan foto banner dan video kawasan sekaligus dalam bagian terpisah. Identitas editorial, keterbacaan mobile dan disclosure ilustrasi dipertahankan. Navigasi bagian memakai scroll halus native; reveal ringan dan transisi foto mengikuti reduced-motion tanpa menghalangi konten SSR. CTA WhatsApp Admin menyebut tujuan dan membawa konteks rumah. Simulasi menyediakan langkah pengisian BNI/BSI, ringkasan harga/DP/tenor dan bantuan meminta penawaran. Foto kartu serta galeri dapat berputar, dijeda dan dipilih manual; denah tetap manual.

## Navigasi workspace dan panduan peran — 16 Oktober 2026

Workspace memakai sidebar khusus desktop dan drawer modal mobile dengan menu sesuai peran, penanda halaman aktif, akses profil/keluar, serta bantuan kontekstual. `/backoffice/panduan` menyediakan langkah Admin/Marketing dan tampilan cetak setelah pemeriksaan sesi; panduan tidak menyatakan fitur yang belum tersedia sebagai otomatis. Kontrak REST, otorisasi backend dan data bisnis tidak berubah. Panduan pengguna: [panduan-admin-marketing.md](panduan-admin-marketing.md).

## Beranda, video YouTube dan mobile — 16 Oktober 2026

Hero editorial mendukung gambar pendamping dan tautan YouTube independen melalui CMS HERO (`video_url`, `video_title`, `video_autoplay`). Video inline tanpa crop, autoplay tanpa suara, putar ulang dan kontrol native/jeda/suara, fallback saat gagal, reduced-motion/Data Saver; privasi menjelaskan pemuatan YouTube otomatis. Admin dapat memilih dan mengunggah foto melalui MediaManager di editor beranda. Kartu harga/spesifikasi dan KPR dirapikan pada mobile; harga/kelima tipe tetap dari API dan BSI Flat tetap hanya36/60. Validasi, kontrak, sumber dan rollback: [editorial-home-media-mobile.md](editorial-home-media-mobile.md).

## Revisi KPR dan akun produksi — 16 Oktober 2026

Instruksi terbaru menggantikan cakupan BSI sebelumnya: program BSI Flat Rp3,7 juta/180 bulan **hanya 36/60**. BNI dan BSI Griya tersedia untuk seluruh lima tipe. Tarif proyek belum tersedia; Admin mengisi penawaran melalui CMS existing, tanpa tarif dummy. FINANCING_PROGRAM mendukung `house_types` dan `MURABAHAH_QUOTE` (harga, DP, tenor, total margin rupiah per tipe); kalkulator mengabaikan penawaran BSI bila harga tidak sama dengan harga aktif. BANK_RATE existing menyediakan bunga efektif/tahapan BNI. Seeder akun produksi opt-in, rahasia melalui konfigurasi privat; default seed tetap kosong. Kontrak, riset, validasi dan rollback: [production-accounts-kpr.md](production-accounts-kpr.md).

## Revisi pemilik: lima tipe, BSI/BNI dan data riil — 2026-10-15

Katalog aktif hanya 36/60, 36/90, 56/90, 62/70 dan 69/80 sesuai EDITED. Angsuran BSI tetap Rp3,7 juta/bulan selama 15 tahun berlaku untuk kelima tipe; DP dan biaya dikonfirmasi terpisah. BNI Griya didasarkan riset resmi tanpa menganggap promo expired/developer lain berlaku untuk proyek ini. Program angsuran tetap dan informasi bank dipisahkan dari kalkulasi anuitas manual melalui CMS existing. Dataset sintetis operasi, termasuk CRM/notifikasi/akun uji tambahan dan draf weje, telah dihapus setelah backup dan rehearsal; akun operasional serta media terverifikasi dipertahankan. Ini menggantikan kebutuhan evaluasi dummy dan sembilan tipe sebelumnya. Bukti dan batas rollout: [real-catalog-financing-revision.md](real-catalog-financing-revision.md).

## Aset pemilik Bukit Flamboyan Indah 2 — 2026-10-15

Seluruh 58 gambar EDITED dan 17 foto lapangan dipetakan, dengan logo resmi pada identitas website. Foto lapangan menerima koreksi warna deterministik yang mempertahankan kondisi fisik; ilustrasi dan dokumentasi aktual diberi caption berbeda. Lima tipe memiliki 50 ilustrasi rumah dan 5 denah; dua ilustrasi gerbang serta satu siteplan disajikan di halaman kawasan. Harga dan spesifikasi tetap dari katalog API. Video 22 berkas ditunda sesuai instruksi pengguna sampai URL YouTube tersedia.

Sumber asli disimpan privat; website memakai varian WebP responsif. Importer opt-in mencegah upload berulang dan memublikasikan galeri pengganti setelah seluruh 55 gambar READY. R2 diinventaris bersama refs database; orphan/duplikasi yang masih dipakai atau berada dalam grace 30 hari dipertahankan. Cakupan, bukti serta batas publikasi ada di [real-flamboyan-assets.md](real-flamboyan-assets.md).

## Kesiapan produksi, SEO, analytics, dan akuisisi berbayar — 2026-10-14

Instruksi pengguna meminta audit kesiapan produksi serta penyiapan kanal akuisisi (Google Search Ads, Meta Ads/Instagram, pencarian organik) tanpa aktivasi iklan, tanpa belanja, dan tanpa mengarang data bisnis. Temuan lengkap, pemilik tindakan, dan batasnya ada di [audits/flamboyan-production-audit.md](audits/flamboyan-production-audit.md) dan [deployment/manual-actions-required.md](deployment/manual-actions-required.md).

Perilaku yang ditambahkan pada aplikasi web (default **nonaktif**; hanya aktif setelah ID resmi diisi): template judul dan default Open Graph, JSON-LD `WebSite`/`BreadcrumbList` (Organisasi ditahan sampai identitas badan usaha sah), helper URL kanonik tunggal, layer persetujuan kategori analitik/marketing dengan Consent Mode v2, banner persetujuan yang hanya tampil bila teknologi opsional dikonfigurasi, layer event terketik yang dikirim ke dataLayer GTM (tanpa PII), CSP kondisional yang mengizinkan host pihak ketiga hanya saat ID terkait diisi, serta slot tautan Instagram.

Batasan yang tidak berubah: tidak ada aktivasi iklan atau belanja; tidak ada harga/stok/legalitas/kontak/username yang dikarang; lead tetap dicatat manual oleh Admin di CRM tanpa atribusi otomatis (kolom sumber lead belum diputuskan); event `generate_lead`/`qualified_lead`/`schedule_visit` sengaja tidak dibuat karena tidak ada bukti reliabel; gate produksi (domain, hosting, privasi/legal, provider, konten) tetap terbuka dan dicatat sebagai tindakan manual.

Pemetaan kebutuhan: P-01/P-04/P-05 (metadata, detail SSR, WhatsApp) diperluas dengan metadata unik/canonical/JSON-LD; P-05 tetap "klik bukan lead tercatat"; I-03 tetap pencatatan manual. Gate baru: ID GTM/GA4/Ads/Meta resmi, pengesahan notice privasi, keputusan domain.

## Perluasan pengenalan perumahan — 2026-10-08

Flamboyan tetap menjadi nama payung. Pengguna menyetujui nama sementara **Banjaran — hunian mendatang** untuk rencana perumahan lain dalam naungan yang sama. Discovery publik memperkenalkan pilihan kawasan melalui `/perumahan`, beranda, navigasi, dan halaman konsep `/perumahan/banjaran`. Identitas editorial premium dipertahankan, dengan foto inspirasi berlabel, gerak terbatas, dukungan reduced motion, dan konsultasi yang membawa konteks kawasan.

Tahap ini adalah pengenalan rencana, bukan peluncuran penjualan Banjaran. Tidak mengarang tipe/harga/stok/alamat lengkap/fasilitas/legalitas/jadwal. Aset dummy memakai foto inspirasi berlisensi yang sudah ada. Katalog published tetap bersumber dari API. Pengelolaan beberapa proyek melalui CMS serta relasi proyek–properti belum termasuk implementasi tahap ini; diperlukan ketika data proyek dan katalog Banjaran ditetapkan.

## Pembaruan katalog dan pembiayaan — 2026-10-05

Katalog Bukit Flamboyan Indah 2 mengikuti sumber pengguna: sembilan tipe, 152 unit rencana, harga dan masa berlaku terdokumentasi. Jumlah rencana tidak menyatakan stok tersedia; sertifikat, kesiapan fasilitas, bank rekanan dan persetujuan kredit tidak diasumsikan. Masterplan terpisah dari denah bangunan. Foto brosur disebut ilustrasi. Template, layout dan tema editorial dipertahankan.

Admin mengelola spesifikasi tambahan, sumber, harga program bertanggal, harga berikutnya, biaya program dan skema pembayaran pengembang melalui editor komersial properti. CMS DEVELOPMENT mengelola kontak WhatsApp, pengembang, alamat, fasilitas kawasan dan fasilitas sekitar. Referensi KPR mengelola tenor, batas plafon/LTV bila diketahui, tahapan bunga, floating dan komponen biaya yang memiliki sumber bank resmi. Publik hanya menerima konten terverifikasi yang berlaku; simulasi anuitas bukan keputusan kredit. Nilai belum diketahui tidak ditampilkan sebagai nol atau gratis. Skema pengembang terpisah dari KPR bank.

Rekonsiliasi harga/tanggal dan sumber regulator/bank: [brochure-kpr-research.md](brochure-kpr-research.md). Produksi mengikuti merge PR ke `main` melalui integrasi Git Vercel; validasi lokal dan build otomatis wajib, tanpa GitHub Actions.

Versi 2.2 · 2026-10-04 · Kontrak produk F0–F2 dan evaluasi dummy dinamis; implementasi dan gate rilis tercatat terpisah.

## 1. Produk dan masalah

Flamboyan menggabungkan website katalog properti dengan CRM internal. Pengunjung middle-to-high membutuhkan informasi lengkap, mudah dipindai, cepat, dan terpercaya. Tim membutuhkan satu katalog persisten dan satu perjalanan lead yang dapat diaudit. Alur utama: discovery → evaluasi → WhatsApp Admin → pencatatan manual → assignment → follow-up → outcome.

Tujuan: mempermudah pencarian, meningkatkan kontak yang relevan, mengurangi lead tanpa tindak lanjut, memperjelas kepemilikan pekerjaan, dan membuat halaman properti dapat diindeks. Target peningkatan bisnis ditetapkan setelah pengumpulan baseline 30 hari; tidak mengarang persentase peningkatan tanpa data.

## 2. Pengguna dan hak dasar

| Persona | Tugas | Batas |
|---|---|---|
| Visitor | Browse, filter, compare, KPR, kontak Admin | Hanya katalog published; tanpa akun |
| Marketing | Kelola properti sendiri, proses lead assigned, tambah notes | Tidak melihat lead Marketing lain; tidak assign; tanpa data user publik |
| Admin | Kelola katalog/akun, catat dan assign lead, supervisi | Audit wajib; bukan role tambahan Super Admin |

Dua role internal cukup untuk produk awal. Admin dapat mengelola katalog agar operasi tidak tergantung pada pemilik unit yang tidak aktif. Penonaktifan pengguna tidak menghapus histori; harus menyelesaikan/reassign pekerjaan aktif terlebih dahulu.

## 3. Prinsip pengalaman

Premium melalui tipografi, whitespace, foto sah, dan konten jelas; bukan efek visual yang mengganggu. WhatsApp Admin selalu menjadi CTA utama. Jangan meminta akun pembeli. UI Bahasa Indonesia, mata uang IDR, luas m², waktu Asia/Jakarta. Target aksesibilitas WCAG 2.2 AA, navigasi keyboard, focus terlihat, label form, error yang dapat dibaca, dan kontras memadai. Detail properti SSR; user internal tidak terindeks.

## 4. Prioritas dan rencana pengiriman

| Tahap | Ruang lingkup | Syarat selesai |
|---|---|---|
| F0 — fondasi | Monorepo, runtime, katalog API/SSR, scoped API katalog/CRM, auth, histori, notifikasi database, suite pengujian lokal, dokumentasi | Check lokal lulus dan bukti tercatat; status fitur jujur; PR reviewable |
| F1 — MVP operasi | UX CRUD properti, media aman, Admin create/assign, tabel Marketing, drawer, akun/profil, push/Echo dan fallback | Seluruh flow P0 dan keamanan lulus; hosting terverifikasi |
| F2 — evaluasi dan supervisi | Compare UI, kalkulator UI/rate bank, maps/POI, brosur, CMS/social proof, reporting | Acceptance terkait masing-masing fitur lulus |
| Produksi | F1 + fitur F2 yang dipilih untuk rilis | Deployment, restore, privacy, beban, konten, dan provider dibuktikan |

Prioritas produk P0: home, listing, detail SSR, CTA, katalog internal, login, CRM manual, assignment, status, notes/histori, notifikasi persisted + real-time. Search/filter/sort dasar masuk fondasi karena biaya rendah dan berguna; fitur P1 tetap wajib sebelum dinyatakan selesai ketika dipilih dalam release scope. Virtual tour adalah media opsional per unit; kemampuan render tetap target produk. F0 bukan keseluruhan MVP.

## 5. Kebutuhan publik

| ID | Perilaku dan acceptance |
|---|---|
| P-01 Home | Hero, search yang menuju listing, featured published, CTA; testimonial/logo bank hanya jika data terverifikasi tersedia |
| P-02 Listing | Card: tipe, kondisi baru/bekas, sertifikat, lokasi/alamat, harga, luas, kamar, availability, WA; tidak menampilkan Marketing |
| P-03 Discovery | Cari judul/lokasi/alamat; filter harga, luas, kamar, kondisi, sertifikat, availability; sort terbaru/harga/luas, URL menyimpan query, pagination, empty/error/loading states |
| P-04 Detail | URL `/properti/{slug}` stabil; harga/spec/deskripsi SSR, metadata/canonical; galeri, video YouTube, denah, tour, brosur bila tersedia; draft/archived 404 |
| P-05 Kontak | `wa.me` terpusat, pesan memuat judul dan canonical URL; klik bukan lead yang sudah tercatat; konfigurasi kosong menyembunyikan CTA |
| P-06 Compare | 2–3 properti published, atribut berdampingan, dapat hapus pilihan, fallback satu kolom pada mobile, tersedia/tidak tersedia diberi label |
| P-07 KPR | Estimasi anuitas; DP/tenor/rate; fixed atau skenario floating eksplisit; grafik bunga/pokok; bank rate manual dengan tanggal berlaku dan disclaimer biaya yang tidak termasuk |
| P-08 Lokasi/media | Maps opt-in/lazy load, POI editorial berjarak terukur bila tersedia, image alt/ukuran responsif; tidak mengarang fasilitas, jarak, testimoni, atau rekanan |

## 6. Kebutuhan internal

| ID | Perilaku dan acceptance |
|---|---|
| I-01 Auth/users | Session cookie, login/logout, rate limit; tanpa public register; active role dibatasi backend; provisioning/recovery akun sebelum rilis |
| I-02 Catalog | Marketing create/edit sendiri, Admin semua; publication terpisah availability; required fields lengkap sebelum publish; slug tidak otomatis berubah ketika judul diedit |
| I-03 Lead | Admin memasukkan nama, nomor WA normalisasi, satu properti; nomor+properti unik seumur record pada baseline; koreksi/update kontak dan proses privacy via operasi terkontrol pada F1 |
| I-04 Assignment | Satu Marketing aktif, bisa reassignment nonterminal dengan alasan; pemilik lama langsung kehilangan akses; histori/notification atomik |
| I-05 Pipeline | NEW_LEAD → FOLLOWED_UP → SURVEY_LOKASI → PEMBERKASAN_KPR → DEAL; setiap nonterminal → LOST dengan alasan; terminal terkunci; tidak otomatis mengubah availability |
| I-06 Notes/history | Notes append-only; timeline created/assignment/reassignment/status/note menampilkan aktor, UTC yang dilokalkan, perubahan, catatan; descending; drawer keyboard accessible |
| I-07 Notifications | Bell unread, list, tandai dibaca hanya milik sendiri; database dahulu, push setelah commit; reconnection refresh; fallback polling bukan klaim real-time |
| I-08 Reports | Lead per cohort created-date, distribusi status/Marketing, conversion dan median first-follow-up; tanpa menganggap klik WA sebagai deal |
| I-09 CMS/profile | Admin home/featured/testimonial/bank; Marketing profil nama sendiri; email/role/aktivasi melalui Admin; konten publikasi tervalidasi |

## 7. Aturan bisnis baseline

Keputusan ini dipilih untuk membuat fondasi konkret dan dapat direvisi melalui PR: dua role; Admin mengelola seluruh katalog; Marketing hanya owner/assigned; lead manual; single property/lead; dedup nomor+property; reassignment dengan alasan; transisi berurutan dan terminal terkunci; compare tiga; rates/POI editorial; managed push target awal Pusher. Tidak ada otomatisasi WhatsApp, pembayaran, akun pembeli, multi-tenant, AI chatbot, ERP, atau native app.

Pipeline fleksibel/skipped stages, reopen terminal, multi-property lead, merging duplicates, dan SLA follow-up kontraktual memerlukan keputusan bisnis berikutnya; tidak diselundupkan ke implementasi. Hasil review bisnis bisa mengganti baseline ini tanpa mengubah prinsip transaksi dan audit.

## 8. Pengukuran

Funnel event `property_view`, `whatsapp_click` (tanpa PII); lead recorded dan outcome berasal dari CRM, tidak dapat menghubungkan klik anonim dengan pesan WA tanpa integrasi/consent. Conversion: jumlah lead cohort berstatus DEAL saat laporan / seluruh lead cohort ×100; tampilkan ukuran cohort dan rentang tanggal. Follow-up: durasi assignment pertama hingga transisi pertama FOLLOWED_UP, median hanya lead yang telah follow-up; tampilkan jumlah lead belum follow-up dan distribusi umur, agar tidak menutupi lead terlambat. Reassignment tidak mereset KPI cohort; laporan individu membedakan aktor follow-up dan assignee terkini.

## 9. Kualitas dan operasi

SLO usulan: availability bulanan 99.5%, API public p95 ≤500ms, SSR p95 ≤1.5s pada dataset 10.000 properties / 50.000 leads dan 20 request/s, error <1% selama 15 menit. Target lapangan LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 pada p75 mobile; baru dapat dibuktikan setelah trafik. Target hosting/lapangan bukan klaim kelulusan. Bukti local synthetic load/restore ada di acceptance-validation.md; pengukuran hosting, uptime bulanan dan field Web Vitals tetap gate. Optimalkan pagination/index/image sebelum layanan tambahan.

Baseline backup: harian DB+media, 7 harian/4 mingguan/3 bulanan di lokasi terpisah dan terenkripsi, RPO ≤24 jam/RTO ≤8 jam, restore triwulanan. Retensi PII lead usulan 24 bulan setelah aktivitas terakhir; kebijakan legal, notice, dan proses penghapusan/anonymization harus ditandatangani sebelum produksi. Identitas dan nomor WA tidak masuk log/analytics.

## 10. Gate dan risiko

| Gate / risiko | Pemilik | Bukti sebelum produksi |
|---|---|---|
| SSR shared hosting | Engineering + pemilik hosting | PHP ≥8.3, Node LTS, proses/restart/routing, HTTPS, cron, DB/media private, outbound push |
| Database | Engineering | Pengujian lokal SQLite/PostgreSQL + load; SQLite hanya satu instance lokal, private disk dan consistent snapshot |
| Identitas/konten | Business owner | Domain, WA Admin, property asli, media berizin, testimonial/rekanan sah |
| Notifications | Engineering + business | Provider/biaya, worker/cron latency, private channel, fallback dan failure recovery |
| KPR/maps | Business owner | Rates berlaku/tanggal, provider/biaya, embed consent, POI/editorial |
| Security/privacy | Business owner + engineering | Provision/recovery, cookie/CSRF, retention/deletion, akses, audit, restore |
| Quality | Engineering | Bukti lokal lint/type/tests/build/browser/audit, UAT mobile/keyboard, load/restore, smoke produksi; GitHub Actions tidak digunakan |

## 11. Traceability dan perubahan

Untuk evaluasi lokal sebelum konten asli tersedia, gunakan dummy sintetis generatif yang disimpan di database dan dikelola melalui API/CRUD sebenarnya. Dataset tidak dibuat ulang pada setiap request/reload, tidak memakai katalog/CRM hardcoded, dan tidak menjadi fallback saat API gagal. Label ilustrasi wajib jelas; ilustrasi, testimonial persona, serta rate bank simulasi bukan bukti bisnis. Seed opt-in hanya local/testing pada database domain kosong, tanpa pengiriman notifikasi eksternal. Konten demo tidak memenuhi gate konten produksi.

Guideline publik → P-01..P-08; back office → I-01..I-09; flows → §7; stack/deployment → §9–10 dan SRS. SRS menguraikan kontrak teknis dan ID source lama agar kebutuhan tidak hilang. `review.md` merekam gap dokumen awal; `implementation-status.md` memisahkan implemented/partial/planned. Original tidak diedit. Versi 1.1 (2026-09-30) diganti 2.0 dengan keputusan baseline, tahapan, acceptance, kualitas dan gate yang eksplisit.

Versi2.1 melengkapi F0–F2/acceptance operasional; versi2.2 mengikuti instruksi pengguna untuk dummy dinamis persisten pada evaluasi lokal, tanpa mengganti gate konten/hosting produksi.

## Addendum 2026-10-04 — Pengalaman pembeli Bandung Timur

Instruksi pengguna menetapkan pasar middle-to-high Indonesia dan lokasi perumahan Bandung Timur, mempertahankan arah editorial premium yang sudah dipilih. Pengamatan Aucoot dan keputusan adaptasi tercatat di [aucoot-adaptation.md](aucoot-adaptation.md). Addendum ini melengkapi baseline2.2 tanpa mengubah arsip original.

| ID tambahan | Perilaku / acceptance |
|---|---|
| P-09 Konteks kawasan | Halaman Bandung Timur menjelaskan evaluasi hunian, menghubungkan katalog/panduan/konsultasi; tidak membuat klaim alamat, akses, fasilitas atau waktu tempuh tanpa data terverifikasi. |
| P-10 Panduan pembeli | Indeks dan tiga artikel SSR untuk kunjungan, lokasi dan pembiayaan, metadata/canonical/sitemap, slug tidak dikenal404; konten terkurasi source, bukan CMS artikel umum. |
| P-11 Konsultasi | Topik dan pertanyaan opsional menyiapkan WhatsApp Admin; konteks properti hanya dari katalog published. Pengunjung mengirim sendiri, jadwal dikonfirmasi Admin; tanpa booking atau lead otomatis. |
| P-12 Evaluasi visual/share | Foto dan denah terkelompok, dialog galeri bernavigasi/keyboard/fokus, video/tour setelah pilihan pengguna, share native dengan clipboard/manual fallback. |
| I-10 Kesiapan hero/logo | Admin memilih foto/video properti siap untuk hero; logo mitra bank dapat diunggah aman dengan version/audit/attestation. Public allowlist tidak mengandung metadata private. |

Logo bank mitra dan referensi suku bunga merupakan dua konsep berbeda. Identitas/izin hubungan bank harus diverifikasi sebelum publikasi; tidak menganggap BANK_RATE sebagai bukti kemitraan. Aset foto/video pemilik belum diberikan; implementasi kemampuan upload/pemilihan tidak menutup gate konten. Video mengikuti baseline YouTube embed, bukan raw video upload.

Tidak mengadaptasi newsletter/property alerts, layanan penjual/appraisal, direktori desainer, agen internasional atau Press tanpa kebutuhan dan bukti bisnis. Seluruh requirement inti katalog/CRM/notifikasi tetap berlaku. Gate hosting/provider/konten/privasi dan bukti pengujian aktual tetap membatasi pernyataan selesai.

## Addendum 2026-10-05 — Operasi situs dan publikasi

Instruksi pengguna menghapus istilah "demo" dari narasi yang ditampilkan aplikasi. Label ilustrasi dan atribusi tetap menjelaskan asal foto; testimonial persona dan rate simulasi tidak dipublikasikan sebagai bukti bisnis. Identitas resource cloud yang sudah dibuat boleh dipertahankan. CMS mencakup hero/pilihan media, testimonial, referensi rate dan logo bank; Admin mengelola dan memverifikasi publikasi, Marketing terbatas pada properti dan CRM sesuai assignment. Dua role kanonik tidak berubah.

Perubahan konten lewat CMS tersimpan pada database dan terlihat tanpa deploy. Perubahan source memakai Git dan pemeriksaan build Vercel sebelum alias diperbarui. GitHub Actions tidak digunakan. Pemrosesan gambar cloud harus berjalan tanpa worker di komputer pengguna; brosur tetap memerlukan scanner malware yang tersedia.

## Addendum pengalaman — 2026-10-05

Evaluasi pengguna meminta fokus input tanpa garis oranye, alur Admin/Marketing yang berorientasi tindakan, penghapusan Bandung Timur dari navbar, dan pemakaian aset situs katalog awal Rumah Rajasa. Arah editorial premium dipertahankan untuk pembeli kelas menengah atas Bandung Timur, dengan katalog lebih awal dan render yang jujur sebagai ilustrasi. Antrean kerja scoped, penugasan setelah pencatatan, editor properti per bagian, CMS menurut tujuan, dan laporan berbahasa operasional melengkapi kebutuhan internal. Halaman kawasan tetap bisa ditemukan lewat footer; P-09 tidak mewajibkan item navbar. Rincian persona, perubahan, dan sumber di [experience-clarity.md](experience-clarity.md); status pengujian di [experience-validation.md](experience-validation.md).


## Ekstensi growth yang diotorisasi — 17 Oktober 2026

Pengguna mengotorisasi implementasi spesifikasi Hostinger/SEO/akuisisi pada branch PR terpisah dan pengujian Vercel sebelum membeli hosting. Fokus BFI2, calon pembeli Kota Bandung, anggaran total Rp500.000 satu bulan Google Search terlebih dahulu; Meta paid Rp0. WhatsApp Admin tetap tersedia dan form konsultasi/permintaan kunjungan menjadi jalur tambahan ke CRM. Outcome sampai akad diukur dengan bukti terpisah dari pipeline DEAL. Tidak ada otorisasi belanja, merge atau aktivasi akun/tag resmi. Kontrak final, status bukti dan external gates: [growth/README.md](growth/README.md), [growth/backend-api-contract.md](growth/backend-api-contract.md), [growth/validation.md](growth/validation.md).
