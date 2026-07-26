# DeloRey AI

AI Commerce Platform — primary product: **AI Sales Employee** (Website, Telegram, Bale).

This repo is past docs-only: **Vertical Slice 01** scaffolds a runnable path from signup → mock catalog → website chat with grounded answers.

## Docs map

| Area | Path |
|------|------|
| Product | `docs/02-product/` |
| Architecture | `docs/03-architecture/` |
| PRDs | `docs/04-prd/` |
| UI/UX | `docs/05-ui/` |
| Build epics | [`docs/06-build/vertical-slice-01.md`](docs/06-build/vertical-slice-01.md) |

## Monorepo

```
apps/api          NestJS — /v1 API (Postgres SoR via Prisma)
apps/workspace    Next.js — merchant Workspace
apps/widget       Vite — Website chat test harness
packages/api-client
packages/ui
```

## Prerequisites

- Node 20+
- pnpm 10+
- Docker (Postgres for SoR — required from Slice 01 persistence)

## Quick start (Slice 01)

```bash
pnpm install
cp .env.example .env

# Postgres on host port 55432 (avoids local Postgres on 5432)
pnpm db:up
pnpm --filter @delorey/api prisma:migrate

# terminal 1
pnpm dev:api

# terminal 2
pnpm dev:workspace

# terminal 3
pnpm dev:widget
```

1. Open http://localhost:3000/login  
2. Demo account: `demo@delorey.local` / `demo1234` (or sign up)  
3. Workspace → **کانال‌ها** → copy `publicKey`  
4. Open http://localhost:5173 → paste key → **شروع نشست**  
5. Ask: `پیراهن لینن موجوده؟ قیمتش چنده؟`  
6. Expect a reply citing catalog SKU/price/stock — not an invented product  

## Ship gate

See [vertical-slice-01.md](docs/06-build/vertical-slice-01.md). Invented prices = not done.

## Next slices

03 Telegram — done ([vertical-slice-03.md](docs/06-build/vertical-slice-03.md)) · **Next:** Bale adapter or Knowledge/RAG
