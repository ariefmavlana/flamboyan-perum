# REST API — katalog, workspace dan operasi

## Katalog komersial dan CMS pembiayaan — 2026-10-05

Availability menambah CHECK_REQUIRED. PublicProperty menambah commercial nullable, hanya untuk metadata yang telah diverifikasi. price_idr publik adalah harga pada tanggal Asia/Jakarta, konsisten untuk listing/filter/sort/detail/compare; harga normal internal tetap price_idr. Internal property menambah commercial JSON, offer_price_idr/offer_start/offer_end, next_price_idr/next_price_start. Nominal kolom harga nullable string integer IDR; tanggal nullable YYYY-MM-DD.

PATCH `/api/v1/internal/properties/{id}/commercial`: ADMIN aktif + Sanctum/CSRF; semua fields berikut wajib hadir (nullable sesuai aturan), version integer≥1, verified accepted. offer_price_idr/next_price_idr nullable integer1..10^12; tanggal program wajib jika harga program diisi, end≥start; next_price_start wajib jika harga berikut diisi dan setelah offer_end bila keduanya ada. commercial fixed keys:

- floors1..20,lot_dimensions≤80,planned_units1..100000,features array≤20 string≤200,source_name≤200,source_date≤hari Asia/Jakarta,notes≤2000,fee_notes≤1500.
- program_fee_idr/next_fee_idr nullable integer0..10^12,program_fee_start/program_fee_until/next_fee_start nullable tanggal. Periode program wajib saat nominal diketahui, akhir≥awal; periode berikut setelah periode sebelumnya.
- payment_plans array≤8; keys title≤120,kind CASH/INSTALLMENT,upfront_idr/monthly_idr0..10^12,total_idr1..10^12,months0..360,valid_from/valid_until (akhir≥awal),quota1..100000,source_name≤200,notes≤1000. Total harus tepat upfront+months×monthly. CASH bulan/angsuran0; INSTALLMENT bulan≥1.

Unknown keys422; Marketing403, missing404, stale409; transaction fresh actor/property lock, version increment, ActivityLog COMMERCIAL_UPDATED. Response200 `{data:InternalProperty}`. Publik hanya floors,lot_dimensions,planned_units,features,source_name,source_date,notes,fee_notes,normal_price_idr,offer_until,program_fee_idr dan payment_plans yang berlaku. Jadwal mentah/metadata aktor verifikasi tidak keluar. Kuota adalah batas program, bukan inventaris tersisa. MASTERPLAN menambah kind media gambar dengan single limit, upload/process/publish/revoke sama dengan media private existing.

GET `/content` menambah `development:null|{name,developer,address,whatsapp,website,planned_units,house_types,facilities,nearby,source_name,source_date,notes}`. Internal CMS kind DEVELOPMENT, fixed payload, verified/published/version/audit existing; fields wajib: teks name/developer≤160,address≤500,WhatsApp regex `^62[0-9]{8,13}$`,website HTTPS≤2048,planned_units1..100000,house_types1..1000,facilities/nearby multiline≤3000,source_name≤200,source_date≤hari Asia/Jakarta,notes≤2000. Public mengambil record eligible pertama position/id. Tidak ada koordinat/jarak/waktu tempuh hasil asumsi.

BANK_RATE mempertahankan fields wajib existing; fields opsional baru: floating_rate0..30,min_tenor_months/max_tenor_months12..360,checked_date≤hari Asia/Jakarta,conditions≤2500,phases array1..10 `{months:1..360,annual_rate:0..30}`,provision_percent/admin_percent0..10,admin_min_idr/admin_max_idr/appraisal_min_idr/appraisal_max_idr0..10^12,min_principal_idr0..10^12,max_principal_idr1..10^12,max_ltv_percent>0..100. Jumlah bulan phases sama dengan fixed_months; bunga pertama sama dengan annual_rate; fixed_months≤max_tenor bila diketahui. Min/max diperiksa saat keduanya hadir. Numeric dinormalisasi; unknown/nested unknown ditolak. Field opsional yang belum diketahui dihilangkan, bukan diberi nol. Public menambah allowlist fields ini dan phases hanya months/annual_rate; tanggal aktif/expiry existing tetap berlaku. Tidak ada endpoint pengajuan bank atau klaim kemitraan.

