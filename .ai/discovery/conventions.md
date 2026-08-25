# Conventions and existing rules

## Existing instruction files (before this framework)

| File | Status |
|------|--------|
| Root `README.md` | Present — product + quick start |
| `apps/api/README.md` | Present |
| `docs/**` | Extensive product/architecture/PRD/UI/build docs |
| `AGENTS.md` | Created as a **thin adapter** by this framework |
| `CLAUDE.md` | Created as a **thin adapter** by this framework |
| `.cursor/` | Created as a **thin adapter** by this framework |
| `CONTRIBUTING.md` | Absent |
| ESLint / Prettier | Absent |
| `tsconfig.base.json` | Present — `strict`, `noUncheckedIndexedAccess` |

Do not overwrite product docs. This `.ai/` layer **indexes** them.

## Authority chain (product)

From architecture docs:

```
Product Vision → Product Principles → Product Scope → User Journey → Roadmap
    → System / DDD / Database / Backend / Frontend / API spec
```

From `docs/03-architecture/ARCHITECTURE.md` for **commerce evolution**:

```
Product Scope / Principles → ARCHITECTURE.md v0.2 → older component docs
```

From this framework for **implementation**:

```
Running code + Prisma + controllers + api-client
    → Product Principles / Positioning
    → ARCHITECTURE.md (when describing target commerce)
    → older docs
    → .ai/rules
```

## Conflicts (docs vs code) — code wins for agents

| Topic | Docs say | Code does |
|-------|----------|-----------|
| Frontend structure | Feature-Sliced Design (`features/`, `entities/`) | App Router pages + `components/` + `shared/api.ts` |
| Server state | TanStack Query | `useState` + `useEffect` + api-client |
| Auth transport | HTTP-only cookies | Bearer token in `localStorage` (`seloma_token`) |
| Workspace API | `/v1/workspaces/{id}` | `GET /v1/workspace/me` |
| Center of gravity | Runtime-first (system-architecture.md) | Native shop SoR + optional Runtime |
| Error envelope | `{ error: { code, message } }` | Nest exceptions + client `Error(status + body)` |
| Lint | implied | stub echo scripts |
| OpenAPI | “YAML may be generated later” | not generated |
| `packages/config` | listed in frontend-architecture.md | does not exist |
| Health `/ready` | API spec / devops | only `GET /v1/health` found |
| Shopify/Woo | connectors in architecture | code present, env-disabled for Iran native shop |

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| npm packages | `@seloma/<app>` | `@seloma/workspace` |
| Nest modules | kebab folder, `*.module.ts` | `shop.module.ts` |
| Controllers | `*.controller.ts`, `@Controller('path')` without `/v1` | `@Controller('shop')` |
| DTOs | class in the same controller file (common) | `SignupDto` in identity.controller.ts |
| Prisma models | PascalCase; columns `snake_case` via `@map` | `StorefrontOrder`, `tenant_id` |
| Frontend routes | App Router folders | `app/shop/orders/page.tsx` |
| Client methods | camelCase on `createApiClient` | `listShopOrders`, `approveShopOrder` |
| Ubiquitous language | Employee, Conversation, Handoff — not Bot, Ticket | product principles |
| Env / storage keys | `seloma_*`; keep `delorey_*` legacy reads | `seloma_token` |

## Folder conventions

- New Nest feature: add to the **existing module** if the bounded context already exists (`shop`, `inbox`, `billing`, …). New top-level modules only for a new bounded context.
- New Workspace screen: `apps/workspace/src/app/<route>/page.tsx` + reuse `AppShell`, `PageHeader`, `EmptyState`, `FormDialog`, `components/ui/*`.
- New shared type used by UI + API client: add to `packages/api-client` first, then consume.
- New FA label for a known enum: `packages/ui/src/tokens.ts`.

## Component conventions (Workspace)

- `'use client'` for interactive pages
- Wrap in `AppShell`
- Toasts via `lib/notify.ts`, not ad-hoc `alert`
- Buttons/inputs from `components/ui/*`
- `cn()` from `lib/utils.ts` for class merging

## Service conventions (API)

- Tenant from `@CurrentAuth()` — never from client-supplied tenant id
- Adapters stay thin
- Gateway is the only provider I/O
- Domain invariants in `shop/domain` get tests

## Persian / copy

- Merchant UI: Persian-first (`docs/05-ui/copy-tone.md`)
- Do not render raw enum codes in Inbox/Orders
- Hire-Employee framing, not “bot settings”

## Git

Recent commits are long, imperative/descriptive summaries (see `git log`). Prefer **why** in one or two sentences when the user asks for a commit. Do not commit unless asked.

Do not commit `.env`, secrets, or `apps/api/static/uploads/*`.
