# Product Roadmap

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Active |
| **Owner** | Founder / Product |
| **Last Updated** | July 20, 2026 |
| **Related Documents** | [Vision](./vision.md) · [Lean Canvas](./lean-canvas.md) |

### Phase Summary

| Phase | Name | Timeline (target) | Outcome |
|-------|------|-------------------|---------|
| **Phase 0** | Discovery | Weeks 1–4 | Problem validated; design partners committed |
| **Phase 1** | MVP | Weeks 5–14 | Core product live with first paying merchants |
| **Phase 2** | Beta | Weeks 15–26 | Self-serve onboarding; product-market fit signal |
| **Phase 3** | Growth | Months 7–18 | Public launch; channel and automation expansion |
| **Phase 4** | Platform | Months 18–36 | API, ecosystem, and scale infrastructure |

---

## Product Strategy

DeloRey AI is built as a **commerce operating layer**, not a chatbot builder. The roadmap follows a strict sequence: prove the problem, prove the agent works on real revenue, prove merchants will pay, then expand channels and platform capabilities.

### Roadmap philosophy

1. **Revenue before reach.** Every phase must demonstrate measurable commerce outcomes — conversion lift, cart recovery, or support hours saved — before we add channels or features.
2. **Depth before breadth.** One storefront integration, one agent type, and three channels (web, Telegram, Bale) must work reliably before Instagram, WhatsApp, or multi-agent orchestration.
3. **Context over cleverness.** Features that deepen commerce data integration (catalog, orders, policies) outrank features that add conversational flair without business grounding.
4. **Merchant trust is the product.** Guardrails, escalation, audit logs, and human override ship with MVP — not as enterprise add-ons.
5. **Ship to learn, not to impress.** Phases have explicit exit criteria and kill signals. We expand scope only when the current phase's metrics are met.

### Strategic arc

```
Discovery → Prove agent works → Prove merchants pay → Public launch & expand → Platform & ecosystem
```

---

## Phase 0 — Discovery

**Objective:** Validate that online merchants lose revenue from slow, fragmented conversations and will pay for a commerce-native AI solution.

### Goals

- Confirm top problems (lost sales, slow response, repetitive support) with ICP merchants.
- Map real workflows across website chat, Telegram, and Bale.
- Identify design partners willing to run a concierge MVP.
- Establish baseline metrics: response time, FAQ patterns, cart abandonment drivers.
- Validate willingness to pay at $99–$499/month with ROI proof.

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| **Merchant interview synthesis** | 15–20 structured interviews with D2C / mid-market shop owners |
| **Channel behavior audit** | Response-time and FAQ analysis across 10 active shops |
| **ICP refinement** | Updated buyer and user personas based on evidence |
| **Competitive landscape** | Gap analysis vs. live chat, helpdesk, and generic chatbots |
| **Design partner shortlist** | 5–10 merchants committed to concierge pilot |
| **Success metric definitions** | Agreed KPIs for resolution rate, accuracy, and attribution |

### Exit criteria

Proceed to MVP development when:

- ≥ 60% of interviewed merchants confirm lost sales from slow or missing replies.
- ≥ 40% have tried and rejected a generic chatbot.
- ≥ 30% express likely purchase at $199+/month with demonstrated ROI.
- ≥ 5 design partners agree to a 30-day concierge pilot.
- Clear FAQ and objection patterns visible across channels (validates agent training approach).

**Kill signal:** Problem ranked low vs. ads, logistics, or inventory; or willingness to pay only at free / <$50.

---

## Phase 1 — MVP

**Objective:** Ship a focused AI commerce product that handles real customer conversations on web, Telegram, and Bale — and proves value with design partners.

**Timeline:** Weeks 5–14

### Goals

- Connect a merchant's storefront and go live on at least one channel within 24 hours.
- Resolve ≥ 50% of routine product and policy questions without human escalation.
- Achieve ≥ 90% factual accuracy on audited commerce responses.
- Attribute at least one conversion or cart recovery per design partner within 14 days.
- Establish the merchant control plane as the daily operations hub.

