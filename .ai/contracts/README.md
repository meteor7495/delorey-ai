# Contracts

How agents verify frontend ↔ backend agreements in Seloma.

There is **no OpenAPI artifact**. Contract truth is:

1. Nest controllers + DTOs
2. Service/Prisma fields
3. `packages/api-client/src/index.ts`
4. Call sites in apps

See:

- `api.md` — discovery workflow
- `schemas.md` — Prisma / DTO
- `frontend-backend.md` — wiring map
