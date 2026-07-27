# 14 — Testing Checklist (QA Master)

**Provider under test:** BoxAPI Instagram Official API  
**DeloRey scope:** Provider validation only (stub Runtime; no LLM quality tests)  
**Rule:** Nothing skipped. Mark `PASS` / `FAIL` / `BLOCKED` / `N/A` / `UNKNOWN`.

---

## A. Environment & access

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| A01 | Trial account created | | |
| A02 | `X-Api-Key` issued | | |
| A03 | Base URL confirmed in writing | | |
| A04 | Domain registered for DeloRey callback | | |
| A05 | Redirect URL accepted (subset of Domain) | | |
| A06 | Redirect URL rejected outside Domain | | |
| A07 | Webhook URL registered (POST) | | |
| A08 | Webhook URL registered (GET) if claimed | | |
| A09 | Panel shows plan, `account_limit`, expiry | | |
| A10 | Staging DeloRey receiver deployed | | |
| A11 | Second IG page available (multi-tenant) | | |
| A12 | Clock sync NTP verified | | |
| A13 | Secret redaction in logs verified | | |

---

## B. Authentication & service info

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| B01 | `GET /service/info` with valid key → 200 | | |
| B02 | Missing `X-Api-Key` → fail | | |
| B03 | Invalid key → fail | | |
| B04 | Response includes domain, token, oauth url, plan, accounts | | |
| B05 | `instagram_oauth_url` opens Meta/IG login | | |
| B06 | `login_redirect_url` matches config | | |
| B07 | `data.token` equals used key or documented variant | | |
| B08 | HTTPS only; HTTP refused | | |
| B09 | TLS version ≥ 1.2 | | |

---

## C. OAuth / page connect

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| C01 | Connect page via oauth URL succeeds | | |
| C02 | Redirect hits DeloRey callback | | |
| C03 | Page appears in `/service/accounts` | | |
| C04 | Fields: id, username, instagram_user_id, profile_photo, is_active, expires_at | | |
| C05 | `internal_token` present; never logged | | |
| C06 | Signed OAuth `state` round-trip binds correct tenant | | |
| C07 | Replayed/forged state rejected | | |
| C08 | Concurrent OAuth two tenants — no swap | | |
| C09 | Connect beyond `account_limit` fails clearly | | |
| C10 | Reconnect after expiry works | | |
| C11 | Cancel/deny OAuth — no partial binding | | |

---

## D. Accounts API

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| D01 | `GET /service/accounts` lists pages | | |
| D02 | Pagination params documented/behave | | |
| D03 | Empty account list shape | | |
| D04 | `DELETE /service/accounts/{id}` removes page | | |
| D05 | Delete wrong id → error | | |
| D06 | Delete is irreversible at provider | | |
| D07 | After delete, send_message fails | | |
| D08 | After delete, webhooks stop for that page | | |

---

## E. Send message API

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| E01 | Send plain text succeeds | | |
| E02 | Persian text OK | | |
| E03 | Emoji OK | | |
| E04 | Empty message rejected | | |
| E05 | Missing account_id rejected | | |
| E06 | Missing recipient_id rejected | | |
| E07 | Invalid UUID account_id rejected | | |
| E08 | Send with postback button | | |
| E09 | Send with web_url button | | |
| E10 | Mixed buttons array | | |
| E11 | Invalid button type rejected | | |
| E12 | Max buttons limit discovered | | |
| E13 | Max title length discovered | | |
| E14 | Response includes message id? | | |
| E15 | Idempotent retry behavior documented/tested | | |
| E16 | Send while rate limited — queue vs error | | |
| E17 | Measure latency p50/p95 | | |

---

## F. Inbound DM webhooks

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| F01 | Text DM delivered to webhook | | |
| F02 | Schema matches/extends sample | | |
| F03 | `event_id` present & unique | | |
| F04 | `message.mid` present | | |
| F05 | `sender.id` usable as recipient_id | | |
| F06 | `account_id` correct | | |
| F07 | Timestamps sane (ms vs s) | | |
| F08 | Envelope array always? | | |
| F09 | `executionMode` values (test/prod) | | |
| F10 | Rapid 20 DMs — loss count | | |
| F11 | Unicode edge cases | | |
| F12 | Very long text | | |

---

## G. Postbacks & interactive

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| G01 | User taps postback — webhook received | | |
| G02 | Payload echoed correctly | | |
| G03 | web_url opens externally (no webhook expected?) | | |
| G04 | Postback after 24h window | | |

