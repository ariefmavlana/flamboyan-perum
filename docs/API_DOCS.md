# REST API — fondasi F0

Base `/api/v1`, JSON, waktu UTC ISO8601. Production browser/API same origin; proxy hosting mengirim `/api`, `/auth`, `/sanctum` ke Laravel dan halaman lainnya ke Nuxt. Private routes hanya session Sanctum + user active ADMIN/MARKETING. Bearer token/public register tidak tersedia.

## Endpoint yang diimplementasikan

| Method/path | Akses | Input / output |
|---|---|---|
| GET `/properties` | Public | q, page, per_page≤48, sort, filter di bawah; resource allowlist paginator |
| GET `/properties/{slug}` | Public | published saja; `{data: Property}`; missing/draft/archive404 |
| GET `/internal/properties` | Internal | Admin semua, Marketing owner; page/per_page≤48; internal paginator |
| POST `/internal/properties` | Internal | Core fields required; Admin owner_id Marketing aktif; Marketing otomatis dirinya;201 |
| PATCH `/internal/properties/{id}` | Internal scoped | partial fields + version required; owner_id/slug prohibited;409 stale |
| GET `/me` | Internal | `{data:{id,name,role}}` |
| GET `/leads` | Internal scoped | page, per_page≤100, status; paginator |
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

## Contract tests

FoundationTest: public/scoping/query/duplicate/assignment/version/pipeline/history. SecurityAndAtomicityTest: login/logout/inactive, bearer unsupported, notification rollback, recipient/read idempotency, request_id, seed production guard. Playwright: SSR HTML+canonical404, mobile discovery, login CSRF, drawer notes/logout. PHPUnit bypass CSRF secara framework pada test environment, sehingga CSRF dibuktikan lagi lewat HTTP browser pada runtime local.
