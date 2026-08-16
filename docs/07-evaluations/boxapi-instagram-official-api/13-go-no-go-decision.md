# 13 — Go / No-Go Decision

| Field | Value |
|-------|-------|
| **Subject** | BoxAPI Instagram Official API as Seloma Growth transport |
| **Date** | 2026-07-27 |
| **Basis** | Documentation review + Seloma architecture fit (no live lab yet) |
| **Decision** | **GO with limitations** |

---

## 1. Scorecard (1–10)

| Criterion | Score | Justification |
|-----------|------:|---------------|
| Security | **2** | No webhook signature docs; god-key risk; silent revoke; weak audit |
| Reliability | **3** | Queue claimed but opaque; no SLA; total dependency (no Meta token escape hatch) |
| Developer Experience | **3** | Thin docs; no OpenAPI/SDK; async without correlation contract |
| Scalability | **3** | 200/h/page hard; multi-tenant webhook model unproven beyond agency multi-page |
| Cost | **4** | Possibly viable as add-on; unit price Unknown — score capped |
| Documentation | **4** | Enough for spike; incomplete for production certification |
| Maintainability | **4** | Small API helps; envelope quirks + dual Instagram products hurt |
| Vendor Lock-in | **2** | No Meta token export; proprietary webhook shape; unilateral cutoff |
| Architecture Fit | **5** | Can be wrapped as thin adapter for text DM; weak commerce richness / tenancy |
| **Average** | **3.3** | |

Scores will be revised after spike lab. Do not treat this as final production certification.

---

## 2. Decision

### GO with limitations

**Meaning:**

- Approve a **time-boxed technical spike** using the 7-day trial (and paid single-page extension if needed).
- Approve **design work** for `InstagramProviderPort` + adapter boundaries (docs only / non-MVP code behind flags if needed).
- **Do not** approve Instagram as a generally available Seloma channel.
- **Do not** put BoxAPI calls in Runtime, Commerce, or n8n production brains.
- **Do not** promise merchants Meta-parity features.

### What would make this a full GO (Growth production)

All must be true:

1. Webhook cryptographic verification (or equivalent) proven  
2. Multi-tenant isolation proven (doc 06 tests)  
3. Text DM receive/send soak test passed  
4. Media either supported or Product signs text-only v1 waiver  
5. Rate-limit queue behavior characterized  
6. Written commercial terms for ≥100 pages  
7. DPA / custody clarification signed  
8. Abstraction layer implemented before GA  

### What would flip to NO GO

Any of:

- Cannot authenticate webhooks  
- Cross-tenant event leakage in lab  
- Cannot receive message text required for AI Sales Employee (custody contradiction)  
- Pricing makes IG attach structurally unprofitable on target ARPU  
- Vendor forbids multi-merchant SaaS use of one integration  
- Legal/compliance rejects intermediary Meta access model  

---

## 3. Limitations register (active)

| ID | Limitation | Owner | Expiry |
|----|------------|-------|--------|
| L1 | Docs-only evidence | Arch/QA | Until spike report |
| L2 | Security score &lt; 5 | Security | Blocker for prod |
| L3 | Multi-tenant unknown | Arch | Blocker for prod |
| L4 | Media unknown | Product | Waive or block |
| L5 | Pricing unknown | Finance | Blocker for scale |
| L6 | Lock-in high | Arch | Accept re-OAuth cost |
| L7 | 200/h/page | Product/Eng | UX + limiter |
| L8 | Out of MVP scope | Product | No MVP build |

---

## 4. Alternatives considered

| Option | Notes |
|--------|-------|
| Wait for direct Meta in Iran | Ideal technically; may be unavailable |
| Other Iranian IG proxies | Run parallel RFP; don’t single-source |
| Delay Instagram to Platform phase | Valid if MVP/Beta metrics lag |
| Manual Inbox-only IG (no AI) | Out of strategy — still needs transport |
| Scraper Data API for “DM-like” hacks | **Rejected** — ToS/ban/security |

---

## 5. Executive recommendation

BoxAPI is a **credible access bridge** to Official Instagram messaging for Iranian SaaS, but the published Official API is a **narrow, automation-oriented proxy** with **serious multi-tenant and security gaps**.

**Proceed to validate, not to integrate for GA.**

Preserve Seloma’s channel adapter discipline so a future vendor swap is a provider implementation change, not a brain rewrite.

---

## 6. Sign-off table

| Role | Name | Decision | Date |
|------|------|----------|------|
| Solutions Architecture | | GO with limitations | 2026-07-27 |
| QA Lead | | GO with limitations (spike checklist required) | 2026-07-27 |
| Security | | Pending spike — prod veto rights | |
| Product | | Pending | |
| Founder | | Pending | |
