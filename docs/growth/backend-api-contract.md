# Kontrak API growth dan outcome CRM

Versi implementasi 17 Oktober 2026. Kontrak wire ini memperinci spesifikasi; fitur produksi tetap default-off sampai gate bisnis/legal selesai. Semua waktu pada wire ISO-8601 UTC, ditampilkan WIB. Internal memakai session Sanctum, CSRF, akun aktif dan scope backend. Semua internal response dan intake `no-store`; error Laravel `{message,errors?,request_id}`. BFF menyampaikan status yang aman, tanpa detail database.

## Gate dan boundary publik

Intake aktif hanya bila enable flag, tepat lima stable property IDs yang masih PUBLISHED, notice version/relative URL valid, `GROWTH_PRIVACY_NOTICE_APPROVED=true`, `GROWTH_RETENTION_APPROVED=true`, dan referensi policy valid. Admin memverifikasi kelima ID di database target; judul/slug tidak menjadi otorisasi.

`GET /api/v1/inquiries/options` memberi `{data:[{property_id,title,canonical_path}],meta:{enabled,disabled_reason,privacy_notice_version,privacy_notice_url,service_hours_notice,attribution_context_enabled}}`. Saat disabled: 200, data kosong, enabled=false, metadata notice null. Gangguan sumber: 503. Semua pilihan aktif berasal dari allowlist backend, bukan input browser.

POST context/intake hanya melalui relay Nuxt same-origin yang fixed. Relay wajib Origin tepat, JSON, body maksimal 16 KiB, tanpa browser cookies ke API publik, HMAC server dan verified client-IP. Laravel mewajibkan signature method/path/time/IP, waktu ±30 detik; unsigned, invalid, expired atau salah path/method 403. Tidak ada endpoint GET receipt. Secret dan upstream URL tidak dapat dipilih browser.

## Atribusi

`POST /api/v1/inquiries/context` menerima:

```json
{
  "first_touch":{"source":"google","medium":"cpc","campaign":"bfi2_bandung","term":"rumah bandung","captured_at":"2026-10-17T01:00:00Z"},
  "last_touch":{"source":"google","medium":"cpc","campaign":"bfi2_bandung","captured_at":"2026-10-17T01:10:00Z"},
  "consent":{"analytics":true,"marketing":false,"decided_at":"2026-10-17T01:00:00Z","version":"2"}
}
```

Source/medium/campaign dan optional content berupa kode lowercase bounded; term boleh kata Unicode/spasi. Masing-masing maksimal 120 karakter, email/nomor telepon ditolak, unknown fields ditolak. Touch maksimal 30 hari, consent maksimal 180 hari, skew future satu menit, last >= first. Sedikitnya satu optional consent harus aktif.

201 `{data:{token,expires_at}}`, ciphertext opaque dengan TTL default 24 jam. Tidak ada persist sebelum inquiry. Token bukan bukti klik platform; provenance CLIENT_REPORTED. `consent_version` dan `consent_decided_at` disimpan terpisah dari `privacy_notice_version` layanan. Tidak menyimpan click ID, URL/referrer mentah, IP atau UA pada record atribusi. Browser hanya menyimpan first/last sanitized setelah consent; direct tidak menimpa last touch. Perubahan consent membersihkan konteks lama.

## Inquiry

`POST /api/v1/inquiries`, header `Idempotency-Key` URL-safe 22–200 karakter dari random minimal 128 bit:

```json
{
  "name":"Contoh Pengunjung",
  "whatsapp_number":"08123456789",
  "property_id":1,
  "purpose":"CONSULTATION",
  "message":"Mohon informasi",
  "privacy_notice_version":"privacy-1",
  "marketing_opt_in":false
}
```

Purpose `CONSULTATION|VISIT_REQUEST`; optional preferred_visit_at harus future maksimal 90 hari dan bukan booking terkonfirmasi. Message plain text maksimal 1.000, name maksimal 160; nomor dinormalisasi ke digit internasional. Attribution token opsional. Tidak menerima assignment, status, lead ID atau field internal. Semua optional tracking ditolak tetap dapat mengirim permintaan layanan.

202 `{accepted:true,receipt:UUID}` hanya sesudah commit durable. Retry key+payload sama mengembalikan receipt yang sama, termasuk setelah token expired bila request sudah diterima; key sama/payload berbeda 409. Hash payload HMAC dengan APP_KEY; receipt dan dedup bukan lookup publik. Intake dibatasi 5/10 menit/IP dan 10/hari/nomor, context 30/menit/IP. Validation 422, throttle 429, dependency/storage 503. Publikasi diperiksa ulang dalam transaksi; gagal tidak memberi receipt sukses. Form event `inquiry_submitted` hanya setelah 202+receipt dan dedupe receipt in-memory; bukan valid lead.

## Rekonsiliasi Admin

`GET /api/v1/internal/inquiries?page=1&per_page=20&state=PENDING` memberi paginator Laravel, batas per_page 100. State `PENDING|RESOLVED|REJECTED_SPAM|EXPIRED`. DTO memuat property `{property_id,title,canonical_path}` atau null, kontak nullable setelah minimisasi, purpose/preference/message/notice/opt-in, version, resolution, lead_id serta attribution `{first_touch,last_touch,method}`. Marketing ditolak 403.

