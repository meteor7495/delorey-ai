# API Map (as implemented)

There is **no OpenAPI/Swagger** in this repository. Contracts are discovered from Nest controllers, DTO classes, Prisma models, and `packages/api-client/src/index.ts`.

Logical spec: `docs/03-architecture/api-specification.md` — useful for intent, often **out of date on path shapes**. Example: spec says `/v1/workspaces/{workspaceId}`; code uses `GET /v1/workspace/me`.

## Discovery order (mandatory)

```
Task
 → packages/api-client/src/index.ts
 → matching Nest @Controller
 → DTO class-validator fields
 → service method
 → Prisma model
```

If the client method does not exist, search controllers before inventing a path.

If the contract cannot be verified: **do not guess**. Report missing contract information.

## Global rules

| Rule | Implementation |
|------|----------------|
| Prefix | `/v1` (`app.setGlobalPrefix('v1')`) |
| JSON | default; uploads are multipart `POST /v1/uploads` |
| Merchant auth | `Authorization: Bearer <session>` + `SessionAuthGuard` |
| Widget | `x-public-key` on public chat routes |
| Webhooks | signature / secret per adapter — not session |
| IDs | UUID strings |
| Pagination (shop lists) | `limit` + `offset` + `{ items, total, limit, offset }` in api-client `Paginated<T>` |

## Client implementation

Single factory: `createApiClient` in `packages/api-client/src/index.ts`.

| App | Wrapper |
|-----|---------|
| Workspace | `apps/workspace/src/shared/api.ts` |
| Storefront | `apps/storefront/src/lib/api.ts` |
| Widget | uses client directly |
| Web | **does not** use api-client — `apps/web/src/lib/api.ts` |

Do not add a second fetch wrapper for `/v1` in workspace/storefront/widget.

Errors: client throws `Error(\`${status} ${body}\`)`. Workspace maps via `toastFromError`.

## Route groups (code, not spec)

### Public / unauthenticated

| Method | Path | Controller |
|--------|------|------------|
| GET | `/v1/health` | `health.controller.ts` |
| POST | `/v1/auth/signup` `/v1/auth/login` | `identity.controller.ts` |
| POST/GET | `/v1/public/access-requests` | `access.controller.ts` |
| POST | `/v1/public/chat/sessions` | website adapter |
| * | `/v1/storefront/:slug/...` | `storefront.controller.ts` |
| GET | `/v1/checkout/sessions` | `checkout.controller.ts` |
| * | `/v1/payments/...` | `payments.controller.ts` |
| * | `/v1/webhooks/...` | telegram/bale/instagram/store-webhook |
| * | `/v1/billing/payments/...` | billing payments callback |

### Merchant (SessionAuthGuard)

| Group | Typical paths | Controller |
|-------|---------------|------------|
| Workspace | `/v1/workspace/me` | `workspace.controller.ts` |
| Employee | `/v1/employee`, `/v1/employee/guardrails` | `employee.controller.ts` |
| Store/sync | `/v1/store`, `/v1/store/sync`, Shopify/Woo connect | `commerce.controller.ts` + shopify/woo controllers |
| Catalog (sync projection) | `/v1/catalog/products`, `/v1/orders` | commerce |
| Channels | `/v1/channels/website`, telegram, bale, instagram | adapter controllers |
| Inbox | `/v1/inbox/conversations` | `inbox.controller.ts` |
| Knowledge | `/v1/knowledge/docs` | `knowledge.controller.ts` |
| Analytics | `/v1/analytics/summary`, `revenue`, `channels`, `knowledge-gaps` | `analytics.controller.ts` |
| Audit | `/v1/audit/turns`, `/v1/audit/admin` | `audit.controller.ts` |
| Shop CMS | `/v1/shop/*` | shop-cms + attributes/variants/inventory/discounts/articles |
| Orders workflow | `POST /v1/shop/orders/:id/approve`, `/reject` | `shop-cms.controller.ts` |
| Uploads | `POST /v1/uploads` | `uploads.controller.ts` |
| Billing | `/v1/billing/*` | `billing.controller.ts` |
| Admin billing | `/v1/admin/billing/*` | `admin-billing.controller.ts` (platform admin emails) |
| AI Gateway ops | `/v1/ai-gateway/*` | `ai-gateway.controller.ts` |

## Frontend ↔ backend mapping

```
UI (workspace page / storefront page / widget)
  → createApiClient method
  → fetch(`${baseUrl}/v1${path}`)
  → Nest controller
  → Service
  → Prisma / DataStore
```

This **is** how Seloma works for Workspace, Storefront, and Widget.

Exception: `apps/web` uses raw `fetch` to access-request endpoints only.

## Native shop order APIs (high-traffic)

From api-client + `shop-cms.controller.ts`:

- `GET /v1/shop/orders` — list
- `GET /v1/shop/orders/:id` — detail + history
- `PATCH /v1/shop/orders/:id` — status (legacy/general)
- `POST /v1/shop/orders/:id/approve`
- `POST /v1/shop/orders/:id/reject` body `{ reason }`

Prefer approve/reject endpoints over inventing new status verbs.

## Customers

- `GET /v1/shop/customers`
- `GET /v1/shop/customers/:id`

Prisma has `Customer`, `CustomerIdentity`, `CustomerAddress`. Tag tables from ARCHITECTURE.md (`tags`, `customer_tags`) are **not** in `schema.prisma`. Do not invent tagging APIs.

## Invented prices / SKUs

Root README ship gate: **invented prices/SKUs = not done**. Storefront and Runtime must read catalog via shop/commerce services.
