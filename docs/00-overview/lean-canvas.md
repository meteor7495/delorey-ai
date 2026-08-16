# Lean Canvas

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft — pending review before product development |
| **Owner** | Founder / Product |
| **Last Updated** | August 10, 2026 |

---

## Problem

Online merchants lose revenue and burn capacity because **selling and ops are fragmented** across site builders, messaging apps, and spreadsheets — and because purchase conversations are slow and disconnected from commerce data.

### Top problems (ranked by revenue / ops impact)

1. **Tool sprawl and manager confusion**
   - Catalog, orders, and chats live in different tools; the shop manager cannot see one coherent picture.
   - Buyers arrive from Instagram, Telegram, Bale, or the website; fulfillment and tracking break across systems.

2. **Lost sales from unanswered or delayed questions**
   - Carts and chat threads die when sizing, stock, shipping, or payment questions go unanswered.
   - Revenue dies in silence across website chat and messaging — not only to competitors.

3. **Slow, inconsistent customer response**
   - Shoppers expect instant answers across channels; small teams cannot staff 24/7 coverage.

4. **Support workload that does not scale**
   - The same product and policy questions are answered repeatedly by humans.

5. **Generic chatbots that erode trust** *(when automation is attempted)*
   - Off-the-shelf bots scale but hallucinate; automation without catalog truth damages the brand.

### Existing alternatives (and why they fall short)

| Alternative | Gap |
|-------------|-----|
| Live chat tools (Intercom, Crisp, etc.) | Human-dependent; weak commerce integration; no revenue attribution |
| Helpdesk software (Zendesk, etc.) | Ticket-centric, not conversion-centric; siloed from catalog and cart |
| Generic AI chatbots | No live product/order context; high hallucination risk on commerce questions |
| Hiring more support staff | Linear cost; does not solve omnichannel fragmentation or insight extraction |
| Doing nothing | Cheapest upfront; highest hidden cost in abandoned carts and repeat questions |

---

## Customer Segments

### Primary ICP (Ideal Customer Profile)

**Direct-to-consumer (D2C) and mid-market online shops** with:

- **GMV:** $500K–$10M annual online revenue
- **Catalog:** 50–5,000 SKUs with non-trivial pre-purchase questions (sizing, compatibility, ingredients, shipping, returns)
- **Channels:** Active website plus at least one messaging channel (Telegram or Bale common in Iran/MENA; WhatsApp/Instagram in expansion markets)
- **Team size:** 2–20 people; no dedicated 24/7 support team
- **Stack:** Shopify, WooCommerce, or comparable storefront with extractable catalog/order data
- **Pain signal:** Measurable cart abandonment, slow response times, founder acting as support bottleneck

### Early adopters

- **Growth-stage D2C brands** already using Telegram/Bale for sales and support but drowning in volume.
- **Shop owners who tried a generic chatbot** and turned it off due to wrong answers or zero sales impact.
- **Merchants in messaging-first markets** (Iran: Bale, Telegram) where customers prefer chat over email.
- **Operators who track revenue per channel** and will pay if ROI is provable within 30 days.

### Buyer persona

| Attribute | Profile |
|-----------|---------|
| **Role** | Founder, CEO, or Head of E-commerce / Operations |
| **Age** | 28–45 |
| **Goals** | Increase conversion, recover abandoned revenue, reduce support load without bad customer experience |
| **Fears** | AI saying wrong things about products; brand damage; paying for another tool with no measurable ROI |
| **Decision criteria** | Time-to-value, revenue attribution, control/guardrails, integration with existing store |
| **Budget authority** | $200–$2,000/month if payback is visible within 1–2 months |

### User persona

| Attribute | Profile |
|-----------|---------|
| **Role** | Support lead, store manager, or founder handling day-to-day customer messages |
| **Daily workflow** | Monitors website chat, Telegram, Bale; answers product questions; escalates refunds and edge cases |
| **Goals** | Fewer repetitive tickets, faster first response, clear handoff when AI cannot help |
| **Frustrations** | Switching between apps, re-explaining policies, no visibility into which chats actually drove sales |
| **Success looks like** | AI handles 60%+ of routine questions accurately; human only sees exceptions and high-value conversations |

