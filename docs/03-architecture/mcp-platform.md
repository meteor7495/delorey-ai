# Seloma MCP Platform — Architecture Assessment

Status: **implemented incrementally** against running code (2026-08-25).  
Authority: **code + Prisma** win over this doc when they diverge.

## 1. Discovery summary

| Area | Reality |
|------|---------|
| Style | Modular NestJS monolith (`apps/api`) + Next/Vite clients |
| Auth | Opaque session Bearer → `AuthContext { userId, tenantId, email }` |
| Tenant | Fail-closed; `tenantId` from session/binding, never client body |
| Commerce SoR | `ShopService`, `InventoryService`, `OrderWorkflowService`, `CustomersService`, `PaymentsService`, domain under `shop/domain/` |
| Agent | `Employee` + `RuntimeService.executeTurn` (deterministic skills; **no** LLM tool loop yet) |
| AI I/O | `AiGatewayService` only |
| Audit | `AuditTurn`, `AdminAuditEvent` |
| Jobs | BullMQ `batch.sync` only |
| Observability | Nest Logger + Prisma ledgers; **no** OTel/Prometheus |
| Validation | `class-validator` globally; **Zod not used** outside MCP |
| MCP prior art | **None** |

### Domain existence matrix (MCP must not invent)

| MCP domain | Reuse | Gap (do not fake) |
|------------|-------|-------------------|
| Commerce / inventory / orders / customers / payments | Shop module services | — |
| Channels / inbox | Adapters + Inbox/Handoff | No conversation “close”; ownership handoff only |
| Website / store | `StorefrontSettings`, articles, banners | No Page/Navigation CMS models |
| Themes | Code catalog `STOREFRONT_THEMES` + `themeId` | No DB Theme entity |
| Analytics | `AnalyticsService` | Aggregates only; limited dimensions |
| Agents | `EmployeeService` | Multi-agent runtime absent |
| Knowledge | `KnowledgeService` | — |
| Marketing campaigns / segments | — | **Absent** → expose discounts only; mark campaign tools unavailable |
| Task work-items | — | **Absent** → MCP **approvals** only (not a generic Task SoR) |
| Customer tags | — | **Absent** |

## 2. Core principle

```
AI Agent → MCP Client → Seloma MCP Gateway (Nest module)
  → AuthN → AuthZ → Tenant Context → Application Services → Domain → Prisma
```

**Forbidden:** MCP handlers calling Prisma directly for business mutations.  
**Allowed exception:** MCP platform tables (`mcp_*`) for tokens, audits, approvals, overrides.

## 3. Placement decision

| Option | Verdict |
|--------|---------|
| New microservice / monorepo app | Reject — conflicts with modular monolith + `.ai/rules` |
| Nest module inside `apps/api` | **Chosen** |
| Shared package `packages/mcp` | Deferred; keep under `modules/mcp` until a second consumer appears |

Path: `apps/api/src/modules/mcp/`

## 4. Protocol stack

- Official `@modelcontextprotocol/sdk` + peer `zod` (**scoped to MCP schemas only**)
- Transport: **Streamable HTTP** at `/v1/mcp` (stateless recommended for multi-tenant Nest)
- Local Inspector: stdio bridge script (`pnpm mcp:inspector`)
- Do not hand-roll JSON-RPC

## 5. Security boundaries

1. Tenant from authenticated MCP context only.
2. Permissions declared per tool; enforced server-side.
3. Risk levels: `READ | LOW | MEDIUM | HIGH | CRITICAL` with approval policies.
4. Public registry ⊆ internal registry (explicit allowlist).
5. Never return payment secrets, CVV, bot tokens, provider credentials.
6. Refund/cancel remain hard-restricted unless merchant auth + approval policy allow (align with Employee guardrails).
7. Sanitize audit payloads (hash/redact secrets).

## 6. Auth model

| Client | Mechanism |
|--------|-----------|
| Internal (Workspace session / Runtime) | `Authorization: Bearer <session>` same as `SessionAuthGuard` |
| External AI | `McpAccessToken` (hashed secret, scopes, tenant-bound, expiry, revoke) |
| Future OAuth | Designed via token issuance API; full OAuth AS deferred |

## 7. Dependency map (handlers → services)

| Tool domain | Services |
|-------------|----------|
| commerce_* | `ShopService`, `AttributesService`, `VariantsService`, `CommerceRetrievalService` |
| inventory_* | `InventoryService` |
| orders_* | `ShopService`, `OrderWorkflowService` |
| customers_* | `CustomersService` |
| payments_* | `PaymentsService` (read-heavy; refund gated) |
| channels_* | `InboxService`, `HandoffService`, channel controllers’ services |
| website_* / themes_* | `ShopService` settings + theme catalog |
| analytics_* | `AnalyticsService` |
| agents_* | `EmployeeService` |
| knowledge_* | `KnowledgeService` |
| marketing_* | `DiscountsService` only where equivalent; else `not_available` |

## 8. Data model (additive)

- `McpClient` — registered MCP client (internal/external)
- `McpAccessToken` — scoped tokens
- `McpToolOverride` — per-tenant enable/disable + risk policy override
- `McpExecution` — audit + usage metering readiness
- `McpApproval` — high-risk human approval queue

## 9. Phased delivery

1. **Core** — registry, auth, tenant, execution, errors, audit, rate-limit, approval, HTTP transport  
2. **Domains** — tools for existing services  
3. **Resources + prompts**  
4. **Internal client** — Runtime/Employee discovery + execute  
5. **Admin API** + Workspace surface (minimal)  
6. **Tests** — tenant isolation, authz, contracts  
7. **Docs** — extend, Inspector, deploy

## 10. Explicit non-goals (this slice)

- Inventing Campaign / Segment / Page / Tag / generic Task SoR
- Kafka / microservices / OTel exporters
- Replacing Runtime deterministic checkout with MCP
- Billing charges for MCP (record usage metadata only)
