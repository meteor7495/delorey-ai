# Claude Code — Seloma adapter

Canonical AI development source of truth: **`.ai/`**.

Do not duplicate the rulebook here. Load files from `.ai/` based on the task.

## Startup

1. `.ai/README.md`
2. `.ai/rules/core.md`
3. `.ai/rules/dont-do.md`

## Commands

| Prompt prefix | Workflow |
|---------------|----------|
| `/agent-task` | `.ai/workflows/task.md` + `.ai/templates/task.md` |
| `/agent-review` | `.ai/workflows/review.md` + `.ai/templates/review.md` |
| `/agent-refactor` | `.ai/workflows/refactor.md` + `.ai/templates/refactor.md` |
| `/agent-debug` | `.ai/workflows/debug.md` + `.ai/templates/debug.md` |

## Progressive loading

After classification, load only the matching `.ai/rules/*`, `.ai/discovery/*`, and `.ai/agents/*`.

## Hard constraints

- Existing Seloma code is the source of truth
- Reuse `packages/api-client` and Nest modules
- No invented APIs / Prisma models
- No drive-by stack changes (Query, Zustand, Zod, Kafka, …)
- Honest `PASS` / `FAIL` / `NOT RUN` for checks

Product documentation: `docs/`. Implementation conflicts: prefer **code**, then update `.ai/discovery` when the insight is stable.