---

## Unique Value Proposition

### One sentence

**Seloma gives online shops one native storefront and Workspace so sales from website, Telegram, and Bale stay trackable in one product — with an optional AI Sales Employee on the same catalog.**

### Supporting benefits

- **One shop, not five tools:** Catalog, orders, and channels share one source of truth so managers are not confused.
- **Commerce-native storefront:** Digikala-like ویترین + CMS as the primary product merchants buy.
- **Omnichannel surfaces:** Website + Telegram + Bale (Instagram later) plug into the same commerce core.
- **Optional AI, same data:** AI Employees answer from live product/order truth when the merchant wants automation.
- **Human-controlled AI:** Guardrails, escalation, and audit when AI is enabled.

### Why customers should care

| Stakeholder | Why it matters |
|-------------|----------------|
| **Founder / buyer** | One place to sell and operate; optional AI without buying a second stack |
| **Store manager** | Orders and stock stay coherent across channels |
| **End customer** | Can buy and get answers where they already are |

**Positioning vs. alternatives:** Not a chatbot builder. Not a helpdesk. Not a free-form page IDE. A commerce platform with optional AI.

---

## Solution

### MVP solution (v0.1 scope)

A focused **native commerce platform** for online shops, with optional AI:

1. **Native Storefront + CMS (primary)**
   - Digikala-like public shop; products, categories, appearance, COD checkout, order tracking.
   - Workspace as the merchant control plane for catalog and orders.

2. **Channels**
   - Website storefront + chat widget.
   - Telegram and Bale adapters on the same catalog/order truth.

3. **AI Sales Employee (optional add-on)**
   - Answers pre-purchase questions from live catalog.
   - Order status and escalation when enabled.
   - Guardrails and Human Handoff required.

4. **External connectors (optional)**
   - Shopify/Woo sync when the merchant already has another storefront.

5. **Merchant control plane**
   - Agent configuration when AI is enabled: tone, policies, discount limits, escalation rules.
   - Unified inbox view across connected channels.
   - Basic ops dashboard: orders, channel volume; conversation metrics when AI is on.

6. **Guardrails & trust (when AI is on)**
   - Response grounded in commerce data; fallback to escalation on unknowns.
   - Human override and conversation review.
   - Audit log of agent actions and recommendations.

### Explicitly out of MVP

- Instagram and WhatsApp as required MVP channels (post-validation).
- Marketing automation, campaign triggers, multi-agent orchestration.
- Free-form drag-drop page IDE / theme marketplace.
- Developer platform / public API.
- Vertical editions, agent marketplace, voice.

### MVP success criteria (hypothesis)

- Merchant connects store and goes live on at least one channel within 24 hours.
- Agent resolves ≥50% of routine product/policy questions without human intervention (target rises to 70%+ before GA).
- At least one measurable conversion or cart recovery attributable to agent within first 14 days.

---

## Channels

### How customers discover Seloma AI

| Channel | Approach | Realism note |
|---------|----------|--------------|
| **Founder-led outbound** | Direct outreach to D2C shops with visible Telegram/Bale presence and slow response patterns | Primary early motion; unscalable but necessary for learning |
| **E-commerce communities** | Forums, Telegram groups, merchant communities in target geographies | High intent; trust-building required |
| **Shopify/WooCommerce app directories** | Listing once integration is stable | Longer lead time; credibility driver at scale |
| **Content & case studies** | Before/after metrics: response time, recovery rate, support hours saved | Only credible after 3–5 real deployments |
| **Agency / integrator referrals** | Shopify/WooCommerce agencies bundle setup | Requires partner program; later stage |
| **Product-led trial** | Free trial or freemium tier with limited conversations | Must prove value before ask; LLM costs constrain generosity |

### How customers buy

1. **Self-serve signup** → connect store → configure agent → deploy widget/bots.
2. **Assisted onboarding (early cohorts)** → founder/success call for first 10–20 customers to ensure integration and guardrails.
3. **Subscription billing** → monthly plan based on conversation volume and connected channels.