Base `/api/v1`, JSON, waktu UTC ISO8601. Production browser/API same origin; proxy hosting mengirim `/api`, `/auth`, `/sanctum` ke Laravel dan halaman lainnya ke Nuxt. Private routes hanya session Sanctum + user active ADMIN/MARKETING. Bearer token/public register tidak tersedia.

Entry PHP Vercel menormalkan `SCRIPT_NAME`/`PHP_SELF` menjadi `/index.php` agar `/api` tetap bagian route aplikasi. URL publik tetap `/api/v1/...`, tanpa tambahan `/api` kedua. Kontrak auth, payload, dan otorisasi tidak berubah. Bukti deployment demo ada di [vercel-demo-validation.md](vercel-demo-validation.md).

Dataset dummy lokal memakai kontrak yang sama: nilai katalog/CMS/CRM berasal dari database hasil generator, lalu dapat dikelola melalui endpoint scoped/versioned di bawah. Tidak ada endpoint mock atau fallback data statis. Nama, slug, harga, lokasi dan identitas Marketing berubah antar-database seed baru; konsumen tidak boleh mengandalkan nilai fixture tertentu. Login alias demo tetap untuk akses lokal, bukan identitas bisnis. Persiapan dan batas ada di demo-data.md; validasi perubahan nyata API→SSR→reload ada di dynamic-demo-validation.md.

## Endpoint yang diimplementasikan

| Method/path | Akses | Input / output |
|---|---|---|
| GET `/properties` | Public | q, page, per_page≤48, sort, filter di bawah; resource allowlist paginator |
| GET `/properties/{slug}` | Public | published saja; `{data: Property}`; missing/draft/archive404 |
| GET `/internal/properties` | Internal | Admin semua, Marketing owner; q,publication,page/per_page≤48; paginator+owner{id,name} |
| POST `/internal/properties` | Internal | Core fields required; Admin owner_id Marketing aktif; Marketing otomatis dirinya;201 |
| PATCH `/internal/properties/{id}` | Internal scoped | partial fields + version required; owner_id/slug prohibited;409 stale |
| GET `/me` | Internal | id,name,email,role,is_active,version,email_verified_at; tanpa password/token |
| GET `/leads` | Internal scoped | q,status,assigned_marketing_id,unassigned,page/per_page≤100; paginator+property/assignee |
| POST `/leads` | Admin | name, whatsapp_number, property_id;201 /409 duplicate |
| POST `/leads/{id}/assignment` | Admin | marketing_id, version, reason required pada reassignment;200 |
| PATCH `/leads/{id}/status` | Scoped | status, version, note optional kecuali LOST required;200 |
| POST `/leads/{id}/notes` | Scoped | note required, version;200 + increment version |
| GET `/leads/{id}/history` | Scoped | page, per_page≤100 default50; paginated descending events+actor{id,name} |
| GET `/notifications` | Recipient | page/per_page≤100 default20; paginator + unread_count |
| PATCH `/notifications/{id}/read` | Recipient | no body; read idempotent; `{data}` |
| GET `/up` (outside version) | Public | liveness; tidak menyatakan semua dependency ready |
| GET `/sanctum/csrf-cookie` | Browser |204, sets XSRF-TOKEN/session cookies |
| POST `/auth/login` | Browser | email/password + X-XSRF-TOKEN;200 meDTO /422 bad credentials /429 |
| POST `/auth/logout` | Session | X-XSRF-TOKEN;204 invalidate session |

Public filter: `min_price,max_price`, `min_land_area,max_land_area`, `min_building_area,max_building_area`, `bedrooms,bathrooms` minimum, `condition`, exact `certificate,location,availability`, `featured=0/1`. q case insensitive literal match title/location/address. Sort: newest,price_asc,price_desc,land_asc,land_desc,building_asc,building_desc; defaults newest/id desc. URL query dikontrol UI dan divalidasi backend. Extra query tidak memengaruhi query SQL; endpoint tidak menerima arbitrary SQL column/order.

