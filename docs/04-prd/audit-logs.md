# PRD-018 — Audit Logs

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-018 |
| **Feature** | Audit Logs |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product / Security |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Security Architecture](../03-architecture/security-architecture.md) · [AI Runtime Architecture](../03-architecture/ai-runtime-architecture.md) · Transparent AI |

---

# 1. Problem

Without explainability, merchants cannot trust or debug the Employee; compliance and incident response fail.

# 2. Goal

Immutable-enough audit of admin actions and AI turns: who/what/when, Skill calls, guardrail blocks, model route metadata, context citations refs — queryable in Workspace.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Admin audit events; AI turn audit (decision path, Skills, citations refs, cost tokens, escalate reasons); tenant-scoped query UI/API | Full SIEM product; cross-tenant analytics for DeloRey sales; raw prompt dump to all roles |

# 4. Users & Journey

Stage 10–11 review; security incidents; eval linkage.

# 5. Functional requirements

1. MUST record admin mutations (authz, employee, guardrails, channels, knowledge, sync).  
2. MUST record AI turn summaries (not necessarily full raw prompts to viewers).  
3. MUST include guardrail blocks and escalation reasons.  
4. MUST be tenant-isolated; RBAC on who sees sensitive fields.  
5. MUST be append-oriented; no silent rewrite of history.  
6. MUST support filter by conversation/employee/time/event type.  
7. MUST retain per Security Architecture policy.

# 6. UX requirements

Audit page: searchable list + detail drawer; link from conversation to turn audit.

# 7. Technical contracts

Security Architecture audit; API Spec audit endpoints; Testing Strategy eval hooks.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Trust + debug |
| AI Employee impact | Yes | Transparent AI |
| Friction | Yes | Explain bad answers |
| Scope fit | Yes | MVP Audit |
| Principle compliance | Yes | Transparent AI; Tenant Isolation |
| Measurement | Yes | Audit write success; query latency |
| Kill criteria | Yes | Below |

# 9. Measurement

Audit write failures; query p95; % turns with citation refs.

# 10. Acceptance criteria

- [ ] Guardrail block appears in audit.  
- [ ] Operator cannot see other tenants.  
- [ ] Conversation → related turn audits linkable.  

# 11. Kill criteria

Shipping AI without turn audit → reject for go-live.

# 12. Dependencies & risks

Runtime instrumentation; Security; Workspace UI.

# 13. Anti-pattern check

Not a generic logging SaaS.
