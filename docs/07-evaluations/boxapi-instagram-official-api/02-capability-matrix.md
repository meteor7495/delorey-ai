# 02 — Capability Matrix

Evaluation of BoxAPI Instagram Official API vs Meta Official Instagram Messaging capabilities and DeloRey adapter needs.

**Legend**

| Column | Meaning |
|--------|---------|
| **Supported?** | Evidence of support today |
| **Official Meta?** | Available in Meta Instagram Messaging / Graph API (generally) |
| **Provider?** | Explicit in BoxAPI Official API docs |
| **Unknown?** | Not evidenced |
| **Need testing?** | Must validate in lab before architecture commitment |

Values: `Y` = yes · `N` = no · `P` = partial · `U` = unknown · `M` = marketing only

---

## Messaging core

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| Receive DM (text) | P | Y | Y | | Y | Sample webhook only |
| Send DM (text) | Y | Y | Y | | Y | `send_message` |
| Receive media (image) | U | Y | N | Y | Y | Not in docs |
| Receive media (video/audio/file) | U | Y | N | Y | Y | |
| Send image | U | Y | N | Y | Y | |
| Send video / audio / file | U | Y | N | Y | Y | |
| Send button template | Y | Y | Y | | Y | `postback`, `web_url` |
| Quick replies | U | Y | N | Y | Y | |
| Generic / product template | M | Y | N | Y | Y | Claimed on marketing page |
| Postback receive | U | Y | P | Y | Y | Send documented; inbound schema missing |
| Reply within 24h window | U | Y | N | Y | Y | Meta human-agent rules **Unknown** at provider |
| Message tags (outside window) | U | Y | N | Y | Y | |
| Ice breakers | U | Y | N | Y | Y | |
| Persistent menu | U | Y | N | Y | Y | |

## Conversation control

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| Mark as read | U | Y | N | Y | Y | |
| Typing on / off | U | Y | N | Y | Y | |
| Customer typing event | U | P | N | Y | Y | |
| Read receipts inbound | U | Y | N | Y | Y | |
| Delivery receipts | U | Y | N | Y | Y | |
| Conversation history API | N | P | N | | Y | Not documented — DeloRey must store locally from webhooks |
| Deleted / unsent message event | U | P | N | Y | Y | |
| Duplicate webhook handling | U | Y | N | Y | Y | Need idempotency on `event_id` / `mid` |
| Out-of-order events | U | P | N | Y | Y | |
| Echo of bot messages | U | Y | N | Y | Y | |

## Identity & profile

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| User IDs (IGSID-like) | Y | Y | Y | | Y | `sender.id` |
| Page Instagram user id | Y | Y | Y | | Y | `instagram_user_id` |
| Get user profile (name/pic) | U | Y | N | Y | Y | Not on Official messaging docs |
| Username of DM sender | U | P | N | Y | Y | Privacy-sensitive; often limited |
| Stable IDs across reconnect | U | Y | N | Y | Y | Critical after re-OAuth |
| Follow status check | P | P | Y | | Y | Async only |

## Comments & content

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| Receive comment webhook | P | Y | P | Y | Y | Claimed; no schema |
| Reply to comment | Y | Y | Y | | Y | |
| Private reply DM from comment | U | Y | N | Y | Y | |
| List posts | P | Y | Y | | Y | Async webhook result |
| Reels-specific APIs | U | Y | N | Y | Y | May appear as media_type |
| Stories publish | N | Y | N | | | Out of scope likely |
| Story reply inbound | U | Y | N | Y | Y | High value for D2C |
| Mentions | U | Y | N | Y | Y | |

## Reactions & rich UX

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| Message reactions | U | Y | N | Y | Y | |
| Stickers / GIFs / shares | U | Y | N | Y | Y | |
| Referral / CTD ads entry | U | Y | N | Y | Y | Important for Growth ads funnel |

## Webhooks & ops

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| Webhook configuration | Y | Y | Y | | Y | Panel-only; one URL |
| Webhook signature verify | U | Y | N | Y | Y | **Blocker if absent** |
| Webhook latency SLA | U | P | N | Y | Y | |
| Retry on 5xx | U | Y | N | Y | Y | |
| Per-page webhook routing | U | Y | N | Y | Y | Multi-tenant risk |
| Health / status of page token | P | Y | P | | Y | `is_active`, `expires_at` |
| Revoke notification | N | P | N | | Y | Docs: no prior notice |

## Platform / tenancy

| Capability | Supported? | Official Meta? | Provider? | Unknown? | Need testing? | Notes |
|------------|------------|----------------|-----------|----------|---------------|-------|
| Multi-page under one API key | Y | Y | Y | | Y | Bounded by `account_limit` |
| Multi-tenant SaaS ready | U | Y* | N | Y | Y | *Meta apps are multi-page; BoxAPI tenancy model unclear |
| Bring-your-own Meta app | U | Y | N | Y | Y | Portability risk |
| Export Meta tokens | N | Y | N | | | Docs say no direct credentials |
| Rate limit 200/h/page | Y | Y | Y | | Y | Hard ceiling |
| Provider-side queue | P | N | Y | | Y | Behavior Unknown |
| OpenAPI / SDK | N | Y | N | | | DX gap |

\* Meta supports multi-page under one Business App with proper architecture.

---

## DeloRey MVP-channel parity (Telegram / Bale baseline)

| DeloRey adapter need | BoxAPI today | Gap severity |
|----------------------|--------------|--------------|
| Connect channel + store encrypted creds | Partial (OAuth via provider; no Meta token to store) | High — different trust model |
| Inbound text → Runtime | Likely | Medium — must prove |
| Outbound text from AI / operator | Likely | Medium |
| Idempotent webhook ingest | Unknown | High |
| Media for product proof / order slips | Unknown | High for commerce |
| Operator Inbox reply | Likely text-only | Medium |
| Channel health / degraded state | Partial | High (silent revoke) |
| Tenant isolation | Unknown / weak by docs | **Critical** |

---

## Matrix summary

| Bucket | Count (approx.) |
|--------|-----------------|
| Clearly documented | Low (send text, reply comment, accounts CRUD, basic messaging webhook) |
| Marketing-only | Product lists, ∞ pages, automation depth |
| Unknown / must test | Majority of production messaging features |
| Explicit gaps vs Meta | History, typing, read, media, signatures, revoke events |

**Architect takeaway:** Treat current BoxAPI Official API as **text DM + comment reply MVP transport**, not as full Meta Messaging parity. Anything else is a lab hypothesis until proven.
