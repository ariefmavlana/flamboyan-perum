# REST API — fondasi dan workspace operasi

Base `/api/v1`, JSON, waktu UTC ISO8601. Production browser/API same origin; proxy hosting mengirim `/api`, `/auth`, `/sanctum` ke Laravel dan halaman lainnya ke Nuxt. Private routes hanya session Sanctum + user active ADMIN/MARKETING. Bearer token/public register tidak tersedia.

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
| GET `/content` | Public | `{data:{hero,testimonials,bank_rates}}`; verified+published only; hero pertama position/id, ≤12 testimonials, ≤50 current rates tanggal Asia/Jakarta |
| GET `/sitemap` | Public | page1..10000,1000 published entries/page; plain Laravel paginator `{data:[{slug,updated_at}],current_page,last_page,...}` |
| GET `/internal/content` | Admin | kind optional HERO/TESTIMONIAL/BANK_RATE,page; resource paginator20 |
| POST `/internal/content` | Admin | kind,published boolean,position0..1000,payload; verified=true wajib saat published;201 |
| PATCH `/internal/content/{id}` | Admin | Full fields+version; kind immutable;409 stale; audit atomik;200 |
| PATCH `/internal/properties/{id}/location` | Scoped | version,latitude/longitude paired nullable,pois array≤20; audit+property version atomik |

HERO payload keys: title≤160,description≤1000,eyebrow≤100,property_id nullable existing property. Public hero property_id/property menjadi null bila referensi tidak published; property DTO menggunakan sanitized cover, bukan sumber private. TESTIMONIAL: name≤160,quote≤2000,context≤160; Admin wajib memverifikasi izin/kebenaran publikasi. BANK_RATE: bank≤120,product≤160,annual_rate numeric0..30,effective_date/valid_until YYYY-MM-DD (akhir≥mulai),fixed_months integer1..360,source_url HTTPS≤2048. Expired/future rates tidak public. Semua payload unknown keys ditolak; fields updated_by/verified_by/version tidak masuk public payload. verified_at/verified_by merupakan attestation internal; publish setiap save memerlukan verified eksplisit, tidak mewarisi otomatis attestation lama. Semua editorial rendering plain text.

Location latitude[-90,90],longitude[-180,180],stored decimal7; salah satu null memerlukan keduanya null. POI keys name≤160,category TRANSPORT/EDUCATION/HEALTH/SHOPPING/OTHER,distance_m integer0..1000000,source_url HTTPS≤2048,source_date YYYY-MM-DD≤hari Asia/Jakarta. JSON bounded20 disimpan bersama property dan ditampilkan detail saja; list tidak memperbesar payload POI. Public detail menambahkan latitude,longitude,pois; internal fields/Marketing tetap dilarang. POI editorial bukan perhitungan geospatial otomatis.

Nuxt GET `/sitemap.xml` index, `/sitemaps/pages.xml`, `/sitemaps/properties-{page}.xml`, `/robots.txt`; absolute configured site origin/XML escaped, only published/lastmod. Missing/out-of-range file404, backend failure503; sitemap no-store. Query listing noindex/canonical base; compare noindex; JSON-LD RealEstateListing faktual tanpa rating/identity Marketing. KPR adalah kalkulasi client pure, bukan endpoint bank atau CRM; fixed/floating estimate manual+current editorial references dengan disclaimer biaya.