# Keputusan dan persiapan peluncuran

17 Oktober 2026. Dokumen ini memperbarui keputusan yang masih terbuka pada paket growth; bukti rilis sebelumnya ada di PR #45. Kode spesifikasi dan implementasi sudah di-merge melalui PR #44 dan #45. Produksi Vercel pada `ddd8f9d` mempertahankan katalog asli, Supabase dan R2 privat.

## Keputusan pemilik

| Bagian | Keputusan/status |
| --- | --- |
| Domain rencana | `bukitflamboyanindah2.com`; belum dibeli. Canonical/DNS tidak dipindah sebelum domain aktif dan cutover diverifikasi. |
| Nama publik | Bukit Flamboyan Indah 2. Gunakan DEVELOPMENT.name yang sudah dapat diedit Admin di Konten publik → Kawasan & kontak. Nama publik ini tidak menyatakan bentuk badan hukum. |
| Kontak | WhatsApp `6282214795024`, dikonfirmasi pemilik; gunakan DEVELOPMENT.whatsapp. |
| Operasional | Penanggung jawab adalah Admin platform. Identitas pribadi petugas dan akun Google tidak dimasukkan ke DTO publik, analytics atau dokumen repository publik. |
| Ketersediaan | Pertanyaan dapat dikirim 24 jam setiap hari; respons Admin menyesuaikan ketersediaan. Tidak menjanjikan respons manusia langsung atau SLA menit tertentu. |
| Retensi | 30 hari pending, 7 hari spam, 90 hari salinan inquiry resolved, dan tinjauan lead terminal setelah 24 bulan tanpa aktivitas adalah **draft untuk ditinjau**, belum policy aktif. |
| Google | Pemilik telah menentukan akun Google untuk penyiapan layanan. Status pembuatan/verifikasi setiap produk harus diperiksa; login Google bukan bukti akun Ads/GA4/GTM/GSC sudah tersedia. |
| Meta | Facebook/Instagram belum tersedia; pemilik akan membuat Instagram dan memberikan URL. Paid Meta tetap Rp0. |
| Anggaran | Total Rp500.000 selama sebulan, Google Search dahulu. Hosting/domain di luar budget media. Tidak ada spend atau billing aktif dari perubahan ini. |

## Perubahan yang diimplementasikan pada PR ini

Halaman `/privasi` menggunakan nama kawasan terpublikasi dan nomor WhatsApp dari CMS existing. Bila nama belum tersedia, gunakan nama publik yang dipilih pemilik. Teks tetap escaped Vue, tanpa HTML editorial atau akun staf. Tidak menambah endpoint, role, database, provider tag atau dependency. Editor Admin memperjelas pemakaian nama pada halaman privasi.

Acceptance: nama dan kontak dari DEVELOPMENT yang published/verified tampil pada SSR privasi; perubahan melalui CMS existing tercermin pada pembukaan halaman berikutnya; draft/unverified tidak ditampilkan; fallback nama tidak kosong; form dan tracker tetap mengikuti gate sebelumnya. Rollback cukup deploy source sebelum PR ini, tanpa rollback database.

Verifikasi: lint/typecheck/unit/build frontend, smoke SSR/browser pada data sintetis, dan pemeriksaan diff; backend tidak berubah, suite backend tetap dijalankan sesuai aturan repository. Review independen mencakup seluruh perubahan serta file pengguna yang dikecualikan. Tidak menjalankan cleanup/anonymize pada produksi. Hasil aktual dicatat pada PR.

## Draft notice dan aktivasi

[Draft privasi](privacy-notice-draft.md) adalah artefak review, bukan kebijakan yang telah disahkan. `GROWTH_PRIVACY_NOTICE_APPROVED`, `GROWTH_RETENTION_APPROVED`, `RETENTION_APPROVED` dan intake produksi tidak dinyalakan hanya karena draft selesai. Durasi lead terminal terkait kemampuan tinjauan Admin existing, bukan job penghapusan otomatis seluruh lead.

Setelah pemilik meninjau isi final: cocokkan notice version/URL, allowlist tepat lima ID produksi, durasi konfigurasi, prosedur cleanup dan masa berlaku backup/log. Verifikasi kanal permintaan privasi, formulir tanpa consent opsional, success/retry, role scope dan monitoring. Data rehearsal tetap pada schema/prefix sintetis yang telah diotorisasi.

## Akun dan domain

Siapkan GTM milik akun Google yang ditentukan, GA4 IDR/Asia Jakarta, Search Console dan draft Search Ads. Penambahan akun memerlukan pemeriksaan syarat provider; tidak menyatakan persetujuan layanan telah diberikan oleh AI. Tag/container diuji sebelum dipublikasikan, tidak memasang tag otomatis hanya karena ID diperoleh. Jangan membuat property GSC domain yang belum dikuasai atau mengubah canonical ke domain yang belum melayani situs.

Instagram dan Facebook ditautkan hanya setelah URL resmi diberikan dan kepemilikan diverifikasi. Tidak membuat username, logo kemitraan atau profil bisnis lokal yang belum disahkan.

## Kualifikasi Hostinger sebelum pembelian

Business Web Hosting adalah kandidat karena dokumentasi resmi mencantumkan Nuxt/Node24. Itu belum membuktikan semua kebutuhan Laravel: periksa PHP sesuai lockfile, `pdo_pgsql` CLI/web, TLS outbound ke Supabase, GD/WebP, release Laravel yang hanya mengekspos `public`, upload, scheduler/worker, scanner PDF, serta pemulihan. Database Supabase yang eksternal tidak memerlukan server PostgreSQL lokal, tetapi tetap memerlukan driver PHP dan jaringan yang cocok.

Sumber: [Node.js Web Apps](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/), [database dan tools](https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/). Dukungan pada akun/SKU target dan rehearsal belum dibuktikan; belum ada rekomendasi pembelian final atau jaminan kelayakan shared. Tidak mengirim pesan ke dukungan Hostinger tanpa instruksi pemilik.
