# Workspace Screens (MVP)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — screen contracts for MVP Workspace |
| **Last Updated** | July 25, 2026 |
| **Parent** | [Information Architecture](./information-architecture.md) · [Frontend Architecture §9](../03-architecture/frontend-architecture.md) |
| **Related** | [UX Foundation](./ux-foundation.md) · [Flows](./flows.md) · [Copy & Tone](./copy-tone.md) · [PRD Index](../04-prd/README.md) |

Each screen: **Job · Layout · Must · Must not · States · PRDs**. Wireframe = layout blocks, not pixels.

---

# Auth — `/login` `/signup` `/reset`

| | |
|--|--|
| **Job** | Establish identity before any tenant action |
| **PRDs** | [PRD-001](../04-prd/authentication.md) |
| **Journey** | Stage 2 |

**Layout:** Centered form; brand wordmark; link swap login↔signup; reset path.

**Must:** Email/password (or equivalent); validation errors inline; secure session after success → Home/Onboarding.  
**Must not:** Anonymous multi-tenant ops; social sprawl as MVP requirement.

**States:** Idle · Submitting · Error · Success redirect.

---

# Home — `/home`

| | |
|--|--|
| **Job** | Answer “what needs attention?” with one primary CTA |
| **PRDs** | [PRD-002](../04-prd/workspace.md) |
| **Journey** | Triage |

**Layout:**

```
[Banner if sync/channel critical]
PageHeader: خانه
PrimaryAttentionCard (one issue + CTA)
SecondaryIssues (muted list, optional)
QuickLinks: Inbox · Dashboard · Onboarding
```

**Must:** Priority order from [IA §6](./information-architecture.md); AIStateChip in shell.  
**Must not:** Full metric wall; bury broken sync under “AI is great” copy.

---

# Onboarding — `/onboarding`

| | |
|--|--|
| **Job** | Ordered checklist to first grounded conversation |
| **PRDs** | 002, 004–006, 013–015 |
| **Journey** | 2–7 |

**Layout:** Vertical checklist with status per step; each row → deep link.

| Step | Done when |
|------|-----------|
| Connect store | Store connected |
| Catalog sync healthy | Sync ok |
| Configure Employee | Employee saved (can stay inactive until channel) |
| Connect ≥1 channel | Website or Telegram or Bale connected |
| Test conversation | At least one test thread |

**Must:** Block celebratory “live” until sync + channel allow it.  
**Must not:** Empty bot-builder labyrinth; skip sync.

---

# Store — `/store`

| | |
|--|--|
| **Job** | Connect commerce + show sync truth |
| **PRDs** | [PRD-004](../04-prd/commerce-core.md) · [PRD-005](../04-prd/catalog-sync.md) |
| **Journey** | 3–4 |

**Layout:**

```
PageHeader: فروشگاه + [Retry sync]
ConnectionStatus (pass/fail)
LastSuccess · Lag · FailureReason
Actions: Connect / Reconnect / Retry
Optional: counts (products synced) if API provides
```

**Must:** Pass/fail honesty; stale ≠ healthy; recovery CTAs.  
**Must not:** Silent connected-with-empty-catalog; go-live enablement here (belongs to checklist/Employee gating).

**States:** Disconnected · Connecting · Healthy · Stale · Failed.

---

# Employee — `/employee`

| | |
|--|--|
| **Job** | Configure AI Sales Employee + guardrails (enforced in Runtime) |
| **PRDs** | [PRD-006](../04-prd/ai-sales-employee.md) · [PRD-007](../04-prd/settings-guardrails.md) |
| **Journey** | 5 |

**Layout:**

```
PageHeader: کارمند فروش + StatusSelect
Tabs or stacked sections:
  1) Profile: name, tone, language
  2) Skills: search, recommend, order_status, escalate (toggles)
  3) Guardrails: blocked topics, discount cap, escalation rules
  4) Status: inactive | active | paused (+ degraded explanation if system)
Footer note: «این تنظیمات در Runtime اعمال می‌شوند»
```

**Must:** Safe defaults; Skills ⊆ MVP set; copy that rules are hard stops; no go-live nudge without sync+channel.  
**Must not:** Prompt IDE; Skill Marketplace; disable handoff control.

---

# Channels — `/channels` (+ `/channels/website`)

