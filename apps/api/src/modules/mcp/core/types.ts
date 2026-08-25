import type { z } from 'zod';

/** MCP tool risk — drives approval policy defaults */
export type McpRiskLevel = 'READ' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** auto | approval_required | disabled */
export type McpApprovalPolicy = 'auto' | 'approval_required' | 'disabled';

export type McpAuditClass = 'read' | 'write' | 'destructive' | 'financial' | 'communication';

export type McpSurface = 'internal' | 'public';

export type McpClientKind = 'internal' | 'external';

/**
 * Stable tool name: domain_action (underscores).
 * Logical dotted form commerce.search_products maps to commerce_search_products.
 */
export type McpPermission =
  | 'products.read'
  | 'products.write'
  | 'inventory.read'
  | 'inventory.write'
  | 'orders.read'
  | 'orders.update'
  | 'orders.cancel'
  | 'orders.refund'
  | 'customers.read'
  | 'customers.write'
  | 'payments.read'
  | 'payments.write'
  | 'payments.refund'
  | 'marketing.read'
  | 'marketing.write'
  | 'marketing.send'
  | 'channels.read'
  | 'channels.write'
  | 'website.read'
  | 'website.write'
  | 'website.publish'
  | 'themes.read'
  | 'themes.write'
  | 'analytics.read'
  | 'agents.read'
  | 'agents.manage'
  | 'knowledge.read'
  | 'knowledge.write'
  | 'mcp.admin';

export type McpRequestContext = {
  correlationId: string;
  tenantId: string;
  userId?: string;
  email?: string;
  employeeId?: string;
  clientId?: string;
  clientKind: McpClientKind;
  surface: McpSurface;
  scopes: McpPermission[];
  /** Auth source */
  authVia: 'session' | 'mcp_token' | 'internal';
  idempotencyKey?: string;
};

export type McpToolDefinition<TIn extends z.ZodTypeAny = z.ZodTypeAny, TOut = unknown> = {
  name: string;
  domain: string;
  title: string;
  description: string;
  version: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  inputSchema: TIn;
  permissions: McpPermission[];
  risk: McpRiskLevel;
  auditClass: McpAuditClass;
  surface: McpSurface;
  timeoutMs: number;
  /** Default approval policy for this risk (tenant override may change) */
  approvalPolicy?: McpApprovalPolicy;
  idempotent?: boolean;
  handler: (ctx: McpRequestContext, input: z.infer<TIn>) => Promise<TOut>;
};

export type McpResourceDefinition = {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  permissions: McpPermission[];
  surface: McpSurface;
  read: (ctx: McpRequestContext, uri: string) => Promise<{ text: string; mimeType?: string }>;
};

export type McpPromptDefinition = {
  name: string;
  title: string;
  description: string;
  argsSchema?: z.ZodObject<z.ZodRawShape>;
  surface: McpSurface;
  build: (
    ctx: McpRequestContext,
    args: Record<string, string>,
  ) => Promise<{ messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }> }>;
};

export const DEFAULT_RISK_POLICY: Record<McpRiskLevel, McpApprovalPolicy> = {
  READ: 'auto',
  LOW: 'auto',
  MEDIUM: 'auto',
  HIGH: 'approval_required',
  CRITICAL: 'disabled',
};

export function toLogicalToolName(stableName: string): string {
  const i = stableName.indexOf('_');
  if (i <= 0) return stableName;
  return `${stableName.slice(0, i)}.${stableName.slice(i + 1)}`;
}
