# Vertical Slice 17 — Live AI Gateway (Complete)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 28, 2026 |
| **Depends on** | [Slice 01](./vertical-slice-01.md) Runtime + mock gateway |
| **Architecture** | [AI Gateway Design](../03-architecture/ai-gateway-design.md) |

**Goal:** Make `ai-gateway.Complete` call an OpenAI-compatible provider plugin when `AI_GATEWAY_MODE=live` (OpenAI, GapGPT, Liara, BoxAPI ChatGPT, or custom base URL), keep Runtime vendor-blind, fall back to grounded mock on failure/missing config, and persist token metering on `audit_turns.gateway`.

---

# Checklist

- [x] Provider plugin interface (`ChatProviderPlugin`)  
- [x] OpenAI-compatible chat plugin via `fetch` (no Runtime SDK import)  
- [x] Presets: `openai` · `gapgpt` · `liara` · `boxapi` · `custom` via `AI_GATEWAY_PROVIDER`  
- [x] `AI_GATEWAY_MODE=live` + API key → live Complete  
- [x] Timeout (`AI_GATEWAY_TIMEOUT_MS`) + typed `GatewayError`  
- [x] Failover: live error / missing key → grounded mock + `fallbackReason`  
- [x] `task_class` / `route_hint` → cheap vs premium model env  
- [x] Meter log `gateway.complete` + persist `audit_turns.gateway` JSON  
- [x] Runtime passes `tenantId`; decision suffix `:live` / `:mock_fallback`  

---

# Out of this slice

Embed path · Redis circuit breaker · multi-provider chain · tenant hard rate limits · shadow eval · Cost Layer “skip LLM” classify · prompt template registry.

---

# Env

```env
AI_GATEWAY_MODE=live
AI_GATEWAY_PROVIDER=gapgpt   # openai | gapgpt | liara | boxapi | custom
AI_GATEWAY_API_KEY=          # optional shared; else provider-specific key
AI_GATEWAY_BASE_URL=         # required for liara/custom; optional override
AI_GATEWAY_MODEL_CHEAP=
AI_GATEWAY_MODEL_PREMIUM=
AI_GATEWAY_TIMEOUT_MS=20000

# Examples:
GAPGPT_API_KEY=
# LIARA_API_KEY= + LIARA_BASE_URL=https://ai.liara.ir/api/<workspaceId>/v1
# BOXAPI_AI_API_KEY=   # ChatGPT proxy https://ai.boxapi.ir/api/v1
# OPENAI_API_KEY=
```

| Provider | Default base | Notes |
|----------|--------------|-------|
| `gapgpt` | `https://api.gapgpt.app/v1` | `GAPGPT_API_KEY` |
| `boxapi` | `https://ai.boxapi.ir/api/v1` | ChatGPT API — not Instagram Official spike |
| `liara` | *(from panel)* | Set `LIARA_BASE_URL`; models like `openai/gpt-4o-mini` |
| `openai` | `https://api.openai.com/v1` | Direct |
| `custom` | *(required)* | Any OpenAI-compatible `/v1` |

---

# Local smoke

1. Pick provider + key in `apps/api/.env`; set `AI_GATEWAY_MODE=live`.  
2. Restart API.  
3. Widget product question → live reply; Audit `decision` ends with `:live` and `gateway.providerId` matches preset.  
4. Bad key → mock grounded + `:mock_fallback`.
