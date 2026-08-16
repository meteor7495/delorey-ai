# Design System (MVP)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — tokens + primitives for Workspace + Widget |
| **Last Updated** | July 25, 2026 |
| **Parent** | [UX Foundation](./ux-foundation.md) · [Frontend Architecture](../03-architecture/frontend-architecture.md) |
| **Implementation** | `packages/ui` (tokens + primitives) per Frontend monorepo |

**Job:** Shared visual language so Workspace feels like a calm commerce control plane — not a chatbot playground or BI wall.

**Brand direction:** *Commerce-ops calm* — dark ink on cool neutrals, one accent for attention/CTA, RTL-first. Avoid purple-AI gradients, cream-serif “editorial SaaS,” and glow/neon autonomy theater.

---

# 1. Design tokens

### Color (semantic)

| Token | Role | Guidance |
|-------|------|----------|
| `--color-bg` | App background | Cool neutral (slight blue-gray), not pure flat white void |
| `--color-surface` | Panels / elevated | Slightly lighter/darker than bg for hierarchy without heavy cards |
| `--color-border` | Hairline structure | Low-contrast; use sparingly |
| `--color-text` | Primary text | Near-black ink |
| `--color-text-muted` | Secondary | Readable muted |
| `--color-accent` | Primary CTA / key links | One decisive accent (e.g. deep teal or steel-blue) — **not** purple default |
| `--color-success` | Healthy sync / active | Calm green |
| `--color-warning` | Paused / stale | Amber |
| `--color-danger` | Degraded / blocked / escalate | Clear red-orange |
| `--color-info` | Syncing / neutral info | Cool blue |

Widget may map merchant brand color as **optional** accent overlay; defaults stay Seloma calm.

### Typography

| Token | Use | Guidance |
|-------|-----|----------|
| `--font-sans` | UI body / controls | Expressive Persian-capable sans (e.g. Vazirmatn / similar) — **not** Inter/Roboto/Arial as brand story |
| `--font-mono` | IDs, snippets, SKUs | Tabular for order ids |
| `--text-xs` … `--text-xl` | Scale | Tight scale; one display size max on Home |

Avoid newspaper multi-column density and oversized marketing headlines inside Workspace.

### Spacing & radius

| Token | Value guidance |
|-------|----------------|
| `--space-1` … `--space-8` | 4px base scale |
| `--radius-sm` / `--radius-md` | Modest radius (4–8px); not pill-everything |
| `--shadow-sm` | Optional elevation; prefer border/surface over multi-layer glow |

### Motion

| Token | Use |
|-------|-----|
| `--ease-standard` | 150–200ms opacity/transform for panels |
| `--ease-emphasis` | 200–250ms for Inbox thread open |

Ship 2–3 intentional motions: shell attention pulse (subtle), thread open, toast enter. No decorative particle noise.

---

# 2. Layout primitives

| Primitive | Rule |
|-----------|------|
| **AppShell** | Top or side nav + main; AI state chip always in chrome |
| **PageHeader** | Title = job of screen; one optional primary CTA |
| **Stack / Inline** | Spacing via tokens; avoid nested card stacks |
| **SplitPane** | Inbox: list | thread (collapse list on mobile) |
| **Banner** | Full-width sync/channel health; dismiss only if resolved or acknowledged |

**Cards:** Default no cards. Cards only when they wrap a discrete interaction (e.g. channel connect unit). If removing border/shadow doesn’t hurt understanding, don’t use a card.

---

# 3. Components (MVP set)

| Component | Notes |
|-----------|-------|
| Button (primary / secondary / danger / ghost) | One primary per view |
| Input / Textarea / Select / Toggle | Form density for SMB; clear labels |
| Badge / AIStateChip | Maps foundation states; icon + text |
| Tabs | Sparse — Employee settings sections, Dashboard metrics vs revenue |
| Table / ListRow | Inbox list, Knowledge FAQ list, Audit list |
| Modal / Drawer | Takeover confirm; channel instructions; audit detail |
| Toast | Mutation success/fail — not for critical sync (use Banner) |
| Skeleton | List and thread placeholders |
| EmptyState | Illustration optional; copy + CTA required |
| CodeSnippet | Website embed; copy button |
| CitationChip | Source attribution on audit / handoff |
| ProductRef | Compact product name/price when API provides (Inbox + Widget) |

Out of MVP component set: flow canvas, kanban ticket board, chart studio, rich WYSIWYG beyond FAQ editor basics.

---

# 4. AI state chips

| State | Chip label (FA) | Color semantic |
|-------|-----------------|----------------|
| inactive | غیرفعال | muted |
| active | فعال | success |
| paused | متوقف | warning |
| syncing | در حال همگام‌سازی | info |
| degraded | مختل | danger |
| awaiting_human | در انتظار انسان | danger / attention |

Ownership chips on threads: `پاسخ‌گوی AI` | `در اختیار اپراتور`.

---

# 5. Iconography

Simple line icons; commerce/ops metaphors (store, sync, employee, inbox, shield). No emoji as UI chrome. Status never icon-only.

---

# 6. Widget skin

| Concern | Rule |
|---------|------|
| Launcher | Circular or soft-square; accessible label |
| Panel | Compact height on mobile; RTL |
| Messages | Bubble clarity; citations as small refs when present |
| Branding | Brand-basic color; no theme studio |
| States | Typing / human joining / offline — per [Widget UX](./widget-ux.md) |

---

# 7. Dark mode

**Not required for MVP.** If system preference is later supported, tokens must remap semantically — do not ship dark-by-default as brand identity.

---

# 8. Handoff to engineering

1. Encode tokens as CSS variables in `packages/ui`.  
2. Primitives before feature chrome.  
3. Screenshot / Storybook optional; acceptance = patterns in [UX Foundation](./ux-foundation.md) + screen contracts.
