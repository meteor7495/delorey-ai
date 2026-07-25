# UI/UX — MVP Index

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Complete — MVP UI/UX doc set |
| **Last Updated** | July 25, 2026 |
| **Authority** | [Product Scope](../02-product/product-scope.md) · [Product Principles — UX](../02-product/product-principles.md) · [User Journey](../02-product/user-journey.md) · [Frontend Architecture](../03-architecture/frontend-architecture.md) · [PRD Index](../04-prd/README.md) |

Docs-first interaction design: IA, Design System, flows, screen contracts, widget UX, copy. Wireframes are structured layout + Mermaid — not Figma pixels. **No new product features.**

---

## Authority chain

```
Product Scope / Principles (UX)
    ↓
User Journey
    ↓
Feature PRDs (001–020)
    ↓
Frontend Architecture
    ↓
docs/05-ui (this folder)
```

---

## Catalog

| Doc | Job |
|-----|-----|
| [ux-foundation.md](./ux-foundation.md) | Patterns: AI state, uncertainty, handoff, empty/error, RTL |
| [design-system.md](./design-system.md) | Tokens, type, components, badges — commerce-ops calm |
| [information-architecture.md](./information-architecture.md) | Nav, routes, Home triage, one job per screen |
| [flows.md](./flows.md) | Signup→live, channels, handoff, knowledge fix |
| [workspace-screens.md](./workspace-screens.md) | Screen contracts for all MVP Workspace routes |
| [widget-ux.md](./widget-ux.md) | Shopper Website Chat widget |
| [copy-tone.md](./copy-tone.md) | Persian-first voice; hire-Employee framing |

---

## Design build order (aligned with Frontend)

1. Shell + Auth + Home triage + Onboarding checklist  
2. Store / Sync health  
3. Employee + Guardrails  
4. Channels (Website → Telegram → Bale)  
5. Inbox + Handoff  
6. Knowledge  
7. Dashboard + Audit visibility  
8. Widget  
9. Polish (brand color depth) only after critical paths  

---

## Explicit non-goals (MVP UI)

Flow/workflow builder · ticket/helpdesk SoR · CRM pipelines · advanced BI builder · theme/page designer · native apps · Instagram/WhatsApp/email consoles · Skill Marketplace UI · multi-brand switcher · hiding escalations for vanity automation.