Property create fields: slug,title,house_type,condition NEW/RESALE,certificate,location,address,description,price_idr,land_area,building_area,bedrooms,bathrooms. Optional publication DRAFT/PUBLISHED/ARCHIVED,availability AVAILABLE/BOOKED/SOLD_OUT,featured. Batas presisi/nilai lihat SRS§3. Frontend tidak mengirim version pada create. Internal update tanpa business field masih bump version; digunakan sebagai valid mutation guard, tetapi UI tidak menawarkan no-op save.

## DTO dan error

Public Property: id,slug,title,house_type,condition,certificate,location,address,description,price_idr string,land_area string,building_area string,bedrooms,bathrooms,availability,featured. Tidak owner_id,publication,version,user/email/phone. Internal Property menambahkan owner_id/publication/version/timestamps. Lead: id,name,whatsapp_number,property_id,assigned_marketing_id nullable,status,version,assigned_at,first_followed_up_at,timestamps.

```json
{
  "data": [],
  "links": { "first": "/api/v1/properties?page=1", "last": "/api/v1/properties?page=1", "prev": null, "next": null },
  "meta": { "current_page": 1, "last_page": 1, "per_page": 12, "total": 0 }
}
```

Laravel paginator memiliki metadata tambahan from/to/path/links yang boleh diabaikan klien; links absolut sesuai APP_URL request upstream. Nuxt UI menyusun URL sendiri dari query/page, tidak bergantung pada host link upstream. Success mutation `{data}`. Create201; list/update200; logout/CSRF204.

```json
{
  "message": "Data sudah berubah. Muat ulang sebelum melanjutkan.",
  "request_id": "server-generated-uuid"
}
```

Validation422 menambahkan `errors:{field:[message]}`. 401 auth,403 role/inactive,404 scoped missing,409 duplicate/stale/transition/terminal/same-assignee,419 CSRF,422 input,429 throttle,500 sanitized failure. Error JSON dan `X-Request-ID` tersedia; frontend tidak menampilkan SQL/stack. API body/filter bounded; login5/min peremail+IP,public120/minIP,internal120/minuser. Cron/push/CMS/media/KPR/rates/report endpoints belum diimplementasikan; tidak dianggap contract live.

## Contoh workflow

```http
POST /api/v1/leads
Content-Type: application/json
X-XSRF-TOKEN: <current browser CSRF token>

{"name":"Nama calon pembeli","whatsapp_number":"08123456789","property_id":1}
```

Admin kemudian assign `{marketing_id:2,version:1}`. Lead returned version2; Marketing membaca list, mengirim status `{status:"FOLLOWED_UP",version:2,note:"Sudah dihubungi"}`. Update returned version3; note siguiente memerlukan3. Conflict409 wajib reload, tidak retry dengan versi terbaru tanpa meninjau data. History+notifications persisten atomik; push belum aktif pada F0.

## Workspace operasi

### Endpoint tambahan

| Method/path | Akses | Kontrak |
|---|---|---|
| GET `/internal/properties/{id}` | Scoped | Detail internal + owner{id,name}; owner lama setelah transfer404 |
| POST `/internal/properties/{id}/owner` | Admin | owner_id Marketing aktif,version,reason required; audit atomik |
| PATCH `/me` | Own | version,name; password≥12+confirmation+current_password optional; email/role/is_active prohibited |
| GET `/internal/users` | Admin | q,role,is_active,page,per_page≤100; account paginator |
| POST `/internal/users` | Admin | name,email,role,password≥12+confirmation,identity_verified optional;201 |
| PATCH `/internal/users/{id}` | Admin | version,name/email/role/is_active/identity_verified; last-admin/workload guard |
| GET `/internal/audit` | Admin | subject_type,subject_id,page,per_page≤100; readonly audit+actor |
| GET `/leads/{id}` | Scoped | Detail + property{id,title,slug},assignee{id,name} |
| PATCH `/leads/{id}/contact` | Admin | name,whatsapp_number,version,reason; CONTACT_UPDATED; duplicate409 rollback |
| POST `/auth/forgot-password` | CSRF | email; generic202 existing/absent;5/min/email+IP; production log/array503 |
| POST `/auth/reset-password` | CSRF | email,token,password≥12+confirmation;200; invalid/expired/used422 |
| GET `/internal/properties/{id}/media` | Scoped | page/per_page≤50 default20,include_archived=0/1; paginator + property_version |
| POST `/internal/properties/{id}/media` | Scoped | version,kind,alt; multipart file PHOTO/FLOOR_PLAN/BROCHURE atau HTTPS url VIDEO/TOUR;201 + property_version |
| PATCH `/internal/properties/{id}/media/{mediaId}` | Scoped | version,alt/position/published/archived/retry; atomic audit + property_version; archive terminal |
| GET `/internal/media/{mediaId}/{variant}` | Scoped | READY sanitized preview, including draft; variant640/1280/1920/download |
| GET `/media/{mediaId}/{variant}` | Public outside v1 | READY+published media pada PUBLISHED property;404 lainnya; nosniff/no-store; PDF attachment |