### Features

#### Website Chat

- Embeddable chat widget for Shopify / WooCommerce storefronts.
- Persistent session with customer context (page viewed, cart state).
- Mobile-responsive UI matching merchant brand colors.
- Offline / human-handoff state when agent escalates.

#### Telegram Bot

- Bot connected to merchant's Telegram business account or channel.
- Same agent brain and memory as website chat.
- Support for text, product cards, and link-to-checkout flows.
- Merchant notification on escalation.

#### Bale Bot

- Bot connected to merchant's Bale presence (Iran-first channel).
- Feature parity with Telegram bot where Bale API allows.
- Unified customer identity across Bale and other channels.

#### AI Sales Agent

- Pre-purchase: product fit, availability, sizing, compatibility, shipping, returns.
- Product recommendations grounded in live catalog data.
- Post-purchase: order status lookup, return eligibility, basic policy answers.
- Confidence-based escalation to human when uncertain or policy requires approval.
- Merchant-configurable tone, discount limits, and escalation rules.

#### Knowledge Base

- Auto-sync from connected storefront: catalog, inventory flags, pricing, shipping and return policies.
- Manual FAQ and policy overrides for edge cases not in catalog data.
- Document upload (PDF, text) for supplementary product or brand context.
- Source attribution so merchants can audit what the agent knows.

#### Dashboard

- Unified inbox across website, Telegram, and Bale.
- Agent configuration: tone, policies, guardrails, escalation rules.
- Conversation review with human override and correction.
- Basic analytics: conversations, resolution rate, escalation rate, attributed conversions.
- Audit log of agent actions and recommendations.

### Not included

| Excluded | Rationale |
|----------|-----------|
| Instagram, WhatsApp, email, SMS | Validate core channels first; higher API cost and complexity |
| Marketing automation and campaign triggers | Revenue attribution must be proven before outbound automation |
| Multi-agent orchestration (Sales + Support + Marketing) | Single AI Sales Agent covers MVP use cases |
| Public API and developer platform | No external consumers until product is stable |
| Vertical editions (fashion, electronics, etc.) | General commerce agent first; verticalize after PMF |
| Voice, IVR, in-store | Post-platform expansion |
| Advanced BI and custom reporting | Basic dashboard sufficient for design partners |
| Multi-store / multi-brand management | Single-store focus for MVP |
| White-label or reseller program | Requires platform maturity |

### Success metrics

| Metric | MVP target |
|--------|------------|
| Time to first live conversation | < 24 hours from signup |
| Agent resolution rate | ≥ 50% without human escalation |
| Answer accuracy (audited sample) | ≥ 90% on product/policy questions |
| Hallucination rate | < 5% on factual commerce questions |
| Design partner retention (30 days) | ≥ 75% still active |
| Attributed conversion / recovery | ≥ 1 per partner within 14 days |
| Channels activated per merchant | ≥ 1 (target ≥ 2 by end of phase) |
| Merchant NPS (design partners) | ≥ 40 |

### Exit criteria

Proceed to Beta when:

- ≥ 5 design partners live on production with ≥ 30 days of usage.
- Agent resolution rate ≥ 50% with hallucination rate < 5%.
- ≥ 3 documented case studies with measurable revenue or support-hour impact.
- Core integrations (one storefront platform + three channels) stable for 2+ weeks without critical incidents.

---

## Phase 2 — Beta

**Objective:** Transition from founder-led onboarding to self-serve beta, incorporate customer feedback, and validate willingness to pay at scale.

**Timeline:** Weeks 15–26

This phase corresponds to **closed beta** — invited merchants beyond design partners, with assisted onboarding available but not required.

### Goals

