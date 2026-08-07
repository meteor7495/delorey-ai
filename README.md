# DeloRey AI

AI Commerce Platform — primary product: **AI Sales Employee** (Website, Telegram, Bale).

Build status: vertical slices **01–26** (see [`docs/06-build/README.md`](docs/06-build/README.md)).

## Docs map

| Area | Path |
|------|------|
| Product | `docs/02-product/` |
| Architecture | `docs/03-architecture/` |
| PRDs | `docs/04-prd/` |
| UI/UX | `docs/05-ui/` |
| Build epics | [`docs/06-build/`](docs/06-build/) |
| Partner E2E | [`docs/06-build/vertical-slice-19.md`](docs/06-build/vertical-slice-19.md) |
| Native shop | [`docs/06-build/vertical-slice-21-26-native-storefront.md`](docs/06-build/vertical-slice-21-26-native-storefront.md) |

## Monorepo

```
apps/api          NestJS — /v1 API (Postgres SoR via Prisma)
apps/workspace    Next.js — merchant Workspace + CMS
apps/storefront   Next.js — public Digikala-like shop
apps/widget       Vite — Website chat harness + embed.js
packages/api-client
packages/ui
```

## Prerequisites

- Node 20+
- pnpm 10+
- Docker (Postgres on **55432**; Redis for `batch.sync`)

## Quick start

```bash
pnpm install
cp .env.example .env

pnpm db:up
pnpm --filter @delorey/api exec prisma migrate deploy

pnpm dev
```

| App | URL |
|-----|-----|
| Workspace | http://localhost:3010 |
| Storefront | http://localhost:3020 |
| Widget | http://localhost:5173 |
| API | http://localhost:3001/v1 |

1. Login: `demo@delorey.local` / `demo1234` (or signup)  
2. Workspace → **فروشگاه** — products / categories / appearance  
3. **تنظیمات فروشگاه** → copy storefront URL (`/s/{slug}`)  
4. Optional: **Shopify / Woo** under اتصالات خارجی (unchanged)  
5. Optional: Widget embed on storefront via website channel origins including `:3020`  

Full partner smoke still: [vertical-slice-19.md](docs/06-build/vertical-slice-19.md).

## AI Gateway

Default `AI_GATEWAY_MODE=mock`. For live NLG set `live` + `AI_GATEWAY_PROVIDER` (`gapgpt` | `liara` | `boxapi` | `openai` | `ninerouter` | `custom`) and the matching API key — see `.env.example`. Optional `AI_GATEWAY_FALLBACK_PROVIDERS` is a comma-separated failover chain (Gateway-owned; 9Router is one upstream only).

## Ship gate

Invented prices/SKUs = not done. Partner path `partnerReady` on `/v1/workspace/me` when store, sync, employee, channel, first chat, and audit are green.