Internal catalog list menerima q(title/location),publication dan eager-loaded owner. Lead list menerima q(name/phone/property title),status,assigned_marketing_id,unassigned=1 dan eager-loaded property/assignee. History menambahkan previous_assignee/next_assignee{id,name}. Semua pagination tetap bounded; pencarian literal wildcard dan backend scoping tetap berlaku.

Email baru disimpan lowercase, unique index LOWER(email), login case-insensitive. Security changes mencabut sessions/reset tokens dan mengganti security stamp; middleware menolak stamp lama yang tersimpan kembali oleh concurrent request. Deactivation/demotion Marketing memerlukan seluruh katalog non-ARCHIVED dan lead nonterminal dialihkan/ditutup. Admin aktif terakhir dilindungi. `identity_verified` merupakan attestation Admin melalui prosedur pemeriksaan identitas tim; email berubah menghapus verifikasi kecuali attestation eksplisit. Recovery60 menit/single-use hanya active verified roles; audit/password/session revoke atomik. Audit tidak menyimpan password/token/email/nomor lama. SMTP aktual belum diuji; production mailer log/array ditolak503.

OperationsTest mencakup version/last-admin/workload/transfer/profile/recovery expiry/single-use/unverified/throttle/security-stamp/case-insensitive email/contact duplicate serta fault-injection audit/history rollback.

Public Property kini menambahkan media allowlist: id,kind,alt,position,url,width,height,sources{url,width,height}. List hanya satu cover PHOTO READY yang deterministik(position,id); detail seluruh media READY+published berurutan. Tidak ada original filename/staging_path/variants storage path/owner/CRM. Video URL canonical youtube-nocookie, tour HTTPS host allowlist; tidak mengambil URL dari server. PHOTO≤20,FLOOR_PLAN≤5,VIDEO/TOUR/BROCHURE masing-masing1 aktif; archive dahulu sebelum replace. Input gambarJPEG/PNG/WebP≤5MiB/40MP/20000px tiap dimensi; PDF≤10MiB+signature/EOF. Metadata gambar dibuang melalui decode+reencode WebP pada worker; sumber privat. Media hanya terlihat setelah READY. PDF scanner missing/error/timeout/unsafe tidak pernah READY; antivirus contract mocked pada test tidak membuktikan engine nyata. Media mutations/row/audit/property version/durable DB job satu transaksi; gagal enqueue menghapus staging dan rollback seluruhnya. Worker idempotent dengan state guard; retry bounded3, timeout60/backoff10/30/60; failed state bisa retry oleh owner/Admin dengan version.

FoundationTest: public/scoping/query/duplicate/assignment/version/pipeline/history. SecurityAndAtomicityTest: login/logout/inactive, bearer unsupported, notification rollback, recipient/read idempotency, request_id, seed production guard. Playwright: SSR HTML+canonical404, mobile discovery, login CSRF, drawer notes/logout. PHPUnit bypass CSRF secara framework pada test environment, sehingga CSRF dibuktikan lagi lewat HTTP browser pada runtime local.

## Evaluasi dan editorial publik

Semua endpoint berikut memakai prefix /api/v1 dan public throttle; public GET tidak meneruskan credential melalui Nuxt.

