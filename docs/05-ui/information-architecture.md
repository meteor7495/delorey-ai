# Information Architecture

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — Workspace IA for MVP |
| **Last Updated** | July 25, 2026 |
| **Parent** | [Frontend Architecture §8](../03-architecture/frontend-architecture.md) · [User Journey](../02-product/user-journey.md) |
| **Related** | [Workspace Screens](./workspace-screens.md) · [Flows](./flows.md) · [PRD Index](../04-prd/README.md) |

**Job:** Define navigation, routes, and primary job per screen so merchants always know where they are and what to do next.

---

# 1. Surfaces

| Surface | Users | IA scope |
|---------|-------|----------|
| **Workspace** | Merchant / operator | Full nav below |
| **Website Widget** | Shopper | No Workspace nav — see [Widget UX](./widget-ux.md) |
| **Telegram / Bale** | Shopper | Adapter only; threads appear in Inbox |

Marketing site is out of this IA (discovery often founder-led).

---

# 2. Workspace chrome

```
┌─────────────────────────────────────────────────────────┐
│ Brand · Workspace name     [AIStateChip]  [User menu]   │
├──────────┬──────────────────────────────────────────────┤
│ Nav      │  PageHeader (title + optional primary CTA)   │
│          │  Main content (one primary job)              │
│          │  Optional Banner (sync / channel)            │
└──────────┴──────────────────────────────────────────────┘
```

Mobile: collapse nav to bottom or hamburger; AIStateChip stays visible.

---

# 3. Primary navigation

| Nav item | Route | Primary job | Journey | PRDs |
|----------|-------|-------------|---------|------|
| خانه | `/` or `/home` | What needs attention? | Triage | 002 |
| شروع کار | `/onboarding` | Checklist to first chat | 2–7 | 002, 004–006, 013 |
| فروشگاه | `/store` | Connect + sync health | 3–4 | 004, 005 |
| کارمند فروش | `/employee` | Configure Sales Employee + guardrails | 5 | 006, 007 |
| کانال‌ها | `/channels` | Website / Telegram / Bale | 6 | 013–015 |
| صندوق ورودی | `/inbox` | Review + takeover | 7–9 | 010–012 |
| دانش | `/knowledge` | FAQ / policy / uploads | 7, 11 | 009 |
| داشبورد | `/dashboard` | Outcomes + revenue basics | 10 | 019, 020 |
| ممیزی | `/audit` | Inspect actions / turns | Transparent AI | 018 |

**Settings** for account/password live under User menu (Auth PRD-001) — not a competing nav pillar.

Unread escalations: badge on **صندوق ورودی** only (not on every nav item).

---

# 4. Route map (canonical)

Aligned with Frontend Architecture; names are Persian in UI, paths English for eng.

| Path | Screen id | Must show |
|------|-----------|-----------|
| `/login`, `/signup`, `/reset` | Auth | Session gate |
| `/home` | Home | Triage + one CTA |
| `/onboarding` | Onboarding | Ordered checklist |
| `/store` | Store | Connect status, last sync, retry |
| `/employee` | Employee | Name, tone, language, Skills, guardrails, status |
| `/channels` | Channels | Three channel units + health |
| `/channels/website` | ChannelWebsite | Snippet + origin/CSP help |
| `/inbox` | Inbox | List + thread + takeover |
| `/inbox?c={id}` | InboxThread | Deep link selected conversation |
| `/knowledge` | Knowledge | FAQ/policy list + index status |
| `/dashboard` | Dashboard | Analytics + revenue tabs/sections |
| `/audit` | Audit | Filterable event list + detail |

V1 (not MVP nav): billing, rich assignment filters — do not add as MVP stretch.

---

# 5. One job per screen

| Screen | Does | Does not |
|--------|------|----------|
| Home | Prioritize attention | Host full Inbox or charts wall |
| Onboarding | Sequence activation | Duplicate deep Employee IDE |
| Store | Commerce truth health | Channel tokens |
| Employee | Role config + guardrails | Catalog editing |
| Channels | Connect & health | Per-channel prompt editors |
| Inbox | Conversations + handoff | Ticket pipelines |
| Knowledge | Grounding content | Sync catalog |
| Dashboard | Measure & gaps | Configure Employee |
| Audit | Explain what happened | Mutate commerce |

---

# 6. Home triage priority

Highest first (stop at first match for **primary** CTA):

1. Sync unhealthy / failed catalog  
2. Escalations awaiting human  
3. Employee paused / degraded / error  
4. Onboarding incomplete (no channel or never tested)  
5. Else → soft link to Dashboard  

Secondary strip may list other issues muted.

---

# 7. Deep links & URL state

| State | URL |
|-------|-----|
| Selected conversation | `/inbox?c=` |
| Inbox filter | `ownership=human_owned` \| `ai_owned` \| `channel=` |
| Dashboard range | `from=` `to=` (eng choice) |
| Audit focus | `conversation_id=` |

URL is shareable for operators; not a second SoR.

---

# 8. IA anti-patterns

- Nav items for OUT-OF-MVP channels  
- “Builder” or “Flows” section  
- Separate “Tickets” SoR next to Inbox  
- Dashboard as default landing when sync is broken  
- Hiding Audit from merchants who need Transparent AI
