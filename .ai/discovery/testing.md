# Testing Map (as implemented)

## Tools

| Layer | Tool | Config |
|-------|------|--------|
| Backend unit | Vitest 4 | `apps/api/vitest.config.ts` — `src/**/*.spec.ts`, env `node` |
| Typecheck | `tsc --noEmit` per package | root `pnpm typecheck` |
| Lint | **stub** (`echo "lint: … stub"`) | every package.json `lint` script |
| Frontend tests | **none found** | no `*.spec.ts` / Playwright / Jest in UI apps |
| CI | **none** | no `.github/workflows` |

Documented strategy: `docs/03-architecture/testing-strategy.md` (isolation, AI eval, E2E). That is the **quality bar**. The **implemented** suite is backend Vitest, concentrated in shop domain, billing, runtime, adapters, gateway mock.

Do not introduce Jest, Mocha, Cypress, or Playwright unless the task explicitly adds that capability.

## How to run

```bash
pnpm --filter @seloma/api test
pnpm --filter @seloma/api typecheck
pnpm typecheck
pnpm test
```

Root `pnpm test` runs each package's `test` script. Packages without a real test script may no-op.

## Existing backend specs (reuse patterns)

Under `apps/api/src/`:

| Area | Examples |
|------|----------|
| Shop domain | `modules/shop/domain/*.spec.ts` — order-workflow, cart, pricing, inventory, discounts, sku, rule-engine, checkout-token, payment, variant-combinations, commerce-events |
| Shop services | `inventory.service.spec.ts`, `discounts.service.spec.ts`, `variants.service.spec.ts`, `commerce-retrieval.service.spec.ts`, `phone.spec.ts`, `storefront-themes.spec.ts` |
| Payments | `payments/mock.payment-provider.spec.ts`, `zarinpal.payment-provider.spec.ts`, `payment-lock.service.spec.ts` |
| Billing | `wallet.service.spec.ts`, `billing-payment.service.spec.ts`, `billing.isolation.spec.ts`, `domain/pricing.spec.ts` |
| Runtime | `runtime.service.spec.ts` |
| Adapters | `channel-adapter.spec.ts`, `bale/bale.client.spec.ts` |
| Gateway | `ai-gateway/infrastructure/providers/mock.provider.spec.ts` |

Pattern: `import { describe, expect, it } from 'vitest'`. Domain tests are **pure functions** (no DB). Isolation tests exist for billing (`billing.isolation.spec.ts`).

## Before writing tests

1. Find a neighboring `*.spec.ts`.
2. Copy its imports and assertion style.
3. Prefer domain unit tests for invariants (order transitions, money, stock).
4. Do not delete tests to make a task pass.
5. Do not mock away the invariant being tested.

## Quality gates for agent tasks

Run only what the change area needs:

| Change | Run |
|--------|------|
| `apps/api` domain/service | `pnpm --filter @seloma/api test` (or the matching spec file) + typecheck |
| `packages/api-client` | `pnpm --filter @seloma/api-client typecheck` |
| `apps/workspace` | `pnpm --filter @seloma/workspace typecheck` |
| Multiple packages | `pnpm typecheck` |

Lint: scripts are stubs. Report `Lint: NOT RUN (stub scripts; no ESLint config)`.

Build: run only if the change can break Next/Nest compile and typecheck is insufficient.

Never claim a test passed if it was not executed.

## AI eval / E2E / load

Described in testing-strategy.md. **Not automated in this repo today.** Do not claim they ran.