| Method/path | Akses | Kontrak |
|---|---|---|
| GET `/compare` | Public | ids[]=positive integer1..3 entries; dedup/order retained; `{data:PublicProperty[],missing:number[]}`; unpublished/missing hanya ID permintaan, tanpa metadata |
| GET `/content` | Public | `{data:{hero,testimonials,bank_rates,bank_partners}}`; verified+published only; hero pertama position/id, ≤12 testimonials, ≤50 current rates tanggal Asia/Jakarta, ≤50 bank partners dengan logo tersimpan |
| GET `/sitemap` | Public | page1..10000,1000 published entries/page; plain Laravel paginator `{data:[{slug,updated_at}],current_page,last_page,...}` |
| GET `/internal/content` | Admin | kind optional HERO/TESTIMONIAL/BANK_RATE/BANK_PARTNER,page; resource paginator20 |
| POST `/internal/content` | Admin | kind,published boolean,position0..1000,payload; verified=true wajib saat published;201 |
| PATCH `/internal/content/{id}` | Admin | Full fields+version; kind immutable;409 stale; audit atomik;200 |
| PATCH `/internal/properties/{id}/location` | Scoped | version,latitude/longitude paired nullable,pois array≤20; audit+property version atomik |

HERO payload keys: title≤160,description≤1000,eyebrow≤100,property_id nullable existing property,media_id optional nullable positive integer. Pilihan media eksplisit harus PHOTO/VIDEO READY+published milik property_id yang PUBLISHED, divalidasi kembali di transaksi;422 bila tidak eligible. Public hero menambahkan media:PublicMedia|null; media_id tidak diekspos. Omit/null media_id memilih cover foto properti untuk kompatibilitas. Pilihan eksplisit yang kemudian hidden/archived/private menghasilkan media:null tanpa berpindah ke foto lain. Public hero property_id/property/media menjadi null bila referensi properti tidak published; seluruh media memakai public allowlist, bukan sumber private. TESTIMONIAL: name≤160,quote≤2000,context≤160; Admin wajib memverifikasi izin/kebenaran publikasi. BANK_RATE: bank≤120,product≤160,annual_rate numeric0..30,effective_date/valid_until YYYY-MM-DD (akhir≥mulai),fixed_months integer1..360,source_url HTTPS≤2048. Expired/future rates tidak public. Semua payload unknown keys ditolak; fields updated_by/verified_by/version tidak masuk public payload. verified_at/verified_by merupakan attestation internal; publish setiap save memerlukan verified eksplisit, tidak mewarisi otomatis attestation lama. Semua editorial rendering plain text.

Location latitude[-90,90],longitude[-180,180],stored decimal7; salah satu null memerlukan keduanya null. POI keys name≤160,category TRANSPORT/EDUCATION/HEALTH/SHOPPING/OTHER,distance_m integer0..1000000,source_url HTTPS≤2048,source_date YYYY-MM-DD≤hari Asia/Jakarta. JSON bounded20 disimpan bersama property dan ditampilkan detail saja; list tidak memperbesar payload POI. Public detail menambahkan latitude,longitude,pois; internal fields/Marketing tetap dilarang. POI editorial bukan perhitungan geospatial otomatis.

Nuxt GET `/sitemap.xml` index, `/sitemaps/pages.xml`, `/sitemaps/properties-{page}.xml`, `/robots.txt`; absolute configured site origin/XML escaped, only published/lastmod. Missing/out-of-range file404, backend failure503; sitemap no-store. Query listing noindex/canonical base; compare noindex; JSON-LD RealEstateListing faktual tanpa rating/identity Marketing. KPR adalah kalkulasi client pure, bukan endpoint bank atau CRM; fixed/floating estimate manual+current editorial references dengan disclaimer biaya.
## Private real-time delivery

GET `/api/v1/realtime` membutuhkan session aktif: `{data:{enabled,key,cluster}}`; key/cluster null jika konfigurasi tidak siap. Tidak mengembalikan app ID/secret. POST `/api/v1/realtime/auth` memerlukan session+CSRF, socket_id angka.titik.angka ≤64 dan channel_name persis `private-users.{authenticated id}`; 403 lintas akun, 422 malformed, 503 provider belum siap. Authorization signature mengikuti protokol Pusher HMAC-SHA256 native. Tidak ada public auth endpoint/bearer token.

