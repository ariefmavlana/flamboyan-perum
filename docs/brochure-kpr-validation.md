# Validasi katalog brosur dan pembiayaan

Branch codex/brochure-kpr dari origin/main3257844; commit operasional PR#18 dibawa melalui cherry-pick agar rilis main tetap memakai routing/auth/media cloud yang telah diuji. Tidak mengubah CSS/tema/layout dasar, menambah dependency, menjalankan seed produksi atau GitHub Actions. Importer/snapshot/kunci/aset source lokal tidak dicommit. Kontrak, sumber dan rekonsiliasi ada di API_DOCS.md dan brochure-kpr-research.md.

## Validasi lokal 2026-10-05

Runtime PHP8.4.26 dengan GD, Node24.21.0, PostgreSQL17.9 dan Chrome terpasang. Database pengujian SQLite terisolasi dan PostgreSQL port15533/database vercel_fix_tests, bukan Supabase. Cluster PostgreSQL dihentikan sesudah suite.

| Perintah | Hasil | Durasi wrapper |
|---|---|---|
| PHP vendor/bin/pint --test | exit0 |1.23s|
| PHP artisan test (SQLite) |94tests/713assertions,exit0,9.05s suite|9.77s|
| PHP artisan test (PostgreSQL terisolasi) |94tests/713assertions,exit0,16.41s suite|17.91s|
| Composer validate --strict |exit0|1.30s|
| Composer audit |0advisory,exit0|2.01s|
| npm run lint |exit0|3.55s|
| npm run typecheck |exit0|6.17s|
| npm test |17tests,exit0,318ms tests|1.09s|
| npm run build |exit0|12.75s|
| npm audit |11high/0critical,exit1|2.32s|
| npm audit --prefix .output/server --omit=dev |0advisory,exit0|0.92s|

Source audit masih dua advisory upstream tooling: node-forge GHSA-86w9-cpqp-85rv dan braces GHSA-vfj7-8cjw-p6xm. Dependency lockfiles tidak diubah. Runtime bersih tidak menyatakan seluruh supply chain bebas temuan. Detail historis di dependency-security.md. Tidak memakai downgrade paksa Nuxt untuk menyembunyikan audit.

Regresi backend mencakup Admin/Marketing/attestation/stale version, atomisitas audit, total cash bertahap, overlap program, tanggal WIB pada batas bulan, harga filter/sort/compare, biaya yang belum aktif, public nested allowlist, source-date WIB, phases/optional min-max numeric dan expiry bank. MediaTest menambah MASTERPLAN single limit/private processing/publish/revoke. Unit frontend menghitung multi-phase dari sisa saldo, perubahan bunga invalid dan biaya minimum/maksimum/tidak diketahui.

Tujuh kelompok browser lokal lulus pada katalog hasil impor terisolasi: sembilan tipe/harga/luas dan152unit rencana; layout/hero/fasilitas/kontak; PHOTO dan MASTERPLAN yang berbeda; KPR BCA bertahap beserta plafon/tenor/manual100%DP; Admin commercial save/409/Marketing403 dan72CRM tetap; CMS phases/DEVELOPMENT/attestation serta perubahan kontak terlihat publik lalu dipulihkan; mobile390px tanpa overflow dan tanpa pageerror. Screenshot desktop/mobile diperiksa visual. Browser ini memakai Chromium pada Chrome Windows, bukan klaim seluruh cross-browser/WCAG.

## Rilis cloud

Rilis memerlukan kedua deployment source main berstatus READY, migrasi aditif selesai, impor sembilan tipe melalui API live dan uji browser live. Source price list/brosur menyimpan batasan harga tanggal30Oktober, promo cash expired dan gambar ilustrasi. Hasil ID deployment/SHA, public/R2/role/CMS dan jumlah data akhir dicatat pada deskripsi PR setelah pelaksanaan; validasi lokal di atas tidak disebut sebagai hasil cloud.

Rollback: revert PR source melalui main tanpa down migration, lalu redeploy; konten/availability/publication dapat dipulihkan dengan API versi terbaru dari snapshot privat. Archive24katalog awal tidak menghapus72lead/histori. Rate/fasilitas yang belum diperiksa ulang dapat di-unpublish. Tidak menjadikan batas BI sebagai keputusan kredit atau narasi bank mitra.
