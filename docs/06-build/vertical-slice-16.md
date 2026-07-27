# Vertical Slice 16 — WooCommerce Connect + Sync

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 27, 2026 |
| **Depends on** | [Slice 13 Shopify](./vertical-slice-13.md) · [Slice 15 batch.sync](./vertical-slice-15.md) |
| **PRD** | [PRD-004 Commerce Core](../04-prd/commerce-core.md) — WooCommerce equivalent path |

**Goal:** Same Commerce Core brain as Shopify: connect with REST keys, encrypt credentials, full sync + webhooks via `batch.sync`, honest sync health. Not a forked Runtime.

---

# Checklist

- [x] `POST /v1/store/woocommerce/connect` (site URL + ck/cs)  
- [x] Normalize products/orders into tenant SoR  
- [x] Empty catalog → `failed`  
- [x] Webhooks via unified `POST /v1/webhooks/store/:connectionId`  
- [x] HMAC (`X-WC-Webhook-Signature`) + `WOOCOMMERCE_WEBHOOK_RELAXED`  
- [x] Jobs: `commerce.sync` / `commerce.webhook` route by platform  
- [x] Workspace Store UI: Woo form + shared sync/webhook actions  
- [x] Admin audit `store.woocommerce.connect`  

---

# Out of this slice

Variable-product variation expansion · Woo OAuth app · multi-store · fair tenant limiter metrics.

---

# Local smoke

1. Create WooCommerce REST API keys (read).  
2. Workspace → فروشگاه → آدرس سایت + ck/cs → اتصال.  
3. Wait for queue (or `SYNC_INLINE=1`) → catalog/orders appear.  
4. Ensure `PUBLIC_API_BASE_URL` reachable for webhooks (tunnel).
