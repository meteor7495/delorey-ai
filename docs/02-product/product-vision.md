# Product Vision

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.2 |
| **Status** | Active — primary product definition for Product, Design, and Engineering |
| **Owner** | Founder / Product |
| **Last Updated** | August 10, 2026 |
| **Related Documents** | [Product Positioning](../00-overview/product-positioning.md) · [Product Principles](./product-principles.md) · [Vision (company)](../00-overview/vision.md) · [Roadmap](../00-overview/roadmap.md) · [Glossary](../00-overview/glossary.md) · [Lean Canvas](../00-overview/lean-canvas.md) · [Business Plan](../01-business/business-plan.md) · [Market Research](../01-business/market-research.md) · [Product Moat](../01-business/product-moat.md) |

---

This document defines **the product**: what DeloRey AI is, who it serves, what problems it owns, and how teams decide what to build. It is not a company strategy memo, not a go-to-market brief, and not marketing copy. Every section should help engineers, designers, and product managers answer: *What are we building, and what must it never become?*

---

# Vision Statement

DeloRey is the **unified commerce platform** for online shops: a native storefront (سایت‌ساز) and one Workspace where catalog, orders, and multi-channel sales stay coherent — so a shop from website, Telegram, Bale, or later Instagram is trackable in one product. Optional **AI Sales Employees** sell and support on those same channels, grounded in live catalog and order data, under merchant guardrails. Long term: one commerce home merchants install; AI is an offer on that foundation — not a separate chatbot beside the shop.

**Authoritative packaging:** [Product Positioning](../00-overview/product-positioning.md).

---

# Product Mission

Give small and medium online shops **one place to sell and run the store** — native storefront + unified order/ops — and, when they need it, an **AI Sales Employee** add-on that answers purchase-blocking questions, recommends real products, looks up real orders, and escalates safely.

Operationally, the product must:

1. Let a merchant publish a native shop and manage catalog/orders in one Workspace on day one.
2. Keep channel sales (web + messaging) attributable to the same commerce truth.
3. Ground any AI reply or commerce action in that same context.
4. Keep humans in control through guardrails, Human Handoff, and audit when AI is enabled.
5. Prove platform value inside the first billing cycle with sales and ops clarity merchants can explain.

If a proposed capability does not advance this mission, it does not belong in the product.

---

# Product Purpose

The purpose of DeloRey is to make **selling and operating an online shop coherent** — one storefront, one order book, one ops surface — and to turn conversations into a reliable commerce function **on top of that**.

Today shops are fragmented: site in one tool, Telegram/Bale/Instagram elsewhere, orders in spreadsheets. Merchants lose sales to silence and lose time to tool sprawl. DeloRey exists so that:

- Shoppers can buy and get answers where they already are.
- Merchants get a **سایت‌ساز / ویترین** plus channels that share catalog and orders.
- Operators get a Workspace where products, orders, channels, and (optionally) AI state are legible.
- AI Employees remain an **optional offer** on the same Commerce Core — not a second product category that confuses the manager.

The product’s job is **unified commerce operations** first; AI conversation automation second. Not tickets, not CRM pipelines, not a free-form page-builder IDE.

---

# Core Problem

## The exact problem

**Online shops lose revenue and burn operator capacity because purchase-intent conversations are slow, fragmented across channels, and disconnected from live commerce data — while generic automation that scales without context destroys trust.**

Broken down for builders:

| Failure mode | What happens in practice | Product implication |
|--------------|--------------------------|---------------------|
| **Latency** | Shoppers ask sizing, stock, shipping, COD, or authenticity questions; replies arrive hours later or never | Instant, grounded replies on active channels |
| **Fragmentation** | Website chat, Telegram, and Bale are separate inboxes with no shared memory | One AI Employee Runtime; thin Channel Adapters |
| **Context gap** | Humans copy answers from memory or stale docs; bots guess | Commerce Core + Context Engine before generation |
| **Wrong automation** | Generic chatbots hallucinate price, stock, or policy | Prefer “I don’t know” + Human Handoff over fluent lies |
| **Invisible outcomes** | Merchants cannot see which conversations drove sales or which objections block conversion | Revenue Intelligence and conversation metrics as product infrastructure |
| **Operator overload** | Founders and small teams re-answer the same FAQs and become the bottleneck | Opinionated Sales (and later Support) Employees with Skills that complete jobs |

## What we are *not* claiming to solve alone

DeloRey does not replace ads, logistics, inventory planning, or payment acquiring. It owns **storefront + unified order/ops across channels**, and optionally the **conversation → accurate answer / safe action → measurable commerce outcome** loop when AI is enabled.

