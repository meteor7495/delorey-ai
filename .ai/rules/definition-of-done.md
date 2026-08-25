# Definition of Done

A Seloma `/agent-task` is done only when:

1. **Scope respected** — change boundary held; unrelated areas untouched
2. **Contracts verified** — no invented APIs; api-client updated when HTTP changes
3. **Reuse checked** — existing services/components used where applicable
4. **Tenant/security** — no isolation or secret regressions
5. **Validation** — DTOs/domain rules intact; reject reasons etc. preserved
6. **Tests** — relevant Vitest added/updated when logic warrants; executed or honestly `NOT RUN`
7. **Typecheck** — relevant packages pass (or failure explained)
8. **Lint** — stub status reported honestly
9. **Diff reviewed** — no accidental secrets, no mass formatting, no drive-by rewrites
10. **Report complete** — template in `.ai/templates/task.md` filled
11. **Product bar** — no invented price/SKU/stock; Persian merchant copy where UI changed
12. **Docs** — `.ai` rules updated only if a stable reusable insight emerged

Ship gate reminder (root README): invented prices/SKUs = not done. Partner readiness signals live on `/v1/workspace/me` (`partnerReady`) — do not fake them.
