# 03 — API Quality

| Field | Value |
|-------|-------|
| **Subject** | BoxAPI Instagram Official Direct & Comment API |
| **Sources** | [Official docs](https://boxapi.ir/docs/instagram/instagram-official-api/), [DM marketing](https://boxapi.ir/instagram-dm-api/), [Data API docs](https://boxapi.ir/docs/instagram/api/) |
| **Method** | Documentation review only (no live traffic) |

---

## 1. Overall score (preliminary)

| Dimension | Score /10 | Rationale |
|-----------|-----------|-----------|
| API Design | 4 | Thin action surface; async without clear correlation contract |
| REST quality | 4 | Mixed resource + RPC (`/actions/*`); Base URL unclear |
| Errors | 2 | No error catalog, codes, or recovery guidance |
| Pagination | 5 | Present on accounts; 0-based semantics unclear |
| Retries | 2 | Undocumented client retry guidance; provider queue opaque |
| Timeouts | 1 | Not documented |
| Consistency | 3 | Sync vs async inconsistency; Data API uses different auth |
| Documentation quality | 4 | Readable endpoint list; missing schemas, errors, edge cases |
| Examples | 3 | Minimal happy-path JSON; “No code available” footer |
| SDKs / Postman / OpenAPI | 1 | n8n node only; no OpenAPI/Swagger/Postman/SDK |

**Weighted judgment:** Below production SaaS partner bar. Acceptable for early spike if DeloRey owns a hardened client wrapper.

---

## 2. API design

### Strengths

- Small surface area — easy to wrap.
- Clear separation of account lifecycle (`/service/accounts`) vs actions.
- UUID `account_id` usable as external binding key.
- Button payload is simple.

### Weaknesses

- **RPC-heavy** (`/service/actions/send_message`) rather than resource-oriented messaging APIs.
- **Async endpoints** (`follow_status`, `list_posts`) return non-results over HTTP and push to webhook **without documented request correlation id**.
- **Webhook envelope** is automation-shaped, not a clean domain event bus.
- **Two Instagram products, two auth schemes** (Official `X-Api-Key` vs Data API Basic/Bearer) — integrator confusion risk.
- Response envelope uses `success`, `message`, `status_code` but `status_code: 0` in 200 examples — semantics unclear vs HTTP status.

### Verdict

Design is **integrator-script oriented**, not **multi-tenant platform oriented**.

---

## 3. REST quality checklist

| Expectation | Observed |
|-------------|----------|
| Stable absolute Base URL | **Unknown** / placeholder `YOUR_BASE_URL` |
| Versioning (`/v1`) | **Not documented** for Official API |
| Idempotency-Key header | **Not documented** |
| Conditional requests / ETags | **Not documented** |
| Standard HTTP verbs for resources | Partial (GET/DELETE accounts; POST actions) |
| HATEOAS / links | No |
| Content negotiation | JSON assumed |
| Locale / timezone docs | No |

---

## 4. Errors

Documented error model for Official API: **effectively none**.

Data API docs say errors may occur and to contact support — not acceptable for automated systems.

### DeloRey requirements (must demand from vendor)

| Requirement | Why |
|-------------|-----|
| Stable machine-readable `error.code` | Map to channel health + user-facing Persian copy |
| Distinguish 4xx vs 5xx vs rate limit | Retry policy |
| Field-level validation errors | Merchant connect UX |
| Token expiry vs permission revoked vs page deleted | Different recovery paths |
| Queue-delayed acceptance vs hard reject | Outbound UX |

Until provided, client must treat all non-2xx as **UnknownFailure** and escalate to degraded channel state.

---

## 5. Pagination

`/service/accounts` returns:

```json
"pagination": {
  "current_page": 0,
  "last_page": 0,
  "per_page": 0,
  "total": 0,
  "from": 0,
  "to": 0
}
```

| Question | Status |
|----------|--------|
| Query params for page/per_page? | **Unknown** |
| 0-based vs 1-based? | Example shows 0 — **must test** |
| Cursor vs page? | Page-style |
| Max per_page? | **Unknown** |
| Stable ordering? | **Unknown** |

Only accounts list is paginated. Message history pagination: **N/A (no API)**.

---

## 6. Retries & timeouts

| Topic | Documented? | Risk |
|-------|-------------|------|
| Client timeout recommendation | No | Blind guesses cause duplicate sends |
| Safe retry methods | No | `send_message` may double-deliver |
| Idempotent send | No | Critical for AI retries |
| Provider queue under 200/h | Claimed | Opacity: when does message actually send? |
| Dead-letter / failed queue visibility | No | Silent loss risk |
| Webhook retry backoff | No | DeloRey must ack fast + queue internally |

**DeloRey mitigation (mandatory if integrating):**

1. Generate `client_message_id` locally; store before send.
2. Treat provider send as at-least-once; dedupe on `mid` if returned (**Unknown if returned**).
3. Never retry blindly without idempotency proof from vendor.

---

## 7. Consistency

| Area | Issue |
|------|-------|
| Auth consistency | Official vs Data API differ |
| Sync consistency | Some actions sync, some async without shared pattern |
| Webhook consistency | Sample includes `executionMode: "test"` — prod parity Unknown |
| Field naming | snake_case generally OK |
| status_code meaning | `0` vs `200` inconsistency in examples |
| Privacy claim vs webhook body | Docs say user data not given to developer, yet webhook sample includes message text — **clarify legally and technically** |

---

## 8. Documentation quality

| Aspect | Assessment |
|--------|------------|
| Language | Persian primary; usable |
| Endpoint coverage | Core endpoints listed |
| Request examples | Minimal |
| Response examples | Partial; placeholders |
| Webhook catalog | Incomplete (one sample) |
| Error reference | Missing |
| Changelog / versioning | Missing |
| SLA / status page | Missing from this review |
| Code samples | Footer: “No code available” |
| n8n | Present — signals target audience is automation builders, not SaaS platforms |

Documentation is **adequate to start a spike**, **inadequate to certify a channel**.

---

## 9. Tooling

| Artifact | Present? |
|----------|----------|
| OpenAPI / Swagger | **No** |
| Postman collection | **No** (not found) |
| Official SDK (Node/Python) | **No** for Official DM API |
| n8n node | Yes |
| Sandbox event simulator | **Unknown** |
| Webhook log viewer in panel | **Unknown** (ask) |

DeloRey should generate an internal OpenAPI for the **InstagramProviderPort** (our abstraction), not depend on BoxAPI docs quality.

---

## 10. Recommendations to vendor (ask list)

1. Publish OpenAPI 3 for Official API.
2. Document Base URL, environments, versioning.
3. Publish full webhook event catalog with JSON Schema.
4. Add HMAC signature header + timestamp + replay window.
5. Return `request_id` on every call; echo on async webhook results.
6. Document idempotency for `send_message`.
7. Publish error code dictionary.
8. Publish queue metrics / delay under rate limit.
9. Clarify data residency and what content appears in webhooks vs stored only at BoxAPI.
10. Provide multi-tenant webhook routing options (per-account URL or signed tenant key).

---

## 11. Quality gate for DeloRey

Do **not** mark API quality as acceptable for Growth production until:

- [ ] OpenAPI or equivalent contract frozen
- [ ] Error + webhook schemas versioned
- [ ] Idempotent send proven
- [ ] Async correlation proven
- [ ] Base URL + versioning stable for 90 days of spike traffic
