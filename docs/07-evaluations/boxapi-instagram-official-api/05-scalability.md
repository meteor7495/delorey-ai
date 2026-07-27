# 05 — Scalability

Can BoxAPI support DeloRey Growth-scale Instagram traffic?

**Assumption set (explicit hypotheses — replace with lab numbers):**

| Assumption | Value | Status |
|------------|-------|--------|
| Meta/BoxAPI rate limit | 200 req/h/page | Documented |
| Avg AI outbound messages / conversation | 4 | Hypothesis |
| Conversations / page / day | 50 (SMB) → 500 (busy) | Hypothesis |
| Webhook fan-in capacity | Unknown | Must test |
| BoxAPI account_limit | Plan-dependent | Documented field, value Unknown |
| DeloRey merchants with IG enabled | Scale scenarios below | |

---

## 1. Scale scenarios

| Merchants (IG on) | Pages (1:1) | Sustained send budget @200/h | Notes |
|-------------------|-------------|------------------------------|-------|
| 100 | 100 | 20,000 req/h aggregate | Feasible **if** provider horizontally scales webhooks |
| 500 | 500 | 100,000 req/h aggregate | Provider + DeloRey queue mandatory |
| 1,000 | 1,000 | 200,000 req/h aggregate | Needs proven multi-tenant ops |
| 5,000 | 5,000 | 1,000,000 req/h aggregate | Unlikely without enterprise contract |
| 10,000 | 10,000 | 2,000,000 req/h aggregate | Treat as **not credible** on current docs |

Aggregate Meta budget scales linearly with pages. **Bottleneck is rarely the math of 200/h/page** — it is:

1. Provider webhook egress fan-out reliability
2. Shared API key / account orchestration
3. Queue delay under burst
4. OAuth/domain operations at onboarding volume
5. Support & failure recovery staffing

---

## 2. Connections

| Concern | Assessment |
|---------|------------|
| Pages per BoxAPI account | Bound by `account_limit` — **Unknown numbers** |
| One DeloRey platform key for all merchants | Operationally simple; isolation **dangerous** |
| One BoxAPI account per merchant | Better isolation; onboarding & billing complexity explode |
| Concurrent OAuth connects | Unknown |
| Connection expiry waves | Many `expires_at` aligning → mass re-auth incidents |

**At 1,000+ merchants, connection lifecycle is an SRE problem**, not a feature checkbox.

---

## 3. Webhooks

| Load driver | Risk |
|-------------|------|
| Single webhook URL for all pages | Hot endpoint; noisy neighbor; blast radius |
| Burst (campaign / viral reel comments) | Comment storms can dwarf DM rates |
| Async action results mixed with messaging | Same pipe contention |
| DeloRey processing time | Must ACK fast → internal queue (match Shopify webhook pattern) |

**Unknowns to measure:**

- Max sustained webhook POST rate
- Timeout / retry when DeloRey returns 500
- Payload size limits
- Whether provider collapses under slow consumers

---

## 4. Limits & burst traffic

### Per-page ceiling reality check

| Scenario | Msgs out / hour needed | Fits in 200/h? |
|----------|------------------------|----------------|
| 20 conv/h × 3 replies | 60 | Yes |
| 40 conv/h × 4 replies | 160 | Marginal |
| 80 conv/h × 4 replies | 320 | **No — queue delay** |
| Flash sale comment reply bot | Spiky | Queue / drop Unknown |

AI Sales Employee that “sounds human” with many short turns will **hit 200/h sooner than Telegram**.

DeloRey must:

- Coalesce replies
- Prefer one rich message over three fragments
- Back-pressure Runtime when channel near limit
- Surface “delayed send” in Inbox

### Provider smart queue

Documented qualitatively only. Critical Unknowns:

| Question | Impact |
|----------|--------|
| Max queue depth? | Loss vs delay |
| Ordering preserved? | Conversation correctness |
| Visible ETA? | UX |
| Duplicate send after dequeue? | Idempotency |
| Multi-tenant fair queueing? | Noisy neighbor |

---

## 5. Retry behavior at scale

Without idempotent send:

- DeloRey retry storms amplify rate-limit pressure
- Duplicate customer messages damage trust

**Rule:** Scale is impossible without idempotency + centralized per-page token bucket on DeloRey side (even if provider also queues).

---

## 6. Queue requirements (DeloRey)

| Queue | Purpose |
|-------|---------|
| `instagram.inbound` | Normalize webhooks off request path |
| `instagram.outbound` | Rate-limit aware send with per-`account_id` bucket |
| `instagram.reconcile` | Poll account health / expires_at |
| `instagram.dlq` | Failed sends / poison payloads |

Mirror existing `batch.sync` discipline from commerce adapters.

---

## 7. Scalability verdict by tier

| Merchants | Verdict | Conditions |
|-----------|---------|------------|
| **100** | **Possible** | Lab proves webhooks, isolation, media decision; dedicated outbound workers |
| **500** | **Conditional** | Enterprise pricing, multi-tenant security model, queue observability, on-call |
| **1,000** | **Unproven** | Requires load test with vendor; likely need multi-key sharding |
| **5,000** | **Not supportable on current evidence** | Needs alternate architecture or direct Meta where possible |
| **10,000** | **No** on current docs | Platform-phase problem; do not bet Growth plan on BoxAPI alone |

---

## 8. Hidden scale risks

1. **Comment viral bursts** overwhelm DM-oriented capacity planning.
2. **Single panel webhook** becomes organizational SPOF.
3. **Manual OAuth domain constraints** slow self-serve onboarding.
4. **Provider-side data wipe** on disconnect destroys forensic ability if DeloRey did not persist.
5. **Support channel (Telegram/Bale)** does not scale as enterprise NOC.
6. **No published status page / SLA** → cannot offer merchant Instagram SLA stronger than “best effort.”

---

## 9. Required scale tests (gate)

Before approving “supports N merchants”:

- [ ] Soak test: 1 page @ 180 req/h for 24h
- [ ] Burst test: 5 minutes @ 5× average inbound webhooks
- [ ] Multi-page test: 50 pages concurrent
- [ ] Slow-consumer test: DeloRey responds in 10s / 30s
- [ ] Rate-limit queue delay histogram
- [ ] Re-OAuth storm simulation (20 pages expire same hour)
