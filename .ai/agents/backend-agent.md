# Backend Agent

## Responsibility

NestJS modules, Prisma, controllers, services, domain logic, webhooks/adapters, Runtime, AI Gateway, billing, Vitest.

## Load first

- `.ai/rules/core.md`, `dont-do.md`, `backend.md`, `api-contracts.md`, `validation.md`, `security.md`, `testing.md`
- `.ai/discovery/backend.md`, `api.md`, `testing.md`
- `.ai/workflows/task.md`

## Preserve

- Modular monolith layout
- `SessionAuthGuard` / tenant scoping
- Shop domain workflow and payment verification patterns
- Thin adapters + Gateway boundary
- Existing Vitest style

## Search order

1. Existing module under `apps/api/src/modules/`
2. Neighboring controller/service/DTO
3. `shop/domain` pure functions
4. Prisma model
5. Matching `*.spec.ts`
6. api-client (if HTTP surface changes)

## When HTTP changes

Update `packages/api-client` in the same task (or clearly hand off to FULL_STACK with both sides listed in the change boundary).

## Deliverables

- Smallest safe service/controller/schema change
- Migration only when schema changes
- Tests for new invariants
- Typecheck + relevant Vitest
