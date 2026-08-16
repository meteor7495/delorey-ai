# Vertical Slice 20 — AI Provider Layer Ops

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 29, 2026 |
| **Depends on** | [Slice 17](./vertical-slice-17.md) Live AI Gateway |
| **Architecture** | [AI Provider Layer](../03-architecture/ai-provider-layer.md) · [AI Gateway Design](../03-architecture/ai-gateway-design.md) |

**Goal:** Operationalize the Provider Layer behind Seloma’s AI Gateway: Redis circuit breakers, `ai_call_events` ledger, tenant AI policies, model binding bootstrap, and session-auth ops endpoints — without making 9Router (or any vendor) the architecture, and without a merchant model playground.

---

# Checklist

- [x] `AiProviderPort` + registry + Router failover chain (prior)  
- [x] `NineRouterProvider` as upstream-only adapter (prior)  
- [x] Tables: `tenant_ai_policies`, `ai_model_bindings`, `ai_call_events`  
- [x] Redis circuit breaker (`global:circuit:{provider}`) with in-memory fallback  
- [x] Ledger writes on success/failure; daily cost budget gate  
- [x] Bootstrapping `ai_model_bindings` from env/presets  
- [x] `GET /ai-gateway/health` — registered providers, circuit, probe  
- [x] `GET|PUT /ai-gateway/policy` — tenant cost/routing policy (admin audit)  
- [x] `GET /ai-gateway/usage` — day cost + recent call events  
- [x] Runtime passes `conversationId` + `feature` into Gateway  

---

# Out of this slice

Merchant UI for picking GPT vs Claude · semantic cache · shadow A/B harness · prompt registry · public LLM API · replacing Gateway with 9Router.

---

# Env

```env
AI_GATEWAY_MODE=live
AI_GATEWAY_PROVIDER=ninerouter   # or gapgpt | openai | …
AI_GATEWAY_FALLBACK_PROVIDERS=openai
NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=http://127.0.0.1:20128/v1
AI_GATEWAY_CIRCUIT_FAILURES=3
AI_GATEWAY_CIRCUIT_OPEN_MS=30000
# Re-sync bindings from env on boot (default 0 = keep manual edits)
AI_GATEWAY_BINDINGS_FORCE=0
```

---

# Ops API (session auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ai-gateway/health` | Provider registry + circuits + health probes |
| GET | `/ai-gateway/policy` | Current tenant policy (null = env defaults) |
| PUT | `/ai-gateway/policy` | Upsert preferred/blocked providers, fallback order, cost caps |
| GET | `/ai-gateway/usage` | UTC-day cost + recent `ai_call_events` |

Example policy body:

```json
{
  "preferredProvider": "ninerouter",
  "fallbackOrder": ["openai", "mock"],
  "blockedProviders": [],
  "maxCostPerDayUsd": 5,
  "qualityTarget": "standard"
}
```

---

# Local smoke

1. Migrate applied (`provider_layer_persistence`). Restart API.  
2. `GET /ai-gateway/health` → providers include `mock` (+ live if configured).  
3. `PUT /ai-gateway/policy` with `maxCostPerDayUsd` → admin audit `ai_gateway.policy`.  
4. Widget chat → `GET /ai-gateway/usage` shows recent events with `feature=sales_reply`.  
5. Kill primary provider / trip circuit → failover in logs + ledger `fallbackCount`.
