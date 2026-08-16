# Vertical Slice 19 — Design-Partner E2E Path

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 28, 2026 |
| **Depends on** | Slices 01–18 |
| **Journey** | [User Journey](../02-product/user-journey.md) Stages 2–11 |

**Goal:** Make the design-partner smoke path explicit and measurable in Workspace: store → sync → Employee → Knowledge → Website channel/origins → grounded chat → handoff → Inbox/Audit — without requiring a paid LLM (`AI_GATEWAY_MODE=mock` OK).

---

# Checklist (product)

- [x] Expand `GET /v1/workspace/me` onboarding flags + `partnerReady`  
- [x] Onboarding UI: 8-step partner path + smoke prompts + widget link  
- [x] Home attention nudges toward first grounded chat when core is green  
- [x] This runbook (ops + acceptance)  

---

# Local runbook (founder / partner)

## 0. Boot

```bash
pnpm db:up
pnpm --filter @seloma/api exec prisma migrate deploy
pnpm dev
```

- Workspace: http://localhost:3010  
- Widget harness: http://localhost:5173  
- API: http://localhost:3001/v1  

Demo: `demo@seloma.local` / `demo1234` (or signup).

Keep `AI_GATEWAY_MODE=mock` until a third-party key exists (GapGPT/Liara/BoxAPI).

## 1. Store + sync

1. `/store` → Mock connect **or** Shopify/Woo with keys.  
2. Wait until sync health = سالم (or `SYNC_INLINE=1` if Redis down).  
3. Confirm products list non-empty.

**Pass:** `onboarding.syncHealthy === true`

## 2. Employee

1. `/employee` → name/tone FA; status فعال.  
2. Skills: product search / recommend / order status on.  
3. Optional: guardrails blocked topic + discount cap.

**Pass:** `onboarding.employeeConfigured === true`

## 3. Knowledge

1. `/knowledge` → ensure ≥1 active FAQ (seed may already exist).  
2. Ask shipping/returns later in widget.

**Pass:** `onboarding.knowledgeReady === true`

## 4. Website channel

1. `/channels` → copy snippet (`data-public-key` + `data-api-base`).  
2. Save allowed origins including `http://localhost:5173` (and real store HTTPS when live).  

**Pass:** `onboarding.channelConnected === true`

## 5. First grounded chat

1. Open harness → paste public key → open launcher.  
2. Ask: `پیراهن لینن موجوده؟ قیمتش چنده؟`  
3. Expect catalog fields (SKU/price/stock) — **no invented SKU**.

**Pass:** `onboarding.firstChatDone` / `partnerReady` trends true; Audit shows `answer_grounded` (or `:live` / `:mock_fallback`).

## 6. Handoff

1. Ask: `می‌خوام با اپراتور حرف بزنم`  
2. Widget shows handoff banner.  
3. `/inbox` → thread `human_owned`; reply as operator; optional release.

**Pass:** `onboarding.handoffProven === true`

## 7. Audit + dashboard

1. `/audit` → open a turn; citations visible.  
2. `/dashboard` → volume / escalation not empty vanity.

**Pass:** `onboarding.auditVisible === true`

## 8. Optional messaging channels

Telegram / Bale connect + simulate (live flags off by default). Same Runtime brain.

---

# Acceptance gate (design partner demo)

| Check | Result |
|-------|--------|
| Signup → Workspace in &lt; 5 min | |
| Sync healthy + products &gt; 0 | |
| Widget grounded product answer | |
| Wrong/missing product → refuse / unsure | |
| Human handoff visible in widget + Inbox | |
| Audit turn persisted | |
| Cross-tenant: wrong public key → 404 | |
| Wrong origin (prod allowlist) → 403 | |

`partnerReady` on `/workspace/me` is true when store+sync+employee+channel+first chat+audit are green (handoff still recommended before live partners).

---

# Out of this slice

Paid LLM go-live · CDN widget host · password reset · RAG embeddings · Instagram · billing · multi-operator assignment.

---

# Next

After a real partner run: fix any fail-gate items; then Slice 20 candidates = password reset / live provider trial / Telegram live soak.