---

## H. Media & attachments (every type)

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| H01 | Inbound image | | |
| H02 | Inbound video | | |
| H03 | Inbound audio / voice | | |
| H04 | Inbound file | | |
| H05 | Inbound sticker | | |
| H06 | Inbound GIF | | |
| H07 | Inbound shared post | | |
| H08 | Inbound shared reel | | |
| H09 | Inbound story reply media | | |
| H10 | Inbound album / multi-attach | | |
| H11 | Media URL downloadable from DeloRey IP | | |
| H12 | Media URL expiry | | |
| H13 | Outbound image send API | | |
| H14 | Outbound video send API | | |
| H15 | Outbound audio send API | | |
| H16 | Outbound file send API | | |
| H17 | Invalid outbound media error | | |
| H18 | Oversized media error | | |

---

## I. Typing, read, receipts

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| I01 | Send typing_on | | |
| I02 | Send typing_off | | |
| I03 | Receive customer typing | | |
| I04 | Mark as read API | | |
| I05 | Delivery receipt webhook | | |
| I06 | Read receipt webhook | | |

---

## J. Comments

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| J01 | Comment create webhook | | |
| J02 | Capture full comment schema | | |
| J03 | `reply_comment` succeeds | | |
| J04 | Invalid comment_id fails | | |
| J05 | Reply visible on IG | | |
| J06 | Comment on reel | | |
| J07 | Comment on carousel | | |
| J08 | Comment delete/edit events | | |
| J09 | Private reply to commenter via DM | | |
| J10 | Comment storm 100/5min | | |

---

## K. Stories & reels context

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| K01 | Story reply inbound | | |
| K02 | Story mention inbound | | |
| K03 | Reel comment inbound | | |
| K04 | Reel share to DM | | |
| K05 | Story ID fields present | | |

---

## L. Follow status & list posts (async)

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| L01 | `follow_status` accepted | | |
| L02 | Result webhook arrives | | |
| L03 | Correlation to request possible | | |
| L04 | Latency of result | | |
| L05 | Never arrives — timeout behavior | | |
| L06 | `list_posts` accepted | | |
| L07 | Result webhook schema | | |
| L08 | fields filter honored | | |
| L09 | limit honored | | |
| L10 | media_type includes REELS? | | |

---

## M. Webhook authenticity & abuse

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| M01 | Signature mechanism exists | | |
| M02 | Valid signature accepted | | |
| M03 | Invalid signature rejected | | |
| M04 | Missing signature rejected | | |
| M05 | Replay rejected | | |
| M06 | Path secret required | | |
| M07 | Forged event with valid account_id rejected without sig | | |
| M08 | Provider egress IP list (if any) | | |

---

## N. Idempotency, ordering, retries

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| N01 | Duplicate `event_id` | | |
| N02 | Duplicate `mid` | | |
| N03 | Out-of-order timestamps | | |
| N04 | Provider retry on 500 | | |
| N05 | Retry schedule captured | | |
| N06 | Slow ACK 10s behavior | | |
| N07 | 15 min downtime gap | | |

---

## O. Rate limits & queue

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| O01 | Confirm ~200/h/page | | |
| O02 | Behavior at 180/h | | |
| O03 | Behavior at 250/h | | |
| O04 | Queue delay histogram | | |
| O05 | Queue drop vs delay | | |
| O06 | Ordering under queue | | |
| O07 | Whether webhooks count to limit | | |
| O08 | Multi-page isolation of buckets | | |
| O09 | HTTP status when limited | | |
| O10 | Circuit after sustained limit | | |

---

## P. Permissions & revocation

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| P01 | List granted Meta scopes (ask vendor) | | |
| P02 | Revoke from IG settings | | |
| P03 | Confirm no prior webhook notice | | |
| P04 | Time until send fails | | |
| P05 | `/service/accounts` reflects inactive/removed | | |
| P06 | expires_at countdown accuracy | | |
| P07 | Partial permission removal cases | | |

---

## Q. Multi-tenant isolation

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| Q01 | Tenant A/B pages connected | | |
| Q02 | DM to A never in B | | |
| Q03 | Comment on A never in B | | |
| Q04 | Unknown account_id dropped | | |
| Q05 | Global unique page constraint | | |
| Q06 | Key leak blast radius assessed | | |
| Q07 | Offboard A leaves B intact | | |
| Q08 | Shared webhook stress 30 min | | |

---

## R. Failure injection

