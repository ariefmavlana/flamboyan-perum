# Dependency security — 2026-10-03

Composer audit dan npm audit lengkap dijalankan pada lockfile, bukan dianggap aman hanya karena versi terbaru. Pemeriksaan akhir pada commit `b5468a2` mencakup devDependencies. Nuxt4.5.2, Nitro2.13.4, listhen1.10.1, globby16.2.4, node-forge1.4.0 dan braces3.0.3 masih versi registry latest saat verifikasi 2026-10-03. Dua advisory upstream yang belum mempunyai patch dipropagasi npm sebagai 11 entry high; tidak ada temuan moderate/critical setelah fix Vitest.

## Perbaikan yang selesai

Audit awal lengkap menemukan 13 entries: 11 high di bawah dan 2 moderate yang berasal dari [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). Vitest3.2.7 diganti dengan **Vitest4.1.11**, versi patched resmi beserta @vitest/mocker. `npm ci`, lint/typecheck, 5 unit tests, 3 browser flows dan SSR build lulus setelah update. Advisory Vitest tidak lagi muncul pada audit; tidak menggunakan `audit fix --force`, pengecualian scanner, fork atau patch kriptografi buatan sendiri.

`npm run audit:source` memeriksa seluruh dependency tree. `npm run audit:runtime` memeriksa artefak `.output/server` setelah lock audit dibuat sesuai runbook. Source tidak memakai `--omit=dev` karena itu melewatkan test tooling.

## Temuan upstream terbuka

| Advisory | Dependency / use | Status dan batas |
|---|---|---|
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge1.4.0 lewat listhen/CLI/dev TLS | Tidak ada patched version pada advisory/registry saat review; aplikasi tidak memakai forge untuk signature verification; jangan expose dev server |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces3.0.3 lewat micromatch/globby/Nitro build | Tidak ada patched version registry saat review; glob berasal dari source/config developer, bukan query user |

Jalur aktual: Nuxt → CLI/Nitro → listhen → node-forge, dan Nuxt → Nitro → globby/fast-glob → micromatch → braces. Dev server terikat127.0.0.1, tidak memakai tunnel/TLS development; aplikasi tidak melakukan signature verification melalui forge atau menerima glob user. Build hanya memakai source/config developer yang dipercaya. Risiko meningkat bila dev server diekspos atau source/config build tidak dipercaya; jangan menjalankan tooling pada input tersebut.

Tidak melakukan `npm audit fix --force` yang menyarankan downgrade Nuxt3.15.1 dan mengubah stack tanpa memperbaiki akar masalah. Tidak mem-fork dependency atau menghilangkan scan. Audit source masih **exit1**, wajib dicatat pada PR. PR dapat direview sebagai fondasi dengan keterbatasan tersebut; kesiapan review bukan penerimaan risiko atau otorisasi produksi. GitHub Actions tidak digunakan. Artefak produksi hanya `.output`, bukan node_modules toolchain; lock artefak telah diperiksa dan tidak memuat node-forge, braces, Vitest atau @vitest/mocker. Batas ini mengurangi exposure, tidak menyatakan dua advisory upstream telah diperbaiki.

Pemilik Engineering wajib mengevaluasi ulang saat patch upstream tersedia, membuat branch fix baru, memperbarui lockfile, typecheck/test/build/E2E dan scan ulang sebelum rilis. Tidak ada risk acceptance permanen atau hasil 'zero vulnerabilities' palsu untuk source dependency tree. Rilis produksi tetap membutuhkan gate keamanan yang ditinjau pemilik.

Hasil audit artefak `.output/server` yang akan di-deploy: **0 advisory** pada build akhir lokal. Audit lokal membuat lock hanya di folder output yang diabaikan Git; ulangi setelah setiap build sebelum rilis sesuai runbook. Ini tidak mengubah hasil source toolchain yang masih 11 entry high dari dua advisory di atas. Build juga menghasilkan satu warning deprecation `DEP0155` pada resolver Vue/Nitro; lint aplikasi lulus dengan `--max-warnings 0`, warning upstream dicatat tanpa disembunyikan. Belum ada deployment produksi.

## Final acceptance audit

Audit ulang pada branch operational-acceptance (2026-10-03): source11 high/exit1 tetap dua advisory di atas; Composer0 dan production.output/server0/exit0. Npm menyarankan audit fix/force pada dependency chain, tetapi advisory root masih mencakup seluruh versi tersedia dan force menawarkan downgrade Nuxt3.15.1. Tidak ada patch dipalsukan, scanner suppression atau risk acceptance produksi otomatis. Validasi final13unit/12browser/build/lint/typecheck tercatat pada acceptance-validation.md; hasil awal5unit/3browser di atas adalah historis perbaikan Vitest.
