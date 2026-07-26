# Vertical Slice 03 — Telegram Channel

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — MVP path shipped (mock delivery default) |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–02 (Postgres, Runtime, Inbox) |
| **PRD** | [PRD-014 Telegram](../04-prd/telegram.md) |

**Goal:** Connect a Telegram bot token, ingest updates (webhook + local simulate), run the **same** Runtime brain, reply via Bot API (or mock delivery), and deliver operator Inbox replies on Telegram threads.

Verified: connect → simulate grounded → duplicate `update_id` ignored → thread in Inbox.

---

# Checklist

- [x] ChannelBinding credentials + webhook secret  
- [x] Conversation `external_thread_id` + message idempotency  
- [x] `POST /v1/channels/telegram/connect`  
- [x] `POST /v1/webhooks/telegram/:bindingId`  
- [x] Local `simulate` for smoke without ngrok  
- [x] Inbox operator reply triggers Telegram send when channel=telegram  
- [x] Channels UI connect form  

---

# Local note

`TELEGRAM_LIVE=0` (default): `getMe`/send mocked.  
`TELEGRAM_LIVE=1`: real Bot API; set public HTTPS webhook with `X-Telegram-Bot-Api-Secret-Token`.
