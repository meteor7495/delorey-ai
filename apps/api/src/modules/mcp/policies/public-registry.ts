/**
 * Explicit public MCP capability allowlist.
 * Tools with surface:'public' are candidates; this set documents the contract
 * for external clients (must also have matching scopes on the access token).
 */
export const PUBLIC_MCP_TOOLS = [
  'commerce_search_products',
  'commerce_get_product',
  'themes_list_themes',
  'analytics_get_summary',
  'knowledge_search',
] as const;

export type PublicMcpTool = (typeof PUBLIC_MCP_TOOLS)[number];