- Enable self-serve onboarding: ≥ 70% of beta merchants reach a live agent within 48 hours without founder setup.
- Convert ≥ 40% of active beta users to paid within 30 days.
- Raise agent resolution rate to ≥ 60% and accuracy to ≥ 93%.
- Achieve ≥ 75% month-2 retention on first paid cohort.
- Build the feedback loop that informs Growth phase priorities.

### Customer feedback

| Initiative | Purpose |
|------------|---------|
| **In-app feedback widget** | Capture merchant corrections and feature requests at point of use |
| **Weekly beta cohort calls** | Structured sessions with 5–8 merchants per cohort |
| **Conversation review program** | Merchants flag bad responses; product team audits weekly |
| **Churn interviews** | Exit interviews within 48 hours of cancellation |
| **Feature voting board** | Prioritize improvements based on merchant demand, not internal assumptions |
| **NPS / CSAT surveys** | Quarterly pulse on trust, ROI perception, and ease of use |

**Key questions to answer in Beta:**

- Where does onboarding stall (store connection, agent config, channel deployment)?
- Which product categories cause the most escalations?
- Do merchants trust the agent enough to reduce human coverage?
- What analytics do buyers need to justify renewal?

### Analytics

| Capability | Description |
|------------|-------------|
| **Conversion attribution** | Link conversations to purchases with assisted vs. unassisted comparison |
| **Funnel analytics** | Track conversation → recommendation → add-to-cart → purchase |
| **Objection taxonomy** | Auto-classify top blockers: shipping, sizing, price, trust, availability |
| **Channel performance** | Compare resolution rate, conversion lift, and volume per channel |
| **Agent quality dashboard** | Grounded response rate, escalation reasons, override frequency |
| **ROI report (exportable)** | Before/after summary merchants can share with stakeholders |
| **Cost per resolved conversation** | Internal unit economics visibility for pricing validation |

### Improvements

| Area | Beta improvements |
|------|-------------------|
| **Onboarding** | Guided setup wizard, integration health checks, test-conversation simulator |
| **Agent quality** | Improved retrieval from knowledge base; better handling of ambiguous queries |
| **Inbox UX** | Filters, tags, assignment to team members, canned human responses |
| **Guardrails** | Keyword blocklists, approval queue for discounts, restricted topic lists |
| **Performance** | Sub-3-second response latency on p95; widget load time < 1s |
| **Reliability** | 99.5% uptime SLA target; graceful degradation when store sync is stale |
| **Billing** | Self-serve subscription, usage metering, plan upgrade/downgrade |
| **Documentation** | Help center, setup guides per channel, troubleshooting playbooks |

### Success metrics

| Metric | Beta target |
|--------|-------------|
| Self-serve onboarding completion | ≥ 70% within 48 hours |
| Paid conversion (active beta → paid) | ≥ 40% within 30 days |
| Month-2 logo retention (paid cohort) | ≥ 75% |
| Agent resolution rate | ≥ 60% |
| Answer accuracy | ≥ 93% |
| Multi-channel activation | ≥ 50% of paying merchants on ≥ 2 channels |
| Gross margin (representative merchant) | ≥ 55% |
| MRR milestone | First $10K MRR |

### Exit criteria — Public Launch readiness

Proceed to Growth (public launch) when:

- ≥ 50 paying merchants with ≥ 75% month-2 retention.
- ≥ 3 published case studies with conversion lift or cart recovery data.
- Self-serve onboarding proven without founder intervention.
- Gross margin ≥ 55% at Growth tier pricing.
- No P0 incidents in production for 30 consecutive days.

---

## Phase 3 — Growth

**Objective:** Public launch, expand channels and automation, and scale merchant acquisition.

**Timeline:** Months 7–18

This phase is **Public Launch** — open signup, app store listings, and scaled go-to-market.

### Goals

- Grow to 200+ paying merchants and $50K+ MRR.
- Launch 2–3 additional channels (WhatsApp, Instagram DMs, email).
- Introduce workflow automation that drives measurable revenue recovery.
- Reduce CAC through product-led growth and partner referrals.
- Achieve net revenue retention > 100% through channel and usage expansion.

