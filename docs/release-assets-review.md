# Review rilis gabungan — 15 Oktober 2026

Pengguna mengotorisasi review semua PR terbuka/draft, merge yang lolos, dan publikasi live. Base main c1cecaf. Lima HEAD telah diperiksa: #30 9589acf, #31 7eb577a, #32 a1863a0 (draft), #33 201fda6 (draft), #34 8e9f09c. Masing-masing memiliki status Vercel API/web success dan tidak mempunyai review/inline comment yang meminta perubahan pada inventaris awal. Semua HEAD menjadi ancestor branch codex/release-assets-review-20261015; rilis gabungan mencegah deployment intermediate yang saling menimpa.

## Temuan dan resolusi

- Kegagalan insert audit LOGIN terbukti mengembalikan500 tetapi meninggalkan sesi authenticated. Regresi RED gagal dengan pesan 'The user is authenticated'. Controller kini logoutCurrentDevice, invalidate dan regenerateToken sebelum melempar kembali error; seluruh10 regresi OperationalTest lulus84assertion pada SQLite.
- Guard TLS PR30 membutuhkan verify-full, tetapi CA provider belum tersedia pada konfigurasi hosting. CA resmi Supabase diambil dari URL dashboard resminya, masa berlaku sampai26April2031, fingerprint SHA256 807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa. Sertifikat publik disertakan dalam resources/certificates. Config memakai utilitas Symfony Path existing agar DB_SSLROOTCERT relatif selalu terhadap app, sambil mempertahankan path absolut Windows/Linux. Regresi path RED lalu GREEN.
- Probe PDO cloud dengan CA resmi dan verify-full lulus. Probe PostgreSQL STARTTLS Node memverifikasi CA+hostname aktual: TLS1.3/TLS_AES_256_GCM_SHA384; CA salah SELF_SIGNED_CERT_IN_CHAIN, hostname salah ERR_TLS_CERT_ALTNAME_INVALID. pg_stat_ssl di belakang pooler mengukur koneksi pooler-backend, sehingga bukan bukti transport client.
- Pengguna secara eksplisit mengizinkan konfigurasi terenkripsi DB_URL/DB_SSLMODE/DB_SSLROOTCERT pada project Vercel flamboyan-api untuk preview/production. Metadata diperiksa dengan decrypt=false; secret tidak diambil dari Vercel, dicetak, atau di-commit. Preview branch disiapkan terlebih dahulu. Satu alias preview exact ditambahkan ke TRUSTED_HOSTS branch karena probe ditolak400 pada allowlist produksi; tidak memakai wildcard dan tidak mengubah produksi. Probe HTTP preview final menunggu redeploy metadata terakhir.
- Seluruh55 hash sumber PR31 cocok dengan inventaris PR34. Importer/generator lama digantikan satu jalur private-upload/journal PR34:50PHOTO+5FLOOR_PLAN,58EDITED lengkap,17foto aktual,22video ditunda. Tidak mengupload paket lama lagi, tidak mengklasifikasikan gambar render/denah sebagai foto kondisi aktual, dan tidak mengubah bisnis/harga/CRM.
- Logo/gerbang/favicon lama yang tidak dirujuk dihapus dari kandidat; link icon ganda dan prop BrandLogo lama disatukan. Metadata Bandung Timur mempertahankan koreksi lokasi PR31. Marker ED/RR/BFI2 hanya dihapus pada suffix DTO publik; internal provenance dan label ilustrasi tetap.
- Dua browser failure awal adalah timeout login pada fixture dingin dan pembatalan goto menunggu load ketika guard telah redirect. Test redirect menunggu domcontentloaded; konfigurasi runner Windows memberi expectation15detik. Seluruh assertion role/API403/URL/konten tetap.

