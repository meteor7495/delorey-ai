import { Injectable } from '@nestjs/common';
import { McpAuthService, ALL_INTERNAL_SCOPES } from '../core/auth.service';
import { McpExecutionService } from '../core/execution.service';
import { McpRegistry } from '../core/registry';
import { runWithMcpContext } from '../core/context';
import type {
  McpPermission,
  McpPromptDefinition,
  McpRequestContext,
  McpResourceDefinition,
  McpToolDefinition,
} from '../core/types';
import { v4 as uuid } from 'uuid';

/**
 * In-process MCP client for Seloma Runtime / internal agents.
 * Discovers tools from the registry (permission + surface filtered) and executes via the same pipeline.
 */
@Injectable()
export class McpClientService {
  constructor(
    private readonly registry: McpRegistry,
    private readonly execution: McpExecutionService,
    private readonly auth: McpAuthService,
  ) {}

  createContext(input: {
    tenantId: string;
    userId?: string;
    employeeId?: string;
    scopes?: McpPermission[];
  }): McpRequestContext {
    return this.auth.createInternalContext({
      ...input,
      scopes: input.scopes ?? ALL_INTERNAL_SCOPES,
      correlationId: uuid(),
    });
  }

  discoverTools(ctx: McpRequestContext) {
    const tools: McpToolDefinition[] = this.registry.listTools(ctx.surface);
    return tools
      .filter((t: McpToolDefinition) =>
        t.permissions.every((p: McpPermission) => ctx.scopes.includes(p)),
      )
      .map((t: McpToolDefinition) => ({
        name: t.name,
        domain: t.domain,
        title: t.title,
        description: t.description,
        version: t.version,
        risk: t.risk,
        permissions: t.permissions,
        inputSchema: t.inputSchema,
      }));
  }

  async callTool(
    ctx: McpRequestContext,
    toolName: string,
    args: unknown,
    opts?: { idempotencyKey?: string },
  ) {
    const next = { ...ctx, idempotencyKey: opts?.idempotencyKey };
    return runWithMcpContext(next, () => this.execution.execute(next, toolName, args));
  }

  listResources(ctx: McpRequestContext) {
    const resources: McpResourceDefinition[] = this.registry.listResources(ctx.surface);
    return resources.filter((r: McpResourceDefinition) =>
      r.permissions.every((p: McpPermission) => ctx.scopes.includes(p)),
    );
  }

  listPrompts(ctx: McpRequestContext): McpPromptDefinition[] {
    return this.registry.listPrompts(ctx.surface);
  }
}
