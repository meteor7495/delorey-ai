# Vertical Slice 15 — batch.sync Queue (BullMQ)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 27, 2026 |
| **Depends on** | [Slice 13](./vertical-slice-13.md) · [Slice 14](./vertical-slice-14.md) · Redis |
| **PRD** | [PRD-005 Catalog Sync](../04-prd/catalog-sync.md) |
| **Architecture** | Backend §8 Jobs & Queues |

**Goal:** Move Shopify full sync and webhook ingest onto BullMQ queue `batch.sync` so webhook HTTP acks fast and heavy work does not share the interactive turn path. Tenant required on every job envelope.

---

# Checklist

- [x] `JobsModule` + BullMQ `batch.sync`  
- [x] Job types: `commerce.sync`, `commerce.webhook`, `commerce.webhooks.register`  
- [x] Envelope `{ tenant_id, type, payload, idempotency_key }`  
- [x] Webhook: HMAC verify → enqueue → `200`  
- [x] Connect / manual sync enqueue (inline fallback if Redis down or `SYNC_INLINE=1`)  
- [x] Processor concurrency 2; attempts + exponential backoff  
- [x] Workspace copy when queued  

---

# Out of this slice

Separate `sync-worker` process · `interactive.turns` queue · fair multi-tenant limiter metrics · DLQ UI · `batch.embed`.

---

# Ops

```bash
docker compose up -d redis
# REDIS_URL=redis://127.0.0.1:6379
```

Local without Redis: enqueue fails soft → inline processing (logged). Force inline: `SYNC_INLINE=1`.