---

# Product Definition

## What DeloRey IS

DeloRey is a **cloud SaaS commerce platform** whose **primary product** is a **native storefront + CMS (سایت‌ساز)** with **unified multi-channel order ops** for small and medium online shops. The **AI Sales Employee** is an **optional add-on** sold into the same offer.

Concretely, the product is:

| Layer | Definition |
|-------|------------|
| **Native Storefront + CMS** | Digikala-like public shop and Workspace merchandising (products, categories, appearance, COD orders) — primary SKU |
| **Commerce Core** | Catalog, inventory, pricing, policies, and orders — native CMS as system of record; Shopify/Woo optional connectors |
| **Channel Adapters** | Website, Telegram, and Bale (MVP); Instagram/others later — same catalog/orders, thin adapters |
| **Workspace (control plane)** | Where merchants run the shop: catalog, orders, channels, inbox, settings — so managers are not confused |
| **AI Employees (add-on)** | Opinionated commerce roles (Sales first; Support next) with Skills, guardrails, and success metrics |
| **AI Employee Runtime** | Receives a message, builds context, calls tools, enforces guardrails, replies or hands off — only when AI is enabled |
| **Context Engine + Knowledge Base** | Assembles live business truth before AI generation |
| **Revenue / ops intelligence** | Orders by channel, conversation outcomes, assisted conversion when AI is on |

**Primary product framing for teams:** Merchants **run a shop in DeloRey**. They may **optionally hire an AI Sales Employee** on the same data. They do not “build a bot” as the center of the product.

**Category label:** Commerce platform / سایت‌ساز + omnichannel ops (SaaS), with optional AI Employee.  
**Deployment:** Multi-tenant cloud.  
**Primary geography for product truth (MVP–Beta):** Iran — Persian language, Website + Telegram + Bale behavior, local commerce realities (e.g. COD, messaging-first journeys). Architecture must not hard-code Iran forever, but MVP quality criteria are Iran-first.

## What DeloRey is NOT

| Not this | Why the product refuses it |
|----------|----------------------------|
| **Chatbot builder** | No blank-canvas prompt playground or arbitrary dialogue trees as the product center |
| **CRM** | Customer context for orders/conversations is in scope; pipelines and deal stages as SoR are not |
| **Helpdesk** | Tickets are a failure/escalation surface, not the primary UX or data model |
| **Free-form website builder IDE** | We ship an opinionated native storefront + CMS — not drag-drop page theater or a theme marketplace |
| **AI-only wrapper without a shop** | Platform value must stand if AI is off; AI is an offer, not the sole product |
| **Marketing automation suite** | Campaign blasts and drip builders are out until subordinate to commerce outcomes |
| **General-purpose AI assistant** | Any AI capabilities must serve commerce sell/support loops |
| **Black-box autopilot** | Autonomy without audit, guardrails, and handoff is a product failure |

For vocabulary used across Product, Design, and Engineering, see the [Glossary](../00-overview/glossary.md).

---

# Product Principles

Product Principles are the constitution of DeloRey AI. This Vision **inherits them by reference**; it does not restate all fifteen Core Principles, UX, AI, Commerce, and Technical Principles in full.

**Mandatory reference:** [Product Principles](./product-principles.md)

### How Vision and Principles relate

| Document | Role |
|----------|------|
| **Product Vision** (this file) | What the product is, who it is for, success, boundaries, long-term direction |
| **Product Principles** | Non-negotiable decision rules for every PRD, design, and architecture choice |

### Principles that most directly shape this Vision (summary)

| Principle | Vision implication |
|-----------|-------------------|
| **AI Assists, Humans Control** | Guardrails, approval, and Human Handoff ship as core Runtime — not enterprise extras |
| **Context Before Intelligence** | Commerce sync and Context Engine are critical path; model cleverness is not |
| **One Brain, Multiple Channels** | Website, Telegram, and Bale are adapters; business logic stays in Runtime |
| **Revenue Before Features** | Ship the smallest set that creates measurable commerce value |
| **Transparent AI** | Merchants can inspect what the Employee knew, did, and why it escalated |
| **Fast Time To Value** | Connect store → live grounded conversation same day (target &lt; 24 hours) |
| **Opinionated Product** | Sales Employee ships with catalog, recommendation, order status, escalation — not a blank IDE |
| **Measure Everything** | Unmeasured features are guesses; Revenue Intelligence is infrastructure |
| **Simple First / Depth Before Breadth** | Prove web + Telegram + Bale and Sales quality before Instagram, marketplace, or multi-agent theater |

