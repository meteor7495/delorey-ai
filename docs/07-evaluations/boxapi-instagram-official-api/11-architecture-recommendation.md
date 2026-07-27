# 11 — Architecture Recommendation

---

## 1. Recommendations (short)

| Question | Answer |
|----------|--------|
| Integrate BoxAPI directly into Runtime/Commerce? | **No** |
| Wrap BoxAPI in a client? | **Yes** |
| Build an abstraction layer? | **Yes — mandatory** |
| Should `InstagramAdapter` hide provider details? | **Yes** |
| Can we replace BoxAPI later without touching business logic? | **Yes, if ports are correct from day one** |

---

## 2. Target architecture

```text
                    ┌──────────────────────────────┐
  Instagram user ─► │ BoxAPI (transport provider)  │
                    └──────────────┬───────────────┘
                                   │ webhook
                                   ▼
                    ┌──────────────────────────────┐
                    │ InstagramWebhookController   │
                    │  verify · idempotent ACK     │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ InstagramAdapter             │
                    │  normalize · bind tenant     │
                    │  deliverOperatorReply        │
                    └──────────────┬───────────────┘
                                   │ NormalizedInboundMessage
                                   ▼
                    ┌──────────────────────────────┐
                    │ Conversation + Runtime       │
                    │ Context · Skills · Handoff   │
                    └──────────────────────────────┘

Outbound:
  Runtime/Handoff → InstagramAdapter → InstagramProviderPort → BoxApiClient → BoxAPI
```

**BoxAPI never imports Skills, Knowledge, Commerce, or Handoff policy.**

---

## 3. Interface set (recommended)

### 3.1 `InstagramProviderPort` (replaceable)

```ts
// Conceptual — not implementation
interface InstagramProviderPort {
  getConnectUrl(tenantId: string, state: string): Promise<Url>;
  listPages(creds: ProviderCreds): Promise<Page[]>;
  disconnectPage(creds: ProviderCreds, pageId: string): Promise<void>;
  sendText(input: SendTextInput): Promise<SendResult>;
  sendButtons?(input: SendButtonsInput): Promise<SendResult>;
  replyComment?(input: ReplyCommentInput): Promise<SendResult>;
  // Optional capabilities — feature-detect
  sendImage?(input: SendImageInput): Promise<SendResult>;
  markSeen?(input: MarkSeenInput): Promise<void>;
  typingOn?(input: TypingInput): Promise<void>;
}
```

### 3.2 `InstagramWebhookNormalizer`

```ts
interface InstagramWebhookNormalizer {
  verify(headers, rawBody, secret): void; // throws if invalid
  parse(rawBody): ProviderEvent[];       // provider-specific
}
```

### 3.3 `InstagramAdapter` (channel-facing, stable)

Responsibilities match Telegram/Bale:

- Tenant binding lifecycle
- `NormalizedInboundMessage` production
- Outbound rendering from `OutboundMessage`
- Health status

Business logic stays out.

### 3.4 Capability flags

```ts
type InstagramProviderCapabilities = {
  mediaInbound: boolean;
  mediaOutbound: boolean;
  typing: boolean;
  markSeen: boolean;
  comments: boolean;
  storyReply: boolean;
  productTemplate: boolean;
  webhookSignatures: boolean;
};
```

Runtime/UI feature-gates on flags — **not** on `if (provider === 'boxapi')` scattered in Skills.

---

## 4. Direct vs wrap vs abstract

| Approach | Use? | Why |
|----------|------|-----|
| Direct HTTP from controllers/services everywhere | **No** | Lock-in + duplication |
| `BoxApiClient` only | Insufficient alone | Still leaks types into adapter callers |
| `BoxApiClient` + `InstagramProviderPort` + Adapter | **Yes** | Testable, replaceable |
| Shared “Meta-compatible” facade pretending full Graph API | Careful | Don’t fake unsupported methods |

---

## 5. Replacement strategy (anti lock-in)

To replace BoxAPI with Meta direct (outside Iran) or Vendor B:

1. Implement new `InstagramProviderPort`.
2. Map existing `ChannelBinding.provider` + credentials shape via migration job.
3. Keep `externalThreadId` = Instagram-scoped user id (not BoxAPI-only ids if avoidable).
4. Keep message idempotency keys namespaced: `ig:{pageIgId}:{mid}`.
5. Never persist BoxAPI envelope as the only message schema — store normalized model.

### Lock-in residual (cannot fully eliminate)

- No export of Meta page tokens from BoxAPI (documented).
- Merchants must re-OAuth on provider switch.
- Webhook downtime during cutover.
- Any BoxAPI-only features (smart queue semantics) must not be product promises.

**Accept re-OAuth as switching cost; reject business-logic lock-in.**

---

## 6. Credential & config architecture

```text
ProviderCredential (platform or tenant scoped)
  └─ apiKey cipher

ChannelBinding (per tenant)
  └─ provider = boxapi
  └─ externalAccountId = BoxAPI page UUID
  └─ externalPageIgUserId = instagram_user_id (for portability)
  └─ webhookSecret
  └─ expiresAt
```

Prefer storing **both** BoxAPI UUID and IG user id.

---

## 7. Webhook ingress design

Match commerce webhook discipline:

```text
POST /v1/webhooks/instagram/:bindingId
```

or platform fan-in:

```text
POST /v1/webhooks/instagram/boxapi
  → verify
  → map account_id → binding
  → enqueue instagram.inbound
  → 200 OK
```

**Prefer binding-scoped URLs** when Topology B; fan-in only with strong verify + map.

---

## 8. Outbound pipeline

```text
OutboundMessage
  → InstagramAdapter.render
  → per-page rate limiter (200/h budget)
  → InstagramProviderPort.send*
  → persist provider mid if returned
```

Circuit breaker on elevated error rates → channel `degraded`.

---

## 9. What not to build

- n8n as production brain
- Follow-gate as sole checkout requirement on async API
- Provider-specific conditionals in Context Engine
- Dual-bot setups on one page
- Dependence on Data API scraper for messaging identity

---

## 10. Phased engineering plan (post-MVP)

| Phase | Work |
|-------|------|
| Spike (now) | Trial key, capture webhooks, fill Unknowns, security gates |
| Growth design | Ports + ERD + threat model approved |
| Growth build | Adapter behind flags; text-only if needed |
| Hardening | Load tests, multi-tenant audit, secondary provider RFP |
| Platform | Meta-direct path where legally available |

---

## 11. Architecture decision record (proposed)

**ADR: Instagram transport providers must implement `InstagramProviderPort`; BoxAPI is the first implementation candidate, not the channel abstraction.**

Status: Proposed — pending spike evidence in docs 07–08 and security gates in doc 04.
