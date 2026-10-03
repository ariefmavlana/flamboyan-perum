# Product Requirements Document — Flamboyan Perum

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

Untuk evaluasi lokal sebelum konten asli tersedia, gunakan dummy sintetis generatif yang disimpan di database dan dikelola melalui API/CRUD sebenarnya. Dataset tidak dibuat ulang pada setiap request/reload, tidak memakai katalog/CRM hardcoded, dan tidak menjadi fallback saat API gagal. Label demo wajib jelas; ilustrasi, testimonial persona, serta rate bank simulasi bukan bukti bisnis. Seed opt-in hanya local/testing pada database domain kosong, tanpa pengiriman notifikasi eksternal. Konten demo tidak memenuhi gate konten produksi.

Guideline publik → P-01..P-08; back office → I-01..I-09; flows → §7; stack/deployment → §9–10 dan SRS. SRS menguraikan kontrak teknis dan ID source lama agar kebutuhan tidak hilang. `review.md` merekam gap dokumen awal; `implementation-status.md` memisahkan implemented/partial/planned. Original tidak diedit. Versi 1.1 (2026-09-30) diganti 2.0 dengan keputusan baseline, tahapan, acceptance, kualitas dan gate yang eksplisit.

Versi2.1 melengkapi F0–F2/acceptance operasional; versi2.2 mengikuti instruksi pengguna untuk dummy dinamis persisten pada evaluasi lokal, tanpa mengganti gate konten/hosting produksi.