### More channels

| Channel | Priority | Notes |
|---------|----------|-------|
| **WhatsApp Business API** | P0 | High intent in MENA and global expansion; manage per-conversation API cost |
| **Instagram DMs** | P0 | Critical for D2C brands; Meta API integration |
| **Email** | P1 | Async support and cart recovery sequences |
| **SMS** | P2 | High-cost; selective use for recovery and order updates |
| **Facebook Messenger** | P2 | Shares Meta infrastructure with Instagram |

**Channel principles:**

- One agent brain, channel-specific formatting.
- Unified customer identity and conversation history across all channels.
- Per-channel analytics in dashboard; merchants enable channels incrementally.

### Automation

| Automation | Description |
|------------|-------------|
| **Abandoned cart recovery** | Agent initiates follow-up on abandoned carts via messaging channels |
| **Proactive outreach** | Trigger messages based on browse behavior, cart idle time, or repeat questions |
| **Auto-escalation rules** | Route high-value or angry customers to human staff instantly |
| **Business hours routing** | Agent vs. human availability by schedule and channel |
| **Follow-up sequences** | Post-purchase check-in, review request, replenishment reminders |
| **Smart handoff** | Context packet transferred to human with full conversation and customer data |

### Integrations

| Integration | Purpose |
|-------------|---------|
| **CRM sync** (HubSpot, etc.) | Push conversation insights and customer records |
| **Helpdesk** (Zendesk, etc.) | Bidirectional ticket creation on escalation |
| **Additional storefronts** | Expand beyond initial platform (e.g., second e-commerce platform) |
| **Payment providers** | Order and refund context for post-purchase conversations |
| **Analytics** (GA4, etc.) | Cross-reference assisted conversion data |
| **Slack / Teams** | Internal alerts for escalations and daily digest |

### Additional Growth features

- **Support Agent** — dedicated post-purchase agent alongside Sales Agent.
- **Team collaboration** — roles, permissions, conversation assignment.
- **Advanced analytics** — cohort analysis, A/B testing of agent interventions.
- **Shopify / WooCommerce app directory** listings.
- **Agency partner program** — referral fees and co-marketing.
- **Localization** — multi-language agent responses for expansion markets.

### Success metrics

| Metric | Growth target |
|--------|---------------|
| Paying merchants | 200+ |
| MRR | $50K+ |
| Logo retention (monthly) | ≥ 90% |
| Net revenue retention | > 100% |
| Agent resolution rate | ≥ 70% |
| Answer accuracy | ≥ 95% |
| Channels per merchant (avg.) | ≥ 2.5 |
| CAC payback | < 6 months |
| Attributed revenue per merchant | Non-zero for ≥ 80% of cohort |

---

## Phase 4 — Platform

**Objective:** Become the commerce intelligence layer — extensible by partners, essential to merchant operations, and defensible through ecosystem depth.

**Timeline:** Months 18–36

This phase is **Scale** — infrastructure, ecosystem, and enterprise readiness.

### Goals

- Launch public API and developer documentation.
- Enable third-party agents and integrations via marketplace.
- Support multi-brand and enterprise deployments.
- Achieve 1,000+ paying merchants and $500K+ MRR.
- Net revenue retention ≥ 120%.

### AI Agent ecosystem

| Component | Description |
|-----------|-------------|
| **Multi-agent orchestration** | Sales, Support, Marketing, and Analytics agents share context and hand off autonomously |
| **Agent runtime** | Standardized execution environment with tool access, guardrails, and audit |
| **Custom agent builder** | Merchants and partners configure specialized agents within platform guardrails |
| **Vertical agent packs** | Pre-trained editions for fashion, electronics, food & beverage, services |
| **Agent performance benchmarking** | Compare agent versions and configurations with revenue impact |

**Example orchestration flow:**

