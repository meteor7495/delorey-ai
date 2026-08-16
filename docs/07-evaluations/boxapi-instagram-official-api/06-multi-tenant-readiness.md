# 06 — Multi-Tenant Readiness

**This is the most important document in the pack.**

Seloma is multi-tenant by design. Instagram Growth cannot ship if BoxAPI forces a single-tenant automation model.

---

## 1. Question

Can multiple Seloma merchants use BoxAPI simultaneously **without cross-tenant leakage**, with operable onboarding, and with credentials/events correctly isolated?

**Docs-only answer:** **Not proven. Likely weak. Treat as high risk.**

---

## 2. Observed tenancy model (inferred)

From Official docs:

- One BoxAPI **user/account** has one `X-Api-Key`.
- That account has a **plan.account_limit**.
- Multiple Instagram pages appear under `/service/accounts`.
- **One webhook URL** is configured in API settings for the BoxAPI user.
- Webhook body includes `account_id` to identify which page the event belongs to.

This is a **multi-page, single-integrator** model — common for agencies — **not** a proven **multi-tenant SaaS customer isolation** model.

---

## 3. Two integration topologies

### Topology A — Platform key (one BoxAPI account for all Seloma merchants)

```
[Merchant A IG]─┐
[Merchant B IG]─┼─► BoxAPI account (Seloma) ─webhook─► Seloma /webhooks/instagram
[Merchant C IG]─┘         X-Api-Key (god key)
```

| Pros | Cons |
|------|------|
| Simple billing to BoxAPI | God-key blast radius |
| One domain / redirect config | Shared webhook fan-in |
| Easier ops initially | Cross-tenant mis-map risk |
| | account_limit may block scale |
| | Noisiest merchant affects queues |
| | Contractual “whose pages?” ambiguity |

### Topology B — Per-merchant BoxAPI account

```
Merchant A → BoxAPI key A → webhook A → Seloma binding A
Merchant B → BoxAPI key B → webhook B → Seloma binding B
```

| Pros | Cons |
|------|------|
| Stronger isolation | Onboarding nightmare |
| Separate rate-limit queues | Domain/redirect per merchant or complex routing |
| Smaller blast radius | Pricing × N accounts |
| | Seloma becomes BoxAPI reseller ops |

### Topology C — Hybrid (recommended direction if vendor cooperates)

- Seloma platform owns Meta-facing relationship via BoxAPI **with contractual tenant isolation features**:
  - per-page webhook path OR signed tenant claim
  - scoped API credentials
  - per-tenant billing telemetry
- Seloma `ChannelBinding` remains SoR for tenant mapping

**Vendor support for Topology C: Unknown / not documented.**

---

## 4. How tokens should be stored (Seloma)

Regardless of topology:

| Secret | Storage | Notes |
|--------|---------|-------|
| BoxAPI `X-Api-Key` | `ChannelBinding.credentialsCipher` or dedicated `ProviderCredential` table encrypted | Never frontend |
| BoxAPI page `account_id` | Plain UUID on binding metadata | Tenant-scoped unique |
| Webhook secret | `ChannelBinding.webhookSecret` | Path + header compare |
| `internal_token` | Prefer **do not store**; if required, encrypt | Never log |
| OAuth state | Short-lived Redis keyed by tenant | CSRF protection |
| Merchant Meta tokens | **Not available** — cannot store | Lock-in |

**Never** put BoxAPI keys in Runtime prompts, analytics raw dumps, or support screenshots.

### Suggested binding record (conceptual)

```text
ChannelBinding {
  tenantId
  channel: 'instagram'
  provider: 'boxapi'          // explicit provider enum
  externalAccountId           // BoxAPI account_id (page)
  credentialsCipher           // { apiKeyId | apiKey }
  webhookSecret
  status: connected|degraded|disconnected
  expiresAt
}
```

Unique constraints:

- `(tenantId, channel)` — matches current Telegram/Bale pattern (one IG binding per tenant for v1)
- `(provider, externalAccountId)` **global unique** — prevents two tenants claiming same page

---

## 5. Tenant isolation rules (mandatory)

1. Resolve tenant **only** from Seloma binding lookup (`account_id` → binding → `tenantId`).
2. If `account_id` unknown → **drop + alert** (do not infer).
3. Ignore any tenant identifiers inside webhook body if BoxAPI ever adds them.
4. Outbound send must load credentials by `tenantId` and verify `account_id` belongs to that tenant.
5. Admin APIs must not list pages across tenants.
6. Support tooling: break-glass with audit.

---

## 6. Cross-tenant leakage risks

| Risk | Mechanism | Severity |
|------|-----------|----------|
| Webhook mis-map | Bug maps `account_id` to wrong tenant | **Critical** |
| Shared logs | Provider or Seloma logs include message text + wrong tenant index | High |
| God key leak | Attacker enumerates `/service/accounts` and messages all pages | **Critical** |
| OAuth redirect confusion | state param missing → page attaches to wrong tenant | **Critical** |
| Panel operator error | Human connects page under wrong BoxAPI subaccount | High |
| Cache key collision | Redis keys omit tenantId | High |
| Async follow_status result | Result webhook without correlation attaches to wrong conversation | High |

**OAuth `state` binding is non-negotiable** even if BoxAPI redirect is dumb.

---

## 7. Domain / Redirect multi-tenant issue

BoxAPI requires Redirect URL ⊆ registered Domain.

**Safe pattern:**

```text
https://<public-api-host>/v1/channels/instagram/oauth/callback
```

- Single callback
- `state` = signed `{tenantId, nonce, exp}`
- After BoxAPI redirect, Seloma associates newly appeared account via `/service/accounts` diff **scoped by state**

**Unsafe pattern:** trusting “last connected page” globally.

**Unknown:** Does BoxAPI pass merchant identifiers on redirect query string? **Must test.**

---

## 8. Data isolation vs provider custody

Even with perfect Seloma isolation:

- BoxAPI staff / systems may see multi-merchant data under Topology A.
- Merchants may reject “another Iranian SaaS holds our Instagram inbox.”

**Product/legal requirement:** disclose subprocessors; offer Enterprise Topology B if demanded.

---

## 9. Multi-tenant readiness score

| Criterion | Score /10 |
|-----------|-----------|
| Documented tenant model | 2 |
| Per-tenant credentials | 2 |
| Webhook isolation | 2 |
| OAuth safe binding | 3 (doable on our side) |
| Cross-tenant leak resistance | 2 |
| Ops at 1,000 tenants | 2 |

**Aggregate: 2/10 — not multi-tenant ready on paper.**

---

## 10. Decision rule

| Condition | Outcome |
|-----------|---------|
| Vendor provides signed per-page webhooks + scoped keys + DPA | Continue Growth design |
| Vendor only offers agency multi-page + shared webhook | Spike only; production capped / Topology B only |
| Cannot prevent cross-tenant attach on OAuth | **NO GO** |

---

## 11. Spike tests for tenancy (must pass)

- [ ] Connect Page A as Tenant A and Page B as Tenant B
- [ ] Send DM to A; ensure B Inbox never receives
- [ ] Forge webhook with B’s `account_id` to A’s URL (if separate) / shared URL — must reject wrong binding
- [ ] Parallel OAuth for two tenants; no swapped bindings
- [ ] Delete Tenant A page; Tenant B unaffected
- [ ] API key rotation for A does not disconnect B (Topology B)
- [ ] Load test 20 tenants × inbound flood — no cross-delivery
