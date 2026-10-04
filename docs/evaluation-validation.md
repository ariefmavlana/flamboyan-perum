# Validasi evaluasi dan editorial publik

2026-10-03 · branch `codex/public-evaluation` · dependensi [PR #5](https://github.com/ariefmavlana/flamboyan-perum/pull/5), #4 dan #3; branch baru dari fetched main lalu dependency range fast-forward cherry-pick. Tanpa merge/Actions.

## Perilaku dan keputusan

Listing mempunyai seluruh filter PRD: query/lokasi tepat/sertifikat/harga/luas/kamar/kondisi/availability dan tujuh sort. URL menyimpan pilihan/pagination, back/reload menyinkronkan form, range terbalik ditolak, unknown query tidak diteruskan. Filtered URLs noindex dengan canonical katalog. Controls interaktif menunggu hydration agar klik tidak hilang/submit native tidak menghapus query.

Compare pilihan localStorage hanya ID, maksimal3/dedup, SSR dari query `ids=1,2,3`, hapus per item dan missing/unpublished label. API mengembalikan hanya public allowlist, mempertahankan urutan; unpublished tidak membocorkan judul/owner. Tampilan satu kolom mobile; butuh≥2 pilihan untuk evaluasi penuh.

Simulasi anuitas fixed atau satu reset fixed→floating eksplisit: cicilan dihitung ulang dari sisa pokok dan sisa bulan pada reset. Input integer IDR/DP, tenor1..30, rate0..30; final balance0 dan total dari schedule, tampilan dibulatkan IDR. Full DP/zero interest/reset invalid diuji. Grafik tahunan pokok/bunga memiliki label tekstual, jadwal bulanan accessible; biaya di luar angsuran tidak termasuk. Angka awal8%/12%/20%DP adalah asumsi berlabel, bukan tawaran aktual. Rate bank hanya referensi editorial verified yang masih berlaku menurut tanggal Asia/Jakarta; floating tetap asumsi pengguna.

CMS Admin terstruktur HERO/TESTIMONIAL/BANK_RATE, bukan generic CMS. Payload key allowlist, full validation, publication memerlukan attestation eksplisit pada setiap save; semua mutation versioned/audited atomik. Edit tidak mempertahankan attestation lama tanpa peninjauan. Hero publik pertama posisi/id; foto berasal dari cover sanitized properti published; draft reference menjadi null. Public hanya payload allowlist, tanpa aktor/verification identity. Maksimum12 testimonial/50 current rates pada public response, internal pagination20. Tidak membuat testimonial/kemitraan/rates bisnis fiktif.

Koordinat optional paired latitude/longitude decimal7. POI maksimal20 dalam JSON property: nama/kategori/jarak meter/source HTTPS/source_date≤tanggal lokal, scoped owner/Admin dan audit/version. JSON bounded dipilih karena seluruh referensi selalu ditampilkan bersama satu detail, tanpa kebutuhan mencari POI lintas properti; tidak menambah child table/query atau spatial service. Maps baseline embed resmi OpenStreetMap, consent/lazy/sandbox/no-referrer, attribution bawaan provider dan external link fallback; tanpa server fetch arbitrary URL. Jarak editorial bukan radius/waktu tempuh otomatis.

SEO: canonical/OG/SSR tetap, RealEstateListing/Offer/House faktual (tanpa rating buatan), JSON-LD escapes `<`, robots private/auth/query paths, sitemap index dengan file published per1000 serta static home/catalog. Upstream gagal503, unknown/out-of-range file404. Sitemap live/no-store; tidak memasukkan draft/archived/CRM. Submit root index ke Search Console pada domain nyata dan verifikasi cakupan sitemap sebelum rilis.

Primary references: [Schema.org listing](https://schema.org/RealEstateListing), [availability enum](https://schema.org/ItemAvailability), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [OpenStreetMap embedding](https://wiki.openstreetmap.org/wiki/Export#Embeddable_HTML), [OJK product information template](https://www.ojk.go.id/id/berita-dan-kegiatan/publikasi/Documents/Pages/Pedoman-Standar-Ringkasan-Informasi-Produk-dan-Layanan-Sektor-Jasa-Keuangan/Ringkasan%20Informasi%20Produk%20dan%20Layanan%20Sektor%20Jasa%20Keuangan%202019.pdf). Tidak menyalin rate terkini tanpa kurasi/sumber/date.

## Bukti lokal

- Windows PHP8.4.26/GD: Pint passed; PHPUnit49 tests/299 assertions masing-masing SQLite dan PostgreSQL17.9 isolated54329. Enam evaluation tests mencakup three-item order/dedup/draft, role/attestation/public allowlist, expiry/source, scope/version/coords, audit rollback, sitemap visibility dan hero draft/unknown payload.
- Node24.21.0: ESLint/typecheck/Vitest7 dan SSR build passed pada final setelah hydration controls; warning urutan atribut Vue difix dan lint rerun0warning. Unit floating membandingkan rumus reset independent, principal/schedule/totals invariants, zero rate/full DP/reset bounds.
- PlaywrightChrome seluruh8 flows passed55.6s. Tambahan mobile full filters/URL, localStorage/reload/max3/missing removal, fixed-floating/fullDP, structured data/no rating, sitemap/404/robots; Admin testimonial publish/unpublish, coordinates save dan map consent. Provider map response mocked, bukan verifikasi tiles jaringan/provider nyata. Dev server direstart setelah branch checkout sempat menonaktifkan page discovery; tidak menaikkan timeout untuk menyembunyikan error.
- Composer validate strict valid/audit0 pada pass awal, audit sempat warning timeout Packagist/cache fallback; rerun final0 dengan warning cache fallback yang sama. Audit source11 high/0 moderate-critical, runtime artefak0. Route cache/clear dan final Pint passed; build DEP0155 upstream tetap gate.

## Migrasi, operasi, dan rollback

Migration000004 additive site_contents dengan user FK restrict/index, nullable property coordinates/POI JSON. Backend API dan worker/storage media tetap kompatibel. Backup DB+media konsisten sebelum migrate; jangan rollback schema pada konten aktif. Rollback kode media sebelumnya dengan tabel/kolom dipertahankan; restore hanya snapshot kompatibel terverifikasi dalam maintenance bila dibutuhkan. Konten tetap tersimpan walau UI sebelumnya belum menampilkannya.

Admin memeriksa izin/kebenaran/sumber semua konten, properti hero published dan foto sesuai, rate validity/terms serta sumber POI. Bank names adalah referensi, bukan klaim rekanan; logo tanpa izin tidak dibuat. Provider map availability/terms, domain/canonical/Search Console, actual hosting/PHP8.3Linux/memory/SLO/security advisories tetap gate. Push, reports/analytics/privacy dan acceptance operasi tetap mengikuti implementation-plan.md; PR ini tidak mengklaim produksi selesai.
