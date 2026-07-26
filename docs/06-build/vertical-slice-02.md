# Vertical Slice 02 — Inbox + Human Handoff

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — MVP path shipped |
| **Last Updated** | July 26, 2026 |
| **Depends on** | [Slice 01](./vertical-slice-01.md) + Postgres SoR |
| **PRDs** | [010](../04-prd/conversation-history.md) · [011](../04-prd/human-handoff.md) · [012](../04-prd/workspace-inbox.md) |

**Goal:** Operator can see conversations in Workspace Inbox, receive escalations with a context package, take over, reply (persisted on the conversation), and release back to AI. AI must not keep answering while `human_owned`.

**Out:** Ticket SoR, SLA engine, Telegram delivery of operator reply (website channel persistence is enough for this slice; adapter delivery for messengers in Slice 03).

---

# Success criterion

> Shopper asks for a human → conversation escalates → appears in Inbox with reason → operator Takeover → reply saved → Release → AI can answer again.

Verified locally: `escalated:customer_request` → inbox → operator reply → `released=ai_owned` → `answer_grounded`.

---

# Checklist

### Backend
- [x] Conversation fields: ownership, escalationReason, escalatedAt, handoffPacket  
- [x] Runtime/public chat: detect human request; skip AI when human_owned  
- [x] `GET /v1/inbox/conversations` (+ filter)  
- [x] `GET /v1/inbox/conversations/:id` (thread + packet)  
- [x] `POST .../escalate|takeover|release`  
- [x] `POST .../messages` operator reply  

### Frontend
- [x] `/inbox` list + thread + actions  
- [x] Nav link; Home triage surfaces escalations  

---

# Non-goals

Helpdesk · macros · assignment queues · Instagram
