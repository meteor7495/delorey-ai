# Schemas

## Prisma

Source: `apps/api/prisma/schema.prisma`.

Isolation root: `Tenant`. Nearly all business tables include `tenantId`.

High-traffic native commerce models:

`Product`, `ProductVariant`, `InventoryLevel`, `Cart`, `CartItem`, `StorefrontOrder`, `StorefrontOrderItem`, `OrderStatusHistory`, `Customer`, `CustomerIdentity`, `CustomerAddress`, `Payment`, `PaymentTransaction`, `HostedCheckoutSession`, `ChannelCheckoutSession`, `WebhookEvent`, `Discount`, `Article`, …

Sync projection: `Order` (external).

AI: `Employee`, `KnowledgeDoc`, `KnowledgeChunk`, `AuditTurn`, `AiCallEvent`, `TenantAiPolicy`, `AiModelBinding`.

Billing: `Wallet`, `WalletTransaction`, `UsageRecord`, `PricingRule`, `CreditPack`, `BillingPayment`, …

## DTOs

Usually co-located in `*.controller.ts` as classes with `class-validator` decorators. Treat them as the request schema.

## Shared TS types

Commerce CMS types live in `packages/api-client/src/index.ts` (`ShopProduct`, `Discount`, `Paginated`, …). Prefer extending these over re-declaring in a page.

## Not in schema (do not invent)

From ARCHITECTURE.md wishlist not present as models: `tags` / `customer_tags` / `campaigns` as first-class tables, full domain outbox table, etc. Confirm with `schema.prisma` before coding.
