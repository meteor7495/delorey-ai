# Frontend Rules

## Surfaces

| App | Change when |
|-----|-------------|
| `apps/workspace` | Merchant ops, CMS, inbox, billing, employee, channels |
| `apps/storefront` | Public shop UX |
| `apps/widget` | Embed chat only |
| `apps/web` | Marketing / access request / pricing |

## Patterns to follow

1. App Router `page.tsx` (+ `*Client.tsx` when needed).
2. Workspace: `AppShell` + `PageHeader` + `EmptyState` + `components/ui/*`.
3. Data: `api` from `@/shared/api` (workspace) or `@/lib/api` (storefront).
4. Mutations: call api-client methods; toast via `toastSuccess` / `toastFromError`.
5. Forms: local state + `FormDialog` unless an existing page shows a better local pattern.
6. RTL + Persian copy for merchant UI.
7. Money: Workspace `formatCurrency` (تومان) vs Storefront `formatIrr` (ریال) — do not mix.

## API consumption

Before changing frontend integration:

1. Find method in `packages/api-client`.
2. Find Nest controller + DTO.
3. Confirm response fields.
4. Only then update UI types/usage.

If the endpoint is missing: implement or request backend first. Do not mock a fake `/v1` path when a real one can be added.

## Do not

- Introduce FSD folders (`features/`, `entities/`) as a mass refactor.
- Introduce TanStack Query / Zustand / Zod / RHF by default.
- Put business rules (pricing, stock, order transitions) in the browser.
- Embed secrets or bot tokens in the client.
- Create a second API client for the same surface.
- Render raw English enums when FA labels exist.

## Figma

- In-repo UI docs: `docs/05-ui/`.
- Static assets may exist under `apps/storefront/public/figma/`.
- Live Figma MCP may be available in the agent environment; if unused, report `Figma source: NOT AVAILABLE`.
- Map designs to existing Workspace/storefront components before inventing new ones.
