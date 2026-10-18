# Koreksi konteks halaman Google Ads — 18 Oktober 2026

## Kebutuhan dan cakupan

Pemilik meminta penyelesaian pengukuran iklan. Uji preview vendor menunjukkan
klik WhatsApp sesudah navigasi SPA `/` ke `/panduan` masih mengirim `url` root,
sedangkan `top` sudah `/panduan`. Plugin hanya mengubah konteks global Google
ketika sinyal consent berubah; field `page_view` di dataLayer tidak otomatis
mengganti konteks yang diwarisi tag konversi.

Perbaikan terbatas: perbarui konteks Google dengan lokasi dan referrer publik
tersanitasi sebelum setiap pageview SPA; kosongkan rantai referrer ketika
optional consent dicabut atau pengguna meninggalkan halaman publik. Default
consent denied, loader, event allowlist, CTA dan CRM dipertahankan. Tidak ada
data kontak, query/hash, nilai rumah, enhanced conversion, atau provider baru.
Kontrak REST tidak berubah. Tidak menaikkan budget Rp2.807/hari atau top-up.

## Penerimaan dan verifikasi

Regresi browser melalui plugin sebenarnya harus membuktikan konteks halaman
berubah setelah SPA tanpa mengganti consent, tetap tanpa query/hash, serta
rantai referrer tidak menyeberangi penolakan/halaman privat. GTM pihak ketiga
boleh diganti fixture hanya pada tes kontrak aplikasi; kelulusan fixture bukan
bukti request vendor. Uji network vendor tetap diperlukan pada draft final:
no choice, deny, analytics saja, marketing saja, revoke, private route, SPA/back,
query sintetis dan satu klik WhatsApp. Klik adalah minat, bukan lead atau akad.

Untuk menjalankan regresi aplikasi, set `NUXT_PUBLIC_GTM_ID=GTM-TEST0` pada
server kandidat dan proses Playwright, serta `NUXT_PUBLIC_SITE_URL` sesuai
origin kandidat. Spec memverifikasi request loader GTM benar-benar muncul
setelah pilihan; banner saja bukan bukti GTM karena Meta/atribusi juga dapat
memunculkannya. Tanpa ID eksplisit regresi ini opt-in dan dilewati.

## Bukti lokal pada kandidat

Node 24.21.0, PHP 8.5.11, PostgreSQL 17. Lint frontend nol warning, typecheck,
89 unit pada 20 file, dan build node-server 36,5 detik lulus. Typecheck awal
berhenti karena NUXT_API_BASE belum diisi; retry berbarengan build sempat
kehilangan tipe Nitro hasil generasi. Setelah build selesai, typecheck
diulang berurutan dengan backend loopback dan lulus. Tes unit awal terhalang
rename cache sandbox; ulang pada runtime lokal yang diizinkan lulus.

Pint dan Composer validate strict lulus; Composer audit locked nol advisory.
PHPUnit SQLite in-memory: 163 tes/1.277 assertion, 1 skipped; PostgreSQL pada
database baru `ads_tracking_tests`, loopback port 15544: 163/1.282, tanpa skip.
PHP sandbox awal tidak dapat membaca vendor/autoload.php; sesudah autoload
diregenerasi tanpa scripts dan eksekusi lokal yang diizinkan, kedua suite
lulus. Cluster khusus tes sudah dihentikan. Tidak memakai DB produksi.

Audit npm source: **11 high, 0 critical**, transitive braces/node-forge pada
baseline lockfile yang tidak berubah. Bukan audit bersih; perbaikan dependensi
tidak digabungkan ke koreksi tracking. Audit artefak runtime `.output/server`
dengan lockfile output ignored: **0 vulnerability**. Audit pertama terhalang
DNS sandbox; retry endpoint resmi pada runtime lokal yang diizinkan selesai.

Pada tahap awal browser dinonaktifkan. Akses kemudian pulih dan pengujian
manual melalui browser serta vendor dijalankan; lihat bukti lanjutan di bawah.
Spec Playwright otomatis kemudian dijalankan terpisah seperti dicatat di
bawah; kelulusan kontrak aplikasi tidak disamakan dengan bukti vendor.

## Temuan lanjutan dan rencana koreksi CSP — 18 Oktober 2026

Browser kembali dapat diakses. PR draft #54 tersedia; source belum di-merge
atau dipasang. Uji preview terkendali membuktikan konteks SPA di request
konversi berubah ke `/panduan`, tetapi request yang dimulai bukan bukti
pengiriman berhasil. Log kandidat memperlihatkan blok CSP pada `www.google.com`
dan `ad.doubleclick.net`. Header dokumen kandidat diperiksa melalui Network:
satu CSP aktif sesuai builder saat ini, tanpa kedua host tersebut. Laporan
`googleads.g.doubleclick.net` masih perlu dikorelasikan dengan redirect;
host itu sudah diizinkan dan tidak memerlukan wildcard baru.

