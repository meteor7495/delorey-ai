# Vertical Slice 14 — Shopify Webhooks (incremental sync)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 27, 2026 |
| **Depends on** | [Slice 13 Shopify Connect](./vertical-slice-13.md) |
| **PRD** | [PRD-005 Catalog Sync](../04-prd/catalog-sync.md) |

**Goal:** Incremental catalog/order updates via Shopify webhooks with HMAC verify, idempotent upserts, and duplicate webhook-id debounce. Full replace sync remains for connect/manual retry. Not a BullMQ worker yet — ingest is fast and must not block shopper turns long-term (queue next hardening).

---

# Checklist

- [x] `POST /v1/webhooks/store/:connectionId` + raw body HMAC  
- [x] Register topics on connect/sync (`products/*`, `orders/*`, `app/uninstalled`)  
- [x] Idempotent product/order upsert by external id  
- [x] Duplicate `X-Shopify-Webhook-Id` debounce (in-process TTL)  
- [x] Uninstall → sync `failed`  
- [x] Workspace: webhook URL + «ثبت مجدد Webhookها»  
- [x] `SHOPIFY_WEBHOOK_RELAXED` for local without secret  

---

# Out of this slice

Redis/`batch.sync` queue · multi-instance debounce · inventory-level webhooks · WooCommerce.

---

# Smoke

1. Connect Shopify (Slice 13).  
2. Ensure `PUBLIC_API_BASE_URL` is reachable by Shopify (tunnel for local).  
3. Set `SHOPIFY_API_SECRET` (or `SHOPIFY_WEBHOOK_RELAXED=1` only for local mocks).  
4. Edit a product in Shopify Admin → Workspace catalog updates without full sync.