---

## Revenue Streams

### Pricing hypothesis (v0.1)

**Model:** SaaS subscription + usage component, aligned with merchant value and our cost structure.

| Tier | Target customer | Hypothesis price | Includes |
|------|-----------------|------------------|----------|
| **Starter** | Small shop, 1 channel | $99–149/month | 1 store, 1 channel (web OR Telegram OR Bale), ~500 AI conversations/month, basic analytics |
| **Growth** | Active omnichannel shop | $299–499/month | 1 store, up to 3 channels, ~2,000 conversations/month, unified inbox, conversion attribution |
| **Scale** | Higher GMV, multiple operators | $799+/month | Higher limits, priority support, custom guardrails, SLA |

**Usage overage:** $0.05–$0.15 per additional AI conversation beyond plan limit (must cover LLM + infra margin).

**Alternative models under consideration (not MVP):**

- **GMV-attached pricing** (% of attributed recovered revenue) — higher upside, harder to measure and sell.
- **Per-seat pricing** — misaligned; value is in conversations and revenue, not human seats.

### Revenue assumptions to validate

- Merchants will pay $200+/month if ROI is shown within 30 days.
- Conversation-based pricing is understandable and predictable enough for SMB buyers.
- Channel add-ons (each additional channel) support natural expansion revenue without forcing enterprise pricing early.

---

## Cost Structure

### Main costs

| Category | Description | Risk |
|----------|-------------|------|
| **LLM inference** | Per-conversation model costs (primary variable cost) | Margin erosion if conversations are long or pricing too low |
| **Engineering** | Platform, integrations, agent runtime, channel connectors | Largest fixed cost pre-PMF |
| **Infrastructure** | Hosting, databases, message queues, observability | Scales with merchants and message volume |
| **Channel API costs** | Telegram/Bale bot infrastructure; future WhatsApp Business API fees | WhatsApp can be expensive per conversation |
| **Customer onboarding** | High-touch setup for early cohorts | Must decrease to self-serve or CAC breaks |
| **Support & success** | Helping merchants tune agents and prove ROI | Needed for retention early; must productize playbooks |
| **Sales & marketing** | Outbound, content, app store presence, events | Deferred until message-market fit signal |
| **Compliance & trust** | Data handling, merchant customer PII, regional messaging regulations | Non-trivial for multi-region expansion |

### Unit economics hypothesis (to validate)

- **Target gross margin:** 60–70% at scale after LLM and infra.
- **Target CAC payback:** < 6 months on Growth tier.
- **Break-even:** Requires ~50–100 paying merchants on Growth tier or equivalent MRR mix — exact number depends on team size and burn.

---

## Key Metrics

### Product KPIs

| Metric | Definition | MVP target (hypothesis) |
|--------|------------|---------------------------|
| **Time to first live conversation** | Signup → agent handling real customer message | < 24 hours |
| **Agent resolution rate** | Conversations closed without human escalation | ≥ 50% MVP; ≥ 70% before GA |
| **Answer accuracy (sampled)** | Correct product/policy responses on audited sample | ≥ 90% MVP; ≥ 95% for autonomy |
| **Escalation rate** | % conversations handed to human | Track and reduce over time; never zero |
| **Channel activation** | Merchants with ≥2 channels live | ≥ 40% of paying customers within 90 days |

### Business KPIs

| Metric | Definition | Early target |
|--------|------------|--------------|
| **MRR** | Monthly recurring revenue | First $10K MRR as initial milestone |
| **Paid merchants** | Active paying accounts | 10 design partners → 50 paying |
| **Logo retention (monthly)** | % merchants renewing | ≥ 85% after month 3 (honest baseline, not 95%+) |
| **Net revenue retention** | Expansion minus churn | > 100% only after upsell motion proven |
| **CAC** | Cost to acquire paying merchant | Track manually in early stage |
| **LTV:CAC** | Lifetime value vs. acquisition cost | Target 3:1; unlikely in first 6 months |
| **Attributed revenue per merchant** | GMV influenced by agent | Must be non-zero for majority of cohort |