| ID | Scenario (see doc 09) | Result | Evidence |
|----|-----------------------|--------|----------|
| R01 | A1 expired API key | | |
| R02 | A3 page expired | | |
| R03 | A4 silent revoke | | |
| R04 | A6 accidental delete | | |
| R05 | C1 duplicate webhook | | |
| R06 | C2 lost webhook | | |
| R07 | E1 rate limit | | |
| R08 | F2 provider outage simulation | | |
| R09 | G1 wrong tenant OAuth | | |
| R10 | G2 wrong tenant webhook | | |
| R11 | H1 hung follow_status | | |
| R12 | J1 unknown event_type | | |
| R13 | D1 unsupported media | | |
| R14 | Network timeout on send | | |
| R15 | Invalid JSON webhook | | |

---

## S. Conversation scenarios (channel behavior)

| ID | Scenario | Result | Evidence |
|----|----------|--------|----------|
| S01 | First DM from new user | | |
| S02 | Returning user same sender.id | | |
| S03 | User messages two pages (A/B) | | |
| S04 | Operator text reply (stub) | | |
| S05 | AI stub reply then user follow-up | | |
| S06 | Button choose → continue thread | | |
| S07 | Comment then DM same user | | |
| S08 | 50-turn text conversation | | |
| S09 | Idle 25h then user messages (24h window) | | |
| S10 | User blocks page | | |
| S11 | User reports spam behavior (observe) | | |
| S12 | Simultaneous inbound+outbound | | |

---

## T. Performance suite (summary)

| ID | Test | p50 | p95 | p99 | Result |
|----|------|-----|-----|-----|--------|
| T01 | send_message latency | | | | |
| T02 | webhook delay text | | | | |
| T03 | webhook delay comment | | | | |
| T04 | media download | | | | |
| T05 | concurrent 10 sends | | | | |
| T06 | 24h soak error rate | | | | |
| T07 | recovery after 15m outage | | | | |

---

## U. Documentation & contract gaps (vendor Q&A)

| ID | Question | Answer recorded? |
|----|----------|------------------|
| U01 | Exact Base URL + versioning | |
| U02 | Full webhook event catalog + JSON Schema | |
| U03 | Webhook signature spec | |
| U04 | Retry policy | |
| U05 | Idempotency for send | |
| U06 | Async correlation id | |
| U07 | Media support roadmap | |
| U08 | Pricing 100/1k/5k pages | |
| U09 | SLA / uptime history | |
| U10 | DPA / data residency / retention | |
| U11 | Multi-tenant SaaS allowed? | |
| U12 | Per-page webhook URLs? | |
| U13 | Scoped API keys? | |
| U14 | Status page | |
| U15 | Meta partnership proof | |
| U16 | Product template API truth vs marketing | |
| U17 | What “data not given to developer” means vs webhook text | |
| U18 | Egress IPs | |
| U19 | Key rotation dual-key | |
| U20 | Secondary region / DR | |

---

## V. Security checklist

| ID | Check | Result |
|----|-------|--------|
| V01 | No secrets in frontend | |
| V02 | Credentials encrypted at rest (DeloRey) | |
| V03 | Webhook auth gate | |
| V04 | Tenant fail-closed routing | |
| V05 | PII redaction in logs | |
| V06 | Admin audit on connect/disconnect | |
| V07 | Threat model reviewed | |
| V08 | Pen test ingress (staging) | |

---

## W. Architecture compliance (DeloRey)

| ID | Check | Result |
|----|-------|--------|
| W01 | No BoxAPI calls from Runtime | |
| W02 | No BoxAPI calls from Commerce Skills | |
| W03 | Provider behind port interface | |
| W04 | Normalized messages only cross boundary | |
| W05 | Capability flags used (no scattered if boxapi) | |
| W06 | Local SoR for conversations | |
| W07 | Exclusive page ownership policy drafted | |

---

## X. Exit review

| Gate | Met? |
|------|------|
| Security gate (doc 04 §13) | |
| Multi-tenant tests Q01–Q08 | |
| Core DM F01–F07 + E01 | |
| Media waived or passed | |
| Rate limit profile O01–O06 | |
| Cost quote U08 | |
| Decision updated in doc 13 | |

### Final QA verdict

| Options | Select one |
|---------|------------|
| PASS — ready for Growth design | |
| PASS WITH LIMITATIONS — text-only / capped tenants | |
| FAIL — NO GO | |
| INCOMPLETE — lab not finished | |

**QA Lead sign-off:** _________________ Date: ________  
**Architect sign-off:** _________________ Date: ________
