# Validasi notifikasi privat

2026-10-03; Windows/PHP8.4.26, PostgreSQL17.9 cluster terisolasi, SQLite memory, Node24.21.0/Chrome lokal. Migration000005 additive; runtime PHP8.3/Linux/provider Pusher nyata belum tersedia.

- Pint --test passed; PHPUnit55 tests/337 assertions masing-masing SQLite5.56s/PostgreSQL9.00s. Kontrak private auth/official signing vector/payload no PII/atomic durable enqueue/provider failure/recovery/inactive recipient diuji.
- Composer validate --strict valid/audit0; route:cache/route:clear passed.
- npm lint --max-warnings0, typecheck, Vitest11 tests passed0.328s. Unit dedup/coalescing/reconnect/fallback60s/unauthorized/unmount tested.
- Playwright9 flows passed1.1min; real Echo/Pusher client with synthetic WebSocket handshake/subscription/reconnect plus HTTP auth/inbox fakes; native logout/CSRF419 tested. Media flow memakai queue worker nyata pada fixture demo private. Simulasi bukan bukti provider latency≤5s atau pengiriman bisnis.
- npm build SSR passed; upstream DEP0155 tetap ada. Source audit11 high/0critical/0moderate dari dua advisory upstream unresolved; runtime artifact audit0. Tidak menyembunyikan warning NO_COLOR/FORCE_COLOR tool.
- Dua kegagalan browser awal adalah test GETme melalui APIRequestContext tanpa header stateful dan locator logout di halaman profil; test memakai browser fetch dan logout global workspace sekarang. Test inactive awal menggunakan field guarded pada factory update; forceFill fixture memperbaikinya. Hasil gagal tidak dihitung sebagai pass.

Rollback: nonaktifkan REALTIME_ENABLED, stop notifications worker, deploy commit evaluasi dengan kolom baru dipertahankan. Persisted inbox tetap tersedia; jangan hapus histori/notifications/kolom aktif. Provider/hosting/credentials/monitoring latency produksi tetap gate yang wajib dibuktikan sebelum go-live.
