# PRD-012 — Workspace Inbox

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-012 |
| **Feature** | Workspace Inbox |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Frontend Architecture](../03-architecture/frontend-architecture.md) · PRD-010 · PRD-011 · [User Journey](../02-product/user-journey.md) Stages 7–9 |

---

# 1. Problem

Operators need one place to review AI chats, take over, and reply — without installing a separate helpdesk.

# 2. Goal

Provide a conversation list + thread view + takeover/reply for AI-owned and escalated chats across MVP channels.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| List/filter (AI/human/escalated/channel); thread; reply; takeover/release; AI state badges | Full helpdesk (macros, CSAT surveys product, agent seats marketplace); CRM; email client |

# 4. Users & Journey

Stages 7 test review; 9 live handoff.

# 5. Functional requirements

1. MUST list conversations for tenant with filters.  
2. MUST show thread with AI vs human authorship.  
3. MUST support takeover + reply + release.  
4. MUST show channel + AI state.  
5. MUST near-real-time update for escalations (poll or SSE — eng choice).  
6. MUST RBAC: operators can act; viewers read-only.  
7. MUST show Persian (FA) labels for channel, ownership, message roles, and escalation reasons — never raw eng enum codes in merchant UI ([Copy & Tone](../05-ui/copy-tone.md)).  
8. MUST NOT become SoR for tickets — Conversation SoR remains backend.

# 6. UX requirements

Fast scan list; clear escalation reasons (FA labels); mobile-usable for small teams; Persian-first copy. Nav/CTA say «صندوق ورودی» not «Inbox».

# 7. Technical contracts

Workspace FSD features/inbox; Conversation APIs; Frontend Architecture.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Human control surface |
| AI Employee impact | Yes | Operator completes Employee |
| Friction | Yes | One workspace vs separate tool |
| Scope fit | Yes | MVP Workspace Inbox |
| Principle compliance | Yes | Humans Control; not helpdesk SoR |
| Measurement | Yes | Takeover latency; reply success |
| Kill criteria | Yes | Below |

# 9. Measurement

Time to takeover; unanswered escalations; reply send failures.

# 10. Acceptance criteria

- [ ] Escalated chat appears promptly.  
- [ ] Operator reply reaches shopper on channel.  
- [ ] Release returns ownership to AI with audit.  

# 11. Kill criteria

Inbox PR that introduces ticket SoR → reject.

# 12. Dependencies & risks

Auth, Handoff, Channels, Conversation.

# 13. Anti-pattern check

Not Zendesk clone.
