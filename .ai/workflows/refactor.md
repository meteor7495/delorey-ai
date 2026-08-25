# Workflow: /agent-refactor

1. Understand current behavior (code + tests + callers).
2. Find usages across apps/packages.
3. Find existing tests.
4. Identify coupling and risk.
5. Define the safe change boundary.
6. Refactor in small steps.
7. Run relevant tests + typecheck.
8. Review diff for behavior/API breaks.
9. Report with preservation flags.

Output: `.ai/templates/refactor.md`.
