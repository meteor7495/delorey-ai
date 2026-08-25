# Repository Map

Discovered from the working tree. Not assumed.

## Identity

| Fact | Evidence |
|------|----------|
| Product name | Seloma AI (`سِلوما`) |
| npm name | `seloma-ai` in root `package.json` |
| Workspace packages | `@seloma/api`, `@seloma/workspace`, `@seloma/storefront`, `@seloma/web`, `@seloma/widget`, `@seloma/api-client`, `@seloma/ui` |
| Git default branch | `main` |
| Historical rename | DeloRey → Seloma (commit `4af1b5b`). Legacy keys (`delorey_token`, `delorey_cart_*`, type alias `DeloreyApiClient`) still exist for migration |

## Layout

pnpm **monorepo**. Workspaces: `apps/*` and `packages/*` (`pnpm-workspace.yaml`).

```
seloma-ai/
├── apps/
│   ├── api/            NestJS API — port 3001, global prefix /v1
│   ├── web/            Next.js marketing landing — port 3000
│   ├── workspace/      Next.js merchant Workspace + CMS — port 3010
│   ├── storefront/     Next.js public shop — port 3020
│   └── widget/         Vite React chat embed — port 5173
├── packages/
│   ├── api-client/     Typed fetch client consumed as TypeScript source
│   └── ui/             Tokens, Persian labels, AiStateChip
├── brand/seloma/       SVG lockups and brand exploration
├── docs/               Product, architecture, PRDs, UI, build slices
├── docker-compose.yml  Postgres 16 + Redis 7
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

There is **no** top-level `frontend/` or `backend/` directory.

There is **no** `packages/config` (mentioned in `docs/03-architecture/frontend-architecture.md` but not in the tree).

## Package manager

| Item | Value | Evidence |
|------|-------|----------|
| Manager | pnpm `10.6.5` | `package.json` `packageManager` |
| Lockfile | `pnpm-lock.yaml` | repository root |
| Node | `>=20` | `package.json` `engines` |

Root scripts: `dev`, `dev:api`, `dev:workspace`, `dev:widget`, `dev:storefront`, `dev:web`, `build`, `lint`, `typecheck`, `test`, `db:up`, `db:down`, `db:migrate`.

`pnpm dev` runs api + workspace + widget + storefront + web in parallel.

## What is not present

| Expected in many repos | Seloma today |
|------------------------|--------------|
| `turbo.json` / `nx.json` | Absent — pnpm filters only |
| `.github/` CI workflows | Absent |
| ESLint / Prettier / Biome config | Absent |
| Dockerfile / k8s manifests | Absent (Compose only) |
| OpenAPI / Swagger | Absent |
| `.cursor/` (before this framework) | Absent |
| `AGENTS.md` / `CLAUDE.md` (before this framework) | Absent |
| Storybook | Absent |
| Zustand / TanStack Query / RHF / Zod | Not in any `package.json` |

## Applications

| Package | Path | Runtime | Port |
|---------|------|---------|------|
| `@seloma/api` | `apps/api` | NestJS 11, Node | 3001 |
| `@seloma/web` | `apps/web` | Next.js 15 App Router | 3000 |
| `@seloma/workspace` | `apps/workspace` | Next.js 15 App Router | 3010 |
| `@seloma/storefront` | `apps/storefront` | Next.js 15 App Router | 3020 |
| `@seloma/widget` | `apps/widget` | Vite 6 + React 19 | 5173 |

## Shared packages

| Package | Path | How consumed |
|---------|------|----------------|
| `@seloma/api-client` | `packages/api-client` | TS source (`main`: `./src/index.ts`). Used by workspace, storefront, widget |
| `@seloma/ui` | `packages/ui` | TS source + `./tokens`, `./colors`, `./colors.css`. Used by workspace, widget, web |

`apps/web` does **not** use `@seloma/api-client`. It calls `/v1/public/access-requests` via `apps/web/src/lib/api.ts`.

## Documentation tree

Authoritative product/engineering docs live under `docs/`:

| Area | Path |
|------|------|
| Overview | `docs/00-overview/` |
| Business | `docs/01-business/` |
| Product | `docs/02-product/` |
| Architecture | `docs/03-architecture/` |
| PRDs | `docs/04-prd/` |
| UI/UX | `docs/05-ui/` |
| Build slices 01–26+ | `docs/06-build/` |
| BoxAPI Instagram eval | `docs/07-evaluations/boxapi-instagram-official-api/` |

Build status (from `docs/06-build/README.md` and root README): vertical slices **01–26** plus billing and omnichannel native shop work.

## Existing AI / agent infrastructure in product code

This is **product** AI, not this development framework:

- `apps/api/src/modules/runtime/` — `RuntimeService.executeTurn`
- `apps/api/src/modules/ai-gateway/` — provider plugins, router, circuit breaker, usage ledger
- `apps/api/src/modules/employee/` — Sales Employee config + guardrails
- `apps/api/src/modules/knowledge/` — FAQ / policy docs
- Env: `AI_GATEWAY_MODE=mock|live`, providers `gapgpt | liara | boxapi | openai | ninerouter | custom`

Do not confuse product Runtime/Gateway with this `.ai/` development framework.
