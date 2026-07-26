# Vertical Slice 11 — Settings / Guardrails

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Employee + Runtime + Handoff |
| **PRD** | [PRD-007 Settings / Guardrails](../04-prd/settings-guardrails.md) |

**Goal:** Persist merchant guardrails 1:1 with Sales Employee and **hard-stop** them in Runtime (blocked topics, discount cap, refund/cancel). Not decorative toggles. No rules IDE.

---

# Checklist

- [x] `Employee.guardrails` JSON + defaults  
- [x] `PUT /v1/employee/guardrails`  
- [x] Runtime: blocked topic → escalate  
- [x] Runtime: discount above cap → escalate  
- [x] Runtime: refund/cancel request → block (no mutation)  
- [x] Employee UI section  
- [x] Smoke block + save  

---

# Defaults (safe)

| Field | Default |
|-------|---------|
| `blockedTopics` | سیاسی، قمار، politics, gambling |
| `discountCapPercent` | 10 |
| `restrictedMutations.refund/cancel` | always blocked in MVP |
| `escalationRules.onBlockedTopic` | true |

---

# Decisions

- Config loaded each turn from DB (no stale cache to bust).  
- `employee.updated` emitted in-process for future listeners.  
- Discount detection: explicit % in shopper text or AI reply over cap.  
