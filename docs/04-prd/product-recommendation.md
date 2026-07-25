# PRD-017 — Product Recommendation

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-017 |
| **Feature** | Product Recommendation |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · PRD-004 · PRD-006 · PRD-008 · [AI Runtime Architecture](../03-architecture/ai-runtime-architecture.md) |

---

# 1. Problem

Shoppers need help choosing; vague LLM inventing products destroys trust.

# 2. Goal

Skill `recommend`: retrieve real in-catalog products (price/stock/availability from Commerce), explain why, cite SKUs — never invent SKUs.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Catalog-grounded recommend; filters from intent (budget, category, attributes); stock-aware; citations; discount only within guardrail caps | Personalization ML platform; lookalike ads; cross-merchant catalogs; inventing products |

# 4. Users & Journey

Stage 7–8 shopping assist.

# 5. Functional requirements

1. MUST enable Skill `recommend` only when Employee enables it.  
2. MUST retrieve candidates from Commerce Core + Context, not model memory.  
3. MUST prefer in-stock / available variants when data exists.  
4. MUST attach product citations (id/sku/url).  
5. MUST apply discount_cap / blocked promotions via Guardrails.  
6. MUST degrade gracefully on empty catalog / sync unhealthy.  
7. MUST NOT invent SKUs or prices.

# 6. UX requirements

Shopper sees real product names/prices; Widget may deep-link; Inbox shows recommended SKUs on handoff.

# 7. Technical contracts

Runtime Skills; Context commerce section; Guardrails.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Conversion assist |
| AI Employee impact | Yes | Core Sales Skill |
| Friction | Yes | Guided choice |
| Scope fit | Yes | MVP recommend |
| Principle compliance | Yes | Context Before Intelligence; Transparent AI |
| Measurement | Yes | Recommend→click/add proxies; accuracy |
| Kill criteria | Yes | Below |

# 9. Measurement

Recommend Skill success; empty-result rate; hallucination eval fails (invented SKU).

# 10. Acceptance criteria

- [ ] Recommendations only reference synced products.  
- [ ] Out-of-stock not presented as available when stock known.  
- [ ] Eval catches invented SKU.  

# 11. Kill criteria

Demo mode inventing catalog → reject for production.

# 12. Dependencies & risks

Catalog sync freshness; Context; Guardrails.

# 13. Anti-pattern check

Not a recommender-science platform.
