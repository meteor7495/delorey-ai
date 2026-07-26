# Vertical Slice 07 — Product Recommendation

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — Skill `recommend` catalog-grounded |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–06 |
| **PRD** | [PRD-017 Product Recommendation](../04-prd/product-recommendation.md) |

**Goal:** Skill `recommend` returns only synced catalog products with real price/stock; prefers in-stock; never invents SKUs; respects Employee skill toggle.

**Out:** ML personalization platform, cross-merchant catalogs, invented products, discount beyond guardrail caps (cap stub = refuse invented discounts).

---

# Checklist

- [x] `CommerceService.recommendProducts` (budget/intent + stock-aware)  
- [x] Runtime path when recommend intent + skill enabled  
- [x] Employee UI toggle `recommend`  
- [x] Smoke: gift/budget/category; OOS not sold as available  

---

# Demo prompts

- «یه هدیه پیشنهاد بده» → in-stock only  
- «بودجه زیر یک میلیون» → `SHIRT-001`  
- «کفش می‌خوام» → `SHOE-220` as **ناموجود** (not as available)
