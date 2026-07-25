# PRD-011 — Human Handoff

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-011 |
| **Feature** | Human Handoff |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Product Principles](../02-product/product-principles.md) — Humans Control · [User Journey](../02-product/user-journey.md) Stage 9 · PRD-012 |

---

# 1. Problem

Hard cases, policy blocks, and customer requests for humans need a first-class exit — not a dead end.

# 2. Goal

Escalate conversations with reason, context package, and ownership change so operators can resume without re-asking; AI pauses until takeover.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Escalation triggers; reason codes; context package; ownership → human; AI pause; resume/release; `conversation.escalated` | Full helpdesk; SLA engines; multi-queue routing products |

# 4. Users & Journey

Stage 9; triggers from Guardrails + Runtime low confidence + customer ask.

# 5. Functional requirements

1. MUST escalate on: customer request, blocked topic, low confidence, over-cap discount, sync-unhealthy factual risk, Skill escalate.  
2. MUST set ownership to human and pause AI replies.  
3. MUST package: last messages, cart/intent summary, last Skill results, citations, reason.  
4. MUST notify Workspace Inbox in near-real-time.  
5. MUST allow operator reply via channel adapters.  
6. MUST allow release back to AI with audit.  
7. MUST NOT remove handoff to inflate automation metrics.

# 6. UX requirements

Inbox queue; reason badges; one-click takeover; customer-facing calm message that human is joining.

# 7. Technical contracts

`POST .../conversations/{id}/escalate|takeover|release` — API Spec. Conversation Engine ownership.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Trust + conversion salvage |
| AI Employee impact | Yes | Safe boundary |
| Friction | Yes | Operator gets context |
| Scope fit | Yes | MVP Human Handoff |
| Principle compliance | Yes | Humans Control AI |
| Measurement | Yes | Escalation rate & reasons |
| Kill criteria | Yes | Below |

# 9. Measurement

Escalation rate; reason mix; time-to-first-human-reply; re-open rate.

# 10. Acceptance criteria

- [ ] Escalated thread stops AI until takeover/release.  
- [ ] Context package visible to operator.  
- [ ] Channel reply delivers to customer.  

# 11. Kill criteria

Feature that disables handoff → revert.

# 12. Dependencies & risks

Inbox, Guardrails, Channels, Conversation.

# 13. Anti-pattern check

Not a ticket product; not “AI forever.”
