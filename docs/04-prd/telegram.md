# PRD-014 — Telegram Channel

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-014 |
| **Feature** | Telegram Channel |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [System Architecture](../03-architecture/system-architecture.md) — Channel Adapters · [User Journey](../02-product/user-journey.md) Stage 6 |

---

# 1. Problem

Iran SMB merchants already sell/support via Telegram; Employee must meet customers there with the same brain.

# 2. Goal

Connect a Telegram bot, ingest webhooks securely, normalize to Conversation/Runtime, reply via Bot API, support handoff replies.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Bot token connect; webhook verify; normalize inbound; outbound reply; status connected/degraded; same Employee | Mini-apps marketplace; Telegram Ads; Instagram/WhatsApp |

# 4. Users & Journey

Stage 6 connect; Stage 8 live; Stage 9 handoff over Telegram.

# 5. Functional requirements

1. MUST store bot credentials encrypted.  
2. MUST verify Telegram webhook authenticity.  
3. MUST map chat → Conversation with idempotency.  
4. MUST call Runtime with channel=`telegram`.  
5. MUST send replies via Bot API; handle delivery errors → degraded.  
6. MUST support operator Inbox replies on same thread.  
7. MUST NOT train/store beyond tenant Conversation SoR.

# 6. UX requirements

Connect wizard (token/instructions); health status; clear error when webhook fails.

# 7. Technical contracts

webhook service Telegram adapter; Channel APIs — API Spec; Security Architecture secret storage.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Meet customers where they are |
| AI Employee impact | Yes | Omnichannel Sales Employee |
| Friction | Yes | Token connect |
| Scope fit | Yes | MVP Telegram |
| Principle compliance | Yes | One brain |
| Measurement | Yes | Telegram resolution; webhook errors |
| Kill criteria | Yes | Below |

# 9. Measurement

Webhook success; reply latency; conversation resolution on Telegram.

# 10. Acceptance criteria

- [ ] Customer message → grounded reply.  
- [ ] Duplicate update ignored.  
- [ ] Handoff operator reply delivered.  

# 11. Kill criteria

Per-channel divergent prompts as product → reject.

# 12. Dependencies & risks

Employee, Conversation, Handoff, webhook infra.

# 13. Anti-pattern check

Not a Telegram growth/marketing suite.