**Decision rule for builders:** If a feature violates Product Principles, redesign or reject it — even if a competitor ships it, even if one merchant asks once, even if it demos well.

---

# Product Values

Product Values describe the behaviors and quality bars the product itself must embody in production — distinct from company culture statements.

| Value | Product manifestation |
|-------|------------------------|
| **Truth over fluency** | Prefer grounded “I don’t know” and escalation over a confident wrong SKU, price, or policy |
| **Commerce outcomes over message volume** | Optimize for conversion, recovery, resolution, and cost avoided — not “chats handled” vanity |
| **Operator clarity** | Workspace always shows Employee health: active, paused, syncing, degraded, awaiting human |
| **Merchant control** | Tone, discount caps, blocked topics, and escalation rules are first-class configuration |
| **Honest measurement** | Attribution methodology is conservative and explainable; no vanity ROI graphs |
| **Consistency across channels** | Same policies and facts on Website, Telegram, and Bale; only formatting differs |
| **Fail safe** | When sync is stale or tools fail, degrade and escalate — do not invent |
| **Tenant integrity** | Isolation of data, Knowledge, Memory, and analytics is non-negotiable |
| **Opinionated defaults** | Correct defaults for SMB online shops; few sharp overrides instead of infinite flexibility |
| **Earn autonomy** | Higher automation only after accuracy and trust metrics justify it |

These values should appear in acceptance criteria, design reviews, and launch checklists — not only in this document.

---

# Target Users

## Primary customers (buyers)

**Small and medium online shops** — D2C and small multi-brand merchants — with syncable storefronts and active messaging commerce.

| Attribute | Product-relevant definition |
|-----------|----------------------------|
| **Business type** | Online shop selling physical goods |
| **Verticals (MVP focus)** | Fashion, cosmetics, accessories, electronics, home products, gift shops |
| **Catalog** | Roughly 50–5,000 SKUs with non-trivial pre-purchase questions |
| **Channels** | Active website plus Telegram and/or Bale |
| **Team** | Typically 2–20 people; no dedicated 24/7 support org |
| **Stack** | Shopify, WooCommerce, or comparable with extractable catalog/orders |
| **Geography (MVP)** | Iran-first product truth; architecture portable |

## Buyer persona (decides)

Founder, CEO, or Head of E-commerce / Operations who cares about conversion, support load, brand risk, and payback within one to two months. Fears: wrong product facts, brand damage, another tool with no measurable ROI. Needs: fast time-to-value, guardrails, store integration, explainable metrics.

## User persona (operates daily)

Store manager, support lead, or founder-in-the-inbox. Monitors Website, Telegram, and Bale; answers product and policy questions; escalates refunds and edge cases. Needs: fewer repetitive answers, clear handoff packets, visible AI state, mobile-usable Workspace for urgent escalations.

## End customer (shopper)

Shoppers interacting with the merchant on Website, Telegram, or Bale. They are not DeloRey’s account holders, but they experience product quality directly. Success for them: accurate answers, no invented promises, smooth path to purchase or status resolution, and human takeover when needed without repeating the whole story.

## Who is out of MVP user scope

Enterprise multi-brand retail (governance/SSO depth), pure marketplace multi-seller operators, service businesses without product catalogs, merchants seeking a bot builder, shops with no messaging volume and no syncable catalog, and Instagram-only sellers unwilling to connect a storefront until Instagram + alternate catalog paths exist.

---

# Product Goals

## Business Goals

These are product-mediated business outcomes (what the product must enable), not a full company P&L plan.

| Goal | Product obligation |
|------|--------------------|
| **Prove paid willingness for AI Sales Employee** | Deliver measurable revenue/support impact that justifies SaaS renewal |
| **Retain on ROI, not novelty** | Merchants can see assisted conversion, resolution, and hours saved without external BI |
| **Expand within commerce conversation scope** | Grow usage via channels, Skills depth, and Employee roles — not category hopping |
| **Defend on context depth** | Commerce grounding and channel continuity become switching costs |

## User Goals

| Actor | Goals the product must satisfy |
|-------|--------------------------------|
| **Buyer** | Go live quickly; trust answers; see payback; control risk |
| **Operator** | Fewer repetitive threads; fast triage of escalations; correct Knowledge without fighting the UI |
| **Shopper** | Instant accurate answers; consistent facts across channels; human help when stuck |

## Technical Goals

