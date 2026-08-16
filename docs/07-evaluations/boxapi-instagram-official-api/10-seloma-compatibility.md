# 10 — DeloRey Compatibility

Evaluate BoxAPI against DeloRey architecture principles.

**Primary principle:** *One Brain, Multiple Channels — adapters format and deliver only.*

Instagram is **Growth**, not MVP. Compatibility assessment is for future `InstagramAdapter`, not current release scope.

---

## 1. Architecture alignment map

| DeloRey component | Must BoxAPI touch it? | Compatible approach |
|-------------------|-----------------------|---------------------|
| Channel Adapter | **Yes** | Thin `InstagramAdapter` + `BoxApiClient` |
| Conversation Engine | No | Receives `NormalizedInboundMessage` only |
| Runtime / AI Employee | No | `executeTurn` unchanged |
| Context Engine | No | Uses DeloRey history + commerce context |
| Commerce Core | No | Skills remain tenant-scoped |
| Knowledge Base | No | Untouched |
| Human Handoff / Inbox | Indirect | `deliverOperatorReply` via adapter |
| Workspace | Indirect | Connect/status UX |
| Audit Logs | Indirect | Log adapter actions, not provider internals as SoR |
| Revenue Dashboard | No | Attribution stays DeloRey |

**Pass condition:** BoxAPI remains a **provider behind the adapter**, never a place where Skills, pricing, or escalation rules live.

---

## 2. Fit with existing adapter patterns

DeloRey messaging adapters (Telegram/Bale) provide:

1. `connect` → verify + encrypt credentials + `ChannelBinding`
2. Webhook with binding id + secret
3. Normalize → idempotent ingest → `Runtime.executeTurn` → send
4. `deliverOperatorReply` for Inbox

### BoxAPI mapping

| Telegram/Bale concept | BoxAPI analog | Gap |
|-----------------------|---------------|-----|
| Bot token | `X-Api-Key` (+ page `account_id`) | Key may be platform-scoped |
| Webhook secret header | **Undocumented** | Must invent path secret + demand signature |
| `update_id` idempotency | `event_id` / `mid` | Must confirm uniqueness |
| Send text API | `send_message` | OK |
| Media | Strong on TG | Weak/unknown on BoxAPI |
| GetMe on connect | `/service/info` + accounts | OK-ish |
| Per-tenant bot | Per-page account | Topology risk |

**Compatibility: moderate for text DM shape; poor for tenancy/security parity with Telegram.**

---

## 3. Commerce platform needs vs provider

| Commerce chat need | BoxAPI | Compatibility |
|--------------------|--------|---------------|
| Answer product questions | Text OK if Context Engine fed | OK |
| Send product cards / images | Buttons yes; images U; product template marketing-only | **Weak** |
| Collect order screenshots | Inbound media U | **Weak** |
| Comment → DM sales funnel | Comment reply yes; private reply U | Partial |
| Follow-gate campaigns | Async follow_status | Fragile — don’t hard-depend |
| Ads referral context | U | Weak |

For Iranian D2C, Instagram without reliable media/product cards is a **degraded sales channel** vs Telegram.

---

## 4. Human Handoff compatibility

| Requirement | Fit |
|-------------|-----|
| Pause AI on `human_owned` | Adapter-agnostic — OK |
| Operator reply delivery | Text send — likely OK |
| Handoff packet channel metadata | Store `instagram` + external thread id — OK |
| Real-time typing to operator | Unknown events — weak |
| Historical transcript | Must be DeloRey-local from webhooks — OK if webhooks reliable |

**Risk:** Lost webhooks create Inbox holes operators cannot recover from provider APIs (no history API).

---

## 5. Context Engine / Conversation Engine

Compatible **if and only if**:

- Every inbound message is persisted under `tenantId`
- External thread key stable (`sender.id` + page id)
- Unknown message types don’t break turns
- Media either normalized to attachments or explicitly ignored

Incompatible patterns to forbid:

- Calling BoxAPI Data API inside Context Engine for “enrichment” without product approval
- Storing business state only at BoxAPI
- Using BoxAPI ChatGPT API as a second brain

---

## 6. Audit Logs

| Event | Who logs |
|-------|----------|
| Page connected / disconnected | DeloRey |
| Inbound message received | DeloRey (metadata; careful with PII policy) |
| Outbound AI/operator send | DeloRey |
| Provider errors | DeloRey |
| Provider-side wipes | Detect + audit |

Provider audit APIs: **Unknown** — do not rely.

---

## 7. Workspace UX compatibility

Needed Workspace surfaces (Growth):

- Connect Instagram (OAuth redirect via BoxAPI URL)
- Connection health (`is_active`, `expires_at`)
- Reconnect CTA
- Disconnect (call DELETE account + local binding clear)

Domain/Redirect constraints make self-serve connect **harder** than Telegram token paste — still doable with DeloRey-hosted callback.

---

## 8. “Provider must remain only an Adapter” stress tests

| Anti-pattern | Risk with BoxAPI | Guard |
|--------------|------------------|-------|
| Put FAQ automation only in n8n via BoxAPI | Splits brain | Forbid parallel bots on same page |
| Use BoxAPI GPT for replies | Two brains | Ban in architecture review |
| Follow-status sales rules inside provider workflows | Logic leak | Keep in Skills/Runtime |
| Merchant configures ManyChat + DeloRey same page | Conflict | Detect/echo loops; policy |
| Rely on BoxAPI storage as Inbox | SoR leak | Local persistence mandatory |

**Compatibility verdict:** BoxAPI can fit **only** if DeloRey enforces exclusive page ownership and a hard adapter boundary.

---

## 9. Compatibility scorecard

| Area | Score /10 |
|------|-----------|
| Thin adapter feasibility (text) | 7 |
| Parity with Telegram/Bale depth | 3 |
| Commerce message richness | 3 |
| Handoff / Inbox | 6 |
| Context / Runtime purity | 8 (if we stay disciplined) |
| Multi-tenant Workspace ops | 3 |
| Audit completeness | 5 |
| Failure isolation | 4 |

**Overall architecture fit: 5/10** — acceptable as a constrained Growth transport after gates; not a drop-in Meta-quality channel.

---

## 10. Required DeloRey changes (when Growth starts)

1. Extend `ChannelBinding.channel` with `instagram`
2. Add `provider` discriminator (`boxapi` | `meta_direct` | …)
3. `adapters/instagram/` module mirroring Telegram
4. `InstagramProviderPort` interface (see doc 11)
5. Outbound rate limiter per page
6. Health reconciler job
7. HandoffService registration for operator delivery
8. OAuth callback + state
9. Product decision: text-only v1 vs wait for media

None of this belongs in MVP code paths until Growth exit criteria from roadmap are met.
