# Vertical Slice 13 — Shopify Connect + Sync

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Commerce Core mock (Slice 01) + Runtime sync gate |
| **PRD** | [PRD-004 Commerce Core](../04-prd/commerce-core.md) · [PRD-005 Catalog Sync](../04-prd/catalog-sync.md) |

**Goal:** Connect a real Shopify store (Admin API token or OAuth), encrypt credentials, pull products + orders into tenant SoR, and surface honest sync health. Mock remains for local demo only.

---

# Checklist

- [x] `StoreConnection` credentials + shop domain columns  
- [x] `POST /v1/store/shopify/connect` (Admin API token)  
- [x] `POST /v1/store/shopify/oauth/start` + `GET /v1/oauth/store/callback`  
- [x] `POST /v1/store/sync` re-sync  
- [x] Normalize products / orders into Prisma  
- [x] Empty catalog → `failed` (not healthy)  
- [x] Credentials never in GET `/store`  
- [x] Workspace Store UI: Shopify + mock  
- [x] Admin audit `store.shopify.connect` / `store.sync`  

---

# Out of this slice

BullMQ webhook debounce workers · variants as first-class rows · WooCommerce · Shopify webhook HMAC ingest · multi-store.

---

# Local smoke

1. Create a Shopify Custom app with `read_products`, `read_orders`.  
2. Copy Admin API access token.  
3. Workspace → فروشگاه → دامنه + توکن → «اتصال با توکن».  
4. Confirm catalog + orders replace mock; sync health healthy (or failed if empty).  
5. Optional: set `SHOPIFY_API_KEY` / `SECRET` and use OAuth button.
