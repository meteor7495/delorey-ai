# 01 — Provider Overview

| Field | Value |
|-------|-------|
| **Provider** | BoxAPI / SendBox |
| **Product under review** | Instagram Official Direct & Comment API |
| **Source** | [boxapi.ir/docs/instagram/instagram-official-api](https://boxapi.ir/docs/instagram/instagram-official-api/) |
| **Evaluation date** | 2026-07-27 |
| **Confidence** | Documentation-only (no live lab yet) |

---

## 1. What BoxAPI is selling

BoxAPI offers two distinct Instagram-related products. **Do not conflate them.**

| Product | Auth model | Purpose | Relevant to Seloma IG Sales Employee? |
|---------|------------|---------|----------------------------------------|
| **Official Direct & Comment API** (this eval) | `X-Api-Key` | OAuth-connected pages, DMs, comments, webhooks | **Yes** — potential adapter transport |
| **Instagram Data API** | Basic Auth / Bearer (docs inconsistent) | Public data scrape (profiles, followers, media, hashtags, etc.) | **No** for messaging; optional analytics later |

Marketing claims Meta Verified access and “official Instagram Graph API without page password.” That claim is **vendor assertion** until Seloma independently verifies Meta app ownership / partnership paperwork.

**Trial (context from product discussion):** 7-day free trial, one Instagram page. SaaS pricing later. Exact trial terms must be confirmed in panel / contract (**Unknown** in public Official API docs).

---

## 2. Documented API surface (Official Direct & Comment)

| Method | Path | Sync? | Purpose |
|--------|------|-------|---------|
| `GET` | `/service/info` | Sync | Service account, plan, domain, OAuth URL, connected accounts |
| `GET` | `/service/accounts` | Sync | Paginated list of connected IG pages |
| `DELETE` | `/service/accounts/{id}` | Sync | Irreversible page disconnect + data wipe at provider |
| `POST` | `/service/actions/send_message` | Sync request; delivery semantics **Unknown** | Send text DM; optional button template |
| `POST` | `/service/actions/reply_comment` | Sync request | Reply to a comment by `comment_id` |
| `POST` | `/service/actions/follow_status` | **Async** → webhook | Check whether customer follows page |
| `POST` | `/service/actions/list_posts` | **Async** → webhook | Fetch page posts |

### Missing from Official API docs (critical for sales chat)

| Capability | Status |
|------------|--------|
| Send image / video / audio / file | **Not documented** |
| Receive media attachments | **Not documented** (sample webhook shows text only) |
| Typing indicator | **Not documented** |
| Read receipts / mark as read | **Not documented** |
| Story reply / story mention | **Not documented** |
| Message reactions | **Not documented** |
| Conversation history pull | **Not documented** |
| Delete / unsend message | **Not documented** |
| Ice breakers / persistent menu | **Not documented** |
| Product / catalog template | **Marketing claim** on [DM product page](https://boxapi.ir/instagram-dm-api/); **not in Official API reference** |
| Base URL for Official API | Docs use relative paths; marketing curl uses `YOUR_BASE_URL` — **Unknown exact host** |

---

## 3. Authentication

| Item | Documented behavior |
|------|---------------------|
| Mechanism | Header `X-Api-Key: <access token>` |
| Token source | BoxAPI user panel → API settings |
| Client-side use | Explicitly forbidden; backend only |
| Scopes / granular permissions | **Not documented** — appears to be a single key for the BoxAPI account |
| Per-page Meta token exposure | Docs state developers do **not** receive Instagram credentials; access only via BoxAPI APIs |
| Page object fields | Includes `internal_token` in account payloads — purpose **Unknown**; treat as sensitive |
| Token lifetime / rotation | **Unknown** |
| Refresh flow | **Unknown** |
| Page access expiry | `expires_at` on account; re-login required after expiry |

---

## 4. Permissions & OAuth connect flow

Documented merchant connect flow:

1. Seloma (or integrator) obtains `instagram_oauth_url` from `/service/info`.
2. Merchant authenticates via official Instagram login (no page password to BoxAPI, per FAQ).
3. Merchant redirected to integrator `Redirect URL`.
4. Page appears in `/service/accounts`.

### Domain / Redirect constraints (high impact)

- Service **Domain** must be registered in BoxAPI panel (default `https://boxapi.ir` if unset).
- `Redirect URL` **must be a subset of registered Domain** — cannot redirect outside that domain.
- Implication for Seloma SaaS: OAuth callback must live on a Seloma-owned domain registered with BoxAPI. Multi-environment (dev/staging/prod) needs multiple domains or a single controlled callback router — **must design carefully**.

### Permission scopes

- FAQ: only permissions needed for BoxAPI Official APIs are granted; no direct Meta credential access for the developer.
- Exact Meta permission list (`instagram_manage_messages`, `pages_messaging`, etc.) — **Unknown / need written confirmation**.

---

## 5. Webhooks

| Item | Documented |
|------|------------|
| Registration | Single webhook URL in API settings panel |
| Methods | `POST` or `GET` |
| Delivery format | JSON **array** wrapping an envelope (`headers`, `params`, `query`, `body`, `webhookUrl`, `executionMode`) |
| Sample `event_type` | `messaging` |
| Sample fields | `event_id`, `account_id`, `data.messaging[]` with `sender`, `recipient`, `timestamp`, `message.mid`, `message.text` |
| Comment events | Claimed in intro (“comments”) — **no sample payload in docs** |
| Async action results | `follow_status`, `list_posts` results delivered via same webhook — **payload schema Unknown** |
| Signature / HMAC | **Not documented** |
| Retry policy | **Not documented** |
| Dedup / ordering guarantees | **Not documented** |
| Verification challenge (Meta-style) | **Not documented** |
| Per-account webhook URL | **Not documented** (appears account-level for BoxAPI user, not per IG page) |

### Webhook design smell

The sample payload looks like an **automation-platform replay envelope** (`executionMode: "test"`, nested `headers.host`, `webhookUrl`). That is not Meta’s native webhook shape. Seloma must treat BoxAPI as an intermediate normalizer and validate:

- Stable production vs test modes
- Whether the outer array is always present
- Whether `event_id` is globally unique and usable for idempotency

---

## 6. Events (known vs unknown)

| Event class | Documented? | Notes |
|-------------|-------------|-------|
| Inbound text DM | Yes (sample) | `sender.id` = `recipient_id` for replies |
| Postback button click | Implied by send buttons | Inbound schema **Unknown** |
| Inbound comment | Claimed | Schema **Unknown** |
| Follow status result | Async via webhook | Schema **Unknown** |
| List posts result | Async via webhook | Schema **Unknown** |
| Media message | **Unknown** | |
| Story reply | **Unknown** | |
| Message deleted / unsent | **Unknown** | |
| Delivery / read | **Unknown** | |
| Account disconnected by user | Explicitly **no prior notification** | Silent revoke risk |
| Echo / outbound echo | **Unknown** | |

---

## 7. Limitations (documented)

1. **Rate limit:** 200 requests/hour/page (Meta-originated). BoxAPI says it enforces this and queues overflow with “smart queueing.”
2. **Silent access removal:** If end user revokes Instagram access or page is deleted via API, removal can happen **without prior notice**.
3. **Hard wipe:** Page delete removes all related data at BoxAPI irreversibly.
4. **Data custody:** BoxAPI states customer Instagram data is **not provided directly** to the developer; held/processed at BoxAPI. This is a **privacy / SoR / audit conflict** with Seloma’s need to store conversation transcripts for Inbox, Audit Logs, and Human Handoff.
5. **Unilateral cut-off:** BoxAPI may terminate access for policy violations without prior notice.
6. **Plan `account_limit`:** Caps how many pages one BoxAPI account may connect.

---

## 8. Pricing model

| Item | Status |
|------|--------|
| Official API public unit price | **Unknown** from Official docs |
| Marketing | Pay-as-you-go and monthly/annual flexible plans; contact support for volume ([DM product page](https://boxapi.ir/instagram-dm-api/)) |
| Trial | 7-day / one page (evaluation assumption — confirm in writing) |
| Meter unit | Likely per page and/or per request — **Unknown** |
| Overage | **Unknown** |
| Enterprise multi-tenant terms | **Unknown** |

Cost model for Seloma scale is in [12-cost-analysis.md](./12-cost-analysis.md) using **explicit hypotheses**.

---

## 9. Rate limits

| Limit | Value | Source |
|-------|-------|--------|
| Per page | **200 requests/hour** | Official docs + FAQ |
| Burst behavior | Provider queues; details **Unknown** | |
| HTTP status when limited | **Unknown** | |
| Queue max depth / TTL / drop policy | **Unknown** | |
| Whether webhooks count toward 200/h | **Unknown** | |
| Whether async actions count | **Unknown** | |

200/h ≈ **3.3 requests/minute sustained** per page. For an AI Sales Employee that may send quick replies, product cards, and follow-ups, this is a **hard product constraint**, not an infra footnote.

---

## 10. Feature deep dive

### DMs

| Feature | Status |
|---------|--------|
| Receive text | Documented (webhook sample) |
| Send text | Documented (`send_message`) |
| Buttons (`postback`, `web_url`) | Documented |
| Quick replies (Meta-native) | **Unknown / likely not exposed** |
| Attachments | **Not documented** |
| Templates beyond buttons | Marketing mentions product list; API ref missing |

### Comments

| Feature | Status |
|---------|--------|
| Receive comment webhook | Claimed; schema **Unknown** |
| Reply to comment | Documented (`reply_comment`) |
| Comment moderation (hide/delete) | **Not documented** |
| Private reply to commenter via DM | **Unknown** |

### Reels / Stories / Media

| Feature | Status |
|---------|--------|
| Reels as inbound context | **Unknown** |
| Story reply | **Unknown** |
| Send media | **Not documented** |
| Media URL expiry / CDN | **Unknown** |
| List posts (may include reel media types) | Async `list_posts` with `media_type` field option |

### Typing / read receipts

| Feature | Status |
|---------|--------|
| Typing indicator send | **Not documented** |
| Customer typing event | **Not documented** |
| Mark as read | **Not documented** |
| Delivery receipts | **Not documented** |

### Attachments

Treat as **unsupported until proven** in lab with real webhook captures.

---

## 11. Separate Data API (out of scope for messaging, noted for risk)

The [Instagram Data API](https://boxapi.ir/docs/instagram/api/) is a scraper-style public data API (`/api/instagram/...`) with different auth. Using it for “profile enrichment” inside sales conversations creates:

- Legal / ToS risk
- Inconsistent identity vs Official IGSID
- Wrong architectural dependency

**Recommendation:** Keep Data API out of the InstagramAdapter messaging path unless Compliance explicitly approves a separate Growth analytics module.

---

## 12. Immediate hidden risks (overview)

1. **Single webhook fan-in** vs multi-tenant Seloma.
2. **No documented webhook authenticity.**
3. **Provider holds conversation data**; Seloma still needs local SoR for Inbox/Audit — confirm what webhooks actually deliver (full text? IDs only?).
4. **Privacy statement vs product need** may be marketing language — must clarify in writing what payload content Seloma receives.
5. **`internal_token` in API responses** — accidental log leakage risk.
6. **Async actions without documented correlation IDs.**
7. **Vendor lock-in** via non-standard envelope + missing Meta token portability.
8. **200/h/page** insufficient for chatty AI without aggressive batching/queueing on Seloma side.
9. **Silent revoke** breaks merchant channel health without webhook — need polling `/service/accounts` health jobs.
10. **Base URL / environments undocumented** — ops fragility.

---

## 13. Summary judgment

BoxAPI Official API is a **narrow proxy** over a subset of Instagram messaging/comment capabilities, oriented toward Iranian integrators and n8n-style automation. It is **promising as a transport candidate** where Meta is unreachable, but the published surface is **incomplete for a production AI Commerce channel** and **structurally weak for multi-tenant SaaS** until lab and commercial gaps are closed.
