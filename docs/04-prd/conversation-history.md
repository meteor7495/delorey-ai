# PRD-010 — Conversation History

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-010 |
| **Feature** | Conversation History |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Conversation Engine Design](../03-architecture/conversation-engine-design.md) · [Glossary](../00-overview/glossary.md) |

---

# 1. Problem

Without persisted threads, operators cannot review, handoff loses context, and omnichannel continuity fails.

# 2. Goal

Persist conversations as commerce events (not tickets): messages, ordering, idempotent ingest, history windows for Context, optional cross-channel link when identity resolvable.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Conversations/messages SoR; idempotency; ownership fields; history/summaries; customer profile link when safe | Ticket SoR; CRM pipelines; forced bad merges |

# 4. Users & Journey

Stages 7–9; operators review; Context consumes history.

# 5. Functional requirements

1. MUST persist Conversation + Messages with tenant_id.  
2. MUST idempotent ingest via `idempotency_key` (no double Runtime).  
3. MUST provide history window (+ summaries) to Context Engine.  
4. MUST prefer no merge over wrong Customer Profile merge.  
5. MUST encrypt message bodies at rest.  
6. MUST emit lifecycle events `conversation.started|message|ended`.  
7. MUST NOT model threads as helpdesk tickets.

# 6. UX requirements

Operator review in Inbox (PRD-012); shopper continuity when linked.

# 7. Technical contracts

Conversation Engine Design; Database Design tables; Inbox/Widget APIs.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Continuity + audit + attribution unit |
| AI Employee impact | Yes | Memory quality |
| Friction | Yes | No repeat yourself when linked |
| Scope fit | Yes | MVP Conversation History |
| Principle compliance | Yes | Conversations ≠ tickets |
| Measurement | Yes | conversation.message events |
| Kill criteria | Yes | Below |

# 9. Measurement

Ingest success; duplicate webhook suppression; cross-channel link rate.

# 10. Acceptance criteria

- [ ] Duplicate webhook → single message/turn.  
- [ ] History available to Context on multi-turn chat.  
- [ ] Ambiguous identity → no wrong merge.  

# 11. Kill criteria

Ticket-centric schema PR → reject.

# 12. Dependencies & risks

Adapters, Runtime gating, Inbox.

# 13. Anti-pattern check

Not helpdesk/CRM.
