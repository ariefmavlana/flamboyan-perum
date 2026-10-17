# Spesifikasi intake, CRM, atribusi dan pengukuran

Status: baseline spesifikasi disetujui untuk implementasi. Status kode/bukti dan gate eksternal mengikuti [validation.md](validation.md); ini bukan klaim aktivasi produksi. Bentuk schema/route di sini adalah proposal untuk review implementasi; [API_DOCS existing](../API_DOCS.md) tetap kontrak yang saat ini berlaku. Tidak ada endpoint baru yang telah dibuat pada PR ini.

## 1. Definisi hasil sampai akad

| ID     | Tahap                               | Sumber bukti minimum                                                                                                   | Bukan bukti yang cukup                                                              |
| ------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CRM-01 | Contact intent                      | Klik WA/CTA survei yang teramati                                                                                       | Pesan terkirim, lead, atau kunjungan                                                |
| CRM-02 | Inquiry diterima                    | Backend menyimpan formulir dan receipt                                                                                 | Klik submit atau halaman thank-you saja                                             |
| CRM-03 | Lead valid                          | Admin memastikan kontak dapat ditindaklanjuti, minat satu tipe, bukan spam/duplikat bisnis                             | Nomor lolos format atau semua form masuk                                            |
| CRM-04 | Qualified                           | Admin/staf berwenang mengonfirmasi kebutuhan, kecocokan tipe dan kesiapan langkah lanjut menurut rubric yang disetujui | FOLLOWED_UP otomatis dianggap qualified                                             |
| CRM-05 | Kunjungan diminta/dijadwalkan/hadir | Permintaan; konfirmasi staf waktu; kehadiran aktual dicatat terpisah                                                   | Klik CTA, tanggal preferensi, atau status SURVEY_LOKASI tanpa makna yang disepakati |
| CRM-06 | DEAL dan akad                       | DEAL mengikuti pipeline existing; akad memerlukan konfirmasi Admin, tanggal aktual, dasar verifikasi dan histori       | DEAL otomatis menjadi Purchase/akad, omzet atau dana cair                           |

Rubric qualified usulan: percakapan dua arah, kebutuhan lokasi/tipe sesuai, kisaran kemampuan pembelian dibahas secara proporsional, dan kesediaan langkah berikutnya. Tidak menyimpan skor kelayakan kredit, NIK, slip gaji atau hasil profiling pada analytics. Rubric dan makna akad harus disahkan pemilik sebelum dipakai sebagai konversi utama.

## 2. Jalur WhatsApp existing

- CRM-07: Pertahankan nomor Admin dari CMS, pesan berisi tipe/proyek dan URL canonical. Pengunjung tetap dapat langsung memakai WhatsApp tanpa mengisi form atau menyetujui iklan.
- CRM-08: Klik WA tidak menciptakan lead. Setelah percakapan nyata, Admin mencatat lead melalui proses existing dan memilih sumber yang diketahui: Google paid, Google organic, Meta organic, referral, direct, unknown; detail campaign hanya bila ada bukti.
- CRM-09: Kode referensi acak opsional pada pesan dapat membantu rekonsiliasi bila dipilih pemilik. Kode tidak memuat nomor/email/click ID mentah. Pengunjung dapat menghapus kode atau tidak mengirim pesan; pencocokan tidak dijanjikan100%.
- CRM-10: Self-report seperti "dari Google" dicatat sebagai SELF_REPORTED, tidak otomatis Google Ads. Tanpa bukti campaign, biarkan paid/organic/campaign unknown. Tidak mencocokkan nomor di browser atau mengakses isi WhatsApp melalui scraping.

## 3. Formulir publik yang masuk CRM

Lokasi utama `/konsultasi`, dengan tautan/preselection dari detail tipe dan halaman proyek. Form tidak memaksa akun. Konteks properti harus diverifikasi backend, bukan percaya hidden field atau judul dari browser.

