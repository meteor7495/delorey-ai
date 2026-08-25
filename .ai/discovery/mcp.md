# MCP discovery (as implemented)

| Item | Location |
|------|----------|
| Module | `apps/api/src/modules/mcp/` |
| Architecture | `docs/03-architecture/mcp-platform.md` |
| Dev docs | `docs/06-build/mcp/README.md` |
| Prisma | `McpClient`, `McpAccessToken`, `McpToolOverride`, `McpExecution`, `McpApproval` |
| Transport | Streamable HTTP `/v1/mcp` |
| Admin | `/v1/mcp/admin/*` |
| Internal client | `McpClientService` + `RuntimeService.discoverMcpTools` |

Zod is allowed **only** inside the MCP module (SDK peer dependency). REST APIs remain `class-validator`.
