# 09 — Failure Scenarios

Exhaustive failure catalog for BoxAPI as Instagram transport.  
Each scenario: detection → customer impact → DeloRey response → residual risk.

Status: **U** = needs lab confirmation.

---

## A. Identity & auth failures

| ID | Scenario | Documented? | Detection | Impact | DeloRey response |
|----|----------|-------------|-----------|--------|------------------|
| A1 | Expired BoxAPI API key | U | 401/403 on send | All pages down (Topology A) | Degrade all IG; alert SEV1 |
| A2 | Rotated key not updated | U | Same | Same | Runbook dual-key |
| A3 | Page `expires_at` passed | Y | Poll / send fail | Single merchant down | Mark binding disconnected; notify merchant re-OAuth |
| A4 | Merchant revokes IG permission | Y (silent) | Send fail / accounts missing | Silent outage | Health poll ≤15 min |
| A5 | Page deleted at IG | U | Same | Outage | Same |
| A6 | `DELETE /service/accounts` accidental | Y wipe | Missing account | Permanent provider-side wipe | Reconnect; local history remains |
| A7 | Wrong `account_id` on send | U | Error | Failed reply | Validate binding |
| A8 | Invalid `recipient_id` | U | Error | Failed reply | Safe user message |
| A9 | Using Data API creds on Official API | Likely fail | Auth error | Misconfig | Separate credential stores |

---

## B. Permission & policy

| ID | Scenario | Impact | Response |
|----|----------|--------|----------|
| B1 | Missing DM permission after Meta policy change | Cannot message | Channel degraded + merchant task |
| B2 | Outside 24h messaging window | Send rejected (U) | Explain limitation; handoff |
| B3 | BoxAPI unilateral cutoff for “violation” | Platform IG dead | SEV1; vendor escrow; abstraction failover |
| B4 | Merchant IG restricted / disabled | Page dead | Merchant notification |
| B5 | Comment reply forbidden on restricted content | Partial | Skill-level catch |

---

## C. Messaging path

| ID | Scenario | Risk | Response |
|----|----------|------|----------|
| C1 | Duplicate webhook | Double AI reply | Idempotency on `event_id`/`mid` |
| C2 | Lost webhook | Missed customer message | No provider catch-up API → irreversible unless user renuds |
| C3 | Out-of-order webhooks | Confused context | Order by timestamp; Context Engine tolerance |
| Dedupe key collision | False drop | Namespace by account_id |
| C5 | Echo of our outbound treated as inbound | Loop | Filter app-authored messages (U if echoes exist) |
| C6 | Empty text / unknown message type | Crash risk | Safe ignore + log |
| C7 | Postback without session | Orphan event | Map payload → conversation |
| C8 | Button URL phishing by merchant config | Trust | Allowlist checks in product |

---

## D. Media & attachments

| ID | Scenario | Response |
|----|----------|----------|
| D1 | Unsupported inbound media | Reply: “متن بفرستید” / handoff |
| D2 | Media URL 403 from DeloRey IP | Retry; escalate |
| D3 | Huge media OOM | Size cap |
| D4 | Invalid media on outbound | Validation before send |
| D5 | Malware file | Do not fetch executables; scan policy |

---

## E. Rate limit & queue

| ID | Scenario | Response |
|----|----------|----------|
| E1 | 200/h exceeded | Per-page token bucket; delay sends; Inbox badge “delayed” |
| E2 | Provider queue delay minutes/hours | SLA messaging; prefer handoff for urgent |
| E3 | Provider queue drop | DLQ + alert; never assume delivery |
| E4 | Retry storm worsens limit | Exponential backoff + jitter; circuit breaker |
| E5 | Comment storm | Separate priority vs DM; shed load |

---

## F. Infrastructure

| ID | Scenario | Response |
|----|----------|----------|
| F1 | Meta outage | Degrade IG; status page |
| F2 | BoxAPI outage | Same; cannot bypass (no Meta tokens) |
| F3 | Network partition DeloRey↔BoxAPI | Queue outbound; health check |
| F4 | DNS failure boxapi.ir | Same |
| F5 | TLS interception / cert change | Fail closed |
| F6 | DeloRey webhook endpoint down | Provider retries U; gap possible |
| F7 | Clock skew breaks signature (if added) | NTP |

---

## G. Multi-tenant failures

| ID | Scenario | Severity | Response |
|----|----------|----------|----------|
| G1 | OAuth attaches page to wrong tenant | Critical | Signed state; manual repair tool |
| G2 | Webhook routes to wrong tenant | Critical | Fail closed; SEV1 |
| G3 | Shared key leak | Critical | Rotate; Topology B migration |
| G4 | Tenant delete leaves page on BoxAPI | High | Ensure DELETE account on offboarding |
| G5 | Two tenants claim same IG page | High | Global unique externalAccountId |

---

## H. Async action failures

| ID | Scenario | Response |
|----|----------|----------|
| H1 | `follow_status` never returns | Timeout; do not block sales flow on follow-gate |
| H2 | `list_posts` never returns | Same |
| H3 | Result without correlation | Drop; don’t guess conversation |
| H4 | Result for deleted tenant | Drop |

**Product warning:** Do not build “must follow to buy” hard gates on unreliable async follow_status.

---

## I. Data & privacy failures

| ID | Scenario | Response |
|----|----------|----------|
| I1 | Provider wipes data on disconnect | DeloRey SoR intact |
| I2 | Provider retains data beyond contract | Legal escalation |
| I3 | Support asks for raw logs with PII | Redaction policy |
| I4 | Ambiguous custody statement vs webhook text | Written clarification |

---

## J. Unknown message / schema drift

| ID | Scenario | Response |
|----|----------|----------|
| J1 | New `event_type` | Versioned parser; unknown → DLQ |
| J2 | Field rename | Contract tests |
| J3 | `executionMode` prod vs test mix | Reject test in prod |
| J4 | Non-array webhook body | Tolerant parser after auth |

---

## K. Human handoff & commerce side effects

| ID | Scenario | Response |
|----|----------|----------|
| K1 | IG down during human_owned thread | Inbox shows channel error; operator informed |
| K2 | Duplicate operator send | Idempotency |
| K3 | AI sends after revoke mid-turn | Catch send error; escalate |
| K4 | Partial product recommendation send failure | Don’t claim “sent” in UI |

---

## L. Failure scenario coverage matrix (QA)

Every ID above must appear in [14-testing-checklist.md](./14-testing-checklist.md) with:

- Repro steps
- Expected detection signal
- Expected merchant-visible behavior
- Owner (Eng / QA / Support)

---

## M. Top 10 failures to simulate first

1. A4 silent revoke  
2. C1 duplicate webhook  
3. C2 lost webhook  
4. E1 rate limit exceeded  
5. F2 provider outage  
6. G1 wrong-tenant OAuth  
7. G2 wrong-tenant webhook  
8. A3 expires_at  
9. J1 unknown event type  
10. H1 hung async follow_status  

---

## N. Architectural implication

Because DeloRey **cannot hold Meta tokens**, **F2 BoxAPI outage is total Instagram channel failure** with no emergency direct-Meta failover inside Iran. That single fact must be accepted in Risk Register before GO for production.