| Field                    | Batas usulan                                         | Keterangan                                                                            |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `name`                   | Wajib1..160 karakter                                 | Plain text, label nama                                                                |
| `whatsapp_number`        | Wajib format8..15 digit setelah normalisasi existing | Bukan verifikasi kepemilikan nomor                                                    |
| `property_id`            | Wajib satu ID published BFI2                         | Pilihan lima tipe; inquiry generik memilih satu tipe minat awal                       |
| `purpose`                | CONSULTATION atau VISIT_REQUEST                      | Tidak otomatis menjadwalkan kunjungan                                                 |
| `preferred_visit_at`     | Opsional ISO8601, ≤90 hari mendatang usulan          | UI Asia/Jakarta; preference saja; bukan booking slot                                  |
| `message`                | Opsional≤1000 karakter                               | Peringatan singkat agar tidak memasukkan dokumen/nomor identitas/data finansial rinci |
| `privacy_notice_version` | Versi notice yang sedang berlaku                     | Bukti notice ditampilkan dan pemrosesan permintaan dijelaskan                         |
| `marketing_opt_in`       | Boolean opsional, defaultfalse                       | Terpisah dari permintaan konsultasi dan pilihan cookies                               |
| `attribution_token`      | Opaque, opsional, server-validatable                 | Mengacu konteks campaign yang diizinkan consent; tidak diisi PII                      |

CRM-11: Pengguna dapat mengirim permintaan konsultasi sambil menolak analitik/marketing. Pemrosesan permintaan layanan dan pemasaran dibedakan pada notice; dasar pemrosesan final ditetapkan pemilik/reviewer legal. Checkbox promo tidak dipaksa agar form berfungsi.

CRM-12: Alur submit: validasi→persist inquiry+receipt secara durable→202→tampilkan keberhasilan dan pilihan WhatsApp. Jika gagal menyimpan, tampilkan error/retry; jangan memancarkan event sukses. Navigasi ke WA atau tag failure tidak mengubah hasil persistence. Preferred time melewati jam layanan harus diberi ekspektasi konfirmasi.

CRM-13: Intake muncul segera pada inbox Admin di workspace existing. Inquiry bukan lead valid otomatis. Admin memilih ACCEPT_NEW, LINK_EXISTING atau REJECT_SPAM dengan alasan; tindakan idempotent, diaudit dan version-guarded. Marketing hanya memperoleh lead/inquiry yang telah diotorisasi melalui assignment.

CRM-14: Dedup existing nomor+properti tetap berlaku. Inquiry berulang boleh terkait satu lead; percakapan lintas tipe mengikuti constraint per tipe existing, bukan merge orang diam-diam. Jika lead terminal sudah ada, tautkan inquiry untuk review Admin tanpa membuka terminal, mengubah histori lama atau membuat konversi valid kedua untuk lead yang sama.

CRM-14a: Keanggotaan BFI2 pada fase ini ditentukan **allowlist ID properti stabil di konfigurasi backend**, berisi tepat lima record yang telah diverifikasi Admin terhadap tipe 36/60,36/90,56/90,62/70,69/80 pada database target. Baseline belum mempunyai relasi project/development yang otoritatif; pencarian substring judul atau slug tidak menjadi otorisasi intake. Nilai ID aktual diambil dari inventaris Admin, bukan dikarang pada spec atau dipercaya dari browser. Perubahan allowlist melalui review konfigurasi dan audit/release manifest, tanpa endpoint publik; validasi membership dan publication dilakukan ulang dalam transaksi. Frontend mengambil pilihan dari `GET /api/v1/inquiries/options`, yaitu DTO publik bounded dari record allowlisted yang masih PUBLISHED, tanpa metadata internal allowlist. Perubahan konfigurasi allowlist tidak tersedia melalui endpoint publik. Tambahkan uji ID published non-BFI2, ID yang ditamper, record eligible yang kemudian archived, dan perubahan judul tanpa perubahan membership. Relasi multi-project merupakan scope baru terpisah bila kelak dibutuhkan.