```
Customer asks about delayed order (Support)
  → Support Agent resolves tracking issue
  → Detects repeat buyer interest in new collection (Sales signal)
  → Sales Agent offers personalized recommendation
  → Analytics Agent logs objection pattern for merchant dashboard
```

### API

| Surface | Purpose |
|---------|---------|
| **REST API** | Conversations, customers, agents, analytics, webhooks |
| **Webhooks** | Real-time events: new conversation, escalation, conversion, sync failure |
| **SDKs** | JavaScript (widget extension), Python, Node.js for server-side integrations |
| **Embed SDK** | Custom UI on top of DeloRey agent runtime |
| **Data export API** | Merchant-owned conversation and analytics export |
| **Sandbox environment** | Safe testing for agencies and developers |

**API principles:**

- Merchants own their data; API enables portability and custom workflows.
- Rate limits and auth scoped per merchant and integration.
- Versioned API with 12-month deprecation policy.

### Marketplace

| Category | Examples |
|----------|----------|
| **Agent templates** | Returns specialist, B2B quoting, subscription retention |
| **Channel connectors** | Built by partners for regional messaging platforms |
| **Data enrichers** | Reviews, UGC, loyalty points fed into agent context |
| **Workflow plugins** | Custom escalation logic, approval chains, CRM automations |
| **Vertical packs** | Compliance defaults, objection libraries, seasonal playbooks |

**Marketplace model:**

- Partner-built extensions certified for DeloRey runtime.
- Revenue share on paid marketplace listings.
- Review and security audit before publication.

### Scale infrastructure

| Area | Capability |
|------|------------|
| **Multi-tenant architecture** | Isolated merchant data, shared runtime efficiency |
| **Global deployment** | Regional data residency for compliance (EU, MENA) |
| **Enterprise SSO & RBAC** | SAML, fine-grained permissions, audit compliance |
| **SLA tiers** | 99.9% uptime, dedicated support, custom model routing |
| **Multi-brand governance** | Agent fleets across brands, regions, and channels from one control plane |
| **Voice and IVR** | Phone channel connected to same agent brain |

### Success metrics

| Metric | Platform target |
|--------|-----------------|
| Paying merchants | 1,000+ |
| MRR | $500K+ |
| Net revenue retention | ≥ 120% |
| Marketplace listings | 25+ certified extensions |
| API-active merchants | ≥ 15% of Scale tier |
| Enterprise accounts | 20+ multi-brand deployments |
| Agent resolution rate | ≥ 75% |
| Platform gross margin | ≥ 65% |

---

## 3 Year Vision

By July 2029, DeloRey AI evolves from a focused AI sales tool into the **commerce operating layer** merchants install alongside their payment processor.

### Year 1 — Foundation (Discovery → Beta → Early Growth)

- Prove the AI Sales Agent drives measurable revenue on web, Telegram, and Bale.
- Establish merchant trust through guardrails, accuracy, and transparent attribution.
- Reach 50–100 paying merchants with documented ROI case studies.
- Launch public beta and open signup with self-serve onboarding.

**Identity:** *The AI employee that sells and supports on the channels Iranian and MENA merchants already use.*

### Year 2 — Expansion (Growth → Early Platform)

- Become the default AI commerce layer for D2C brands in initial markets.
- Expand to WhatsApp, Instagram, and email with unified agent memory.
- Introduce Support and Marketing agents with orchestrated handoffs.
- Launch public API, webhooks, and agency partner program.
- Reach 200–500 paying merchants; $50K–$200K MRR.

**Identity:** *The omnichannel AI commerce team that never sleeps.*

### Year 3 — Platform (Scale)

- Operate a thriving agent marketplace with partner-built extensions.
- Serve enterprise and multi-brand merchants with governance and compliance.
- Deliver predictive commerce: proactive recovery, replenishment, and win-back driven by conversation intelligence.
- Expand globally with localized agents (language, currency, regional compliance).
- Reach 1,000+ paying merchants; $500K+ MRR; NRR ≥ 120%.