| | |
|--|--|
| **Job** | Connect Website / Telegram / Bale and show health |
| **PRDs** | [PRD-013](../04-prd/website-chat.md) · [014](../04-prd/telegram.md) · [015](../04-prd/bale.md) |
| **Journey** | 6 |

**Layout:** Three channel units (interaction cards OK):

```
[Website] status · [Manage]
[Telegram] status · [Connect]
[Bale] status · [Connect]
```

**Website detail:** Snippet · copy · origin allowlist help · CSP diagnostics · test link.  
**Telegram/Bale:** Instructions · token field · webhook health · reconnect.

**Must:** Health connected/degraded; same Employee brain (no per-channel prompt editors).  
**Must not:** Theme designer; Instagram/WhatsApp rows.

---

# Inbox — `/inbox`

| | |
|--|--|
| **Job** | Review conversations; takeover; reply; release |
| **PRDs** | [PRD-010](../04-prd/conversation-history.md) · [011](../04-prd/human-handoff.md) · [012](../04-prd/workspace-inbox.md) |
| **Journey** | 7–9 |

**Layout (desktop):**

```
Filters: ownership · channel
┌────────────┬──────────────────────────────┐
│ List       │ Thread header: channel · state│
│ rows       │ ContextPackage if escalated   │
│            │ Messages (AI vs human)        │
│            │ Composer (if human_owned or   │
│            │   after Takeover)             │
│            │ Actions: Takeover | Release   │
└────────────┴──────────────────────────────┘
```

Mobile: list → full-screen thread.

**Must:** Reason badges; context package; authorship clarity; near-real-time escalations (poll OK).  
**Must not:** Ticket SoR; SLA engine; hide escalations.

**Empty:** CTA to Channels or Test chat.

---

# Knowledge — `/knowledge`

| | |
|--|--|
| **Job** | Manage FAQ / policy overrides / uploads with attribution + index status |
| **PRDs** | [PRD-009](../04-prd/knowledge-base.md) |
| **Journey** | 7, 11 |

**Layout:**

```
PageHeader + [Add FAQ] [Upload]
IndexStatusBanner (active | indexing | failed)
List/Editor: title · body · source_attribution
GapTopics (from dashboard) optional side link
```

**Must:** Attribution visible; index honesty; last-good on reindex fail message.  
**Must not:** Unattributed dump; pretend instant learn.

---

# Dashboard — `/dashboard`

| | |
|--|--|
| **Job** | Honest outcomes + gaps + basic revenue context |
| **PRDs** | [PRD-019](../04-prd/basic-analytics.md) · [PRD-020](../04-prd/revenue-dashboard.md) |
| **Journey** | 10–11 |

**Layout:**

```
Range filter
Section A — Conversations: volume by channel, resolution proxy, escalations + reasons
Section B — Gaps: top questions / knowledge gaps → link Knowledge
Section C — Revenue: methodology note + assisted counts + store GMV from sync
Section D — Sync health summary
```

**Must:** Defined methodology; empty states not fake data; link actions to Inbox/KB.  
**Must not:** Causal “+X% sales from AI” badge; BI builder; vanity happiness scores.

---

# Audit — `/audit`

| | |
|--|--|
| **Job** | Inspect admin actions and AI turns (Transparent AI) |
| **PRDs** | [PRD-018](../04-prd/audit-logs.md) |
| **Journey** | 10–11 + incidents |

**Layout:** Filter bar (time, type, conversation, employee) → list → detail drawer (Skills, guardrail blocks, citation refs, cost tokens summary per RBAC).

**Must:** Tenant isolation; append-only presentation; link from Inbox thread → related audits.  
**Must not:** Cross-tenant; full raw prompt dump to all roles.

---

# Cross-cutting UI chrome

| Element | Rule |
|---------|------|
| AIStateChip | Always in shell when authenticated |
| SyncBanner | On any screen when sync unhealthy (dismiss ≠ resolve) |
| Permission | Viewer read-only; operator mutate per RBAC ([PRD-002](../04-prd/workspace.md)) |

---

# Screen acceptance (design/QA)

- [ ] Every screen states one job in PageHeader  
- [ ] Failure paths use Banner/Empty/Error patterns  
- [ ] Escalation path reaches Inbox ≤ 2 clicks from badge  
- [ ] No OUT-OF-MVP nav or builders  
- [ ] Persian RTL layout verified on Auth, Inbox, Employee
