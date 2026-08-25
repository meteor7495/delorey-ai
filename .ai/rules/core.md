# Core Rules

These rules apply to every Seloma agent task.

## 1. Seloma is the source of truth

Adapt to the repository. Do not force a generic stack onto Seloma.

```
SEARCH → UNDERSTAND → REUSE → EXTEND → CREATE ONLY WHEN NECESSARY
```

## 2. Canonical AI knowledge

`.ai/` is the canonical AI development layer. Cursor and Claude are adapters. Do not duplicate this rulebook into adapters.

## 3. Progressive context loading

Load only:

1. This file + `dont-do.md`
2. Task classification
3. Relevant area rules
4. Relevant discovery docs
5. Relevant modules/files

Do not dump the whole monorepo into context.

## 4. Task classification

Classify every task as one or more of:

`FRONTEND` | `BACKEND` | `FULL_STACK` | `BUG` | `REFACTOR` | `INFRASTRUCTURE` | `TEST` | `DOCUMENTATION` | `ARCHITECTURE`

Then load matching rules and agents.

## 5. Change boundary

Before significant edits, define:

- Allowed files
- Potentially affected files
- Unrelated / protected areas

Keep the diff as small as reasonably possible.

## 6. Plan before large changes

For non-trivial work, write a short plan and confirm the boundary. Trivial one-liners may skip an elaborate plan but still require search-first behavior.

## 7. Prefer existing abstractions

| Need | Reuse |
|------|-------|
| HTTP to `/v1` | `packages/api-client` `createApiClient` |
| Session token (Workspace) | `apps/workspace/src/shared/api.ts` |
| FA labels / AI chips | `packages/ui` |
| Workspace UI kit | `apps/workspace/src/components/ui/*` |
| Toasts | `apps/workspace/src/lib/notify.ts` |
| Auth | `SessionAuthGuard` + `CurrentAuth` |
| Validation (API) | `class-validator` DTOs + global ValidationPipe |
| DB | Prisma + `DataStore` / existing services |
| Order transitions | `OrderWorkflowService` + `shop/domain/order-workflow` |
| Cart | `CartService` |
| Payments | `PaymentsService` + payment providers |
| Channel send | `IChannelAdapter` |
| LLM I/O | `AiGatewayService` only |
| Tests | Vitest patterns under `apps/api/src/**/*.spec.ts` |

## 8. Product identity

- Native storefront + ops is primary; AI Sales Employee is optional.
- Conversations are commerce events, not tickets.
- Do not build chatbot-builder, CRM, or helpdesk SoR.
- Invented prices/SKUs = not done.

## 9. Tenant fail-closed

Every merchant query and job must be scoped by `tenantId` from auth/binding. Never trust a client-supplied tenant id alone.

## 10. Honest completion

Never claim tests/lint/build passed if not run. Use `NOT RUN` + reason.

## 11. Docs vs code

When product docs conflict with code, **code wins for implementation**, then update `.ai/discovery` if the insight is stable. Do not rewrite product docs unless the task is documentation.
