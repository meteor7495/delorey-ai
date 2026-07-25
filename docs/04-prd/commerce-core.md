# PRD-004 — Commerce Core

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-004 |
| **Feature** | Commerce Core |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [User Journey](../02-product/user-journey.md) Stages 3–4 · [System Architecture](../03-architecture/system-architecture.md) §7 · [API Specification](../03-architecture/api-specification.md) |

---

# 1. Problem

Without live storefront truth, DeloRey is a generic chatbot. Merchants lose trust when chat invents price/stock.

# 2. Goal

Connect one primary storefront (Shopify primary; WooCommerce equivalent) and expose catalog, inventory signals, pricing, shipping/return/COD policy fields, and orders to Context/Skills.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Store connect/disconnect OAuth/API, normalized commerce schema, read APIs for Context/Skills, sync health projection, events | Multi-platform coverage as MVP requirement; owning checkout; PSP/WMS; spreadsheet as primary path |

# 4. Users & Journey

| Persona | Stages |
|---------|--------|
| Merchant | 3 Store connection, 4 Sync |

# 5. Functional requirements

1. MUST connect Shopify (primary) and WooCommerce-equivalent path with tenant-scoped credentials in secrets manager.  
2. MUST normalize products, variants, inventory signals, prices, policy fields, orders.  
3. MUST publish sync health (last success, lag, failure reason) — user-visible.  
4. MUST emit `store.connected`, `sync.*`, `catalog.updated`, `inventory.updated`, `order.updated` as Architecture requires.  
5. MUST block confident factual answers when connection/sync unhealthy (with Catalog Sync / Runtime).  
6. MUST NOT allow misleading go-live on empty catalog.  
7. Credentials NEVER in prompts/logs/API GET bodies.

# 6. UX requirements

Clear pass/fail connect; never silent “connected” with broken truth; retry/reconnect CTAs.

# 7. Technical contracts

`/v1/workspaces/{id}/store/*` — [API Specification](../03-architecture/api-specification.md). ACL connectors per Backend Architecture.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Grounded GMV path |
| AI Employee impact | Yes | Context Before Intelligence |
| Friction | Yes | &lt;24h connect path |
| Scope fit | Yes | MVP Commerce Core |
| Principle compliance | Yes | Commerce + Context principles |
| Measurement | Yes | Connection success; sync lag |
| Kill criteria | Yes | Below |

# 9. Measurement

Store connect success rate; sync lag; sync failure rate; % turns blocked by unhealthy sync.

# 10. Acceptance criteria

- [ ] Design partner can connect store and see catalog entities in tenant DB.  
- [ ] Failed OAuth/scopes mark unhealthy — not healthy.  
- [ ] Isolation: Shop A catalog never in Shop B context.  

# 11. Kill criteria

Chronic inventing of price/stock despite “connected” store → stop channel expansion; fix Commerce/sync first.

# 12. Dependencies & risks

Auth, Tenant, Catalog Sync workers. API fragility of storefronts.

# 13. Anti-pattern check

Not a website builder or inventory WMS product.
