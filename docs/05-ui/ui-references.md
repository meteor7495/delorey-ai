# UI References (Market Pattern Map)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — reference board for Design / Frontend (no Figma required) |
| **Last Updated** | July 25, 2026 |
| **Parent** | [UI/UX Index](./README.md) · [Market Research](../01-business/market-research.md) · [Business Plan — Competitive Landscape](../01-business/business-plan.md) |
| **Related** | [Workspace Screens](./workspace-screens.md) · [UX Foundation](./ux-foundation.md) · [Design System](./design-system.md) · [Copy & Tone](./copy-tone.md) |

**Job:** Map *which* market products to study for *which* DeloRey screen — what to borrow, what to reject. Identity stays DeloRey (AI Sales Employee, commerce grounding, Persian + Telegram/Bale). Do not clone a competitor’s brand or IA wholesale.

**Method:** Screenshot → annotate against this table → implement per [Workspace Screens](./workspace-screens.md). Mystery-shop when possible; marketing pages alone are weak evidence.

---

# 1. Reference stack (locked)

| Role | Primary | Secondary | Job |
|------|---------|-----------|-----|
| **Shell / onboarding / widget chrome** | Crisp | Tidio | Low friction SMB control plane |
| **Inbox as commerce ops** | Gorgias | — | Thread next to store context, not tickets |
| **Handoff / AI vs human clarity** | Intercom | — | Ownership, takeover, state honesty |
| **Persian merchant expectation** | Gofta / Yektabot | InstaCRM, Roboclick | FA copy, pricing mental model, connect wizards |
| **Product identity** | DeloRey docs only | — | Sync health, Employee, guardrails, Knowledge, honest revenue |

```
Crisp / Tidio     → shell, onboarding, widget chrome
Gorgias           → inbox as commerce ops
Intercom          → handoff / AI vs human clarity
Local FA tools    → Persian copy & merchant expectations
DeloRey docs      → sync banner, AI states, Knowledge, Revenue honesty
```

---

# 2. Explicit anti-references

| Product | Do not use as primary UX model | Why |
|---------|--------------------------------|-----|
| ManyChat | Flow canvas, broadcast funnels | Chatbot-builder identity |
| Botpress | Visual bot IDE | Developer TTV weeks; anti-opinionated Employee |
| Zendesk | Ticket queues / SLA boards | Conversations ≠ tickets ([Product Scope](../02-product/product-scope.md)) |
| HubSpot | CRM pipeline chrome | Wrong SoR; not live Sales Employee ops |
| Generic “AI purple glow” dashboards | Vanity autonomy UI | Conflicts [Design System](./design-system.md) commerce-ops calm |

Local IG-first tools: **study copy/friction**, do not adopt Instagram-primary nav (MVP channels = Website, Telegram, Bale).

---

# 3. Screen → reference map

## Auth (`/login` `/signup` `/reset`)

| Borrow from | Pattern |
|-------------|---------|
| Crisp / Tidio | Single-column calm form; short path; clear error inline |
| Gofta / Yektabot | Persian field labels, password-reset expectation |

| Reject | Pattern |
|--------|---------|
| Enterprise SSO-first walls | Not MVP bar for Iran SMB |
| Social-login sprawl as requirement | Optional later |

**DeloRey delta:** After auth → Home triage or Onboarding, not empty “create a bot.”

---

## Home (`/home`)

| Borrow from | Pattern |
|-------------|---------|
| Crisp | “What needs you” sparse home — not a metric wall |
| Intercom | Attention badges that mean work (unread / needs reply) |

| Reject | Pattern |
|--------|---------|
| Tidio marketing dashboards | Feature promo cards burying sync failures |
| BI-style KPI grids | Wrong first job |

**DeloRey delta:** Priority = sync unhealthy → escalations → Employee health → else Dashboard ([IA](./information-architecture.md)). Always show **AIStateChip**.

---

## Onboarding (`/onboarding`)

| Borrow from | Pattern |
|-------------|---------|
| Tidio | Checklist: install → test chat feel |
| Crisp | Few steps, progress visible, deep-link per step |
| Local FA tools | Wizard tone: plain language, screenshot-style instructions |

| Reject | Pattern |
|--------|---------|
| Botpress / ManyChat | “Build your first flow” |
| Empty canvas | “Configure intents” labyrinth |

**DeloRey delta:** Ordered: Store → Sync healthy → Employee → Channel → Test. No go-live celebration while sync/channel fail ([Flows](./flows.md)).

---

## Store / Sync (`/store`)

| Borrow from | Pattern |
|-------------|---------|
| Gorgias (Shopify connect UX) | Connection status + last sync metaphor |
| Shopify admin (light) | Pass/fail integration health language |

| Reject | Pattern |
|--------|---------|
| Generic chatbot “trained” copy | Sync ≠ model training |
| Silent green “connected” | With empty/stale catalog |

**DeloRey delta:** Lag, failure reason, Retry/Reconnect; stale ≠ healthy. Banner sitewide when unhealthy ([UX Foundation](./ux-foundation.md)).

