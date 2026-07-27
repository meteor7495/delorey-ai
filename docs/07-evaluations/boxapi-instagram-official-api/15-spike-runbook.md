# 15 — Spike Runbook (BoxAPI Instagram Official API)

| Field | Value |
|-------|-------|
| **Status** | Ready to run when trial key exists |
| **Code** | `apps/api/src/modules/adapters/instagram/` |
| **Checklist** | [14-testing-checklist.md](./14-testing-checklist.md) |
| **Decision** | [13-go-no-go-decision.md](./13-go-no-go-decision.md) |

This spike validates **the provider**. It does **not** call Runtime, Commerce, Knowledge, or Human Handoff.

---

## 1. What was built

| Piece | Path | Role |
|-------|------|------|
| `InstagramProviderPort` | `instagram-provider.port.ts` | Replaceable transport interface |
| `BoxApiClient` | `boxapi.client.ts` | Official API HTTP wrapper |
| Spike service | `instagram-spike.service.ts` | Proxy + in-memory webhook capture |
| Spike controller | `instagram-spike.controller.ts` | Authed lab APIs + public webhook/OAuth |
| Module | `instagram.module.ts` | Wired in `AppModule` |

**Gate:** all spike routes require `BOXAPI_SPIKE_ENABLED=1` (except they 403 when off).  
**Live calls:** only when `BOXAPI_LIVE=1` + `BOXAPI_API_KEY` + `BOXAPI_BASE_URL`.

---

## 2. Environment

Add to `.env` (never commit secrets):

```env
BOXAPI_SPIKE_ENABLED=1
BOXAPI_LIVE=0
BOXAPI_API_KEY=
BOXAPI_BASE_URL=
BOXAPI_WEBHOOK_SECRET=change-me-to-a-long-random-string
PUBLIC_API_BASE_URL=https://<your-tunnel-or-domain>
```

| Variable | Meaning |
|----------|---------|
| `BOXAPI_SPIKE_ENABLED` | Expose spike endpoints |
| `BOXAPI_LIVE` | `0` = mock client; `1` = real BoxAPI HTTP |
| `BOXAPI_API_KEY` | Panel `X-Api-Key` |
| `BOXAPI_BASE_URL` | Vendor base (docs say `YOUR_BASE_URL`) — **confirm in panel** |
| `BOXAPI_WEBHOOK_SECRET` | Path secret for `/v1/webhooks/instagram/boxapi/:secret` |

Webhook URL to register in BoxAPI panel:

```text
https://<PUBLIC_HOST>/v1/webhooks/instagram/boxapi/<BOXAPI_WEBHOOK_SECRET>
```

OAuth redirect (must be under Domain registered in BoxAPI):

```text
https://<PUBLIC_HOST>/v1/spike/boxapi/oauth/callback
```

For local lab use ngrok / cloudflared so BoxAPI can reach you.

---

## 3. Start API

```bash
# from repo root
pnpm --filter api dev
# or your usual apps/api start command
```

Confirm spike status (session required):

```http
GET /v1/spike/boxapi
Authorization: Bearer <session>
```

Expected when enabled + mock:

```json
{
  "spike": true,
  "provider": "boxapi",
  "live": false,
  "capabilities": { "webhookSignatures": false, "rateLimitPerPagePerHour": 200 }
}
```

---

## 4. Lab sequence (maps to checklist)

### Day 0 — Mock smoke (no vendor key)

| Step | Call | Checklist |
|------|------|-----------|
| Status | `GET /v1/spike/boxapi` | A10 |
| Mock info | `GET /v1/spike/boxapi/info` | — |
| Fake webhook | `POST /v1/webhooks/instagram/boxapi/<secret>` with sample JSON from docs | N01, F08 |
| Inspect | `GET /v1/spike/boxapi/webhooks/captured` | F03–F06 extractors |
| Replay same `event_id` | POST again | N01 `duplicate: true` |

