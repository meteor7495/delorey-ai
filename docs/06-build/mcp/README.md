# Seloma MCP Platform

Production MCP layer over Seloma application services. Architecture assessment: [`docs/03-architecture/mcp-platform.md`](../03-architecture/mcp-platform.md).

## Principles

- MCP is **not** a second business layer.
- Handlers call Nest services (`ShopService`, `OrderWorkflowService`, …) with `ctx.tenantId` from auth.
- Official `@modelcontextprotocol/sdk` + Zod (MCP module only).
- Tool names: `domain_action` (e.g. `commerce_search_products`). Logical form `commerce.search_products`.

## Endpoints

| Path | Auth | Purpose |
|------|------|---------|
| `ALL /v1/mcp` | Bearer session **or** `mcp_*` token | Streamable HTTP MCP |
| `GET /v1/mcp/admin/tools` | Session | List registered tools |
| `POST /v1/mcp/admin/invoke` | Session | In-process tool invoke |
| `POST /v1/mcp/admin/clients` | Session | Register MCP client |
| `POST /v1/mcp/admin/tokens` | Session | Issue scoped access token (shown once) |
| `GET /v1/mcp/admin/executions` | Session | Audit log |
| `GET/POST /v1/mcp/admin/approvals*` | Session | High-risk approvals |

Headers: `Authorization`, optional `Idempotency-Key`, `X-Correlation-Id`.

## Local development

```bash
pnpm db:up
pnpm --filter @seloma/api exec prisma migrate deploy
pnpm dev:api
```

### MCP Inspector

```bash
# Terminal 1 — API running on :3001
# Terminal 2 — login and export token, or use demo session after login

npx @modelcontextprotocol/inspector
```

Connect to Streamable HTTP URL:

`http://localhost:3001/v1/mcp`

Authorization header:

`Bearer <workspace_session_or_mcp_token>`

Optional script:

```bash
pnpm --filter @seloma/api mcp:inspector
```

## Adding a tool

1. Create/extend a registrar under `apps/api/src/modules/mcp/domains/`.
2. Call existing Nest service methods only.
3. Declare `permissions`, `risk`, `surface`, Zod `inputSchema`, `version`.
4. Register the registrar in `mcp.module.ts`.
5. Add a Vitest covering permission/tenant if high-risk.

## Resources & prompts

- Resources: `seloma://store/settings`, `seloma://themes`, `seloma://knowledge/policies`
- Prompts: `analyze_store`, `analyze_sales`, `inventory_analysis`, `daily_business_report`, `customer_support`, `product_description`

## Gaps (honest)

| Requested capability | Status |
|----------------------|--------|
| Marketing campaigns / segments | **not_available** (discounts only) |
| CMS pages / navigation | **not_available** |
| Customer tags | **not_available** |
| Generic Task SoR | Approvals only (`mcp_approvals`) |
| Payment refunds | **disabled** (guardrails) |

## Security

- Tenant from session/token only
- Server-side permissions + rate limits + audit
- HIGH/CRITICAL tools → approval policy or disabled
- No secrets in tool outputs
- Public surface ⊆ internal tools with `surface: 'public'`

## Deployment

Same Nest process as `apps/api`. Env:

```
MCP_ENABLED=1
# optional future toggles
MCP_PUBLIC_ENABLED=0
MCP_RATE_LIMIT_TENANT=600
```

No separate container required. Compose Postgres migration `20260825140000_mcp_platform` must be applied.

## Internal agent integration

`RuntimeService.discoverMcpTools(tenantId)` and `executeMcpTool(...)` use `McpClientService`. Deterministic `executeTurn` path is unchanged; LLM tool-calling can attach later via Gateway without rewriting commerce rules.
