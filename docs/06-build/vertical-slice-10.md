# Vertical Slice 10 — Revenue Dashboard (honest)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 08 Analytics + Orders |
| **PRD** | [PRD-020 Revenue Dashboard](../04-prd/revenue-dashboard.md) |

**Goal:** Honest revenue-adjacent metrics: Skill volumes (recommend / order_lookup), store GMV from synced orders, assisted conversation counts — with mandatory methodology. **No causal “+X% sales from AI”.**

---

# Checklist

- [x] Order `total_amount` for GMV  
- [x] `GET /v1/analytics/revenue`  
- [x] Dashboard revenue section  
- [x] Methodology + anti-causal copy  
- [x] Smoke GMV matches order sum  

---

# Methodology

| Metric | Meaning |
|--------|---------|
| Store GMV (period) | Sum of `orders.total_amount` with `synced_at` in range — **store fact**, not AI-attributed |
| Recommend / order_lookup volume | Audit turn counts |
| Assisted conversations | Distinct conversations with ≥1 recommend or order_lookup turn — **not** proven conversions |
| Usage proxy | Audit turn count (mock) — not provider invoice |
