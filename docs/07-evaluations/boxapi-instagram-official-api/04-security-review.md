# 04 — Security Review

| Field | Value |
|-------|-------|
| **Scope** | BoxAPI Instagram Official API as future DeloRey transport |
| **Standard** | DeloRey Security Architecture + multi-tenant SaaS bar |
| **Method** | Docs-only threat assessment |
| **Verdict** | **Fail for production** until signature, tenancy, and custody gaps closed |

---

## 1. Executive security judgment

BoxAPI’s documented security posture is **API-key over HTTPS + panel-configured webhook**. That is a starting point for a solo automation, **not** for a multi-tenant commerce platform handling merchant customer conversations.

Critical blockers:

1. No documented **webhook signature / authenticity**.
2. Likely **single shared webhook** for all pages under one API key.
3. **Silent revoke** without notification.
4. Ambiguous **data custody** (provider stores customer data; DeloRey still needs transcripts).
5. **`internal_token` exposure** in account list responses.
6. Unilateral provider termination clause.

---

## 2. Token lifetime & refresh

| Control | Documented? | Assessment |
|---------|-------------|------------|
| API key lifetime | Unknown | Assume long-lived static secret until proven otherwise |
| Rotation procedure | Unknown | Must require panel rotation + zero-downtime dual-key — **Unknown** |
| Page `expires_at` | Yes | Forces re-OAuth; good that expiry exists, bad if no proactive webhook |
| Refresh tokens | Unknown / likely N/A | DeloRey never holds Meta tokens — cannot self-heal without merchant |
| Compromised key blast radius | High | One `X-Api-Key` appears to authorize all pages under the BoxAPI account |

**Risk:** Static platform API key = god key for all connected merchant pages if DeloRey uses one BoxAPI account.

**Required design:** Prefer **one BoxAPI sub-account per tenant** *or* contractual scoped keys per tenant. Neither is documented as supported. **Unknown — must ask.**

---

## 3. Encryption

| Layer | Status |
|-------|--------|
| Transit | Assume TLS to `boxapi.ir` — **verify cert, TLS version, HSTS in lab** |
| At rest (provider) | **Unknown** |
| DeloRey storage of `X-Api-Key` | Must use existing `encryptSecret` / AES-256-GCM pattern |
| DeloRey storage of page `account_id` | Non-secret identifier; still tenant-scoped |
| Media at rest | N/A until media supported |

---

## 4. Webhook authenticity

| Control | Meta typical | BoxAPI docs |
|---------|--------------|-------------|
| App secret HMAC | Yes | **Not documented** |
| Timestamp anti-replay | Common | **Not documented** |
| Verification handshake | Yes | **Not documented** |
| Shared secret header | Common (Telegram-style) | **Not documented** |
| IP allowlist of provider egress | Sometimes | **Not documented** |

**Attack scenario:** Attacker POSTs forged Instagram DMs to DeloRey webhook URL → AI replies / leaks commerce actions / pollutes Inbox.

**Mitigations if vendor has no signature (insufficient alone):**

- Obscure webhook path with high-entropy secret segment (like Telegram `bindingId` + secret header)
- IP allowlist **if** provider publishes stable egress IPs (**Unknown**)
- Reject events whose `account_id` is not bound to tenant
- Still **cannot** prove authenticity without cryptographic signature

**Gate:** No production without cryptographic webhook verification **or** mutually authenticated private networking (unlikely).

---

## 5. Replay attacks

| Question | Status |
|----------|--------|
| Are `event_id` values unique forever? | Unknown |
| Can old webhooks be resent? | Unknown |
| Timestamp skew window? | Sample has timestamps; no verification rules |
| DeloRey control | Mandatory idempotency keys on `event_id` + `message.mid` |

Replay of a “confirm order” style utterance is lower risk if Runtime is read-only for money movements, but still pollutes conversations and may trigger duplicate sends.

---

## 6. IP whitelist

