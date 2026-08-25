# MCP Security Review (Seloma)

Date: 2026-08-25

## Controls implemented

| Threat | Mitigation |
|--------|------------|
| Cross-tenant access | `tenantId` from session / MCP token only; handlers use `ctx.tenantId` |
| Privilege escalation | Per-tool permissions checked server-side |
| Public surface overexposure | `surface: 'public'` + `PUBLIC_MCP_TOOLS` + client.surface |
| Destructive ops | Risk levels + approval policies; refund/cancel disabled |
| Secrets leakage | Audit sanitization; channel tools never return credentialsCipher |
| Replay / duplicate mutations | Idempotency-Key on success path |
| Rate abuse | Per tenant/client/user/agent/tool limits |
| Prompt injection → tools | Args treated as untrusted; Zod validation; no trust of model tenant ids |
| Confused deputy | Token bound to tenant (+ optional user/employee); scopes limited |

## Residual risks / follow-ups

1. Full OAuth AS for external MCP not shipped — scoped tokens first.
2. Rate limiter is in-memory (Redis upgrade later).
3. Runtime `executeTurn` still deterministic — MCP discovery available via `discoverMcpTools` for future LLM tool loops.
4. Admin Workspace UI for MCP is API-ready (`/v1/mcp/admin/*`); dedicated page deferred.

## Test evidence

- `mcp-security.spec.ts`: permissions, tenant isolation, public surface, rate limit — **PASS**
- Typecheck `@seloma/api` — **PASS**
