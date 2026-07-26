# Vertical Slice 08 — Basic Analytics Dashboard

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — honest counters from Audit + Conversations |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–07 |
| **PRD** | [PRD-019 Basic Analytics](../04-prd/basic-analytics.md) |

**Goal:** Workspace `/dashboard` shows tenant-scoped volume, escalation rate/reasons, resolution proxy, knowledge-gap themes, sync health — from real events. Empty states when no data. No vanity AI happiness scores.

**Out:** BI builder, causal “+X% sales from AI”, cohort SQL studio.

---

# Checklist

- [x] `GET /v1/analytics/summary`  
- [x] `GET /v1/analytics/knowledge-gaps`  
- [x] Methodology notes in API + UI  
- [x] `/dashboard` page + nav link  
- [x] Smoke: summary returns defined metrics  

---

# Methodology (honest)

| Metric | Definition |
|--------|------------|
| Resolution proxy | Share of audit turns with decisions in {`answer_grounded`,`answer_knowledge`,`recommend`,`order_lookup`} |
| Escalation rate | Share of conversations with `ownership=human_owned` or audit `escalated:*` |
| Knowledge gaps | Top shopper texts near `answer_empty_catalog` / `recommend_empty` / `order_lookup_not_found` |
| Assisted actions | Count of `recommend` + `order_lookup` turns — **not** attributed revenue |
