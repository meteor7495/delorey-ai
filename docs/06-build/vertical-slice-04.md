# Vertical Slice 04 — Bale Channel

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — MVP path shipped (mock delivery default) |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–03 (Postgres, Runtime, Inbox, Telegram pattern) |
| **PRD** | [PRD-015 Bale](../04-prd/bale.md) |

**Goal:** Mirror Telegram adapter for Bale — connect bot token, ingest updates (webhook + local simulate), same Runtime brain (`channel=bale`), mock/live delivery via `tapi.bale.ai`, Inbox operator replies on Bale threads.

Verified: connect → simulate grounded → duplicate `update_id` ignored → thread in Inbox (`channel=bale`) → operator reply.

**Out of slice:** Rich media parity race, second Employee personality, other messengers, Knowledge/RAG.

---

# Checklist

- [x] ChannelBinding `channel=bale` + encrypted credentials + webhook secret  
- [x] Conversation `external_thread_id` + idempotency `bale:{update_id}`  
- [x] `POST /v1/channels/bale/connect`  
- [x] `POST /v1/webhooks/bale/:bindingId`  
- [x] Local `simulate` for smoke without public webhook  
- [x] Inbox operator reply delivers when channel=bale  
- [x] Channels UI connect + simulate  

---

# Local note

`BALE_LIVE=0` (default): `getMe`/send mocked.  
`BALE_LIVE=1`: real Bale Bot API (`https://tapi.bale.ai`). Webhook ports typically **443/88**; outbound text treated as Markdown — adapter escapes plain replies.
