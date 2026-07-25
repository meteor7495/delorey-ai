# PRD-015 — Bale Channel

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-015 |
| **Feature** | Bale Channel |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [System Architecture](../03-architecture/system-architecture.md) · [User Journey](../02-product/user-journey.md) Stage 6 · PRD-014 |

---

# 1. Problem

Bale is a required Iran-local messaging channel for MVP reach.

# 2. Goal

Same adapter pattern as Telegram: connect, verify webhooks, normalize, Runtime with channel=`bale`, reply, handoff.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Connect credentials; webhook; normalize; Runtime; outbound; Inbox replies | Feature parity race with Telegram extras; other messengers |

# 4. Users & Journey

Stage 6–9 same as Telegram.

# 5. Functional requirements

1. MUST follow Channel Adapter contract (verify → normalize → Runtime → reply).  
2. MUST encrypt credentials; tenant isolation.  
3. MUST idempotent ingest.  
4. MUST share Sales Employee brain (no Bale-only logic beyond adapter quirks).  
5. MUST surface connection health in Workspace.  
6. MUST document Bale API quirks in adapter (eng) without product scope creep.

# 6. UX requirements

Mirror Telegram connect UX with Bale-specific instructions.

# 7. Technical contracts

webhook Bale adapter; Channel APIs; Security.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Local channel coverage |
| AI Employee impact | Yes | Omnichannel |
| Friction | Yes | Same connect pattern |
| Scope fit | Yes | MVP Bale |
| Principle compliance | Yes | One brain |
| Measurement | Yes | Bale resolution; webhook errors |
| Kill criteria | Yes | Below |

# 9. Measurement

Same KPIs as Telegram scoped to Bale.

# 10. Acceptance criteria

- [ ] End-to-end chat on Bale with catalog-grounded answer.  
- [ ] Handoff works.  
- [ ] Adapter failure → degraded status, not silent drop.  

# 11. Kill criteria

Bale-specific second Employee personality productized → reject.

# 12. Dependencies & risks

Same as Telegram; Bale API stability.

# 13. Anti-pattern check

Not a messenger aggregator suite.
