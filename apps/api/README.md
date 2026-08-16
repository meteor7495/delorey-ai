# Seloma API

NestJS modular monolith — process role `api` for Slice 01.

## Persistence

- **PostgreSQL** is the system of record (Prisma) — aligns with [Database Design](../../docs/03-architecture/database-design.md).
- Default local URL: `postgresql://seloma:seloma@127.0.0.1:55432/seloma` (Docker Compose maps `55432→5432` so it does not collide with a host Postgres on `5432`).
- Demo user is seeded on boot if missing: `demo@seloma.local` / `demo1234`.

```bash
# from repo root
pnpm db:up
pnpm --filter @seloma/api prisma:migrate
pnpm dev:api
```