| Goal | Requirement for builders |
|------|--------------------------|
| **Multi-tenant SaaS** | Hard tenant isolation on data, caches, jobs, indexes, logs |
| **API-first** | Workspace capabilities exposeable via stable contracts; UI is a client |
| **Thin Channel Adapters** | Website, Telegram, Bale normalize to shared Conversation / Runtime events |
| **Context-critical path** | Sync health, retrieval, and tool calls observable; stale sync visible to merchants |
| **Safe tool execution** | Scoped permissions for mutating actions; secrets never in prompts/logs |
| **Fail-safe Runtime** | Prefer escalate/degrade over confident wrong automation |
| **Instrument everything** | Structured events for context build, tools, guardrails, delivery, attribution |
| **Persian + Iran channel reality** | Product quality includes language, messaging UX constraints, and local commerce patterns for MVP |

---

# Success Definition

Success is defined with **product metrics** teams can instrument and audit. Thresholds align with the [Roadmap](../00-overview/roadmap.md); Vision owns *what good looks like*, Roadmap owns phase sequencing.

## Product success

| Signal | Definition of success |
|--------|------------------------|
| **Time to first live conversation** | Merchant connects store and handles a real grounded conversation within 24 hours |
| **Grounded accuracy** | Audited factual answers on product/policy ≥ 90% at MVP; rising thereafter; hallucinations on price/stock/policy treated as P0/P1 |
| **Resolution without human** | Routine product/policy questions resolved ≥ 50% without escalation at MVP, rising with quality |
| **Trust mechanics** | Human Handoff, audit visibility, and guardrails used in production — not disabled to inflate automation rates |
| **Multi-channel continuity** | Same Employee brain on Website + Telegram + Bale; identity continuity when resolvable |
| **Attribution honesty** | Non-zero attributed conversion/recovery for design partners within early usage windows, with explainable methodology |

## Customer (merchant) success

| Signal | Definition of success |
|--------|------------------------|
| **Support load** | Material reduction in repetitive questions handled by humans |
| **Conversion** | Assisted conversations convert better than comparable unassisted paths where measurable |
| **Retention intent** | Merchants renew because removing the Employee would visibly hurt revenue or inbox capacity |
| **Operator NPS / trust** | Operators trust the system enough to leave Employee active during peak hours |

## What does *not* count as success

- High message volume with high hallucination rate.
- “Looks smart” demos without store sync.
- Dashboard vanity without merchant-believable attribution.
- Shipping many Skills that do not close sell/support loops.

---

# Long-term Product Direction

Horizon thinking for builders. Expansion deepens the **AI Employee platform for commerce**, not adjacent categories.

## Near term (MVP → Beta)

- **Primary product:** AI Sales Employee (Support capabilities co-located or adjacent as quality allows).
- **Channels:** Website, Telegram, Bale — depth and reliability over new surfaces.
- **Core systems:** Workspace, tenant isolation, Commerce Core sync, Knowledge, Skills (product search, recommendation, order status, escalation), guardrails, Human Handoff, basic Revenue Intelligence.
- **Outcome:** Production accuracy and trust with paying merchants; self-serve path emerging in Beta.

## Medium term (Growth)

- Additional channels (e.g. WhatsApp, Instagram DMs, email) as adapters on the same brain.
- Dedicated Support Employee alongside Sales; stronger Memory and Customer Profile continuity.
- Deeper storefront coverage; workflow automation subordinate to Employee outcomes (e.g. cart recovery) only after core quality is proven.
- Clearer ROI dashboards and operator collaboration (roles, assignment).

## Long term (Platform)

- Composable Employees and Skills; developer APIs, webhooks, partner extensions.
- Multi-Employee orchestration that still stays opinionated around commerce.
- Vertical Skill packs (objection libraries, policy defaults) without becoming a generic agent IDE.
- Enterprise governance (multi-brand, SSO, stricter SLAs) only after commerce wedge is solid.
- Possible later expansion of *connectors* (e.g. service businesses) by swapping Commerce Core-style data — not by rewriting product identity.

**Invariant across horizons:** Context Graph + Employee Runtime + Channel Adapters + merchant control + honest measurement. The long-term product is an **AI Commerce Operating System** for conversation operations — still not a CRM, helpdesk, or chatbot builder.

---

# Non Goals

Explicit refusals for product scope. Do not schedule these as “eventually maybe” without a Vision revision.

1. **Generic chatbot builder** — arbitrary trees, unrestricted tool IDEs, “any use case” agents.
2. **Website or theme builder** — pages, themes, page editors.
3. **CRM replacement** — pipelines, deal stages, full customer SoR migration.
4. **Helpdesk-centric product** — ticket queues as the center of gravity.
5. **Marketing automation monster** — blasts, drip suites, audience builders as primary surfaces.
6. **Ads / media attribution platform** — we inform commerce conversation outcomes; we do not replace ad platforms.
7. **Black-box full autonomy** — removing merchant visibility to look more “AI.”
8. **Everything app** — breadth that starves Context Graph and Sales Employee quality.
9. **Premature Skill Marketplace** — third-party store before first-party Skills prove value.
10. **MVP channel sprawl** — Instagram, WhatsApp, SMS, voice as MVP requirements before web + Telegram + Bale quality is proven.

