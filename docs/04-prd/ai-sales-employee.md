# PRD-006 — AI Sales Employee

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-006 |
| **Feature** | AI Sales Employee |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [AI Runtime Architecture](../03-architecture/ai-runtime-architecture.md) · [User Journey](../02-product/user-journey.md) Stage 5 & 8 · PRD-007 |

---

# 1. Problem

Merchants need an opinionated commerce colleague — not a blank chatbot canvas.

# 2. Goal

Configure and run one primary AI Sales Employee that handles grounded pre-purchase Q&A, recommendations, order status, policy answers, and escalation on Website/Telegram/Bale with one brain.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Sales role; name/tone/language; Skills ⊆ search, recommend, order_status, escalate; status inactive→active/paused; Runtime turn execution | Support as dedicated Employee (Growth); multi-agent orchestration; custom prompt IDE; Skill Marketplace |

# 4. Users & Journey

Stages 5 (create), 7–8 (test/live), 9 (handoff).

# 5. Functional requirements

1. MUST provision default Sales Employee skeleton on tenant create (`inactive` until sync+channel).  
2. MUST persist name, tone, language, enabled Skills, status.  
3. MUST execute turns only via Runtime pipeline (Cost → Context → Skills → Guardrails → Gateway).  
4. MUST decide only: Answer \| Recommend \| Order Lookup \| Escalate.  
5. MUST stay in Sales role — no general assistant wander.  
6. MUST share one brain across channels.  
7. MUST NOT go-live nudge without healthy sync + channel.

# 6. UX requirements

Employee settings forms; clear AI state (active/paused/syncing/degraded/awaiting human); settings described as enforced in Runtime.

# 7. Technical contracts

`/v1/.../employees` — API Spec. Runtime — AI Runtime Architecture. Events `employee.updated`.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Primary product wedge |
| AI Employee impact | Yes | The Employee itself |
| Friction | Yes | Hire vs build-a-bot |
| Scope fit | Yes | MVP primary product |
| Principle compliance | Yes | Opinionated Employees |
| Measurement | Yes | Resolution, accuracy, escalation |
| Kill criteria | Yes | Below |

# 9. Measurement

Resolution ≥50%; accuracy ≥90%; hallucination &lt;5%; escalation appropriateness.

# 10. Acceptance criteria

- [ ] Merchant configures Employee and sees grounded test replies.  
- [ ] Channel-agnostic behavior for same Knowledge/guardrails.  
- [ ] Eval suite hooks via audit (Testing Strategy).  

# 11. Kill criteria

Fluent answers without store sync treated as “done” → reject; fix grounding first.

# 12. Dependencies & risks

Commerce, Context, Guardrails, Channels, Conversation.

# 13. Anti-pattern check

Not a generic chatbot builder or autonomy theater.