Event `notification.created` hanya `{id,lead_id,history_id,kind}`, bukan nama/telepon/catatan. Job database `notifications` dimasukkan bersama lead/history/persisted notice pada database transaksi yang sama. Worker mengirim sesudah commit; kegagalan enqueue membatalkan mutation. Provider failure tidak membatalkan CRM yang sudah committed. Delivery at-least-once, marker push_sent_at setelah sukses, client dedup UUID500; persisted inbox tetap sumber kebenaran. Retry3/backoff5,30,120s/timeout15s; HTTP timeout8s/connect3s/no redirects, failure logs pesan generik tanpa signed URL/credentials.

Echo2.5.0/Pusher8.6.0 lazy client/TLS/private own channel; subscription acknowledgement memicu refresh, reconnect memicu reconciliation, interval60s tetap berjalan untuk missed events. Concurrent refresh dikoalesensi dengan satu pending follow-up. 401/403 menghentikan koneksi/poll dan meminta login. Bell global/read/unread/pagination/navigation memakai scoped inbox API; stale assignment menghasilkan404 tanpa leak. Read tetap aksi eksplisit dan idempotent.

## Supervisi, funnel dan privasi

GET /api/v1/internal/reports Admin-only: from/to YYYY-MM-DD optional default30hari, marketing_id optional assignee saat ini; maksimal366hari/50.000lead (422 bila lebih). Cohort created_at dalam [awal00:00Asia/Jakarta, akhir+1hari00:00), convertedUTC. Response data cohort_size/statuses/conversion_percent, follow_up{completed,median_seconds,not_followed_up,invalid_timing_count,pending_age}, current_assignees, first_follow_up_actors, funnel. No contact fields. Median assignment pertama→FOLLOWED_UP pertama hanya valid samples; reassignment tidak reset, null bila tanpa sampel. Pending mencakup terminal tanpa follow-up; unassigned/<1hari/1–7hari/>7hari. Satu bounded select cohort dengan first-actor subquery/index; funnel terpisah seluruh properties event-date, bukan filter assignee atau atribusi CRM.

POST /api/v1/analytics stateless/throttle60min, default503 bila ANALYTICS_ENABLED=false. Strict only property_id positive/event property_view|whatsapp_click; published-only404;202 accepted. Daily Asia/Jakarta unique(property,day,event), atomic increment. Tidak menyimpan raw events/IP/UA/session/cookies/contact/referrer/attribution dan tidak membuat lead. Nuxt relay tidak meneruskan credential; client opt-in keepalive tidak menghambat CTA. Counts bukan unique people; reload/bot/missed events dapat memengaruhi total.

GET /api/v1/internal/privacy Admin-only paginator20, terminal DEAL/LOST/not-anonymized/updated_at≤cutoff; fields id/property_id/status/version/updated_at, policy_approved/retention_months metadata. Read-only; tidak ada PATCH histori/delete API. CLI flamboyan:lead-anonymize ID dry-run; execute membutuhkan --actor email, --lead-version integer, --request CASE-REF, password private+explicit ANONYMIZE ID prompt. --retention memeriksa cutoff; tanpa flag tetap untuk verified request/policy-controlled/terminal. Approved policy/reference/freshactiveAdmin/password security snapshot/terminal/version diperiksa dalam transaksi. Name becomes labelID/phoneNULL; notes redacted_at, existing LEAD audit text redacted, new history/audit append flags+policy/case refs. Status/actor/time/FK/metrik retained; anonymized mutation409 agar PII tidak dimasukkan kembali.

## Edge security, readiness dan operasi

GET `/ready` (di luar v1): public/throttle30min; `{status:ready|not_ready}`,200/503 dan no-store/private. Readiness memeriksa DB/jobs/private storage baca-tulis, queue oldest≤300s dan konfigurasi produksi (debugoff, valid APP_KEY32decoded bytes, proxy key≥32, secure cookies/HTTPS APP_URL, provider-ready jika realtime enabled). Tidak membuktikan provider receipt, backup/SLO atau legal policy. GET `/api/v1/internal/operations` Admin-only/internal throttle: `{data:{ready,database,private_storage,production_configuration,queue:{pending,oldest_age_seconds,failed,backlog_alert},media:{failed,stale_processing}|null,backup:{verified_at,age_seconds,overdue}}}`. Nilai null berarti tidak tersedia; tidak mengembalikan credential/path/environment/exception. Backup timestamp UTC ISO,overdue jika missing/invalid/future atau>93600s; marker private operator-only. Failed/stale-media/backup tetap alert tersendiri, bukan alasan mengklaim readiness sebagai seluruh release gates.