Rencana terbatas dalam cakupan penyelesaian tracking yang diotorisasi pemilik:
lengkapi directive Google Ads dengan host HTTPS eksplisit dari dokumentasi
[CSP Google](https://developers.google.com/tag-platform/security/guides/csp),
pertahankan nonce, strict-dynamic, consent, dan semua pembatas non-tracking.
Tidak mengaktifkan preview fonts/styles di produksi, unsafe-eval, wildcard
Google baru, enhanced conversions, data kontak, atau akses privat.
Gunakan tes CSP existing untuk kontrak directive dan cek header hasil build,
kemudian ulang network vendor untuk respons berhasil, URL sintetis,
revoke, dan halaman privat. Review keamanan independen wajib diulang pada
diff akhir. Sebelum itu status tetap BLOCKED; tidak publish GTM atau deploy.

UI kandidat sempat tidak merespons saat backend loopback tidak tersedia;
tab WhatsApp yang mengambil fokus juga mengganggu langkah berikutnya.
Fixture HTTP lokal berisi development null dan financing kosong digunakan
untuk menstabilkan harness; tab WhatsApp ditutup setelah tiap klik.
Ini pengujian tracking, bukan pengujian katalog/backend produksi.

## Hasil kandidat dengan CSP final — 18 Oktober 2026

Lima regresi CSP lulus (Vitest 4.1.11, 487 ms), lint nol warning, typecheck,
build Node Nitro final 29,0 detik. Percobaan Vitest sandbox gagal rename cache
sebelum tes; pengulangan lokal yang diizinkan lulus. Command npm dengan --run
ditolak CLI; tes aktual memakai node node_modules/vitest/vitest.mjs run
tests/csp.test.ts. Backend tidak berubah; hasil backend sebelumnya tetap
riwayat validasi, bukan klaim dijalankan ulang pada koreksi CSP ini.

Tiga spec consent Playwright lulus pada Microsoft Edge installed dengan
profil terisolasi (16,9 detik, satu worker, tanpa skip). Startup pertama gagal
karena Chromium bundel belum terpasang; tidak ada browser baru dipasang.
Dua percobaan berikutnya menghasilkan dua tes lulus dan satu timeout pada
canonical SEO yang tidak tersedia pada harness beranda. Spec konteks Google
kini memakai NUXT_PUBLIC_SITE_URL eksplisit (fallback origin navigasi),
sehingga tidak bergantung pada penyelesaian konten/SEO beranda. Assertion
loader, konteks SPA, query/hash dan referrer sesudah revoke tetap dijalankan.
Ini bukan klaim penyebab canonical produksi atau audit SEO produksi selesai.

Kandidat loopback 3334 memakai GTM ID riil dengan draft pratinjau terbaru.
Satu loader live sengaja diblokir oleh harness, lalu satu script preview
resmi dimuat melalui debugger pada dokumen lokal setelah consent. Tidak ada
perubahan produksi. Tag Assistant UI tetap tidak terhubung karena jendela
popup tidak dibuka oleh browser ini; bukti vendor diambil dari Network CDP,
bukan klaim badge Tag Assistant lulus. Semua pembacaan network di bawah tidak
hasMore/truncated.

- Header dokumen final HTTP200 memiliki satu CSP sesuai builder dan host
  eksplisit Google Ads. Redirect dari googleads.g.doubleclick.net melalui
  www.google.com menuju www.google.co.id menjelaskan laporan blok lama pada
  host awal yang sebenarnya sudah diizinkan; Google Indonesia ditambahkan
  hanya pada connect/img, bukan wildcard seluruh domain Google.
- No choice + reload: nol request Google/DoubleClick. Deny + reload: nol
  request vendor. Marketing saja memuat preview200, ccm/collect200 dan
  ad.doubleclick.net/ccm/s/collect204. Ping ini tetap ada meski send_page_view
  false; konfigurasi itu tidak menjanjikan seluruh ping Google Ads hilang.
- Query/hash sintetis pada /panduan: satu klik menghasilkan satu request
  awal /pagead/conversion dengan label yang benar dan HTTP200; satu chain
  pendamping berakhir di Google Indonesia HTTP200. url dan top keduanya
  /panduan tanpa query/hash, tidak ada string synthetic pada request vendor.
  ERR_ABORTED muncul pada chain gambar setelah response200; tidak ada blok
  CSP pada konversi final ini. Respons200 bukan bukti atribusi Ads atau deal.
- SPA /panduan ke /bandingkan, lalu workspace: nol request vendor ketika
  masuk /backoffice, consent event public=false/marketing=denied. Kembali
  publik, revoke, navigasi dan klik WhatsApp: nol request vendor. Analitik
  saja sesudah revoke dan navigasi: nol request Ads.
- Accept all, navigasi ke /panduan lalu Back ke /bandingkan: satu klik
  menambah tepat satu event click_whatsapp (1 ke 2) dan satu request awal
  conversion HTTP200; url=/bandingkan, ref=/panduan. Request pendamping
  vendor tidak dihitung sebagai event aplikasi tambahan.

Draft tag dasar juga menyimpan allow_ad_personalization_signals=false,
send_page_view=false, allow_enhanced_conversions=false, url_passthrough=false,
ads_data_redaction=true. Data pengguna dan keenam deteksi event otomatis
dinonaktifkan. Kedua tag tetap memerlukan consent marketing dan public guard.

## Rollout, risiko dan rollback

Source melalui branch/PR dari main terbaru, review independen dan pemeriksaan
lokal sebelum merge. GTM tetap draft dan `NUXT_PUBLIC_GTM_ID` produksi belum
ditambahkan sampai review final dan pemasangan source selesai. Pengujian
kandidat tidak membuktikan pemasangan website produksi atau atribusi Ads;
smoke test produksi sesudah deployment tetap wajib. PR draft #54 belum merge.

Rollback source dengan revert commit. Jika GTM kemudian diaktifkan, rollback
dengan menonaktifkan hanya key GTM melalui operasi hPanel yang mempertahankan
variabel lain, lalu pulihkan versi GTM sebelumnya dan smoke test website.
Jangan memakai full replace API dengan nilai tersamarkan. Risiko tersisa:
perubahan endpoint vendor di masa depan dan atribusi Ads belum disahkan oleh
tes aplikasi. Query/hash sintetis pada top sudah diuji seperti di atas.
Tidak ada migrasi, perubahan secret, atau data produksi.
