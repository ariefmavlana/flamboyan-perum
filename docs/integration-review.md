# Pemeriksaan dan integrasi PR ke main

Snapshot2026-10-04 Asia/Jakarta. Pengguna secara eksplisit meminta seluruh open PR diperiksa dan langsung di-merge ke main jika tidak ada blocker/conflict. Delapan PR yang terbuka (#3–#10) diperiksa sebelum mutation, lalu diintegrasikan berurutan dengan merge commits. Main semula `e9ca01ab889d0d2735ce3ff145ae07d57d69e370` (bootstrap).

## Pemeriksaan sebelum merge

- REST list seluruh open PR dan GraphQL review decision/mergeState/reviewThreads. Pagination diperiksa; delapan PR non-draft, mergeable, CLEAN, tidak mempunyai review submission/comment/unresolved thread/changes requested. Ini pemeriksaan keadaan review, bukan klaim approval dari reviewer independen.
- Rules/protection main dan izin repository diperiksa. Main tidak protected, branch rules kosong, merge commits diizinkan. Tidak mengubah aturan atau memakai bypass/admin override. Branch protection tetap belum dikonfigurasi; perubahan berikutnya mengikuti AGENTS/PR dan otorisasi pengguna.
- Setiap expected head SHA cocok dengan remote Git yang difetch. Main adalah ancestor awal; delapan head membentuk rantai linear. `git merge-tree --write-tree origin/main origin/codex/dynamic-demo-data` clean dan tree hasil sama dengan final PR #10 yang sudah divalidasi.
- Head masing-masing mempunyai0check run/0status context. GitHub combined-status kosong mengembalikan pending, sementara mergeState CLEAN dan required-check rules kosong. Tidak ada job/check aktual yang sedang menunggu atau gagal, dan GitHub Actions tidak dijalankan. Bukti kualitas berasal dari suite lokal yang tercatat pada PR/dokumen validasi.
- Sebelum setiap merge, PR lanjutan di-retarget ke main, mergeability/review threads/checks diperiksa lagi, serta head SHA dan main SHA diverifikasi tetap sesuai snapshot. REST merge memakai expected head SHA dan metode merge; berhenti jika review/head/main/check berubah. Tidak melakukan squash/rebase atau force-push yang memutus ancestry stack.

## Hasil per PR

| PR | Head yang diperiksa | Merge commit main |
|---|---|---|
| [#3 fondasi](https://github.com/ariefmavlana/flamboyan-perum/pull/3) | cbde01f07835147d9b38355fd678095a276baef5 | 4876895cb29829f78ee97e6a0f0d724c9d476dfd |
| [#4 workspace](https://github.com/ariefmavlana/flamboyan-perum/pull/4) | 45b7606069bcc95473f1ac7e5805b641aefb6e45 | e141b8db6ec3f436dc1d8011c43857ee340b440b |
| [#5 media](https://github.com/ariefmavlana/flamboyan-perum/pull/5) | f564621ca7b58f8bdf41ac4c6bdce05af6d74d7b | 5210f42be9e24dd0a2340ecf4e5003623e9f786c |
| [#6 evaluasi](https://github.com/ariefmavlana/flamboyan-perum/pull/6) | d6bc89e92870ba53e4a385a4e9cfaa8e3c2444ba | aaa5c744b6fa61cc2c78ee2c0d0169ab92477583 |
| [#7 realtime](https://github.com/ariefmavlana/flamboyan-perum/pull/7) | 53493f8c3adfea30eb9223f574966bf3b799d896 | c44be083fba0891b8edc962cb8ada53bc2b35a41 |
| [#8 supervisi/privacy](https://github.com/ariefmavlana/flamboyan-perum/pull/8) | bf5759f82ed719254dd243d6c6773e53c56746e4 | aee4e308de188618db0d34e1536d36e1083174dc |
| [#9 acceptance](https://github.com/ariefmavlana/flamboyan-perum/pull/9) | 29518c6f69c8029c02da584365ba1cf3996f258b | 4c0405af684b6cb0287bebb72dc0dc82f4601de4 |
| [#10 dummy dinamis](https://github.com/ariefmavlana/flamboyan-perum/pull/10) | ee3cec756544b85e00864562610de31a1af39f23 | e2e1ccd9a82796d32e57105aed0b062f5701a9e7 |

Seluruh delapan PR benar-benar merged ke main, bukan hanya ditutup. Sesudah stack selesai, API list open PR mengembalikan0. Tidak menghapus branch atau database/media/private environment. REST API memakai kredensial Git lokal yang sudah berizin; token tidak dicetak atau disimpan.

## Verifikasi hasil dan bukti kualitas

`origin/main^{tree}` = `ee3cec7^{tree}` = `0e7178e2a8e8f6fdf0c0bba18b65c90483bf60ea`. `git diff --exit-code ee3cec7 origin/main` kosong. Main lokal disinkronkan fast-forward. Karena isi seluruh aplikasi persis sama, bukti akhir PR #10 berlaku untuk tree ini: Pint;71PHPUnit/504assertions masing-masingSQLite/PostgreSQL17.9; Composer strict/audit0; route cache/clear; frontend lint0/typecheck/build;13Vitest;13browser flows dengan rate-cache fixture isolation/media worker aktif; output runtime audit0. Ini menggunakan hasil yang sudah dijalankan, tidak mengklaim rerun suite sesudah merge.

Pengujian gagal dan perbaikannya, command/runtime, serta batas scope tersedia di dynamic-demo-validation.md dan bukti setiap tahap. Load/restore dari PR #9 tetap bukti lokal terisolasi; tidak diulang pada integrasi ini. Workflow tree hanya `.github/pull_request_template.md`, tanpa GitHub Actions. Tidak ada konflik manual atau perubahan kode tambahan saat integrasi.

Dokumen README/status/plan/traceability diperbarui melalui branch `codex/record-main-integration` yang dibuat dari main setelah PR #10, dengan Conventional Commit dan PR tersendiri ke main. Perubahan ini hanya dokumentasi: diff check, tautan lokal/SHA/table diperiksa; tidak menambah migration atau memodifikasi aplikasi. Catatan validasi historis sebelum merge tetap diberi konteks snapshot, bukan dihapus.

## Batas yang tetap terbuka

Audit source masih11high propagated entries dari advisori upstream; Composer/output runtime0 tidak menyelesaikan gate source. HostingHostinger/Rumahweb paket/domain, TLS/routing/proses Node/worker, realSMTP/Pusher≤5s/ClamAV, konten/rate/izin asli, privacy/offsite/UAT/runtime hosting tetap memerlukan bukti. Merge ini mengintegrasikan kode ke main, tanpa deployment, risk acceptance produksi, atau klaim bebas seluruh error/WCAG/cross-browser.

Rollback integrasi memerlukan PR tersendiri dan penilaian schema/data compatibility. Jangan reset/force-push main, migrate:fresh, rollback schema destructive atau memulihkan data bisnis otomatis. Data demo/workspace private tetap dipertahankan; instruksi merge tidak merupakan instruksi deploy.
