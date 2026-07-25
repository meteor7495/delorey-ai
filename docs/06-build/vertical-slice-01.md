# Vertical Slice 01 — First Grounded Chat

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — first build epic |
| **Last Updated** | July 25, 2026 |
| **Authority** | [Product Scope](../02-product/product-scope.md) · [User Journey](../02-product/user-journey.md) Stages 2–8 · [Frontend Architecture](../03-architecture/frontend-architecture.md) · [Backend Architecture](../03-architecture/backend-architecture.md) |
| **Related PRDs** | 001 Auth · 002 Workspace · 003 Tenant · 004–005 Commerce/Sync · 006 Employee · 008 Context · 010 Conversation · 013 Website Chat |

**Goal:** A merchant (or founder on a test store) can sign up, see Workspace, connect/sync catalog (mock OK), configure Sales Employee defaults, embed/open Website widget, ask a product question, and get a **catalog-grounded** reply — not a bare GPT answer.

**Out of this slice:** Telegram, Bale, Inbox handoff UI, Knowledge RAG, Dashboard, Audit UI, Billing, real Shopify OAuth polish (connector stub/mock catalog allowed).

---

# 1. Success criterion (ship gate)

> Open widget → ask “این محصول موجوده؟ / قیمتش چنده؟” about a synced SKU → answer cites live catalog fields → wrong/missing data refuses or says unsure (no invented price).

Demo path completable without Figma.

---

# 2. Scope checklist

### Backend (`apps/api`)

- [ ] NestJS modular monolith boots as `api` role  
- [ ] Modules stubbed per Backend map; **implemented for slice:** `identity`, `tenant`/`workspace`, `employee`, `commerce`, `sync` (mock), `conversation`, `adapters/website`, `runtime` (minimal), `context` (commerce-only), `ai-gateway` (provider behind interface), `cost` (allow/deny stub), `audit` (persist turn summary)  
- [ ] Postgres + Redis via docker-compose  
- [ ] Tenant isolation on every query  
- [ ] `POST /v1/public/chat/sessions` + `POST /v1/public/chat/messages`  
- [ ] `ExecuteTurn`: Cost → Context(commerce) → optional Skill `product_search` → Guardrails stub → Gateway Complete → Audit  

### Frontend

- [ ] `apps/workspace`: Auth screens + shell + Home triage stub + Onboarding checklist + Store (mock connect) + Employee basics + Channels (Website snippet)  
- [ ] `apps/widget`: launcher + session + send/receive + AI state  
- [ ] `packages/api-client` + `packages/ui` tokens scaffold  

### Docs / ops

- [ ] Root README run instructions  
- [ ] `.env.example`  

---

# 3. Explicit non-goals (this slice)

Flow builder · Zendesk inbox · Instagram · Skill Marketplace · multi-brand · Kafka · full RAG · revenue dashboard · production hardening beyond tenant checks.

---

# 4. Suggested implementation order

1. Monorepo + docker-compose (Postgres, Redis)  
2. Auth + tenant provision + Workspace shell  
3. Mock commerce seed + sync_health=healthy  
4. Employee defaults  
5. Website adapter + Conversation ingest  
6. Minimal Runtime + Gateway (one provider) + grounded prompt from ContextBundle  
7. Workspace Channels snippet + Widget talk to API  
8. Eval: 5 product questions, 0 invented SKUs  

---

# 5. Done definition

| Check | Pass |
|-------|------|
| Signup → Workspace | Yes |
| Catalog visible / sync healthy | Yes (mock OK) |
| Widget grounded answer | Yes |
| Cross-tenant read impossible | Tested |
| Invented price in eval | Fail = not done |

---

# Next slice (preview)

**Slice 02:** Inbox + Human Handoff + Guardrails enforcement UI path.  
**Slice 03:** Telegram adapter.  
**Slice 04:** Knowledge FAQ + index-worker.
