# 12 — Cost Analysis

**All BoxAPI unit prices below are Hypotheses.** Public Official API docs do not publish a firm IRR/USD price per page for SaaS scale. Replace with contracted rates before financial commitment.

Seloma list pricing context: merchants ~$99–499/mo ([Pricing Strategy](../../01-business/pricing-strategy.md)).

---

## 1. Cost drivers

| Driver | Who bills | Notes |
|--------|-----------|-------|
| Connected IG pages | BoxAPI | Likely primary meter |
| API requests / queued sends | BoxAPI | Possibly bundled |
| Webhook volume | Usually included | Confirm |
| OpenAI / LLM tokens | Seloma AI Gateway | Dominates variable cost |
| Infra (API, queues, DB, egress) | Seloma | Modest vs LLM at chat volumes |
| Support / re-OAuth ops | Seloma | Soft cost, scales with merchants |
| Compliance / DPA overhead | Seloma | Fixed + legal |

---

## 2. Pricing hypotheses (BoxAPI)

Until vendor quote exists, use **three bands** for sensitivity:

| Band | Assumed Blended cost / page / month | Meaning |
|------|--------------------------------------|---------|
| Low | $8 | Aggressive volume SaaS deal |
| Mid | $20 | Plausible SMB intermediary |
| High | $45 | Thin volume / agency pricing |

Trial: ~7 days free / 1 page — negligible.

**Action item:** Obtain written quote for 100 / 500 / 1,000 / 5,000 pages.

---

## 3. Volume assumptions (Hypothesis)

| Merchants with IG | Conversations / page / mo | AI replies / conv | LLM turns / mo / page |
|-------------------|---------------------------|-------------------|------------------------|
| All scenarios | 800 | 3.5 | ~2,800 |

Token cost hypothesis: **$0.004 per AI turn** blended (cache + small model + occasional premium) → **~$11.20 LLM / page / month**.

Infra hypothesis: **$1.50 / page / month** at scale (queues, storage, egress), floor **$400/mo** platform IG stack.

---

## 4. Monthly cost estimates

### 4.1 Provider (BoxAPI) — sensitivity

| Merchants | Low ($8) | Mid ($20) | High ($45) |
|-----------|----------|-----------|------------|
| 30 | $240 | $600 | $1,350 |
| 100 | $800 | $2,000 | $4,500 |
| 500 | $4,000 | $10,000 | $22,500 |
| 1,000 | $8,000 | $20,000 | $45,000 |
| 5,000 | $40,000 | $100,000 | $225,000 |

### 4.2 Estimated OpenAI (Seloma)

| Merchants | LLM / mo @ $11.20/page |
|-----------|-------------------------|
| 30 | ~$336 |
| 100 | ~$1,120 |
| 500 | ~$5,600 |
| 1,000 | ~$11,200 |
| 5,000 | ~$56,000 |

### 4.3 Estimated infrastructure (Seloma IG channel)

| Merchants | Infra / mo |
|-----------|------------|
| 30 | ~$400 floor |
| 100 | ~$400–600 |
| 500 | ~$750 |
| 1,000 | ~$1,500 |
| 5,000 | ~$7,500 |

### 4.4 Combined (Mid BoxAPI band)

| Merchants | BoxAPI Mid | LLM | Infra | **Total** | Per merchant |
|-----------|------------|-----|-------|-----------|--------------|
| 30 | $600 | $336 | $400 | **~$1,336** | ~$45 |
| 100 | $2,000 | $1,120 | $500 | **~$3,620** | ~$36 |
| 500 | $10,000 | $5,600 | $750 | **~$16,350** | ~$33 |
| 1,000 | $20,000 | $11,200 | $1,500 | **~$32,700** | ~$33 |
| 5,000 | $100,000 | $56,000 | $7,500 | **~$163,500** | ~$33 |

---

## 5. Margin impact vs Seloma subscription

| Merchant plan (hyp.) | Price | IG variable cost mid (~$33) | Room for other COGS |
|----------------------|-------|-----------------------------|---------------------|
| Starter $99 | $99 | 33% of revenue on IG alone if IG-heavy | Tight |
| Pro $199 | $199 | ~17% | OK if conversation caps enforced |
| Business $499 | $499 | ~7% | Comfortable |

**If BoxAPI High band ($45) + LLM ($11) + infra:** ~$58/merchant — **Starter margin hostile**.

---

## 6. Cost risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Opaque SaaS pricing | Quotes jump after dependency | Cap commitment; dual-vendor RFP |
| Per-request metering surprises | Chatty AI burns requests | Coalesce messages; local rate limiter |
| Double bot tax | Merchant also pays ManyChat | Exclusive page policy |
| Re-OAuth support load | Soft cost dominates at scale | Self-serve reconnect UX |
| Currency / FX | IRR vs USD billing | Contract currency explicitly |
| Trial → prod cliff | Features locked behind higher plans | Confirm account_limit early |
| Topology B (per merchant BoxAPI) | Multiplies seats/min fees | Avoid unless required |
| No Meta token portability | Switching cost = renegotiate + re-OAuth all | Abstraction + commercial escrow |
| Comment storms | Spike LLM + provider costs | Shed/load limit comment autos |

---

## 7. Compare: “free Meta” counterfactual

Where Meta direct is available, incremental provider cost ≈ $0 beyond cloud egress, but:

- Iran access problem remains the reason BoxAPI exists
- Engineering & compliance cost of Meta app review is non-zero
- Still pay LLM + infra

BoxAPI is paying for **access + proxy ops**, not for AI.

---

## 8. Financial gates before Growth launch

- [ ] Written price list for 100 and 1,000 pages
- [ ] Overage definition
- [ ] SLA credits
- [ ] Model: IG attach as paid add-on vs bundled in Pro+
- [ ] Kill criterion: if blended provider+LLM > 25% of median IG merchant ARPU

---

## 9. Recommendation

Treat BoxAPI cost as an **Instagram channel add-on COGS**, not free bundling on Starter, until Mid-band quotes ≤ ~$15–20/page or ARPU rises.

Do not approve 1,000+ merchant IG rollout on **Unknown** pricing.
