# Performa — baseline terukur dan protokol sesudah perubahan

Versi 1.1 · 2026-10-14 · Di-merge ke `main` melalui PR #25 (`808b69c`) · Hanya data yang benar-benar diukur yang dicatat.

## 1. Ringkasan jujur

- **Tidak ada** data Core Web Vitals lapangan (LCP/INP/CLS p75): situs belum memiliki RUM/trafik terukur dan tidak ada akses CrUX/Search Console.
- **Tidak ada** pengukuran Lighthouse/PageSpeed lab pada pekerjaan ini (alat tidak tersedia di lingkungan kerja); perintahnya dicantumkan pada bagian 4 agar dapat dijalankan konsisten.
- Yang tersedia: pengukuran artefak build di mesin lokal (Windows, Node 24, cache Vite terisi) dan fakta struktural dari inspeksi source.

## 2. Baseline struktural (sebelum dan sesudah perubahan sama)

| Aspek | Kondisi | Sumber |
|---|---|---|
| Skrip pihak ketiga | Tidak ada pada baseline; setelah branch tetap nol selama ID tidak diisi | inspeksi source; `nuxt.config.ts`, `app/plugins/consent.client.ts` |
| CSP | `script-src 'self' 'nonce-…'` (tanpa `strict-dynamic` sampai tag dikonfigurasi) | header respons terverifikasi lewat smoke lokal |
| Gambar | Varian responsif (`srcset`/`sizes`), `loading="lazy"` untuk bawah fold, `fetchpriority="high"` untuk hero/galeri utama, `width`/`height` eksplisit | `PropertyCard.vue`, `index.vue`, `panduan/[slug].vue`, `PropertyGallery.vue` |
| Font | Dua berkas lokal (`dm-serif-display.ttf`, `manrope-variable.ttf`), `font-display: swap`, tanpa CDN | `assets/editorial.css` |
| Peta/video/tour | Iframe dimuat hanya setelah pilihan pengunjung (click-to-load) | `PropertyLocation.vue`, `PropertyGallery.vue`, `EditorialHeroMedia.vue` |
| JavaScript framework | Nuxt 4.5.2 / Vue 3.5.43, tidak ada dependency baru ditambahkan pada branch ini | `package.json` (tidak berubah) |

## 3. Artefak build terukur (branch ini)

Perintah: `npm run build:checked` di `apps/web`, 2026-10-14, Windows, Node 24, cache Vite aktif.

| Metrik | Nilai |
|---|---|
| Durasi build klien | 3,02 s (incremental; nilai ini tidak boleh dibandingkan dengan build bersih di CI) |
| Durasi build server Nitro | ±1,5 s setelah build klien |
| Berkas JS klien | 53 berkas, total 500,4 kB sebelum kompresi |
| Berkas CSS klien | 3 berkas, total 61,1 kB |
| Total `/.output/public` | 67 berkas, 2.344,6 kB (termasuk font dan gambar statis) |
| Chunk JS terbesar | 92,39 kB (gzip 33,54 kB); berikutnya 90,34 kB (gzip 35,03 kB); 61,01 kB (gzip 18,12 kB) |

Dampak perubahan pada dokumen buatan manusia/metadata: blok JSON-LD ditambahkan ke HTML SSR (WebSite di beranda, Breadcrumb + listing di detail properti) — ukuran orde ratusan byte per halaman, tidak ada permintaan jaringan tambahan. Banner consent tidak dirender saat tidak ada ID opsional (terverifikasi: 0 kemunculan `consent-banner` pada HTML SSR tanpa konfigurasi).

**Tidak ada** perbandingan bundle "sebelum vs sesudah" yang diukur dengan build bersih pada `main`. Untuk mendapatkannya, jalankan prosedur pada bagian 4 pada dua revisi berbeda (mis. `git worktree add ../main-check main`).

## 4. Protokol pengukuran (untuk dijalankan konsisten)

Lab (setiap revisi, kondisi sama):

1. `npm ci && npm run build && npm run start` di `apps/web`.
2. `npx lighthouse http://127.0.0.1:3000/ --preset=desktop --output=json --output-path=<hasil>-desktop.json` dan variasi `--form-factor=mobile`. Catat: LCP, CLS, TBT, total byte, jumlah permintaan.
3. Ulangi untuk `/properti` dan satu `/properti/{slug}`.
4. Simpan hasil di `.tools/` (gitignored) dan rangkum angka di dokumen ini pada PR pengukuran.

Lapangan (setelah rilis + trafik):

1. Aktifkan GTM + GA4 dengan persetujuan pengunjung, aktifkan Web Vitals reporting (GA4 otomatis mengumpulkan Core Web Vitals bila tag aktif dan consent diberikan).
2. Setelah kira-kira 4 minggu: periksa laporan Core Web Vitals di Search Console (data lapangan) dan bandingkan terhadap target: **LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 pada p75 mobile**.
3. Jangan memakai angka lab sebagai pengganti data lapangan; jangan mengklaim lulus target tanpa keduanya.

## 5. Risiko regresi yang dipantau

| Risiko | Mitigasi yang sudah ada | Verifikasi |
|---|---|---|
| Tag GTM memperlambat LCP/INP | Dimuat `async` dan hanya **setelah** persetujuan (tidak ada tag sebelum interaksi pengunjung) | Smoke: tanpa keputusan → 0 permintaan ke `googletagmanager.com` |
| Duplikasi pixel/GA4 | Satu orkestrator GTM; peringatan bila pixel langsung + GTM bersamaan | Unit test CSP + peringatan konsol |
| CSP memblokir tag yang sah | Host ditambahkan hanya untuk ID yang diisi | Unit test `csp.test.ts` |
| Gambar hero tertunda | Hero memakai `fetchpriority="high"` dan bukan `loading="lazy"` | Inspeksi source + smoke HTML |

## 6. Batas

Dokumen ini tidak menyatakan target Core Web Vitals tercapai. Target baru dapat dievaluasi setelah trafik nyata dan analytics aktif. Nilai build pada bagian 3 berasal dari mesin pengembangan dengan cache; angka build bersih akan berbeda dan harus diukur ulang bila dipakai untuk keputusan.
