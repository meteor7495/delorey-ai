# Workflow: /agent-task

Canonical task execution for Seloma.

## Steps

1. **Understand** the user request (restated in the report).
2. **Classify**: `FRONTEND` | `BACKEND` | `FULL_STACK` | `BUG` | `REFACTOR` | `INFRASTRUCTURE` | `TEST` | `DOCUMENTATION` | `ARCHITECTURE`.
3. **Load** `.ai/rules/core.md` + `dont-do.md` + relevant area rules + matching agent.
4. **Inspect** discovery docs for that area (do not reload everything).
5. **Search** existing implementation (pages, modules, api-client, tests).
6. **Contracts** if API-related — follow `.ai/contracts/api.md`.
7. **Validation** paths (DTOs, domain).
8. **Figma** only if applicable and available; else `NOT AVAILABLE`.
9. **Change boundary** — Allowed / Potentially affected / Unrelated.
10. **Plan** (numbered) before significant edits.
11. **Implement** smallest safe diff; reuse first.
12. **Validate** — typecheck, relevant tests, lint status.
13. **Review** own diff against `dont-do.md` and `definition-of-done.md`.
14. **Report** using `.ai/templates/task.md`.

## Clarifying questions

Ask only when blocked (missing contract, ambiguous product choice, destructive migration). Prefer repository discovery over questions.

## Output

Use `.ai/templates/task.md` exactly for the final structure.
