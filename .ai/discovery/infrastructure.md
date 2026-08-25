# Infrastructure Map (as implemented)

## Local runtime

| Service | How | Ports |
|---------|-----|-------|
| API | `pnpm dev:api` / Nest watch | 3001 |
| Workspace | Next `dev --port 3010` | 3010 |
| Storefront | Next `dev --port 3020` | 3020 |
| Marketing web | Next `dev --port 3000` | 3000 |
| Widget | Vite `--port 5173` | 5173 |
| Postgres | Docker Compose `postgres:16-alpine` | host **15432** → 5432 |
| Redis | Docker Compose `redis:7-alpine` | 6379 |

Compose file: `docker-compose.yml` (project name `seloma`).

```bash
pnpm db:up
pnpm --filter @seloma/api exec prisma migrate deploy
pnpm dev
```

Demo login (root README): `demo@seloma.local` / `demo1234`.

## Environment

- Template: `.env.example` (root)
- API also reads `apps/api/.env` then `../../.env` (`ConfigModule` in `app.module.ts`)
- `.gitignore` ignores `.env` and `.env.local`; keeps `.env.example`

Important variables (see `.env.example` for the full list):

| Variable | Role |
|----------|------|
| `DATABASE_URL` | Prisma Postgres |
| `REDIS_URL` | BullMQ + circuits + locks |
| `API_PORT` | default 3001 |
| `CORS_ORIGINS` | Workspace/widget/storefront/web |
| `JWT_SECRET` | Dev secret; also default for bot-token encryption |
| `AI_GATEWAY_MODE` | `mock` \| `live` |
| `AI_GATEWAY_PROVIDER` | gapgpt / liara / boxapi / openai / ninerouter / custom |
| `ZARINPAL_MERCHANT_ID` | empty → mock pay |
| `TELEGRAM_LIVE` / `BALE_LIVE` / `BOXAPI_LIVE` | live channel flags |
| `PLATFORM_ADMIN_EMAILS` | `/v1/admin/billing/*` |
| `STOREFRONT_BASE_URL` / `PUBLIC_API_BASE_URL` / `WIDGET_EMBED_BASE_URL` / `WORKSPACE_BASE_URL` | public URLs |

Never commit real secrets. Never log tokens or provider keys.

## Docker / deploy

- **No application Dockerfile** in the tree
- **No Kubernetes / Terraform / GitHub Actions**
- DevOps design doc exists: `docs/03-architecture/devops-infrastructure.md` (target, not implemented CI)

Do not add a deployment stack as part of an unrelated feature.

## Jobs / Redis usage today

- BullMQ queue `batch.sync` (`apps/api/src/modules/jobs/`)
- Redis circuit breaker for AI Gateway
- Redis payment lock (`payment-lock.service.ts`)
- Postgres remains SoR (sessions, checkout state, webhook events)

## Object storage

Merchant uploads go to `apps/api/static/uploads/` (gitignored except `.gitkeep`). Served as `/static/`. Sample images are committed under `apps/api/static/samples/`.

## CI/CD

Not present. Quality gates for agents are local: Vitest + `tsc`.
