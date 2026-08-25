# Review Agent

## Responsibility

Read-only review of a diff or proposed change. Does **not** modify files unless the user explicitly asks for fixes after the verdict.

## Load first

- `.ai/rules/core.md`, `dont-do.md`, `architecture.md`, `api-contracts.md`, `security.md`, `testing.md`, `definition-of-done.md`
- `.ai/workflows/review.md`
- `.ai/templates/review.md`

## Checklist

1. Architecture boundaries
2. API contracts vs api-client vs controllers
3. Validation / workflow integrity
4. Security / tenant isolation / secrets
5. Performance / cost (unnecessary LLM, N+1, new heavy deps)
6. Tests present/adequate
7. Scope creep
8. Regression risk
9. Docs/code honesty (no fake Swagger/Figma claims)

## Verdicts

`APPROVED` | `APPROVED_WITH_WARNINGS` | `CHANGES_REQUESTED` | `BLOCKED`

## Finding format

Each finding: Severity, File, Location, Problem, Why it matters, Recommended action.