Saying “a competitor has it” or “one merchant asked once” does not override a Non Goal.

---

# Product Boundaries

## What belongs

| Belongs | Examples |
|---------|----------|
| **AI Employees for commerce** | Sales Employee; Support Employee; later commerce roles with clear metrics |
| **Runtime + Skills** | Product search, recommendations, order status, escalation, policy answers within guardrails |
| **Commerce grounding** | Catalog, inventory signals, pricing, shipping/returns/COD policies, order lookup |
| **Knowledge + Memory** | FAQ/policy overrides, uploads, conversation memory, Customer Profile continuity |
| **Channels as adapters** | Website widget, Telegram, Bale; later messaging/email as thin adapters |
| **Control plane** | Config, inbox/escalations, sync health, audit, operator corrections |
| **Measurement** | Resolution, escalation reasons, grounded answer rate, assisted conversion/recovery |
| **APIs (as product matures)** | Same capabilities as Workspace for agencies/integrators — still commerce-scoped |

## What does not belong

| Does not belong | Boundary rationale |
|-----------------|--------------------|
| Storefront design systems | Wrong problem |
| Inventory forecasting / WMS | Adjacent ops systems |
| Payment processing | Integrate for context; do not become PSP |
| Full CRM / ERP | Sync/push insights; do not absorb |
| Arbitrary non-commerce agents | Dilutes product identity |
| Channel-native business rules | Rules live in Runtime, not Telegram/Bale forks |
| Perfect attribution science before directional honesty | Prefer explainable metrics over fake precision |

**Boundary test for any proposal:** Does it improve grounded sell/support conversations, safe actions, channel delivery, merchant control, or honest commerce measurement? If no, it is outside the product.

---

# MVP Alignment

The MVP exists to prove one thesis (from Product Principles): **grounded AI Employees can create measurable commerce value on real channels without destroying trust.**

## How MVP supports this Vision

| Vision pillar | MVP manifestation |
|---------------|-------------------|
| **AI Sales Employee as primary product** | Opinionated Sales Employee (with Support-capable Skills as needed) — not a blank bot |
| **Commerce grounding** | Storefront sync for catalog/inventory/orders + Knowledge for policies/FAQs |
| **Iran-relevant channels** | Website + Telegram + Bale with one brain |
| **Human control** | Guardrails, Human Handoff, audit visibility from day one |
| **Measurable value** | Basic Revenue Intelligence / conversation metrics; design-partner attribution |
| **Fast time to value** | Path to first live grounded conversation &lt; 24 hours |
| **SaaS foundation** | Workspace + multi-tenant isolation |

## What MVP deliberately postpones (still Vision-aligned)

Instagram/WhatsApp/email/SMS, Skill Marketplace, multi-agent orchestration theater, marketing automation suites, public developer platform, vertical editions as separate products, multi-brand enterprise governance, voice/IVR. These wait until Sales Employee quality, trust, and measurement on the first three channels are real.

## MVP rule for backlog

If a backlog item does not improve grounded replies, safe actions, Website/Telegram/Bale delivery, or measurable merchant value for Sales/Support, it waits. Depth before breadth is how the Vision survives contact with a sprint board.

---

# Summary

DeloRey AI is a **cloud AI Commerce Platform** whose primary product is an **AI Sales Employee** for small and medium online shops — Iran-first on **Website, Telegram, and Bale** — grounded in live commerce data, controlled by merchants, and judged by commerce outcomes.

Builders should treat this Vision as the definition of the product, [Product Principles](./product-principles.md) as the decision constitution, the [Roadmap](../00-overview/roadmap.md) as sequencing, and the [Glossary](../00-overview/glossary.md) as shared language.

**Build:** AI Employees, Context, Channels as adapters, Workspace control, honest measurement.  
**Do not build:** Chatbot builders, CRMs, helpdesks, website builders, or autonomy theater.

Every feature either reinforces an AI Commerce Operating System for conversation operations — or erodes it into a wrapper. Choose accordingly.

---

*Product Vision v0.1. Changes require an explicit version bump and written rationale from Product ownership. Company-level narrative lives in [Vision](../00-overview/vision.md); mandatory decision rules live in [Product Principles](./product-principles.md).*
