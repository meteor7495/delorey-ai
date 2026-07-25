# PRD-013 — Website Chat Widget

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-013 |
| **Feature** | Website Chat Widget |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Frontend Architecture](../03-architecture/frontend-architecture.md) · [User Journey](../02-product/user-journey.md) Stage 6 · PRD-006 |

---

# 1. Problem

Website is the primary commerce surface; merchants need a installable chat that speaks as the Sales Employee.

# 2. Goal

CDN-hosted widget + install snippet + public chat/session APIs; streaming replies; AI state UI; tenant isolation by public key/origin.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Install snippet; session create; message send/stream; typing/AI state; brand light theming; origin allowlist | Full theme studio; native SDKs; voice; Instagram/WhatsApp |

# 4. Users & Journey

Stage 6 install; Stage 7–8 shopper chats.

# 5. Functional requirements

1. MUST publish widget JS from CDN.  
2. MUST create sessions with tenant public key + origin checks.  
3. MUST route messages through Runtime with channel=`website`.  
4. MUST stream tokens where supported.  
5. MUST show AI state (thinking/typing/escalated).  
6. MUST rate-limit + abuse protection.  
7. MUST NOT expose private keys or admin APIs.  
8. MUST share same Employee brain as Telegram/Bale.

# 6. UX requirements

Non-blocking embed; mobile-friendly; Persian RTL; accessible focus/labels.

# 7. Technical contracts

`POST /v1/public/chat/sessions|messages` — API Spec. Frontend Architecture widget package.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Primary channel |
| AI Employee impact | Yes | Employee reaches shoppers |
| Friction | Yes | Snippet install |
| Scope fit | Yes | MVP Website Chat |
| Principle compliance | Yes | One brain; Transparent AI state |
| Measurement | Yes | Session starts; resolution on web |
| Kill criteria | Yes | Below |

# 9. Measurement

Widget load errors; session create success; web conversation resolution; p95 reply latency.

# 10. Acceptance criteria

- [ ] Snippet on storefront opens chat and answers from synced catalog.  
- [ ] Wrong origin rejected.  
- [ ] Escalation reflected in widget UI.  

# 11. Kill criteria

Channel-specific second brain → reject.

# 12. Dependencies & risks

Employee, Runtime, Conversation, CDN/DevOps.

# 13. Anti-pattern check

Not a white-label chat SaaS with feature bloat.
