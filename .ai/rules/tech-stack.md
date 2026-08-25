# Technology Stack Rules

Use **actual** versions and libraries from package manifests. Do not upgrade major versions unless asked.

## Monorepo

- pnpm `10.6.5`, Node `>=20`
- Workspaces: `apps/*`, `packages/*`
- Filter scripts: `pnpm --filter @seloma/<name> <script>`

## Backend (`@seloma/api`)

- NestJS 11, TypeScript 5.8, Prisma 6, PostgreSQL 16, Redis 7, BullMQ 5
- Validation: `class-validator` / `class-transformer`
- Tests: Vitest 4
- Auth: opaque sessions (Bearer), not JWT app sessions

## Frontends

- Next.js 15 App Router (web, workspace, storefront)
- React 19
- Vite 6 (widget)
- Tailwind 3.4
- Workspace: Radix UI, CVA, lucide-react, next-themes, clsx, tailwind-merge

## Shared

- `@seloma/api-client` — typed fetch (source consumption)
- `@seloma/ui` — tokens / labels / AiStateChip

## Do not add by default

Zustand, TanStack Query, React Hook Form, Zod, ESLint/Prettier configs, OpenAPI generator, Storybook, Kafka, new test runners, new UI libraries (MUI, Chakra, Ant), new state managers.

If a task truly requires a new dependency, justify it against an existing pattern first and keep it scoped.
