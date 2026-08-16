# BoxAPI Instagram Official API — Technical Evaluation

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Evaluation — **not approved for production** |
| **Owner** | Solutions Architecture / QA |
| **Date** | 2026-07-27 |
| **Provider** | [BoxAPI (SendBox)](https://boxapi.ir/) — Instagram Official Direct & Comment API |
| **Primary source** | [Official API docs](https://boxapi.ir/docs/instagram/instagram-official-api/) |
| **Seloma phase** | Growth (Instagram is **out of MVP**) |
| **Decision** | **GO with limitations** — spike / vendor validation only |
| **Spike code** | `apps/api/src/modules/adapters/instagram/` (gated by `BOXAPI_SPIKE_ENABLED`) |

---

## Purpose

Determine whether BoxAPI can become the **transport provider behind a future `InstagramAdapter`**, without moving business logic into the vendor and without assuming production readiness.

This evaluation tests **the provider**, not Seloma AI, and not LLM quality.

## Non-goals

- Building Instagram in MVP
- Replacing Telegram / Bale / Website Chat
- Trusting marketing claims without lab validation
- Storing merchant Instagram credentials in BoxAPI workflows as the system of record for Seloma business state

## Document index

| # | Document | Focus |
|---|----------|--------|
| 01 | [Provider Overview](./01-provider-overview.md) | APIs, auth, webhooks, limits, media, DMs |
| 02 | [Capability Matrix](./02-capability-matrix.md) | Supported / Official Meta / Provider / Unknown / Need testing |
| 03 | [API Quality](./03-api-quality.md) | REST, errors, pagination, docs, SDKs |
| 04 | [Security Review](./04-security-review.md) | Tokens, webhook integrity, least privilege |
| 05 | [Scalability](./05-scalability.md) | 100 → 10,000 merchants |
| 06 | [Multi-Tenant Readiness](./06-multi-tenant-readiness.md) | Isolation, token storage, cross-tenant risk |
| 07 | [Webhook Tests](./07-webhook-tests.md) | Event checklist |
| 08 | [Performance Tests](./08-performance-tests.md) | Latency, concurrency, recovery |
| 09 | [Failure Scenarios](./09-failure-scenarios.md) | Exhaustive failure catalog |
| 10 | [Seloma Compatibility](./10-seloma-compatibility.md) | Adapter-only fit |
| 11 | [Architecture Recommendation](./11-architecture-recommendation.md) | Wrap, abstract, replace |
| 12 | [Cost Analysis](./12-cost-analysis.md) | Merchant scale cost model |
| 13 | [Go / No-Go Decision](./13-go-no-go-decision.md) | Scorecard + verdict |
| 14 | [Testing Checklist](./14-testing-checklist.md) | Full QA matrix |
| 15 | [Spike Runbook](./15-spike-runbook.md) | How to run the lab harness in `apps/api` |

## Spike harness (code)

Evaluation spike lives at `apps/api/src/modules/adapters/instagram/`.

- Gated by `BOXAPI_SPIKE_ENABLED=1`
- Live HTTP only when `BOXAPI_LIVE=1`
- Captures webhooks in memory; **does not** call Runtime

See [15-spike-runbook.md](./15-spike-runbook.md).


**GO with limitations** for a **time-boxed spike** (7-day trial + paid single-page validation).

**NO GO for Growth production** until these blockers are cleared in a written lab report:

1. **Multi-tenant webhook model** — docs imply one panel webhook; Seloma needs per-binding isolation.
2. **Webhook authenticity** — no documented signature / HMAC / shared secret verification.
3. **Media & conversation completeness** — send/receive image/audio/video, typing, read receipts, history, mark-as-read are undocumented or absent.
4. **Operational SLAs** — uptime, latency p95/p99, queue delay under rate limit, support escalation — undocumented.
5. **Commercial terms** — published SaaS unit price per page / merchant for 100–10,000 tenants is **Unknown**; must be contracted before scale planning.

See [13-go-no-go-decision.md](./13-go-no-go-decision.md).

## Evidence rules used in this pack

| Label | Meaning |
|-------|---------|
| **Documented** | Explicit in BoxAPI Official API docs or related BoxAPI pages |
| **Marketing claim** | Stated on product/marketing pages; not confirmed in API reference |
| **Unknown** | Not specified; must be lab-tested or asked in writing |
| **Not supported (docs)** | Absent from Official API surface; treat as unsupported until proven |
| **Seloma requirement** | Needed for InstagramAdapter parity with Telegram/Bale depth |

## Related Seloma architecture

- Channel adapters are thin: normalize inbound → `Runtime.executeTurn` → deliver outbound
- Credentials encrypted on `ChannelBinding` / `StoreConnection`
- Tenant resolved from binding ID, never from untrusted body
- Instagram is Growth-phase only ([Roadmap](../../00-overview/roadmap.md))

## Spike exit criteria (minimum)

A spike may proceed to “approved for Growth design” only if all of the following are true and recorded:

- [ ] Signed webhook verification mechanism exists and is enforced
- [ ] Per-merchant page connect works without cross-tenant event leakage
- [ ] Text DM receive + send works end-to-end with stable user IDs
- [ ] Media inbound OR explicit product decision that text-only IG is acceptable for v1
- [ ] Rate-limit queue behavior measured (delay, drop, duplicate, ordering)
- [ ] Written pricing for ≥100 connected pages
- [ ] Abstraction layer designed so BoxAPI can be replaced without touching Runtime / Commerce / Handoff
