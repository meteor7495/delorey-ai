# Website Chat Widget UX

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — shopper-facing Website Chat |
| **Last Updated** | July 25, 2026 |
| **Parent** | [PRD-013](../04-prd/website-chat.md) · [Frontend Architecture §12](../03-architecture/frontend-architecture.md) |
| **Related** | [UX Foundation](./ux-foundation.md) · [Design System](./design-system.md) · [Copy & Tone](./copy-tone.md) · [Flows](./flows.md) |

**Job:** Specify shopper interaction with the Sales Employee on the storefront. Widget formats and streams; Runtime owns answers.

---

# 1. Goals

- Low-friction ask about products, policies, order status (via Skills).  
- Clear when AI vs human is responding.  
- Never invent prices/SKUs in the UI layer.  
- Mobile-first; Persian RTL when Employee language is FA.

---

# 2. Structure

```
[Launcher button — bottom corner, RTL-aware]
        ↓
┌─────────────────────────────┐
│ Header: Employee name · state│
│─────────────────────────────│
│ Message list                 │
│  - shopper bubbles           │
│  - employee bubbles          │
│  - system (handoff/offline)  │
│  - product refs (from API)   │
│─────────────────────────────│
│ Composer + send              │
└─────────────────────────────┘
```

**Must not:** Checkout ownership; local Skill logic; theme studio; floating promo stickers on host page beyond launcher.

---

# 3. Session

| Step | UX |
|------|-----|
| First open | Create session via public API (origin + public key) |
| Return | Resume session if token valid |
| Rejected origin | Show calm error; no retry loop spam |
| Rate limited | Explain briefly; disable send temporarily |

---

# 4. Message types

| Type | Render |
|------|--------|
| Text (shopper) | Bubble |
| Text (AI) | Bubble; optional citation chips if API sends |
| Product recommendation | Compact product ref (name, price, link) — **only** fields from API |
| Order status | Status text from Skill result — no extra invented tracking |
| System | “در حال اتصال به همکار…” / offline |
| Error | Retry send |

Streaming: show partial tokens; keep “در حال نوشتن…” until complete or fail.

---

# 5. Widget states

| State | UI |
|-------|-----|
| `ai_active` | Normal chat; optional typing indicator |
| `awaiting_human` / handoff | Banner: human joining; composer may stay open for customer notes |
| `human_owned` | Label replies as human when API marks authorship |
| `degraded` / offline | Non-blocking error; “الان در دسترس نیست” |
| `sync_risk` (if API signals refuse) | Honest limitation — no fake catalog answers in UI |

---

# 6. Launcher & layout

| Concern | Rule |
|---------|------|
| Position | Corner; respect RTL (start-side aware) |
| z-index | High but not covering critical checkout buttons if avoidable — document merchant guidance in Channels |
| Mobile | Full-bleed sheet preferred over tiny inset card |
| A11y | `aria-label` on launcher; focus trap in open panel; Esc closes |

---

# 7. Branding

- Brand-basic: primary accent from merchant setting if provided.  
- Header shows Employee **name** (Sales Employee), not “Bot”.  
- No multi-theme marketplace.

---

# 8. Security & privacy UX

- No admin/API secrets in client.  
- Don’t display raw tenant internals.  
- Order lookup: ask for verification fields in chat as Runtime directs — Widget only renders prompts/results.

---

# 9. Acceptance

- [ ] Snippet boots launcher on allowlisted origin  
- [ ] Grounded reply path shows product refs only from API  
- [ ] Handoff state visible; AI stops claiming autonomy  
- [ ] Offline/degraded copy is calm and honest  
- [ ] RTL + mobile usable  
- [ ] Wrong origin → clear failure, no silent empty

---

# 10. Out of scope

Voice · file-heavy attachments as MVP requirement · Instagram/WhatsApp UIs · in-widget analytics for merchant (belongs in Workspace).
