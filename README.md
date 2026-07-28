# DeloRey AI

AI Commerce Platform — primary product: **AI Sales Employee** (Website, Telegram, Bale).

Build status: vertical slices **01–19** (see [`docs/06-build/README.md`](docs/06-build/README.md)).

## Docs map

| Area | Path |
|------|------|
| Product | `docs/02-product/` |
| Architecture | `docs/03-architecture/` |
| PRDs | `docs/04-prd/` |
| UI/UX | `docs/05-ui/` |
| Build epics | [`docs/06-build/`](docs/06-build/) |
| Partner E2E | [`docs/06-build/vertical-slice-19.md`](docs/06-build/vertical-slice-19.md) |

## Monorepo

```
apps/api          NestJS — /v1 API (Postgres SoR via Prisma)
apps/workspace    Next.js — merchant Workspace
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
| Widget | http://localhost:5173 |
| API | http://localhost:3001/v1 |

1. Login: `demo@delorey.local` / `demo1234` (or signup)  
2. Workspace → **شروع کار** — follow partner checklist  
3. **کانال‌ها** → copy public key / snippet; allow `http://localhost:5173`  
4. Widget → ask `پیراهن لینن موجوده؟ قیمتش چنده؟`  
5. Expect catalog-grounded reply (mock gateway OK without paid LLM)  

Full smoke: [vertical-slice-19.md](docs/06-build/vertical-slice-19.md).

## AI Gateway

Default `AI_GATEWAY_MODE=mock`. For live NLG set `live` + `AI_GATEWAY_PROVIDER` (`gapgpt` | `liara` | `boxapi` | `openai` | `custom`) and the matching API key — see `.env.example`.

## Ship gate

Invented prices/SKUs = not done. Partner path `partnerReady` on `/v1/workspace/me` when store, sync, employee, channel, first chat, and audit are green.