Sample body (from [Official docs](https://boxapi.ir/docs/instagram/instagram-official-api/)):

```json
[
  {
    "body": {
      "event_id": "client_ig_test_1",
      "event_type": "messaging",
      "account_id": "00000000-0000-0000-0000-000000000000",
      "data": {
        "messaging": [
          {
            "sender": { "id": "1234567890" },
            "recipient": { "id": "999" },
            "timestamp": 1785081317081,
            "message": { "mid": "abcxyz", "text": "سلام" }
          }
        ]
      }
    },
    "executionMode": "test"
  }
]
```

### Day 1 — Live connect

1. Set `BOXAPI_LIVE=1` and real key/base URL.
2. `GET /v1/spike/boxapi/info` → record oauth URL, plan, account_limit (**B01–B07**, **U01**).
3. Register Domain + Redirect + Webhook in BoxAPI panel (**A04–A08**).
4. Open `instagram_oauth_url`, connect one page (**C01–C05**).
5. `GET /v1/spike/boxapi/accounts` (**D01**).
6. `GET /v1/spike/boxapi/oauth/callbacks` — capture redirect query shape (**C06**, **U**).

### Day 1–2 — Messaging

1. Send IG DM to connected page → check `webhooks/captured` (**F01–F12**).
2. `POST /v1/spike/boxapi/send-message` with `accountId` + `recipientId` from capture (**E01–E17**).
3. Buttons / postbacks (**E08–E10**, **G01–G04**).
4. Media / typing / read — expect many **BLOCKED** (**H**, **I**) — record honestly.

### Day 2 — Comments & async

1. Comment on page post → capture schema (**J01–J02**).
2. `reply-comment` (**J03–J05**).
3. `follow-status` + wait for webhook result (**L01–L05**).
4. `list-posts` + wait (**L06–L10**).

### Day 3 — Security / tenancy / limits

1. Wrong webhook secret → 401 (**M06**).
2. Search for signature headers in captures (**M01** — likely FAIL).
3. Second page / second tenant if available (**Q**).
4. Approach 200/h carefully (**O**).

Fill results into [14-testing-checklist.md](./14-testing-checklist.md). Update scores in [13-go-no-go-decision.md](./13-go-no-go-decision.md) only after evidence.

---

## 5. Endpoint map

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/spike/boxapi` | Session |
| GET | `/v1/spike/boxapi/info` | Session |
| GET | `/v1/spike/boxapi/accounts` | Session |
| POST | `/v1/spike/boxapi/send-message` | Session |
| POST | `/v1/spike/boxapi/reply-comment` | Session |
| POST | `/v1/spike/boxapi/follow-status` | Session |
| POST | `/v1/spike/boxapi/list-posts` | Session |
| DELETE | `/v1/spike/boxapi/accounts/:id` | Session |
| GET | `/v1/spike/boxapi/webhooks/captured` | Session |
| DELETE | `/v1/spike/boxapi/webhooks/captured` | Session |
| GET | `/v1/spike/boxapi/oauth/callback` | Public |
| GET | `/v1/spike/boxapi/oauth/callbacks` | Session |
| POST/GET | `/v1/webhooks/instagram/boxapi/:webhookSecret` | Path secret |

---

## 6. Explicit non-goals (do not expand spike into)

- `ChannelBinding.channel = instagram` in Prisma
- Runtime `executeTurn` on inbound DMs
- Workspace Instagram nav / MVP UI
- Handoff operator delivery
- BoxAPI Data API (scraper) usage
- n8n as production brain

If product wants GA Instagram later, promote `InstagramProviderPort` into a real adapter per [11-architecture-recommendation.md](./11-architecture-recommendation.md).

---

## 7. Blockers that stop the spike early

Stop and mark **NO GO** path if:

- Base URL cannot be obtained from vendor
- Webhooks never arrive to public URL
- Message text never appears in webhook (custody contradiction)
- Cross-page leakage with two accounts

---

## 8. Handoff back to architecture

After lab:

1. Attach redacted capture samples (no tokens) under this folder as `lab-notes/` (optional).
2. Revise capability matrix Unknowns → Y/N.
3. Re-score doc 13.
4. Keep or kill BoxAPI as Growth candidate.