**Identity:** *The commerce intelligence layer — essential infrastructure for AI-native online business.*

### Evolution diagram

```
Year 1                    Year 2                         Year 3
──────                    ──────                         ──────
AI Sales Agent      →     Multi-agent fleet          →   Agent marketplace
3 channels          →     6+ channels                →   Global channel coverage
Basic dashboard     →     Revenue attribution + BI   →   Predictive commerce
Design partners     →     PLG + partners             →   Enterprise + ecosystem
Manual onboarding   →     Self-serve + API           →   Platform extensibility
```

---

## Roadmap Principles

Features are prioritized using a consistent framework. When in doubt, we ship what moves a commerce metric for merchants — not what sounds impressive in a demo.

### 1. Impact on merchant revenue

| Priority | Definition | Example |
|----------|------------|---------|
| **P0** | Directly drives conversion, recovery, or retention | Cart recovery automation, product recommendations |
| **P1** | Reduces support cost or increases agent resolution | Knowledge base improvements, escalation UX |
| **P2** | Enables expansion revenue or retention | New channel, team roles, advanced analytics |
| **P3** | Strategic / ecosystem bets | Marketplace, API, vertical editions |

### 2. Confidence vs. effort

We prioritize **high-confidence, medium-effort** items in early phases. Low-confidence bets (new markets, new agent types) require explicit validation experiments before full build.

```
                    High Impact
                        │
         ┌──────────────┼──────────────┐
         │   DO FIRST   │   PLAN WELL  │
         │  (Quick wins)│  (Strategic) │
 Low ────┼──────────────┼──────────────┼──── High
 Effort  │   FILL IN    │   DEFER OR   │     Effort
         │  (If cheap)  │   VALIDATE   │
         └──────────────┼──────────────┘
                        │
                    Low Impact
```

### 3. Merchant segment focus

| Phase | Primary segment |
|-------|-----------------|
| MVP – Beta | D2C / mid-market, $500K–$10M GMV, Telegram/Bale active |
| Growth | Same segment + WhatsApp/Instagram-heavy brands |
| Platform | Enterprise, multi-brand, agencies, international |

We do not build for enterprise requirements (SSO, custom SLAs) until Growth phase metrics are met.

### 4. Build vs. integrate

- **Integrate** when a best-in-class tool exists (CRM, helpdesk, analytics).
- **Build** when the capability is core differentiation (agent runtime, commerce grounding, attribution, channel unification).
- **Partner** when ecosystem scale exceeds internal capacity (marketplace agents, regional connectors).

### 5. Non-negotiables (never deprioritized)

- Agent accuracy and hallucination prevention.
- Merchant control and escalation paths.
- Data security and customer PII handling.
- Revenue attribution honesty (no inflated metrics).
- Uptime and response latency on customer-facing channels.

### 6. What we say no to

Aligned with [Vision non-goals](./vision.md#non-goals):

- Generic chatbot builder features (arbitrary conversation trees).
- Storefront or website builder capabilities.
- CRM replacement scope.
- Features unrelated to commerce outcomes.
- Black-box autopilot without merchant visibility.

### Prioritization review cadence

| Cadence | Activity |
|---------|----------|
| **Weekly** | Engineering sprint planning against current phase exit criteria |
| **Bi-weekly** | Review merchant feedback, support tickets, and churn signals |
| **Monthly** | Phase progress check; adjust feature order within phase |
| **Quarterly** | Strategic review: confirm phase, kill/pivot signals, Year vision alignment |

---

## Document Notes

This roadmap is a **living document**. Timelines are directional targets, not commitments. Phase transitions require exit criteria to be met — not calendar dates alone.

**Next review:** After Phase 0 merchant interviews — update timelines and MVP scope based on validation evidence.

**Change log:**

| Date | Change |
|------|--------|
| July 20, 2026 | Initial roadmap v1.0 |
