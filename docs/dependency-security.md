# Dependency security — 2026-10-03

Composer audit dan npm audit dijalankan pada lockfile, bukan dianggap aman hanya karena versi terbaru. Nuxt4.5.2 adalah versi registry latest yang diperiksa pada tanggal review. Dependency tooling transitif menampilkan dua advisory langsung, yang dipropagasi npm sebagai 11 entry high:

| Advisory | Dependency / use | Status dan batas |
|---|---|---|
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge1.4.0 lewat listhen/CLI/dev TLS | Tidak ada patched version pada advisory/registry saat review; aplikasi tidak memakai forge untuk signature verification; jangan expose dev server |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces3.0.3 lewat micromatch/globby/Nitro build | Tidak ada patched version registry saat review; glob berasal dari source/config developer, bukan query user |

Tidak melakukan `npm audit fix --force` yang menyarankan downgrade Nuxt3.15.1 dan mengubah stack tanpa memperbaiki akar masalah. Tidak mem-fork dependency atau menghilangkan scan. Audit toolchain tetap dilaporkan oleh CI dan dapat gagal sampai patch tersedia; PR tetap reviewable sebagai fondasi, tidak menjadi otorisasi deploy. Artefak produksi hanya `.output`, bukan node_modules toolchain; dependency runtime artefak diperiksa terpisah saat build. Batas ini mengurangi exposure, tidak menyatakan advisory telah diperbaiki.

Pemilik Engineering wajib mengevaluasi ulang saat patch upstream tersedia, membuat branch fix baru, memperbarui lockfile, typecheck/test/build/E2E dan scan ulang sebelum rilis. Tidak ada risk acceptance permanen atau hasil 'zero vulnerabilities' palsu untuk source dependency tree. Rilis produksi tetap membutuhkan gate keamanan yang ditinjau pemilik.

Hasil audit artefak `.output/server` yang benar-benar di-deploy: 0 advisory (65 dependencies runtime dilaporkan npm) pada build lokal. CI membuat lock audit hanya di folder output yang diabaikan Git lalu mengulang scan. Ini tidak mengubah hasil source toolchain yang masih 11 entry high dari dua advisory di atas. Build juga menghasilkan satu warning deprecation `DEP0155` pada resolver Vue/Nitro; lint aplikasi lulus dengan `--max-warnings 0`, warning upstream dicatat tanpa disembunyikan.
