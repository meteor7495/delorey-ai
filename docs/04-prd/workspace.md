# PRD-002 — Merchant Workspace

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-002 |
| **Feature** | Merchant Workspace |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [User Journey](../02-product/user-journey.md) · [Frontend Architecture](../03-architecture/frontend-architecture.md) · [API Specification](../03-architecture/api-specification.md) |

---

# 1. Problem

Merchants need one control plane for store, Employee, channels, inbox, Knowledge, and outcomes — not a bot IDE.

# 2. Goal

A mobile-usable Workspace where attention triage, onboarding checklist, and daily ops (sync, handoffs, Employee health) are legible within minutes.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Workspace shell, home attention, onboarding checklist, memberships (MVP may be single user) | Native app, multi-brand switcher, power-user IDE chrome |

# 4. Users & Journey

| Persona | Stages |
|---------|--------|
| Founder / operator | 2–11 |

# 5. Functional requirements

1. MUST provide Workspace home with attention triage: sync unhealthy → store; escalations → inbox; Employee error → employee; else dashboard ([UX Principles](../02-product/product-principles.md)).  
2. MUST provide onboarding checklist: store → sync → Employee → channel → test.  
3. MUST NOT encourage go-live without sync + channel.  
4. MUST be API client of `/v1/workspaces/*` only — UI not SoR.  
5. SHOULD support membership list; invite may be minimal in MVP.

# 6. UX requirements

One primary job per screen; low cognitive load; responsive; clear next action; no card-heavy dashboard burying action.

# 7. Technical contracts

`/v1/workspaces/{id}`, `/attention`, `/onboarding`, `/members` — [API Specification](../03-architecture/api-specification.md).

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Time-to-value &lt; 24h path |
| AI Employee impact | Yes | Surface to operate Employee |
| Friction | Yes | Checklist vs empty config |
| Scope fit | Yes | MVP Workspace |
| Principle compliance | Yes | Fast Time To Value, Simple First |
| Measurement | Yes | Checklist step completion |
| Kill criteria | Yes | Below |

# 9. Measurement

Onboarding step completion; time from signup to first live conversation.

# 10. Acceptance criteria

- [ ] After signup, merchant sees checklist with blocked go-live until store+channel.  
- [ ] Attention API drives home CTAs correctly for sync/handoff/employee states.  
- [ ] Mobile-usable core flows (inbox/handoff reachable).  

# 11. Kill criteria

Workspace that feels like a developer IDE or hides sync/handoff → redesign before new channels.

# 12. Dependencies & risks

Auth, Tenant Isolation. Risk: polishing chrome before sync health.

# 13. Anti-pattern check

Not a chatbot builder or everything-app shell.
