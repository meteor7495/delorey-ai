# Backend Rules

## Module placement

Put code in the existing Nest module that owns the context. Primary homes:

- Native commerce → `modules/shop`
- Auth → `modules/identity` + `modules/platform`
- Inbox → `modules/inbox` + `modules/conversation`
- Channels → `modules/adapters/*`
- AI turns → `modules/runtime`
- LLM I/O → `modules/ai-gateway`
- Wallet → `modules/billing`
- External sync → `modules/commerce`

## Controller conventions

- `@Controller('segment')` without `/v1`
- Merchant routes: `@UseGuards(SessionAuthGuard)` + `@CurrentAuth()`
- DTOs: `class-validator` decorators; rely on global ValidationPipe
- Keep controllers thin: validate → call service → return

## Services

- Scope every query by `auth.tenantId` or binding-resolved tenant
- Prefer existing services (`CartService`, `OrderWorkflowService`, `PaymentsService`, …)
- Domain invariants: extend `modules/shop/domain/*` + add Vitest
- Fail closed on missing tenant

## Adapters

- Implement/extend `IChannelAdapter`
- Normalize inbound; deliver outbound; capability downgrade
- No pricing, inventory, or order status logic

## AI Gateway

- Only Gateway talks to providers
- Default local mode is `mock`
- Record usage through existing ledger paths; billing reserves/charges through billing module where already wired

## Prisma

- Additive migrations preferred
- `@map` snake_case columns
- Do not invent models that are not in `schema.prisma`
- Do not merge `StorefrontOrder` and sync `Order` casually

## Jobs

- Existing queue: `batch.sync`
- Do not invent new BullMQ queues unless the task is that infrastructure slice

## Security

- Secrets encrypted; never return bot/store tokens to clients
- Webhook authenticity + idempotency via existing helpers
- No unguarded refund/cancel from Skills
