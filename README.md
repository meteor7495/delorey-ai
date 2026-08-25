# Seloma AI

**سِلوما** — AI Commerce Platform. Primary product: **native storefront + unified ops**; **AI Sales Employee** is an optional add-on (Website, Telegram, Bale).

Build status: vertical slices **01–26** (see [`docs/06-build/README.md`](docs/06-build/README.md)).

## Seloma AI Development Framework

This repository includes a shared AI engineering layer for Cursor / Claude agents.

| Item | Location |
|------|----------|
| **Canonical source** | [`.ai/`](.ai/README.md) |
| Agents | Frontend, Backend, Review, Refactor/Debug — [`.ai/agents/`](.ai/agents/) |
| Commands | `/agent-task`, `/agent-review`, `/agent-refactor`, `/agent-debug` |
| Cursor adapter | [`.cursor/`](.cursor/rules/seloma-ai.mdc) (points at `.ai/`, does not duplicate rules) |
| Claude adapter | [`CLAUDE.md`](CLAUDE.md), [`AGENTS.md`](AGENTS.md) |

Workflow: **Task → Discovery → Plan → Implementation → Test → Review**.

Agents must reuse existing Nest modules, `packages/api-client`, and Workspace components. They must not invent APIs or rebuild the monorepo. Sample prompts: [`.ai/examples/sample-tasks.md`](.ai/examples/sample-tasks.md).

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
apps/web          Next.js — marketing landing + pricing + access request
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
pnpm --filter @seloma/api exec prisma migrate deploy

pnpm dev
```

| App | URL |
|-----|-----|
| Landing | http://localhost:3000 |
| Workspace | http://localhost:3010 |
| Storefront | http://localhost:3020 |
| Widget | http://localhost:5173 |
| API | http://localhost:3001/v1 |

1. Landing → **تعرفه‌ها** → ثبت درخواست  
2. فعال‌سازی آزمایشی پرداخت → ورود Workspace  
3. یا Login مستقیم: `demo@seloma.local` / `demo1234`

## AI Gateway

Default `AI_GATEWAY_MODE=mock`. For live NLG set `live` + `AI_GATEWAY_PROVIDER` (`gapgpt` | `liara` | `boxapi` | `openai` | `ninerouter` | `custom`) and the matching API key — see `.env.example`. Optional `AI_GATEWAY_FALLBACK_PROVIDERS` is a comma-separated failover chain (Gateway-owned; 9Router is one upstream only).

## Ship gate

Invented prices/SKUs = not done. Partner path `partnerReady` on `/v1/workspace/me` when store, sync, employee, channel, first chat, and audit are green.
