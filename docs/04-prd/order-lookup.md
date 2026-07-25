# PRD-016 — Order Lookup

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-016 |
| **Feature** | Order Lookup |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [User Journey](../02-product/user-journey.md) · PRD-004 · PRD-006 · [AI Runtime Architecture](../03-architecture/ai-runtime-architecture.md) |

---

# 1. Problem

Shoppers ask “where is my order?” constantly; humans burning cycles on status is the wrong use of staff.

# 2. Goal

Sales Employee Skill `order_status`: verify shopper, read synced order status/tracking from Commerce Core, answer grounded — escalate when ambiguous/PII risk.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Lookup by order id + verification (phone/email last digits per policy); status/tracking from sync; cite source; escalate on fail | Cancel/refund mutations; full post-purchase Support Employee; carrier API integrations beyond synced fields |

# 4. Users & Journey

Live shopper Stage 8; operator Stage 9 if escalate.

# 5. Functional requirements

1. MUST expose Skill `order_status` only when enabled on Employee.  
2. MUST read from Commerce Core (synced), never invent status.  
3. MUST require verification before revealing PII-rich order details.  
4. MUST refuse/escalate when sync unhealthy for orders domain.  
5. MUST log Skill call in audit with order id hash/ref.  
6. MUST NOT cancel/refund/mutate order in MVP via this Skill.

# 6. UX requirements

Shopper: clear status language; ask for order id calmly. Operator: see Skill result in handoff package.

# 7. Technical contracts

Runtime Skills; Commerce Core order read APIs; Guardrails restricted mutations.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Deflect status tickets |
| AI Employee impact | Yes | Core Sales Skill |
| Friction | Yes | Instant status vs wait |
| Scope fit | Yes | MVP order status |
| Principle compliance | Yes | Context Before Intelligence; Humans Control mutations |
| Measurement | Yes | Skill success; escalate rate |
| Kill criteria | Yes | Below |

# 9. Measurement

order_status success rate; verification fail rate; escalation on lookup.

# 10. Acceptance criteria

- [ ] Valid verified order → grounded status.  
- [ ] Unverified → ask verify, no leak.  
- [ ] Unsynced/missing → no invent.  

# 11. Kill criteria

Auto-cancel/refund via chat → reject.

# 12. Dependencies & risks

Commerce sync quality; Guardrails; Conversation identity.

# 13. Anti-pattern check

Not a full OMS or Support bot.
