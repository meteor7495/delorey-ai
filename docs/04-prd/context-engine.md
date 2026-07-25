# PRD-008 — Context Engine

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-008 |
| **Feature** | Context Engine |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product / AI |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Context Engine Design](../03-architecture/context-engine-design.md) · [AI Runtime Architecture](../03-architecture/ai-runtime-architecture.md) |

---

# 1. Problem

Generation without live business context is hallucination theater.

# 2. Goal

Before generation (when intelligence is needed), assemble a typed `ContextBundle`: commerce, Knowledge, history, Memory, constraints, sync flags, citations — within token/latency budget.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| BuildContext pipeline; parallel fetch; sync health flags; budget trim keeping price/stock; keyword fallback on vector timeout; diagnostics for audit | Generation without assembly; inventing missing facts; ads/CRM context sources |

# 4. Users & Journey

Invisible merchant feature; Stage 8 go-live path.

# 5. Functional requirements

1. MUST run when Cost Layer needs intelligence (skip on pure cache/rule hits).  
2. MUST return `ContextBundle` with section statuses (`ok`/`stale`/`empty`/`failed`/`skipped`).  
3. MUST never invent commerce facts; expose gaps.  
4. MUST mark commerce unhealthy when sync unhealthy for factual domains.  
5. MUST attach citations for Transparent AI.  
6. MUST parallelize under deadline (target 200–400ms tuneable).  
7. MUST strip secrets; tenant-scope every retrieval.  
8. Over budget: drop low-relevance first; keep hard facts.

# 6. UX requirements

Merchants see effects via grounded answers + audit sources — not a Context IDE.

# 7. Technical contracts

[Context Engine Design](../03-architecture/context-engine-design.md); consumed by Runtime only (internal).

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Accuracy / trust |
| AI Employee impact | Yes | Context Before Intelligence |
| Friction | Yes | Fewer wrong answers → fewer refunds |
| Scope fit | Yes | MVP Context Engine |
| Principle compliance | Yes | Core principle #4 |
| Measurement | Yes | `context.build` latency; empty-retrieval rate |
| Kill criteria | Yes | Below |

# 9. Measurement

context.build latency; empty retrieval; sync_health flag distribution; citation coverage.

# 10. Acceptance criteria

- [ ] Stale sync + stock question → bundle not `ok` → Runtime refuse/escalate.  
- [ ] Cross-tenant retrieval impossible.  
- [ ] Audit contains context refs on grounded answers.  

# 11. Kill criteria

Shipping “always call GPT” without Context assembly → reject release.

# 12. Dependencies & risks

Commerce, Knowledge, Conversation, Cost Layer.

# 13. Anti-pattern check

Not prompt-only cleverness.