### AI KPIs

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **Grounded response rate** | Responses citing synced catalog/policy data | Proves commerce-native differentiation |
| **Hallucination rate** | Incorrect product/policy claims (audited) | Trust killer; must stay < 2% on factual questions |
| **Conversion lift (assisted vs. unassisted)** | Purchase rate when agent involved | Core value proof |
| **Cart recovery rate** | Abandoned carts recovered via agent outreach/reply | Direct revenue attribution |
| **Cost per resolved conversation** | LLM + infra cost / resolved conversation | Unit economics health |
| **Human override rate** | Merchant corrections to agent responses | Signals trust and tuning needs |

---

## Unfair Advantage

### Current advantages (honest assessment)

| Advantage | Defensibility | Status |
|-----------|---------------|--------|
| **Commerce-first agent design** | Medium — concept is copyable; execution and integration depth are not instant | Building |
| **Omnichannel unified memory** | Medium — requires sustained connector investment | Partial (web, Telegram, Bale) |
| **Regional channel focus (Bale, Telegram)** | Medium-high in Iran — global players under-invest here | Early mover if executed well |
| **Founder domain proximity** | Low alone — matters only if translated into customer access and iteration speed | Assumed, not proven |

### Potential long-term moats (not yet earned)

1. **Integration depth** — Agents that read/write catalog, cart, and orders outperform generic wrappers; switching cost rises as agents learn merchant-specific policies and edge cases.
2. **Permissioned conversation data** — Aggregated objection patterns and conversion interventions improve agent performance across similar verticals (with strict privacy controls).
3. **Revenue attribution graph** — Proprietary link between conversation → intervention → purchase is hard to replicate without commerce connectors and longitudinal data.
4. **Regional messaging infrastructure** — Reliable Bale/Telegram commerce workflows plus future WhatsApp/Instagram in target markets.

### What is NOT an unfair advantage today

- Using frontier LLMs (commoditized).
- "AI Employees" branding (marketing, not moat).
- Feature parity with Intercom + ChatGPT plugin (easily replicated).

**Investor framing:** Defensibility must be earned through integration depth, measurable ROI, and retention — not assumed from AI hype.

---

## Risks and Assumptions

### Critical assumptions (must be true for this to work)

1. **Merchants will trust AI** to speak to customers if guardrails and escalation are visible.
2. **Store integration alone** provides enough context for accurate answers on most SKUs (without manual FAQ curation for every product).
3. **Attributing revenue to conversations** is feasible and convincing enough for buyers to renew.
4. **SMB merchants will pay $100–500/month** for measurable conversion and support savings.
5. **Telegram and Bale** are sufficient channels to prove value in initial market before Instagram/WhatsApp investment.
6. **LLM costs** can be managed to preserve gross margin at proposed price points.
7. **Time-to-value under 24 hours** is achievable with self-serve onboarding for non-technical merchants.

### Key risks

| Risk | Severity | Mitigation direction |
|------|----------|---------------------|
| **Agent hallucination damages merchant brand** | High | Ground in commerce data; conservative escalation; human review mode at launch |
| **Low conversion lift** — agent chats but does not sell | High | Revenue-focused agent design; A/B measurement from day one |
| **Integration fragility** (Shopify/Woo API changes, sync delays) | High | Robust sync, stale-data handling, clear "I don't know" behavior |
| **Channel platform dependency** (Telegram, Bale policy/API changes) | Medium | Abstract channel layer; diversify to web + WhatsApp |
| **Commoditization** by storefront platforms (Shopify Sidekick, etc.) | Medium | Go deeper on omnichannel + attribution + regional channels |
| **Long sales cycle for SMB** despite low price | Medium | PLG trial, ROI calculator, design partner case studies |
| **Regulatory / data privacy** (customer PII in conversations) | Medium | Clear data policy, regional compliance roadmap |
| **Overbuilding before PMF** | High | Strict MVP scope; one storefront platform first; one primary agent type |

---

## Validation Plan

