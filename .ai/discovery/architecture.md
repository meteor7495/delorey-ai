# Architecture Map

Discovered from running module layout and current architecture docs. Prefer **code** when a doc is older or marked proposal.

## Product identity (current)

From `docs/02-product/product-principles.md` (2026-08-10) and root README:

- Primary product: **native storefront + unified merchant ops**
- **AI Sales Employee** is an optional add-on (Website, Telegram, Bale; Instagram adapter exists)
- Entitlement gate: `hasAiEmployeeEntitlement(tenant.plan)` — unlocks for `ai-sales` / `ai-business` (+ `trial` / legacy). Site-builder plans do not unlock AI APIs, Runtime turns, or Workspace AI surfaces.
- Not a chatbot builder, CRM, helpdesk, or drag-drop page IDE

Older `docs/03-architecture/system-architecture.md` (2026-07-25) still says the Runtime is the center of gravity. Treat that as historical for conversation paths. Commerce truth lives in native shop tables.

`docs/03-architecture/ARCHITECTURE.md` v0.2 (2026-08-17) is labeled **proposal** but large parts are already in code (order workflow, `CartService`, `IChannelAdapter`, checkout sessions, payment provider port, webhook events). Use it as the commerce evolution contract; do not treat unimplemented target tables as if they exist.

## Style

**Modular NestJS monolith** + multiple Next.js/Vite clients in one pnpm monorepo.

```
CHANNELS (Website widget, Telegram, Bale, Instagram, Storefront)
    ↓
ADAPTERS / STOREFRONT HTTP
    ↓
CONVERSATION / CHANNEL CHECKOUT / COMMANDS
    ↓
APPLICATION SERVICES (shop, runtime, inbox, …)
    ↓
COMMERCE CORE (Prisma: Product, Cart, StorefrontOrder, Customer, Payment, …)
    ↓
PostgreSQL
```

AI path:

```
Inbound → RuntimeService.executeTurn
    → human ownership skip | ChannelCheckout | rule/regex intents | skills
    → AI Gateway (never call provider SDKs from Runtime/Skills)
    → Commerce reads via shop/commerce services
```

Never: `AI → Prisma` as a new pattern. Never: channel-specific Order/Cart engines.

## Logical topology (as implemented)

```
Prospects     → apps/web          → /v1/public/access-requests
Merchants     → apps/workspace    → /v1/* (Bearer session)
Shoppers web  → apps/storefront   → /v1/storefront/:slug/*
Shoppers chat → apps/widget       → /v1/public/chat/*  and channel webhooks
Bots          → Telegram/Bale/IG  → /v1/webhooks/* + connect APIs
```

## Layering that the code actually uses

| Layer | Location | Owns |
|-------|----------|------|
| Experience | `apps/workspace`, `apps/storefront`, `apps/widget`, `apps/web` | Screens, embed, marketing |
| HTTP API | `apps/api/src/**/*.controller.ts` | Routes, DTO validation, guards |
| Application | Nest services in the same module | Use cases |
| Domain (partial) | `apps/api/src/modules/shop/domain/` | Order workflow, pricing, inventory, discounts, cart, rule engine |
| Persistence | `PrismaService` + `DataStore` (`apps/api/src/modules/platform/`) | PostgreSQL |
| Jobs | `apps/api/src/modules/jobs/` | BullMQ `batch.sync` only |
| AI access | `apps/api/src/modules/ai-gateway/` | Provider plugins |

There is **no** separate repository layer folder. Many services call Prisma/`DataStore` directly. Do not introduce a generic repository framework unless a slice explicitly extracts one.

## Backend module map (imported in `app.module.ts`)

| Module | Path | Role |
|--------|------|------|
| platform | `modules/platform/` | Prisma, DataStore, Redis lock, auth guard, webhook events |
| jobs | `modules/jobs/` | BullMQ `batch.sync` + `ai.ops` |
| identity | `modules/identity/` | Signup/login, sessions |
| access | `modules/access/` | Public access requests (landing) |
| billing | `modules/billing/` | Wallet, PAYG, auto-recharge, admin billing |
| workspace | `modules/workspace/` | `GET /v1/workspace/me` |
| employee | `modules/employee/` | Multi-role AI Employees (`/employee` = sales alias) |
| ai-ops | `modules/ai-ops/` | Decision engine, Command Center, opportunities, memory, cart recovery |
| commerce | `modules/commerce/` | External store connect/sync (Shopify/Woo path) |
| shop | `modules/shop/` | Native catalog, CMS, cart, orders, payments, storefront, channel checkout |
| knowledge | `modules/knowledge/` | FAQ / policy docs |
| analytics | `modules/analytics/` | Summary, revenue, channels |
| audit | `modules/audit/` | Turn + admin audit |
| conversation | `modules/conversation/` | Threads / messages |
| website adapter | `modules/adapters/website/` | Widget sessions |
| telegram | `modules/adapters/telegram/` | Bot webhook + simulate |
| bale | `modules/adapters/bale/` | Bot webhook + simulate |
| instagram | `modules/adapters/instagram/` | Production-shaped adapter + BoxAPI spike |
| runtime | `modules/runtime/` | `executeTurn` + permission-filtered MCP tools |
| ai-gateway | `modules/ai-gateway/` | Complete/embed, routing, circuits |
| inbox | `modules/inbox/` | Takeover / release / operator reply + customer memory panel data |
| mcp | `modules/mcp/` | Tool registry, Streamable HTTP, admin |

Shopify and WooCommerce **adapter modules exist** (`adapters/shopify`, `adapters/woocommerce`) and are wired through `commerce`. `.env.example` states they are **disabled for Iran native shop**; do not revive them as the primary catalog.

## Dual order models

| Prisma model | Meaning |
|--------------|---------|
| `StorefrontOrder` | Native Order Engine for all sales channels |
| `Order` | External storefront **sync projection** (order lookup skill) |

Merchant «سفارش‌ها» UI is native `StorefrontOrder`. Do not merge these tables in a drive-by change.

## Frontend surfaces

| App | Job | Must not |
|-----|-----|----------|
| Workspace | Merchant control plane + shop CMS | Own prices/stock |
| Storefront | Public Digikala-like shop | Call merchant admin APIs |
| Widget | Shopper chat only | Checkout / Skill logic |
| Web | Marketing, pricing, access request | Become Workspace |

## Shared code rules

- Frontend HTTP for Workspace/Storefront/Widget: `@seloma/api-client` (`createApiClient`).
- Design tokens and FA enum labels: `@seloma/ui`.
- Workspace local UI kit: `apps/workspace/src/components/ui/` (Radix + CVA + Tailwind).
- Apps must not import each other. Shared logic goes to `packages/*` or stays in `apps/api`.

## Dependency direction

```
apps/web, apps/workspace, apps/storefront, apps/widget
    ↓  (HTTP)
apps/api
    ↓
PostgreSQL / Redis

apps/*  →  packages/api-client, packages/ui
packages/*  must not import apps/*
```

Forbidden: a new HTTP client beside `createApiClient` for the same `/v1` surface; provider SDKs outside `ai-gateway`; business rules inside adapters.
