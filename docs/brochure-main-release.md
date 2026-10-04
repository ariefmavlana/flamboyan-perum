# Bukti rilis main dan katalog brosur

5Oktober2026 Asia/Jakarta. Situs [Flamboyan](https://flamboyan-web.vercel.app/) dan API [Flamboyan API](https://flamboyan-api.vercel.app/) sudah memakai source main69095d182d8e63d6d8b8c063c068d9be3e129eaa. Tidak mengaktifkan Pro trial/upgrade, GitHub Actions atau seed produksi. Panduan Admin: [admin-catalog-financing.md](admin-catalog-financing.md); sumber/rekonsiliasi: [brochure-kpr-research.md](brochure-kpr-research.md).

## Review dan integrasi

Pengguna memberi instruksi eksplisit review semua PR lalu merge jika lolos. Dua PR terbuka ditinjau: [#18](https://github.com/ariefmavlana/flamboyan-perum/pull/18),25files operasi cloud/auth/media/CI, dan [#19](https://github.com/ariefmavlana/flamboyan-perum/pull/19),42files tambahan katalog/CMS/KPR. RBAC/allowlist/transaksi/version, jadwal harga, aritmetika anuitas, perilaku serverless dan hasil pengujian diperiksa. Tidak ditemukan blocker baru;11temuan tooling upstream tetap terbuka sebagaimana scope audit sebelumnya, bukan dinyatakan selesai.

Keduanya bukan draft, tidak ada unresolved review thread atau changes requested, merge state CLEAN dan status API/web success sebelum merge. Merge memakai expected head SHA dan merge commit, tanpa commit fitur langsungmain atau bypass branch protection.

| PR | Head sebelum merge | Merge SHA |
|---|---|---|
|18|aa3f10d077f054c7ce20d52549e7673a9d3aec9e|36605a7c05d2618459939b157cbb3473e7adb2d6|
|19|f6b9941997573b3fe9dcb7757e7028776633ff29|69095d182d8e63d6d8b8c063c068d9be3e129eaa|

PR#19 membawa cherry-pick perubahan#18. Integrasi sesudah merge#18 menimbulkan dua konflik dokumentasi, diselesaikan pada branch fitur. Commit integrasi f6b9941 mempunyai tree6c7c8f696d3eeba9a7f86dddcd3a827c2fe63c90, persis sama dengan source5155fb6 yang telah diuji lokal. Karena push merge commit dengan tree identik tidak menjadwalkan preview otomatis, preview exact head dibuat memakai Vercel API dengan gitSource SHA; kedua check provider nyata lulus, tidak membuat status sukses manual. Preview API dpl_4sHVniCn5EFfyquzznoR4PKxNvFq dan web dpl_8eVtwD5A5sg1EVCGwGQ5s132YoLw READY. Tree aplikasi main hasil merge identik dengan source teruji.

## Deployment main

Kedua project memiliki link.productionBranch=main, root apps/api dan apps/web. Merge memicu deployment produksi Git otomatis:

- API dpl_GULf164knPkX3ksHxm3E3aj77n4j READY, source69095d1/refmain. PHP8.5.2: Pint,94PHPUnit/713assertions,Composer validate/audit lulus. Migrasi2026_10_05_000007_add_property_commercial DONE sesudah checks pada2026-10-04T23:36:05Z (06:36:05WIB5Oktober).
- Web dpl_3hVrdxAHJeFaWFus7L85fmbsWCfc READY, source69095d1/refmain. npmci/build:checked menjalankan lint --max-warnings0,typecheck,17unit tests dan build sukses.

DB pengujian build adalah SQLite in-memory/cache terisolasi; bukan Supabase. Preview tidak memigrasi database bersama. Migration production aditif dan kompatibel dengan source lama saat alias belum berpindah. Hasil lokal PostgreSQL94/713 dan audit0runtime/11highsource tercatat terpisah pada brochure-kpr-validation.md; tidak mengklaim itu adalah checks PostgreSQL Vercel.

## Impor dan kondisi akhir

Impor melalui API live selesai2026-10-04T23:39:03Z (06:39:03WIB5Oktober), sesudah kedua deployment READY. Snapshot privat dibuat sebelum perubahan. Sembilan tipe:36/60,36/72,36/90,62/70,62/84,69/80,56/90,56/108,62/140. Jumlah152unit adalah rencana; semua CHECK_REQUIRED, legalitas tidak direkayasa. Harga program/normal/jadwal sesudah30Oktober mengikuti sumber, dengan batasan hari30Oktober dijelaskan. Tiga skema cash September tersimpan internal dan tidak masuk penawaran aktif.

18media baru (9PHOTO/9MASTERPLAN) diproses pipeline GD/R2 private menjadi54varian WebP; masterplan bukan denah/status stok. CMS published:1HERO,1DEVELOPMENT,2referensiBANK_RATE BCA berkriteria, tanpa klaim kemitraan/logo. Kontak62895375894848 dan fasilitas bersumber dari brosur. Rate/testimonial sintetis tetap draft. Tidak mempublikasikan PDF yang scanner-nya belum tersedia.

Snapshot akhir06:43:43WIB:33properties (9published/24archived),72lead awal dengan referensi properti lama,4users aktif (1Admin/3Marketing),10CMS,0jobs/failedjobs dan seluruh18media katalogREADY. Fixture pemeriksaan tambahan dipensiunkan lewat pemeliharaan terbatas dengan snapshot/audit; katalog/CRM awal dan isi brosur tidak dihapus. Verifikasi read-only seluruh R2 memakai `PHP .tools/cloud-artisan.php flamboyan:media-verify --json`:414checked_variants,0missing,0missing_published,exit0.

## Browser produksi

20kelompok pengujian lulus pada Chrome Windows, source main69095d1:

1.7kelompok operasi: Admin login/reload/Marketing session; role403/anonymous401/owner404; Marketingcreate/edit/stale409/GDupload/private/public/revoke; Adminprovision/assignment/reassignment/notifikasi/pipelinehinggaDEAL/historiappend-only; HEROeditSSRandstale; TESTIMONIAL/BANK_RATE/BANK_PARTNERpublication/attestation/R2logo/revoke; public/workspace/report/readiness/logout/narasi.
2.6kelompok auth-publik: MarketingUI/halamanAdmin ditolak/logout; login salah tetap422JSON; sesi akuninactive dicabut401 dan loginulang422; recipient-onlynotificationread; seluruhfoto beranda termuat/narasi bersih;9katalog/72CRM setelah cleanup.
3.7kelompok katalog baru: sembilan tipe/harga/luas/152rencana/publicallowlist/filter; layout/fasilitas/kontak/gambar; PHOTOvsMASTERPLAN; KPRthree-phase/floating/fees/tenor/plafon/manual100%DP; Admincommercialsave/attestation/409/Marketing403; CMSphases/kontak/Marketing403;mobile390px tanpaoverflow/pageerror. Selesai06:43:08WIB. Perubahan kontak untuk membuktikan propagasi diuji dan dipulihkan pada browser lokal; browser live memeriksa kontak aktual tanpa mengganti nomor publik. HERO dan konten asli dipulihkan setelah pengujian operasional.

Screenshot desktop/mobile diperiksa visual. Tidak mengklaim seluruh cross-browser/WCAG, bank approval, stok, kondisi fisik, SMTP receipt, Pusher delivery, backup terjadwal atau UAT pemilik. Email masih mail log, push masih polling, PDF scanner belum tersedia. Source tooling masih11high dari dua advisory upstream; runtime audit0 bukan klaim supply chain bebas temuan. Batas provider tercatat di vercel-demo-deployment.md.

Rollback source melalui PR revert ke main/redeploy, tanpa down migration atau seed. Unpublish/restore konten memakai version terbaru dan snapshot privat; jangan menimpa perubahan Admin yang lebih baru. Perubahan Admin/CMS tersimpan langsung; perubahan kode dirilis melalui main.