- Smoke Vercel-mode menemukan /api/csp-report tertelan proxy /api/** dan404. Regresi RED terkonfirmasi; proxy kini hanya /api/v1/**. Regresi browser GREEN memastikan laporan204, payload413 dan private API401; smoke raw UTF-8 chunked413/Connection close, kuota429/Connection close serta log origin/directive tersanitasi lulus.
- Build Linux menangkap dua asumsi harness: path drive Windows di Linux dan repository environment immutable ketika DB_SSLROOTCERT sudah terisi. Tes menggunakan path native dan menyimpan/memulihkan seluruh sumber env secara eksplisit; bukan melonggarkan verify-full. Build Linux113tes/904assertion lulus pada121c868; satu assertion Windows khusus menjelaskan beda jumlah dengan Windows.

## Bukti validasi

Windows, Node24.21.0, PHP8.4.26, Laravel13.36.0/PHPUnit12.5.39, Nuxt4.6.1/Nitro2.13.4/Vite8.3.2, PostgreSQL17, Chrome.

- npm ci sesuai lock pada worktree terisolasi; lint/typecheck/48unit pada11file lulus dan diulang sesudah patch CSP. Build produksi final node-server dengan proxy Vercel lulus19.2s; audit runtime final0. Build dingin pertama5m35s. Warning upstream DEP0155 dan runner NO_COLOR/FORCE_COLOR dicatat.
- Pint final dan Composer validate strict/audit0 lulus. Suite final SQLite113tes/905assertion lulus15.120s dan PostgreSQL113tes/905assertion lulus23.808s; cluster test dihentikan. Run awal artisan test112tes menghasilkan109warning harness; hasil itu tidak dianggap bebas warning. PHPUnit langsung dengan key fixture eksplisit lulus tanpa warning.
-19regresi importer lulus.20kasus browser terdampak:6Admin,6project,4gallery,3residences,1routing CSP. Run serentak final16lulus/4gagal karenaHTTP429 (trace Retry-After19–32detik), bukan assertion produk; kelompok7gallery/residences diulang setelah jendela limiter dan seluruh7lulus16.1s; seluruh20kasus telah lulus pada build final dalam kelompok. Limiter120request/menit tidak diubah. Screenshot desktop1440/mobile390 dan0pageerror diperiksa.
- File mentah, video, env, DB/storage fixture, journal, token dan runtime tetap ignored. Source pengguna di checkout utama tidak diubah oleh integrasi worktree ini. Tidak ada migration, seed cloud, penghapusan cloud, atau GitHub Actions.

## Keputusan pemilik — 15 Oktober 2026

Pemilik menjawab eksplisit **"Terima risiko sementara; lanjutkan"** untuk11high source dari braces/node-forge tanpa patched release, dengan runtime audit0, dev loopback dan build dari source/config tepercaya. Izin konfigurasi TLS preview/production juga telah diberikan terpisah. Ini penerimaan risiko sementara pada rilis ini, bukan hasil auditPASS, suppression, approval GitHub palsu, atau penerimaan otomatis untuk dependency/perubahan baru. Merge tetap mensyaratkan HEAD/main/review/check terbaru, probe TLS hosting dan hasil fungsional yang lulus. Temuan harus ditangani saat patch resmi tersedia.

## Gate source audit

Source npm audit masih FAIL/exit1:11high/0critical, dua akar braces3.0.3 dan node-forge1.4.0. Dua critical lama simple-git/argv-parser terselesaikan oleh lock PR32. Registry resmi dan [advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) / [advisory node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) masih belum menyediakan patched release saat pemeriksaan15Oktober2026.

Keduanya digunakan pada tooling glob/dev TLS; aplikasi tidak menerima glob pengguna atau memakai forge untuk signature. Keduanya tidak dikirim pada artefak runtime yang diaudit. Dev tetap loopback, tanpa tunnel/TLS dev, build hanya source/config terpercaya. Mitigasi tersebut bukan patch atau penerimaan risiko manusia. Source audit tetapFAIL. Gate penerimaan risiko sementara telah dipenuhi melalui jawaban eksplisit pemilik di atas; gate teknis lain tetap wajib lulus. Tidak ada klaim patched release atau audit source bersih.

## Rollout dan rollback

Setelah gate dipenuhi: cek main/HEAD/review/status terbaru; pastikan preview API verify-full dan web berfungsi; update environment produksi terenkripsi yang sama; jadikan draft siap; merge candidate exact SHA tanpa bypass. Verifikasi semua PR tertutup merged dan dua deployment produksi READY pada SHA main sebelum import55media. Importer harus melihat supports_unpublished_uploads=true, dry-run cocok, lalu55READY privat sebelum publish. Journal/metadata bisnis diverifikasi, rerun0baru/55reused, sweep gambar/galeri/logo/mobile dan audit R2refs0hilang. Cleanup tetap dry-run;0eligible bukan alasan menghapus objek aktif.

Rollback aplikasi: promosikan deployment produksi terakhir yang sehat beserta environment immutable-nya; revert source melalui PR dan selaraskan TLS config sebelum deployment berikutnya. APP_KEY tidak berubah. Rollback konten hanya unpublish media baru/pulihkan posisi dan flag lama dari journal memakai versi terbaru. Jangan restore seluruh database atau menimpa CRM. Sertifikat publik bukan private key.
