# PRD-007 — Settings / Guardrails

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-007 |
| **Feature** | Settings / Guardrails |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Product Principles](../02-product/product-principles.md) — Humans Control · PRD-006 · [AI Runtime Architecture](../03-architecture/ai-runtime-architecture.md) |

---

# 1. Problem

Merchants fear brand damage more than slow replies. Soft “please don’t” prompts are not enough.

# 2. Goal

Hard-stop guardrails: blocked topics, discount caps, restricted mutations, escalation rules — enforced in Runtime, visible and editable in Workspace.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Tone/language settings; blocked topics; discount_cap_percent; restricted mutations (no unguarded refund/cancel); escalation triggers | Arbitrary policy DSL / visual rules IDE; disabling handoff for vanity automation |

# 4. Users & Journey

Stage 5 configure; Stage 9 escalation; Stage 11 tighten rules.

# 5. Functional requirements

1. MUST persist guardrail config 1:1 with Employee.  
2. MUST enforce as hard stops in Runtime (before tool side effects, after Skills, post-validate).  
3. MUST require human approval path when discount above cap.  
4. MUST block unguarded refund/cancel in MVP.  
5. MUST escalate on blocked topics / low confidence / customer human request per rules.  
6. MUST emit `employee.updated` on change.  
7. Tool permission checks MUST run after model suggestions (prompt injection).

# 6. UX requirements

Simple forms; progressive disclosure; never hide that rules are enforced; never hide uncertainty.

# 7. Technical contracts

`PUT .../employees/{id}/guardrails` — API Spec. Guardrails module — Runtime/Backend.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Trust → retention |
| AI Employee impact | Yes | Safe autonomy |
| Friction | Yes | Defaults safe |
| Scope fit | Yes | MVP Settings/Guardrails |
| Principle compliance | Yes | Humans Control AI |
| Measurement | Yes | Guardrail block count; escalation reasons |
| Kill criteria | Yes | Below |

# 9. Measurement

Escalation reason breakdown; guardrail block events; incidents of over-cap discount.

# 10. Acceptance criteria

- [ ] Over-cap discount attempt → escalate/block, not apply.  
- [ ] Model-requested refund → blocked.  
- [ ] Blocked topic → handoff/skip Agent path.  

# 11. Kill criteria

Any path that disables handoff to inflate automation → revert immediately.

# 12. Dependencies & risks

Runtime, Handoff, Employee UI.

# 13. Anti-pattern check

Not a no-code rules platform; not black-box autonomy.
