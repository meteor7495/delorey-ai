# Backend Architecture (as implemented)

NestJS modular monolith in `apps/api`. Docs in `docs/03-architecture/backend-architecture.md` describe a fuller target (outbox, many queues, RLS, process roles). Implement against **what exists**, not the full target list.

## Stack (actual)

| Concern | Choice | Evidence |
|---------|--------|----------|
| Framework | NestJS `^11.1.3` | `apps/api/package.json` |
| Language | TypeScript `^5.8.3` | same |
| HTTP | `@nestjs/platform-express`, `rawBody: true` | `main.ts` |
| Validation | `class-validator` + `class-transformer` + global `ValidationPipe` | `main.ts` |
| ORM | Prisma `^6.10.1` | `apps/api/prisma/schema.prisma` |
| DB | PostgreSQL 16 | `docker-compose.yml` |
| Cache / queues | Redis 7 + BullMQ `^5.81.2` | compose + `jobs.module.ts` |
| Auth | Opaque session tokens in `sessions` table, Bearer header | `auth.guard.ts` |
| Password hash | `bcryptjs` | identity module |
| Uploads | `multer` | uploads controller |
| Tests | Vitest `^4.1.10`, `src/**/*.spec.ts` | `vitest.config.ts` |
| OpenAPI | **None** | no Swagger imports |

## Bootstrap (`apps/api/src/main.ts`)

- Global prefix: **`v1`** → all HTTP paths are `/v1/...`
- CORS: `CORS_ORIGINS` plus local-dev origins; HTTPS origins allowed for storefront embeds (tenant allowlist still in website adapter)
- Static files: `apps/api/static` at `/static/`
- `ValidationPipe`: `whitelist`, `transform`, `forbidNonWhitelisted`
- Port: `API_PORT` default **3001**

## Auth

Implemented in `apps/api/src/modules/platform/auth.guard.ts`:

- Header `Authorization: Bearer <token>`
- Lookup `DataStore.findSession`; reject missing/expired
- `AuthContext`: `{ userId, tenantId, email }`
- `@CurrentAuth()` param decorator

Login/signup: `apps/api/src/modules/identity/identity.controller.ts` (`POST /v1/auth/signup`, `POST /v1/auth/login`). Returns `{ token, tenant }`.

`.env.example` has `JWT_SECRET` used as a **credentials encryption key** (bot tokens), not as JWT session auth. Do not “upgrade” to JWT in a drive-by.

Workspace membership role in Prisma includes `owner`. Deep RBAC matrix is not fully implemented.

## Persistence

- `PrismaService`: `apps/api/src/modules/platform/prisma.service.ts`
- `DataStore`: `apps/api/src/modules/platform/data.store.ts` — shared queries, session, seed helpers
- Schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/`

There is no separate `repository/` layer. New data access should follow the nearest service (`ShopService`, `CartService`, `CustomersService`, …) and always constrain by `tenantId`.

## Shop module (commerce SoR)

`apps/api/src/modules/shop/` is the largest module. Controllers:

| Controller | Prefix |
|------------|--------|
| `shop-cms.controller.ts` | `shop` (CMS + orders approve/reject) |
| `attributes.controller.ts` | `shop` |
| `variants.controller.ts` | `shop` |
| `inventory.controller.ts` | `shop/inventory` |
| `discounts.controller.ts` | `shop/discounts` |
| `articles.controller.ts` | `shop/articles` |
| `storefront.controller.ts` | `storefront` |
| `payments.controller.ts` | `payments` |
| `uploads.controller.ts` | `uploads` |
| `checkout.controller.ts` | `checkout` |

Important services (reuse these):

| Service | File |
|---------|------|
| ShopService | `shop.service.ts` |
| CartService | `cart.service.ts` |
| OrderWorkflowService | `order-workflow.service.ts` |
| CustomersService | `customers.service.ts` |
| PaymentsService | `payments.service.ts` |
| ChannelCheckoutService | `channel-checkout.service.ts` |
| CheckoutSessionService | `checkout-session.service.ts` |
| CommerceRetrievalService | `commerce-retrieval.service.ts` |
| NotificationService | `notification.service.ts` |
| ChannelMenuService | `channel-menu.service.ts` |

Domain pure functions: `apps/api/src/modules/shop/domain/` (order-workflow, pricing, inventory, discounts, cart, sku, rule-engine, checkout-token, payment, commerce-events). **Prefer extending these with unit tests** over putting invariants only in controllers.

Payments: `IPaymentProvider` (`request` / `verify`) with `MockPaymentProvider`, `ZarinpalPaymentProvider`, `PaymentProviderResolver` (platform vs merchant), and `payment-lock.service.ts`. Store payment config lives on `StorefrontSettings` (`paymentMode`, `paymentProvider`, encrypted `zarinpalMerchantId`). Merchant APIs: `GET|PUT /v1/shop/payment-settings`, `POST /v1/shop/payment-settings/test`.

## Runtime / AI

- `RuntimeService` — `apps/api/src/modules/runtime/runtime.service.ts`
- Channel checkout runs as a **deterministic** path before LLM
- Gateway: `apps/api/src/modules/ai-gateway/` with `infrastructure/providers/` (mock + live plugins)
- Default `AI_GATEWAY_MODE=mock`
- Business modules must not import OpenAI/Anthropic/etc. SDKs

## Channel adapters

Shared contract: `apps/api/src/modules/adapters/channel-adapter.ts` (`IChannelAdapter`, `CHANNEL_CAPABILITIES`).

Adapters normalize/deliver. They must not compute price, stock, or order status.

Webhook idempotency: `WebhookEventsService` in platform.

## Jobs

Only **`batch.sync`** is registered (`apps/api/src/modules/jobs/`). Target queues from architecture docs (`interactive.turns`, `notify`, `webhooks`, `ai`) are **not** implemented as BullMQ queues yet. Do not add them unless the task is that slice.

## Logging / errors

- Nest default logger; `main.ts` uses `console.log` for listen URL
- Domain: `CommerceRuleError` in shop domain
- HTTP: Nest exceptions (`UnauthorizedException`, validation 400)
- API spec error envelope in docs is **logical**; handlers often throw Nest exceptions rather than a uniform `{ error: { code, message } }` wrapper. Do not invent a new global error filter unless asked.

## Health

`GET /v1/health` → `{ ok, service: 'seloma-api', slice }` in `apps/api/src/health.controller.ts`.

`GET /v1/ai-gateway/health` is a **different** authenticated Gateway ops endpoint.