Public Nuxt proxy menerima fixed routes saja, tidak meneruskan cookie/Authorization. Client IP berasal dari socket dan chain X-Forwarded-For yang dihitung dari kanan melalui exact trusted hops. Internal SSR metadata HMAC waktu+IP digunakan untuk meneruskan identitas rate bucket tanpa percaya header raw. Nuxt→Laravel headers X-Flamboyan-Client-IP, X-Flamboyan-Proxy-Time dan X-Flamboyan-Proxy-Signature; HMAC-SHA256 atas `METHOD\n/PATH\nUNIX_SECONDS\nIP`, private shared API_PROXY_SECRET/NUXT_API_PROXY_SECRET, waktu±30s dan path public allowlist. Signature invalid/malformed/stale/wrong-path403. Header bukan public API requirement untuk browser/direct clients dan tidak memberi hak autentikasi internal. Query tetap divalidasi controller; signature bukan claim user/CRM. Raw X-Forwarded-For tidak dipercaya kecuali actual peer dalam private allowlist.

Laravel baseline nosniff/frameDENY/no-referrer/Permissions-Policy dan HSTS1tahun pada HTTPS produksi, termasuk error responses. Nuxt produksi nonce per HTML response, script-src self+nonce tanpa unsafe-eval, embed/connect allowlist, frame-ancestors none; inline styles tetap diizinkan untuk tampilan/chart. Reset/forgot no-referrer; login/backoffice same-origin untuk Sanctum GET stateful detection, public strict-origin-when-cross-origin. No-store/noindex private tetap berlaku. Host allowlist exact pada kedua aplikasi. Structured logs hanya UUID request/method/route pattern/status/duration dan sanitized exception class/code; tidak query/SQL/body/telepon/password/keys. API errors tetap generic500 dengan request_id.

## Catatan kompatibilitas UI/UX — 2026-10-04

Redesign `codex/ui-ux-redesign` menggunakan endpoint, request, DTO allowlist, pagination, version guard dan error HTTP yang sama. Tidak ada endpoint atau response field baru. Label publikasi/ketersediaan/peran/jenis konten diterjemahkan hanya di frontend; nilai enum request/response tetap. Menu dan sidebar tidak menggantikan otorisasi backend. Halaman error frontend tetap mempertahankan status404/503 dan tidak menampilkan detail exception mentah. Bukti validasi antarmuka ada di `ui-ux-redesign.md`.

Label filter aktif pada katalog dibentuk dari parameter query yang sudah didukung API. Menghapus satu label hanya membuang parameter tersebut dan `page`, sambil mempertahankan filter lain serta `sort`; reset menghapus seluruh query katalog. Tidak mengubah validation/allowlist API. Nilai IDR dan enum tetap memakai kontrak lama; format ramah pengguna hanya untuk tampilan.

Revisi editorial mengubah komposisi media: foto suasana berlisensi pada hero diberi label ilustrasi dan disajikan sebagai aset lokal; `hero.property` dari API tetap tampil sebagai sorotan katalog dengan media/harga/slug sebenarnya. Judul/deskripsi/eyebrow tetap dari CMS. Tidak ada foto stok yang disisipkan sebagai foto unit pada public DTO. Referensi aset ada di `editorial-direction.md`.

### Penyajian foto demo terkurasi (2026-10-04)

Tidak ada endpoint/field baru. Foto demo memakai POST/PATCH media internal existing, CSRF, version guard dan worker. Katalog/compare memakai cover existing; detail memakai galeri existing. UI memberi label pada alt berawalan `Ilustrasi demo ·`; bukan flag otorisasi atau aturan pemilihan unit. Metadata kredit disimpan pada alt≤240 karakter. Foto produksi tidak diberi fallback stok. Impor hanya fixture lokal opt-in; lihat [photo-curation.md](photo-curation.md).