| Item | Status |
|------|--------|
| Provider documents egress IPs | **No** |
| Provider allows ingress IP allowlist for API key | **Unknown** |
| DeloRey should allowlist webhook sources | Only if stable IPs exist |

---

## 7. Secret rotation

| Secret | Rotation path |
|--------|---------------|
| BoxAPI `X-Api-Key` | Panel — procedure **Unknown**; dual-key support **Unknown** |
| Webhook URL secret segment | DeloRey-controlled — rotate by re-registering URL |
| OAuth connected pages | Merchant re-login |
| `internal_token` | Purpose Unknown — never log |

---

## 8. Audit

| Need | Provider | DeloRey |
|------|----------|---------|
| Who connected a page | Unknown | Must audit in Workspace |
| Who sent a DM via API | Unknown | Audit outbound via our Audit Logs |
| Webhook delivery log | Unknown | Persist raw envelope (redacted) temporarily |
| Support access to merchant IG data at BoxAPI | Unknown — ask | Contractual DPA required |

Without provider audit APIs, DeloRey Audit Logs can only cover **our** side.

---

## 9. Permission scopes & least privilege

| Principle | Assessment |
|-----------|------------|
| Least privilege API keys | **Fail (docs)** — single key model |
| Per-page scoped credentials for DeloRey | Not available (by design: Meta tokens hidden) |
| OAuth scopes minimized | Claimed; list Unknown |
| Separation of Data API vs Official API credentials | Required — different products; do not share secrets |
| Panel user access control (SSO, 2FA) | **Unknown** |

Hiding Meta tokens from DeloRey reduces token exfiltration risk **but increases vendor lock-in and reduces DeloRey’s ability to rotate/respond independently**.

---

## 10. Threat model (abridged)

| Threat | Likelihood (docs) | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Forged webhooks | High if no signature | High | Blocker |
| Cross-tenant event misrouting | High with shared webhook | Critical | Binding map + fail closed |
| API key leak | Medium | Critical | Encrypt, rotate, env isolation |
| Provider insider access to DMs | Unknown | High | DPA, minimize retention asks |
| Silent page revoke | Documented | High | Poll health; mark channel disconnected |
| Log leakage of `internal_token` / message text | Medium | High | Redaction standards |
| Supplier kill switch | Documented | Critical | Abstraction + secondary provider strategy |
| OAuth redirect hijack | Medium if domain misconfigured | High | Strict Domain allowlist ownership |

---

## 11. Compliance / privacy notes (Iran + platform)

- Customer chat content is personal data. If BoxAPI stores it, DeloRey needs **processor terms**, retention limits, deletion APIs, and breach notification.
- Docs claim full wipe on page delete — verify whether DeloRey-local copies remain (they should, for Audit — with policy).
- “No user data given to developer” conflicts with operating an AI agent that must read message text. **Get written clarification.**

---

## 12. Security scorecard

| Control | Score /10 |
|---------|-----------|
| Token lifetime / refresh | 3 |
| Encryption (known) | 4 |
| Webhook signature | 1 |
| Replay protection | 2 |
| IP controls | 1 |
| Secret rotation | 2 |
| Auditability | 2 |
| Least privilege | 2 |
| Tenant isolation (provider) | 2 |
| Transparency / DPA readiness | 2 |

**Aggregate security: 2/10 (docs-only).** Not production-viable.

---

## 13. Mandatory security gates before any production traffic

- [ ] Cryptographic webhook verification documented and tested
- [ ] Written multi-tenant isolation model from vendor
- [ ] DPA + data residency + retention + deletion API
- [ ] Key rotation runbook tested
- [ ] No secrets in logs (ci lint)
- [ ] Channel disconnect detection < 15 minutes (poll or event)
- [ ] Penetration test of DeloRey Instagram webhook ingress
- [ ] Legal review of Meta ToS / Iranian intermediary risk (**outside eng scope, required**)
