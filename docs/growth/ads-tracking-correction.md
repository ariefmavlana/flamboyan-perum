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

Regresi browser baru dan uji vendor **BELUM DIJALANKAN**. Setelah pemilik
menyatakan browser diaktifkan, sesi kontrol di-reset dan inventaris tetap
mengembalikan `Local browser use is disabled in Work settings`; tidak ada
browser yang dapat dikendalikan. Tidak memakai jalur alternatif untuk
melewati pembatasan tersebut. Jadi source siap ditinjau sebagai draft,
bukan bukti pengukuran produksi selesai.

## Rollout, risiko dan rollback

Source melalui branch/PR dari main terbaru, review independen dan pemeriksaan
lokal sebelum merge. GTM tetap draft dan `NUXT_PUBLIC_GTM_ID` produksi belum
ditambahkan sampai perilaku vendor lulus. Browser lokal sedang dinonaktifkan
dalam Work settings; itu membatasi validasi akun melalui UI, bukan kelulusan
teknis. Tidak mengubah setting aplikasi untuk melewati pembatasan tersebut.

Rollback source dengan revert commit. Jika GTM kemudian diaktifkan, rollback
dengan menonaktifkan hanya key GTM melalui operasi hPanel yang mempertahankan
variabel lain, lalu pulihkan versi GTM sebelumnya dan smoke test website.
Jangan memakai full replace API dengan nilai tersamarkan. Risiko tersisa:
payload otomatis vendor (termasuk `top`) dan atribusi Ads belum disahkan oleh
tes aplikasi. Tidak ada migrasi, perubahan secret, atau data produksi.