### Kesiapan aset hero dan logo bank berizin — 2026-10-04

BANK_PARTNER payload tepat {name:string≤120,website:HTTPS≤2048}. Bentuk record baru tidak membutuhkan migrasi; kind tersimpan string dan logo metadata terkelola server pada payload JSON existing. Client tidak dapat menyuplai/mengubah metadata logo atau path. Normal PATCH preserve logo yang sudah diunggah, tetapi tetap meminta attestation verified untuk publikasi. Internal record menambahkan logo_uploaded:boolean; filesystem metadata tidak ada pada JSON internal maupun public.

POST /api/v1/internal/content/{id}/logo Admin aktif + session/CSRF: multipart file,version integer≥1,verified=1 wajib. Record harus BANK_PARTNER existing. JPEG/PNG/WebP≤2MiB/4MP/dimensi≤4000; MIME+signature+decode, konversi WebP dengan sisi terpanjang≤640px dan transparansi dipertahankan, metadata sumber dibuang. Tidak menerima SVG, remote URL atau fetch eksternal. Pemrosesan sinkron dibatasi ukuran logo; tanpa GD WebP503. Logo tersimpan pada private media disk; fresh actor/version guard+audit+attestation+version increment atomik; response200 {data:EditorialContent}. Upload tidak mengubah published flag; simpan draft, upload, lalu publish melalui PATCH bila siap. Stale409, role403, wrong kind/missing404, invalid422. Kegagalan transaksi membersihkan file baru dan mempertahankan record/version sebelumnya.

GET /api/v1/content/{id}/logo public hanya BANK_PARTNER published+verified dan file tersedia; selain itu404. Output image/webp, nosniff, Cache-Control:no-store, CSP sandbox. Route diizinkan pada signed public proxy dengan ID numerik, tidak membuka internal routes. Public content.bank_partners hanya record eligible dengan file dan DTO {id,name,website,logo_url}; tidak membuat klaim rekanan dari data BANK_RATE. Pemilik wajib memverifikasi izin logo dan hubungan bank sebelum attestation.

File logo terdahulu dipertahankan private setelah replacement, tidak dihidangkan oleh endpoint dan tidak dihapus otomatis. Rollback konten cukup unpublish atau unggah kembali aset yang disetujui memakai version terbaru; pemulihan filesystem/DB mengikuti backup operator. Inventaris dan pembersihan file lama memerlukan review backup/retensi operator, bukan cleanup media properti. Tidak ada hard-delete, logo fiktif, perubahan CRM/privacy, atau migrasi database. Catatan redesign terdahulu mengenai hero statis merupakan snapshot historis; hero yang dipilih CMS kini dikirim lewat field media di atas.

### Media function (2026-10-05)

GET /api/v1/internal/properties/{id}/media menambah process_in_request:boolean di envelope (bersama property_version/data/links/meta). GET hanya membaca.

POST /api/v1/internal/properties/{id}/media/process: auth Sanctum, active account, throttle internal, CSRF dan scope properti seperti upload. Memproses maksimal satu job media durable bila property memiliki PROCESSING, mengembalikan204; Marketing lain404, mode worker terpisah409. Tidak mengubah property version, metadata atau publikasi. Job sukses mengisi READY/variants; kegagalan memakai kontrak processor existing. POST upload dan PATCH retry pada mode function dapat langsung mengembalikan READY/FAILED setelah commit; PROCESSING tetap hasil sah saat antrean mendahulukan job lain.

Akun inactive/role tidak didukung: request internal tetap403; bila memiliki sesi, middleware mencabut login device tersebut, invalidasi sesi dan regenerasi CSRF. Permintaan login berikutnya diproses sebagai guest (akun inactive422), sehingga tidak mengembalikan redirect HTML seolah login berhasil. Security stamp tidak cocok tetap401 dan membersihkan sesi.

Semua exception /auth/* selalu JSON, termasuk validation422, auth401, CSRF419 dan throttle429, walau Accept tidak diteruskan proxy atau client mengirim text/html. Response memakai allowlist message/errors/request_id existing; tidak ada redirect ke Referer sebagai pengganti error login/recovery.
