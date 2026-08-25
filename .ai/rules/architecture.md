# Architecture Rules

## Style

- Keep the **modular NestJS monolith** and existing Next/Vite apps.
- Do not split into microservices, new repos, or Kafka for convenience.
- Do not rebuild Workspace or Storefront from scratch.

## Boundaries

| Layer | May call | Must not |
|-------|----------|----------|
| Experience apps | `@seloma/api-client`, `@seloma/ui`, own components | Prisma, provider SDKs, other apps' internals |
| Controllers | Services, DTOs, guards | Business rules that belong in domain/services |
| Adapters | Conversation/Runtime/checkout use cases, channel APIs | Price/stock/order status computation |
| Runtime / Skills | Shop/commerce **services**, Gateway | Provider SDKs, bypassing guardrails |
| AI Gateway | Provider plugins | Product policy / Skills |
| packages/* | Nothing under apps/* | — |

## Commerce

- Native SoR: `Product`, `Cart`, `StorefrontOrder`, `Customer*`, `Payment*`, inventory, discounts.
- `Order` (sync projection) is not a second checkout path.
- One place-order path for channels (`ShopService.placeOrder` / extracted use cases) — do not fork per channel.
- Order status changes go through `OrderWorkflowService` / approve-reject APIs.

## AI

```
AI → tools/use cases → Commerce Core
```

Never `AI → Database` as a new pattern. Deterministic paths (ChannelCheckout, rule engine, templates) before LLM.

## Shared packages

- Extend `api-client` when adding Workspace/Storefront/Widget endpoints.
- Extend `ui` tokens for shared FA labels.
- Do not create parallel packages for the same job.

## Forbidden dependency directions

- `packages/*` → `apps/*`
- `apps/workspace` → `apps/api` TypeScript imports (HTTP only)
- Skills/Runtime → OpenAI SDK (or any provider SDK)
- Adapters → Prisma order mutations (call services)

## Evolution

Incremental slices. Prefer additive Prisma migrations. No big-bang rewrites. `ARCHITECTURE.md` v0.2 lists target work — implement only the slice being asked.