---

## Employee (`/employee`)

| Borrow from | Pattern |
|-------------|---------|
| Intercom Fin / agent settings (light) | Role-like settings, not prompt dump |
| Crisp | Short forms, progressive disclosure |

| Reject | Pattern |
|--------|---------|
| Botpress / ManyChat | Flow trees, intent graphs |
| Raw system-prompt IDE | SMB anti-goal |

**DeloRey delta:** Name / tone / language / Skills toggles / guardrails; copy: *enforced in Runtime*. Hire framing ([Copy & Tone](./copy-tone.md)).

---

## Channels (`/channels`)

| Borrow from | Pattern |
|-------------|---------|
| Tidio / Crisp | Website snippet + copy button + domain help |
| Local Telegram bot UIs | Token paste + “send test message” verification |
| Gorgias channels | Per-channel health row |

| Reject | Pattern |
|--------|---------|
| ManyChat | Channel = broadcast list |
| Theme / page builders | OUT OF MVP |

**DeloRey delta:** Three units only — Website, Telegram, Bale. No Instagram/WhatsApp rows in MVP nav. No per-channel second brain.

---

## Inbox (`/inbox`)

| Borrow from | Pattern |
|-------------|---------|
| **Gorgias (primary)** | Split list/thread; commerce-flavored context beside chat |
| **Intercom (primary for handoff)** | Clear assignee/ownership; note when bot vs human; takeover CTA |
| Crisp | Lightweight density for small teams; mobile-usable |

| Reject | Pattern |
|--------|---------|
| Zendesk | Ticket statuses, SLA clocks as center |
| Helpdesk macros-first | Wrong SoR |

**DeloRey delta:** Context package on escalate (reason, citations, Skill results). Ownership `ai_owned` / `human_owned`. Release to AI audited. Never hide escalations.

---

## Knowledge (`/knowledge`)

| Borrow from | Pattern |
|-------------|---------|
| Intercom Articles (light) | Simple FAQ list + editor |
| Local FA tools | Persian FAQ mental model |

| Reject | Pattern |
|--------|---------|
| Full CMS / help-center product | Scope creep |
| “Upload PDF = instantly smart” | Without index status |

**DeloRey delta:** `source_attribution` + index `active|indexing|failed`; gaps from Dashboard link here.

---

## Dashboard (`/dashboard`)

| Borrow from | Pattern |
|-------------|---------|
| Gorgias reporting (light) | Conversation volume, channel mix |
| Crisp | Sparse charts, action links |

| Reject | Pattern |
|--------|---------|
| Intercom/Zendesk heavy analytics | Advanced BI |
| Fake AI uplift badges | “+X% sales from AI” without proof |

**DeloRey delta:** Resolution proxy, escalation reasons, knowledge gaps, sync health, revenue section with **methodology note** ([PRD-019](../04-prd/basic-analytics.md) / [020](../04-prd/revenue-dashboard.md)).

---

## Audit (`/audit`)

| Borrow from | Pattern |
|-------------|---------|
| Intercom / enterprise audit UIs (light) | Filterable event list + detail drawer |

| Reject | Pattern |
|--------|---------|
| Raw log dump for all roles | RBAC; Transparent AI ≠ leak prompts |

**DeloRey delta:** Turn summary, Skills, guardrail blocks, citation refs; link from Inbox thread.

---

## Website Widget (shopper)

| Borrow from | Pattern |
|-------------|---------|
| **Tidio / Crisp widget** | Launcher, panel, typing, mobile sheet |
| Shopify Inbox (light) | Product cards when data exists |

| Reject | Pattern |
|--------|---------|
| ManyChat | Growth popups / broadcast stickers on page |
| Theme studio | Brand-basic only |

**DeloRey delta:** Employee name in header; handoff “همکار انسانی”; refuse/offline calm copy; product refs **only** from API ([Widget UX](./widget-ux.md)).

---

# 4. Local tools — what to capture in teardown

Mystery-shop **at least two** of: Gofta, Yektabot, InstaCRM, Roboclick.

| Capture | Notes for DeloRey |
|---------|-------------------|
| Signup → first value clicks | Benchmark TTV friction |
| Persian microcopy | Feed [Copy & Tone](./copy-tone.md) |
| Pricing / limits language | Honest packaging later |
| Channel connect UX | Especially Telegram |
| Failure / wrong-answer behavior | Contrast with our grounding + handoff story |

**Do not** copy Instagram-primary IA into MVP Workspace nav.

---

# 5. Reference board workflow

1. Create a folder (Notion/Drive/Figma moodboard — any): one section per screen above.  
2. 2–4 screenshots per section, labeled `BORROW:` / `REJECT:`.  
3. Before implementing a screen, check this map + [Workspace Screens](./workspace-screens.md) acceptance.  
4. Design review gate: AI state, sync honesty, handoff visible ([UX Foundation §11](./ux-foundation.md)).

---

# 6. One-line reminder

**Look like a calm commerce control plane that hired an Employee — not like a bot builder, not like a helpdesk, not like a purple AI demo.**