Experiments are ordered by **kill-or-continue decisiveness**. Each has a clear success/fail signal and time box. Failure is an acceptable outcome — it saves capital.

### Phase 0: Problem validation (Weeks 1–4)

| Experiment | Method | Success signal | Fail signal |
|------------|--------|----------------|-------------|
| **Merchant interviews** | 15–20 interviews with ICP shop owners | ≥ 60% confirm lost sales from slow/missing replies; ≥ 40% tried and rejected generic chatbot | Problem ranked low vs. ads, logistics, inventory |
| **Channel behavior audit** | Observe 10 shops' Telegram/Bale response times | Median first response > 2 hours; repeated FAQ patterns visible | Merchants already respond in minutes with high conversion |
| **Willingness to pay** | Price anchor in interviews ($99, $299, $499) | ≥ 30% express likely purchase at $199+ with ROI proof | Strong interest only at free or <$50 |

### Phase 1: Solution validation — concierge MVP (Weeks 5–10)

| Experiment | Method | Success signal | Fail signal |
|------------|--------|----------------|-------------|
| **Concierge agent for 3–5 design partners** | Manually configure agents; founder monitors quality | ≥ 3 partners report saved hours/week; ≥ 2 attribute ≥1 sale/recovery to agent | Partners disable agent or revert to human-only |
| **Accuracy audit** | Sample 100 conversations per partner | ≥ 85% factually correct on product/policy | < 75% accuracy or brand-damaging errors |
| **Resolution without human** | Track escalation rate | ≥ 40% fully resolved by agent | Agent escalates > 80% or customers complain |

### Phase 2: Product validation — self-serve beta (Weeks 11–18)

| Experiment | Method | Success signal | Fail signal |
|------------|--------|----------------|-------------|
| **Self-serve onboarding** | 10 merchants use onboarding without founder setup | ≥ 70% reach live agent within 48 hours | Majority stall at integration or config |
| **Multi-channel adoption** | Offer web + Telegram + Bale | ≥ 50% activate ≥ 2 channels within 30 days | Single-channel only; no expansion |
| **Paid conversion** | Convert design partners + new beta to paid | ≥ 40% of active beta converts to paid within 30 days | Usage without willingness to pay |
| **30-day retention** | Track month-2 renewal | ≥ 75% of first paid cohort renews | Churn citing "no ROI" or "AI not good enough" |

### Phase 3: Business model validation (Weeks 19–26)

| Experiment | Method | Success signal | Fail signal |
|------------|--------|----------------|-------------|
| **Pricing sensitivity** | A/B or cohort test across 2 price points | Similar conversion at $299 vs. $199 with acceptable LTV | Sharp drop above $149 |
| **Unit economics** | Measure cost per conversation vs. revenue | Gross margin ≥ 55% on representative merchant | LLM costs exceed 40% of revenue |
| **ROI proof package** | Standardized before/after report per merchant | ≥ 60% of merchants show measurable attributed revenue or support hour reduction | Metrics too noisy to convince buyers |

### Kill criteria (pivot or stop)

Stop or pivot if, after Phase 1 or Phase 2:

- **Accuracy cannot reach 85%+** on factual commerce questions with store integration alone.
- **< 25% of design partners** report meaningful value after 30 days of live usage.
- **Zero attributable conversions** across 5+ active merchants over 60 days.
- **Merchants refuse to pay** even when support hours saved are documented (suggests vitamin, not painkiller).

### Continue criteria (proceed to full product development)

Proceed when:

- ≥ 5 paying merchants on beta pricing with ≥ 75% month-2 retention.
- Documented conversion lift or cart recovery in ≥ 3 case studies.
- Agent resolution rate ≥ 50% with hallucination rate < 5% on audited sample.
- Clear path to 60%+ gross margin at Growth tier pricing.

---

## Document Notes

This Lean Canvas is a **hypothesis document**, not a business plan. Numbers are directional. Assumptions must be validated before committing to full product development.

**Next review:** After Phase 0 merchant interviews — update Problem, Customer Segments, and Pricing based on evidence.

**Related documents:** [Vision Document](./vision.md)
