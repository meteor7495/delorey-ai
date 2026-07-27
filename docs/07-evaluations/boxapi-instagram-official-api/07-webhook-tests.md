# 07 — Webhook Tests

Checklist for validating BoxAPI → DeloRey webhook behavior.

**Rules**

- Record raw payload (redacted) for every case.
- Pass = expected DeloRey state + no cross-tenant effects.
- Mark **BLOCKED** if provider cannot produce the event.
- Do not invent schemas; capture actual JSON.

---

## 0. Preconditions

| # | Check | Pass? | Notes |
|---|-------|-------|-------|
| 0.1 | Webhook URL registered in BoxAPI panel | | |
| 0.2 | URL uses HTTPS with valid cert | | |
| 0.3 | High-entropy path secret configured | | |
| 0.4 | Two test pages (Tenant A/B) if multi-tenant test | | |
| 0.5 | Clock sync (NTP) on receiver | | |
| 0.6 | Raw body logging enabled in staging | | |
| 0.7 | Idempotency store ready | | |

---

## 1. Message received (text DM)

| # | Case | Steps | Expected | Pass? |
|---|------|-------|----------|-------|
| 1.1 | Simple text | User sends “سلام” | Event received; `event_type=messaging`; text preserved; `sender.id` stable | |
| 1.2 | Unicode / Persian / emoji | Mixed string | No mojibake | |
| 1.3 | Long text | Near IG limit | Accepted or documented truncation | |
| 1.4 | Rapid 10 messages | Burst | All delivered or documented drops | |
| 1.5 | `event_id` uniqueness | Compare ids | Unique per delivery | |
| 1.6 | `message.mid` present | Inspect | Usable idempotency key | |
| 1.7 | `account_id` matches page | Compare | Exact BoxAPI account UUID | |
| 1.8 | Envelope shape | Compare to docs | Array wrapper? `executionMode`? | |

---

## 2. Media received

| # | Case | Pass? | Notes / Blocked? |
|---|------|-------|------------------|
| 2.1 | Image DM | | |
| 2.2 | Video DM | | |
| 2.3 | Audio DM | | |
| 2.4 | File / PDF | | |
| 2.5 | Sticker | | |
| 2.6 | Shared post / reel | | |
| 2.7 | Media URL fetchable by DeloRey servers | | |
| 2.8 | Expired media URL behavior | | |

If all blocked → product decision: text-only IG v1 or NO GO for commerce proofs.

---

## 3. Customer typing

| # | Case | Pass? | Notes |
|---|------|-------|-------|
| 3.1 | Typing on event | | Likely unsupported |
| 3.2 | Typing off event | | |

---

## 4. Story reply

| # | Case | Pass? | Notes |
|---|------|-------|-------|
| 4.1 | Reply to story with text | | |
| 4.2 | Reply with media | | |
| 4.3 | Story mention | | |
| 4.4 | Story ID / permalink available | | |

---

## 5. Deleted message

| # | Case | Pass? | Notes |
|---|------|-------|-------|
| 5.1 | User unsends DM | | |
| 5.2 | User deletes comment | | |
| 5.3 | DeloRey marks message deleted locally | | |

---

## 6. Duplicate webhook

| # | Case | Steps | Expected | Pass? |
|---|------|-------|----------|-------|
| 6.1 | Provider retry same `event_id` | Replay captured payload | Single ingest; one AI turn | |
| 6.2 | Same `mid` new `event_id` | If observable | Dedupe on `mid` | |
| 6.3 | Deliberate double POST | QA tool | Idempotent | |

---

## 7. Out-of-order events

| # | Case | Expected | Pass? |
|---|------|----------|-------|
| 7.1 | msg2 arrives before msg1 | Conversation order by timestamp; no crash | |
| 7.2 | Async `list_posts` result arrives interleaved with DMs | Correct routing by type | |
| 7.3 | Postback arrives before send ack | Stable handling | |

---

## 8. Retry events

| # | Case | Expected | Pass? |
|---|------|----------|-------|
| 8.1 | DeloRey returns 500 | Provider retries (document schedule) | |
| 8.2 | DeloRey returns 200 slowly (8s) | No duplicate or documented retry | |
| 8.3 | DeloRey returns 401/403 | Retries stop or alert | |
| 8.4 | Endpoint down 15 min | Backfill or permanent loss documented | |

---

## 9. Timeout

| # | Case | Pass? | Notes |
|---|------|-------|-------|
| 9.1 | Provider timeout threshold discovery | | |
| 9.2 | DeloRey ACK < 1s via queue | | Required architecture |
| 9.3 | Poison payload 200 vs 400 strategy | | Prefer 200 + DLQ after auth |

---

## 10. Provider downtime

| # | Case | Expected | Pass? |
|---|------|----------|-------|
| 10.1 | Webhooks stop | Channel health → degraded; alert | |
| 10.2 | Catch-up after restore | Gap detection method exists or known loss | |
| 10.3 | Outbound during downtime | Failures surfaced in Inbox | |

---

## 11. Webhook verification / authenticity

| # | Case | Expected | Pass? |
|---|------|----------|-------|
| 11.1 | Documented verification mechanism exists | Signature or secret | |
| 11.2 | Valid signature accepted | | |
| 11.3 | Invalid signature rejected | | |
| 11.4 | Missing signature rejected | | |
| 11.5 | Replay outside time window rejected | | |
| 11.6 | GET verification challenge (if any) | | |

If 11.1 fails → **security blocker**.

---

## 12. Comments & async actions

| # | Case | Pass? | Notes |
|---|------|-------|-------|
| 12.1 | New comment webhook | | Capture schema |
| 12.2 | Comment reply then confirm on IG | | |
| 12.3 | `follow_status` result webhook | | Correlation id? |
| 12.4 | `list_posts` result webhook | | |
| 12.5 | Postback button click webhook | | |

---

## 13. Multi-tenant webhook cases

| # | Case | Expected | Pass? |
|---|------|----------|-------|
| 13.1 | Event for page A never appears in tenant B | Fail closed | |
| 13.2 | Unknown `account_id` dropped | Alert fired | |
| 13.3 | Shared webhook URL stress | No crosstalk | |

---

## 14. Pass criteria for spike

Minimum:

- [ ] 1.1–1.8 pass
- [ ] 6.1 pass
- [ ] 11.x pass **or** written risk acceptance by Security (unlikely for prod)
- [ ] 13.1–13.2 pass
- [ ] Media suite either pass or explicit product waiver
