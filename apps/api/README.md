# Flamboyan API

Laravel 13 / Eloquent / Sanctum session API. PostgreSQL production target; SQLite local.

Setup, provisioning, verification and deployment: [runbook](../../docs/runbook.md).
Contract: [API_DOCS](../../docs/API_DOCS.md). Behavior: [SRS](../../docs/SRS.md).

Keep public resources allowlisted. CRM writes, history and notifications are atomic; private mutations require current object version. No public registration or bearer-token auth.
