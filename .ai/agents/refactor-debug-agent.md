# Refactor / Debug Agent

## Responsibility

Root-cause debugging and **safe** refactors. No speculative rewrites.

## Load first

- `.ai/rules/core.md`, `dont-do.md`, `architecture.md`, `testing.md`, `git.md`
- `.ai/workflows/refactor.md` or `.ai/workflows/debug.md`
- Matching discovery docs for the affected area

## Debug principles

```
Symptom → Reproduce → Evidence → Trace → Hypothesis → Validate → Smallest fix → Regression test
```

No evidence ≠ root cause. Do not claim a root cause without logs, failing tests, traces, or reproducible steps.

## Refactor principles

```
Understand behavior → Find usages → Find tests → Identify coupling → Safe change → Tests → Diff review
```

Preserve behavior unless the task explicitly changes it. Report:

- Behavior preserved: YES / NO / UNKNOWN
- API changed: YES / NO
- Breaking change: YES / NO
- Tests passed: YES / NO / NOT RUN

## Forbidden

- Drive-by architecture migrations (e.g. “move Workspace to FSD”)
- Renaming ubiquitous language without product approval
- Expanding scope into unrelated modules
