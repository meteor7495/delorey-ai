# Vertical Slice 21–26 — Native Storefront + CMS

## Metadata

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Last Updated** | August 5, 2026 |
| **Depends on** | Slices 01–20 |

**Goal:** Keep Shopify/Woo + AI Employee intact; add native Digikala-like storefront and Workspace CMS under grouped navigation.

## Delivered

- [x] Slice 21 — Sidebar groups (فروشگاه / اتصالات / کارمند هوش مصنوعی) + `/shop/*` CMS routes  
- [x] Slice 22 — Prisma Category/Product extensions + CMS CRUD (`/v1/shop/*`)  
- [x] Slice 23 — `apps/storefront` public read (home, list, PDP)  
- [x] Slice 24 — Cart, COD checkout, track, CMS orders  
- [x] Slice 25 — Settings, banners, colors, store slug  
- [x] Slice 26 — AI search includes native published products; widget embed on storefront; docs scope update  

## Local

```bash
pnpm db:up
pnpm --filter @seloma/api exec prisma migrate deploy
pnpm install
pnpm dev
```

| App | URL |
|-----|-----|
| Workspace CMS | http://localhost:3010/shop |
| Storefront | http://localhost:3020/s/{storeSlug} |
| Widget | http://localhost:5173 |
| API | http://localhost:3001/v1 |

Env: `STOREFRONT_BASE_URL`, `CORS_ORIGINS` includes `:3020`.