`POST /api/v1/internal/inquiries/{numericId}/resolve`:

```json
{"version":1,"action":"ACCEPT_NEW","reason":"Kontak dan kebutuhan sudah diperiksa"}
```

Action `ACCEPT_NEW|LINK_EXISTING|REJECT_SPAM`; lead_id wajib hanya pada LINK_EXISTING, reason wajib untuk spam. ACCEPT_NEW membuat lead tanpa assignment dan histori CREATED+INQUIRY_LINKED; unique phone+property mencegah lead ganda. LINK_EXISTING wajib kontak+properti tepat sama, lead bukan anonim; tidak membuka ulang terminal. Kedua jalur menghasilkan state RESOLVED dengan action berbeda. Reply `{data:<inquiry>,lead?:{id,status,version}}`. Resolusi identik dapat diulang tanpa side effect; resolusi berbeda/stale 409. Mutasi inquiry, lead version, histori dan relasi attribution satu transaksi; kegagalan rollback semua.

## Qualification, visit dan akad

`GET /api/v1/internal/leads/{id}/outcomes?visits_page=N` memberi `{data:{lead_id,lead_version,qualification,visits,visits_meta,akad,attribution}}`. Scope Admin/assigned Marketing; scoped miss 404. Visits 50 terbaru per halaman; meta `{current_page,last_page,total}`. First/last attribution di-query bounded. Histori lengkap tetap endpoint `/api/v1/leads/{id}/history` dengan pagination existing.

| Endpoint | Body selain version wajib | Akses dan aturan |
| --- | --- | --- |
| PATCH `.../{id}/qualification` | qualified:boolean, reason | Admin/assignee; rubric server versi 1 pada histori; duplicate 409 |
| POST `.../{id}/visits` | status, scheduled_at?, reason? | REQUESTED/CONFIRMED; confirmed wajib future maksimal 180 hari |
| PATCH `.../{id}/visits/{visitId}` | status, scheduled_at?, reason? | Transisi sesuai paragraf berikut; lead terminal ditolak |
| POST `.../{id}/akad-confirmation` | confirmed:boolean, occurred_at?, reference?, reason? | Admin; confirmed wajib DEAL, waktu tidak future dan referensi non-PII maksimal 120 |
| PATCH `.../{id}/attribution` | source,medium,campaign,content?,term?,reason | Admin, provenance ADMIN_REPORTED; bukan verifikasi platform |

REQUESTED→CONFIRMED/CANCELLED. CONFIRMED→CONFIRMED (reschedule berbeda+alasan)/COMPLETED/CANCELLED/NO_SHOW. Kehadiran/no-show hanya sesudah jadwal; tanggal tidak dapat diganti sambil menyatakan hadir. Cancel/no-show/reschedule wajib alasan. DEAL/LOST tidak menerima perubahan kunjungan. `was_confirmed` tetap true setelah konfirmasi untuk agregat funnel. Versi **lead** adalah guard bersama semua mutation; visit version dikembalikan untuk audit, bukan parameter independen.

Akad correction wajib alasan dan perubahan nyata, duplicate 409; revoke wajib alasan. Histori baru QUALIFICATION_CHANGED, VISIT_CHANGED, AKAD_CONFIRMED/CORRECTED/REVOKED, ATTRIBUTION_CORRECTED; tidak ada edit/delete histori. Tidak ada perubahan otomatis pada pipeline atau availability properti. Tidak ada upload conversion/CAPI/WA Platform.

## Laporan, retensi dan rollback

Report existing menambah `growth.cohort=lead_created_at`: semua lead dalam periode WIB, termasuk WhatsApp manual, satu kali per metrik. Qualified/akad adalah proyeksi terakhir; confirmed adalah pernah mempunyai konfirmasi, completed kehadiran aktual. Sumber terakhir yang diketahui dipilih satu per lead, repeat inquiry/koreksi tidak melipatgandakan hasil. UNKNOWN ditampilkan; source/medium/campaign/method maksimal 100 kelompok, selebihnya meminta rentang dipersempit. CPL/CPQL null karena spend belum diimpor. `growth.inquiry_cohort=inquiry_created_at` hanya menghitung inquiry states dan unique linked leads; denominator tidak dicampur.

Cleanup default dry-run; execute menolak policy belum disahkan. Kandidat default pending 30 hari→EXPIRED, spam 7 hari, resolved 90 hari atau segera saat lead anonim. Kontak, message, preferred date, free-text reason dan term/content dibersihkan; receipt tombstone dan metadata minimum dipertahankan. Anonimisasi lead juga meredaksi outcome reason/akad reference/visit prose dan metadata histori dalam transaksi yang sama. Jadwal execute tidak diaktifkan otomatis.

Rollback: disable growth flags dan deploy source sebelumnya, pertahankan tabel aditif. Jangan menjalankan down/drop setelah ada data; gunakan backup dan migrasi terkontrol. Environment fixture tidak mengesahkan notice/policy produksi.
