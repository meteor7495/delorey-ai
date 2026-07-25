# PRD-019 — Basic Analytics

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-019 |
| **Feature** | Basic Analytics |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [User Journey](../02-product/user-journey.md) Stages 10–11 · PRD-020 |

---

# 1. Problem

Merchants need to know if the Employee is working — volume, resolution, escalations, gaps — without a BI project.

# 2. Goal

Workspace dashboard with MVP metrics: conversations, resolution proxy, escalation rate/reasons, channel mix, knowledge gaps, sync health — from platform events, not vanity AI scores.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Core counters & simple charts; date range; channel filter; gap topics list; sync health widget | Advanced BI; cohort SQL studio; marketing attribution suite; predictive churn |

# 4. Users & Journey

Stages 10 measure; 11 improve.

# 5. Functional requirements

1. MUST show conversation volume by channel/day.  
2. MUST show escalation rate + top reasons.  
3. MUST show resolution/deflection proxy (product-defined, honest).  
4. MUST surface knowledge-gap / low-confidence themes when available.  
5. MUST show sync health summary.  
6. MUST be tenant-scoped; near-daily freshness OK (batch OK for MVP).  
7. MUST NOT invent “AI happiness” scores without definition.

# 6. UX requirements

One dashboard page; sparse charts; Persian labels; link to Inbox/KB for action.

# 7. Technical contracts

Events from Conversation/Runtime; optional rollup tables — Database/Backend; Frontend dashboard feature.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Prove ROI path |
| AI Employee impact | Yes | Feedback loop |
| Friction | Yes | See gaps → fix KB |
| Scope fit | Yes | MVP Basic Analytics |
| Principle compliance | Yes | Improve from correction; Cost/outcome focus |
| Measurement | Yes | Meta: dashboard usage |
| Kill criteria | Yes | Below |

# 9. Measurement

Dashboard visits; action clicks to KB; metric freshness lag.

# 10. Acceptance criteria

- [ ] Merchant sees yesterday’s volume & escalations.  
- [ ] Reasons match audit taxonomy.  
- [ ] Empty tenant shows empty states, not fake data.  

# 11. Kill criteria

Vanity metrics without definitions → remove.

# 12. Dependencies & risks

Events pipeline; Audit taxonomy; Commerce sync health.

# 13. Anti-pattern check

Not a BI platform.
