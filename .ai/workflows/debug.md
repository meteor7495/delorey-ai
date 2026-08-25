# Workflow: /agent-debug

1. Capture **symptom** (what, where, when).
2. **Reproduce** (or document why not reproducible).
3. Collect **evidence** (logs, responses, failing test, DB row, env flags).
4. Trace execution path (adapter → service → domain → DB / Gateway).
5. Form hypothesis; **validate** against evidence.
6. Implement the **smallest safe fix**.
7. Add/adjust regression test when feasible.
8. Review diff.
9. Report root cause with evidence links/quotes.

Critical: no evidence ≠ root cause.

Output: `.ai/templates/debug.md`.