## 4. Kontrak API usulan

| Route                                                      | Akses                                                 | Perilaku dan respons                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/inquiries/options`                            | Publik melalui BFF Nuxt                               | 200 `{data:[{property_id,title,canonical_path}]}` maksimum lima record eligible; tanpa kontak/CRM/config internal; kegagalan sumber503, bukan pilihan dummy |
| `POST /api/v1/inquiries`                                   | Publik melalui BFF/relay Nuxt terkontrol              | 202 hanya setelah persist; `{accepted:true,receipt:<opaque>}` tanpa ID lead/status existing;422 field errors;429 throttle;503 dependency gagal              |
| `GET /api/v1/internal/inquiries`                           | Admin aktif                                           | Pagination/batas existing, filter status, detail minimum untuk rekonsiliasi; no-store                                                                       |
| `POST /api/v1/internal/inquiries/{id}/resolve`             | Admin aktif + version                                 | Action dan lead target opsional;409 stale; scope404; hasil internal aman                                                                                    |
| `PATCH /api/v1/internal/leads/{id}/qualification`          | Admin atau assignee aktif sesuai policy yang disahkan | Boolean/status rubric+reason, version; histori append-only, tidak mengubah pipeline otomatis                                                                |
| `POST /api/v1/internal/leads/{id}/visits` dan update visit | Admin atau assignee aktif sesuai policy               | Permintaan→konfirmasi→hadir/batal/no-show, version dan audit; tidak membuka kalender publik                                                                 |
| `POST /api/v1/internal/leads/{id}/akad-confirmation`       | Admin aktif                                           | Tanggal aktual+reference ringkas terkontrol+version; wajib state DEAL; koreksi/revokasi sebagai event baru                                                  |

CRM-15: Publik tidak memiliki route GET receipt untuk mengecek kontak/lead. Semua detail inquiry, dedup result, assignee dan histori hanya internal. Response untuk submission baru dan retry/duplikat diterima berbentuk generik agar nomor+tipe tidak dapat dienumerasi.

CRM-16: `Idempotency-Key` acak minimal128 bit dari form instance dipakai pada submit/retry. Constraint unik per key, hash payload tersimpan server, receipt sama untuk replay identik. Key sama dengan payload berbeda→409 generik. Batas masa replay24 jam usulan; durasi tombstone/reuse harus menjaga replay lama tidak menghasilkan data ganda. Client tidak menyimpan PII form pada localStorage.

CRM-17: Validasi allowlist, tipe/ukuran body, normalisasi kontak existing, plain-text escaping, limit preference date, dan properti published diverifikasi ulang dalam transaksi. Public role/assignee/history fields ditolak. Proteksi abuse memakai throttle berlapis, request-origin/CSRF strategy BFF yang eksplisit, honeypot/timing sebagai sinyal dan rate store durable. Usulan batas:5 submit/10 menit/IP dan10/hari/kontak HMAC server, dengan uji NAT/aksesibilitas; jangan mengunci pengguna sah tanpa pemulihan.

CRM-18: Tantangan bot hanya bila ada bukti abuse; solusi, aksesibilitas, privacy/vendor dan biaya ditinjau. CAPTCHA tidak dipakai sebagai bukti lead berkualitas. Header proxy/IP tidak boleh dipercaya dari klien. Tidak memasukkan isi submit/kontak ke log access atau error tracking.

## 5. Data aditif dan transaksi

Tabel/fungsi berikut adalah model logis yang akan direkonsiliasi dengan migrasi/schema source pada fase desain implementasi. Hindari generic event bus atau repository baru.

| Entitas                              | Data minimum                                                                                                                                           | Invariant                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `lead_inquiries`                     | UUID receipt/key, properti, kontak minimum, purpose/preference, notice/opt-in, state, optional lead_id, version, timestamp UTC                         | PII internal; tidak ada public read; key unik; state changes diaudit      |
| `lead_attributions`                  | lead/inquiry, source/medium/campaign/content/term yang disanitasi, first/last touch, method, capture time, consent record, optional encrypted click ID | Pernyataan client bukan bukti klik platform terverifikasi; unknown sah    |
| `lead_visits`                        | lead, waktu rencana UTC, status REQUESTED/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW, actor, version                                                        | Preferensi form tidak langsung CONFIRMED; jadwal/hasil berbeda            |
| `lead_outcomes`                      | qualified status/rubric version, akad confirmation state/date, provenance actor/reference, version                                                     | State terkini adalah proyeksi; histori koreksi tidak dihapus              |
| Histori existing diperluas           | INQUIRY_LINKED, QUALIFICATION_CHANGED, VISIT_CHANGED, AKAD_CONFIRMED/REVOKED, ATTRIBUTION_CORRECTED                                                    | Additive enum/type; payload tidak menyalin dokumen sensitif               |
| Delivery ledger opsional fase lanjut | provider, business event UUID, action/version, consent snapshot, attempt/status/ack                                                                    | Unik provider+event+action; bukan menjalankan HTTP di dalam transaksi CRM |

CRM-19: ACCEPT_NEW menulis lead+histori+assignment/notifikasi yang diperlukan+link inquiry+attribution dalam satu transaksi pada koneksi yang sama. Constraint unik nomor+properti menyelesaikan race; race tidak membuat dua lead atau dua notification. LINK_EXISTING dan koreksi outcome memakai fresh authorization+conditional version update;409 tidak menyisakan side effect parsial.

CRM-20: Pengiriman notifikasi/pihak ketiga terjadi sesudah commit dengan queue existing; retry tidak membuat lead/history/event bisnis baru. NOTIFY_FAILED tidak menghapus inquiry yang sudah diterima. Receipt diterbitkan setelah commit. Admin tetap melihat inbox saat provider gagal.

CRM-21: Retensi usulan untuk review: inquiry belum direkonsiliasi 30 hari, rejected spam 7 hari, konteks atribusi browser 30 hari, click ID terenkripsi maksimal 90 hari atau batas platform yang lebih singkat, PII lead mengikuti kebijakan existing usulan 24 bulan setelah aktivitas terakhir. Inquiry accepted/linked mengikuti jadwal retensi lead terkait; duplikasi kontak pada inquiry diminimalkan atau dianonimisasi setelah rekonsiliasi sesuai kebijakan, sehingga tidak menjadi salinan PII tanpa batas. Semua angka **belum disahkan**; publish/enable tracking menunggu kebijakan final dan job purge teruji. Backup expiry, access log, revoke consent dan anonimisasi histori harus diperhitungkan; jangan menghapus audit secara serampangan.

## 6. Atribusi dan consent

- MEAS-01: GTM menjadi satu jalur orkestrasi browser; GA4/Google Ads dan Meta fase lanjut berada di container yang sama. Direct pixel loader tidak dijalankan bersamaan. Tag dilarang pada backoffice/login/reset/response form yang memuat PII.
- MEAS-02: Perbaiki kontrak consent: default dan update resmi bagi `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`, dipetakan melalui Consent API template GTM sesuai G-06. Event kustom `flamboyan_consent_update` sendiri belum membuktikan Consent Mode v2. Pilihan kategori dan revoke diuji; basic mode menjadi usulan baseline.
- MEAS-03: Consent analytics saja mengaktifkan analytics yang diizinkan, bukan Meta/remarketing. Consent marketing saja tidak otomatis mengaktifkan GA4 analytics tanpa aturan sah. State kembali saat reload; version/masa berlaku dan perubahan notice diuji. Reload/tag yang sudah termuat harus berhenti mengirim aksi terlarang sesudah revoke.
- MEAS-04: Simpan konteks eligible lintas navigasi setelah consent relevan, bukan membaca query route saat ini saja. Rekam first touch dan last non-direct eligible beserta timestamp/metode. Direct visit tidak otomatis menimpa campaign; first-touch dan last-touch ditampilkan terpisah.
- MEAS-05: Campaign keys berupa taxonomy tertutup/semi-terkontrol ≤120karakter; `utm_term`≤120, `utm_content`≤120; buang value yang mengandung email/telepon/token/konten bebas. Jangan forward seluruh query atau referrer mentah ke GA4/dataLayer. Attribution context tidak boleh diisi dari form message.
- MEAS-06: `gclid`, `gbraid`, `wbraid`, `fbclid` diperlakukan identifier terbatas, bukan UTM atau bukti lead. Penyimpanan hanya setelah consent/dasar pemrosesan yang sesuai, server encrypted dan akses Admin minimum; sanitasi/log redaction/TTL. Jangan taruh click ID di pesan WA, public response, custom dimension GA4 atau notifikasi push.
- MEAS-07: Form receipt dapat menghubungkan inquiry→lead secara deterministik di sistem sendiri; sumber klik masih client-provided kecuali ada validasi platform. WhatsApp manual/referral tanpa bukti ditandai UNKNOWN/SELF_REPORTED. Jangan fingerprint IP/UA untuk menutup kehilangan atribusi.
- MEAS-08: Consent pengiriman promo, consent cookies dan izin pengukuran/upload provider berbeda; rekam versi notice, waktu, scope, provenance dan revocation. Persetujuan form tidak otomatis membolehkan enhanced conversions/customer list. Hash nomor tetap data pribadi terbatas, bukan anonim.

## 7. Taksonomi event dan deduplikasi

| Event situs/bisnis                                                   | Trigger otoritatif             | GA4                                                | Google Ads fase1                                   | Meta fase lanjut                                         |
| -------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `page_view`                                                          | Page transition yang selesai   | Satu page_view per navigasi; pilih satu metode SPA | Observasi                                          | PageView sekali                                          |
| `view_property` existing                                             | Detail valid terlihat          | Custom view_property                               | Secondary/non-bidding                              | ViewContent                                              |
| `select_property`, `compare_property`, `calculate_mortgage` existing | Interaksi valid                | Custom                                             | Secondary/non-bidding                              | Custom                                                   |
| `click_whatsapp`, `request_visit` existing                           | Klik CTA                       | Custom contact intent                              | Secondary/non-bidding                              | Custom, bukan Lead/Schedule                              |
| `inquiry_submitted` baru                                             | Backend202 committed + receipt | Custom tanpa PII/receipt sebagai dimensi           | Secondary sampai mutu tervalidasi                  | Custom inquiry, bukan qualified                          |
| `lead_validated` baru                                                | CRM resolve/validasi pertama   | Reporting server fase lanjut bila diizinkan        | Kandidat primary hanya jika import dapat dipercaya | Lead dengan bukti, bukan klik                            |
| `qualified_lead` baru                                                | Rubric+konfirmasi berwenang    | Outcome CRM; upload hanya fase lanjut              | Kandidat tujuan bidding yang dipilih               | Event yang didukung setelah verifikasi                   |
| `visit_confirmed`/`visit_completed` baru                             | Konfirmasi jadwal/kehadiran    | Outcome terpisah                                   | Jangan primary semua tahap sekaligus               | Event mapping setelah verifikasi                         |
| `akad_confirmed` baru                                                | Admin+tanggal+reference        | Outcome CRM                                        | Offline outcome bila eligible                      | Tidak disebut Purchase bernilai tanpa transaksi yang sah |

MEAS-09: Satu aksi hanya mempunyai satu conversion action canonical untuk bidding. Jangan mengimpor GA4 sekaligus direct Google conversion untuk aksi yang sama tanpa menetapkan jalur observasi. Primary dipilih menurut validitas, volume dan kampanye; G-07 menjelaskan secondary umumnya observasi, tetapi custom goal dapat tetap memakainya untuk bidding sehingga custom goals harus diperiksa.

MEAS-10: Initial Search tanpa primary bisnis yang reliabel memakai bidding yang tidak bergantung konversi bisnis palsu. Tidak menjadikan klik WA lead hanya agar Smart Bidding berjalan. Keputusan pindah bidding dicatat setelah baseline lead/biaya memadai.

MEAS-11: Browser hydration/SPA, refresh thank-you, retry form, duplicate webhook/upload dan repeated status update tidak menciptakan conversion baru. Business event UUID stabil berbeda dari request ID; internal ledger unik provider+event+action. Bila Pixel+CAPI kelak melaporkan aksi sama, event identity dan dedup harus dibuktikan di Events Manager menurut dokumentasi versi yang diverifikasi.

MEAS-12: Tidak mengunggah data konsumen ke platform pada fase1. Enhanced conversions/offline conversion/CAPI adalah fase terpisah dengan consent evidence, pemilihan identifier, platform eligibility, jendela upload, timezone, retry/backoff, revoke/correction dan audit yang disetujui. Transaksi CRM tidak bergantung availability platform iklan.

## 8. Reporting, follow-up dan kualitas operasi

CRM-22: Dashboard Admin existing diperluas secara proporsional: inquiry masuk/pending/spam, lead valid unik, qualified, kunjungan dikonfirmasi/hadir, DEAL, akad confirmed; dimensi periode/cohort, channel, campaign jika diketahui, tipe dan attribution method. Marketing tetap scoped. Tidak menampilkan kontak pada chart/export campaign default.

CRM-23: Pisahkan laporan cohort created-date dari aktivitas pada tanggal tertentu dan belanja tanggal iklan. CPL=spend/lead valid unik; CPQL=spend/qualified unik; cost per completed visit/akad memakai outcome cohort dan cakupan atribusi yang jelas. Denominator0→null/"belum ada", bukan0 rupiah. Jangan membagi belanja bulan ini dengan semua akad historis.

CRM-24: Laporkan ukuran sampel, unmatched/unknown, consent loss, duplicate/spam, waktu median respons dan lead belum ditindaklanjuti. Data platform, GA4 dan CRM tidak diharapkan sama persis. Laporan Google dan Meta dapat mengklaim prospek yang sama; hitungan bisnis didedup di CRM, tidak dijumlahkan mentah.

CRM-25: Usulan layanan: respons manusia≤30 menit pada jam layanan yang disahkan; di luar jam, tampilkan ekspektasi dan antrian hari kerja berikutnya. Owner menentukan petugas cadangan, jadwal, reminder, aturan follow-up, alasan LOST dan pemeriksaan pending harian. Waktu teknis receipt berbeda dari respons manusia. Otomasi pesan/WhatsApp tidak termasuk fase1.

CRM-26: Akad merupakan indikator jangka lanjut. Evaluasi media bulan pertama tetap memakai biaya, relevansi, lead valid/qualified dan kemajuan follow-up, kemudian pantau cohort sampai 90 hari usulan atau durasi siklus yang disetujui. Tidak menyatakan kegagalan/sukses statistik dari beberapa klik atau menjanjikan akad dalam 30 hari.

## 9. Acceptance minimum

Uji field invalid/draft property/unknown role, normalisasi nomor, spam/throttle, consent denied, success202 setelah commit, DB failure503, replay identik, payload berbeda, concurrent duplicate dan lead terminal. Buktikan satu lead/history/notification sesuai aksi, akses Admin/Marketing scoped, no PII di HTML/dataLayer/log, dan histori outcome koreksi append-only. Form, CTA WA dan analytics harus dapat gagal secara independen sesuai kontraknya.

Sebelum real ads, simulasikan satu perjalanan lengkap dengan data uji terisolasi: URLcampaign→navigasi proyek→tipe→form→inbox→lead valid→qualified→kunjungan hadir→DEAL→akad confirmed→laporan. Verifikasi juga jalur WA manual dan unknown attribution. Data rehearsal tidak diperlakukan hasil kampanye produksi.
