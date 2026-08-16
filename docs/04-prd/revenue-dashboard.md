# PRD-020 — Revenue Dashboard

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-020 |
| **Feature** | Revenue Dashboard |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Product Principles](../02-product/product-principles.md) · PRD-019 · Commerce Core |

---

# 1. Problem

Seloma sells outcomes (commerce help), not chat volume. Merchants need a revenue-adjacent view tied to Employee-assisted journeys — without fake attribution theater.

# 2. Goal

Show honest revenue-related metrics: assisted conversations that touched recommend/order paths, synced GMV/orders context where attributable with clear methodology, and cost/usage awareness — never overclaim causality.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Assisted conversation counts; recommend Skill volume; orders synced in period (store-level); optional “touched by AI session” linkage when identity/order link exists; methodology note | Multi-touch attribution engine; ad ROAS; finance ERP; guaranteed causal lift claims |

# 4. Users & Journey

Stages 10–11 prove value.

# 5. Functional requirements

1. MUST define and display methodology text (what “assisted” means).  
2. MUST show Skill recommend / order_status volumes.  
3. MUST show store order/GMV from Commerce sync for period (tenant store facts).  
4. MAY link conversation→order when deterministic link exists; else show separately.  
5. MUST NOT claim causal conversion lift without experiment.  
6. MUST tenant-isolate all figures.  
7. SHOULD show AI usage/cost summary at high level (Cost First).

# 6. UX requirements

Same analytics area as PRD-019 or adjacent tab; methodology always visible; no fake up-and-to-the-right sparklines.

# 7. Technical contracts

Commerce order aggregates; conversation/Skill events; Analytics rollups.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Outcome narrative |
| AI Employee impact | Yes | Ties Employee to commerce |
| Friction | Yes | One place to see value |
| Scope fit | Yes | MVP Revenue Dashboard (basic) |
| Principle compliance | Yes | Cost First; no vanity autonomy |
| Measurement | Yes | Assisted rate; GMV displayed |
| Kill criteria | Yes | Below |

# 9. Measurement

Assisted conversation rate; recommend volume; linked order rate (when available).

# 10. Acceptance criteria

- [ ] Methodology copy present.  
- [ ] GMV matches Commerce aggregates for period.  
- [ ] No causal lift badge without experiment flag.  

# 11. Kill criteria

Marketing claims of “+X% sales from AI” in-product without proof → remove.

# 12. Dependencies & risks

Commerce sync; Analytics; identity linking quality.

# 13. Anti-pattern check

Not a fake attribution SaaS.
