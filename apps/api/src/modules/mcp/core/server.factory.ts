import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpRegistry } from './registry';
import { McpExecutionService } from './execution.service';
import { getMcpContext } from './context';
import { McpPlatformError } from './errors';
import type { ZodRawShape } from 'zod';
import { z } from 'zod';

/**
 * Builds an MCP SDK server after all tool registrars have run (OnModuleInit).
 * Stateless: handlers read tenant/auth from AsyncLocalStorage.
 */
@Injectable()
export class McpServerFactory implements OnApplicationBootstrap {
  private server!: McpServer;

  constructor(
    private readonly registry: McpRegistry,
    private readonly execution: McpExecutionService,
  ) {}

  onApplicationBootstrap(): void {
    this.server = this.build();
  }

  getServer(): McpServer {
    return this.build();
  }

  /** Prefer this for HTTP — each request needs its own transport connection. */
  createServer(): McpServer {
    return this.build();
  }

  private build(): McpServer {
    const server = new McpServer({
      name: 'seloma-mcp',
      version: '1.0.0',
    });

    for (const tool of this.registry.listTools()) {
      const shape = zodObjectShape(tool.inputSchema);
      // Cast avoids Zod/MCP generic depth explosion across many tools
      const registerTool = server.registerTool.bind(server) as unknown as (
        name: string,
        config: object,
        cb: (args: Record<string, unknown>) => unknown,
      ) => void;
      registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: shape,
          annotations: {
            readOnlyHint: tool.risk === 'READ',
            destructiveHint: tool.risk === 'HIGH' || tool.risk === 'CRITICAL',
            idempotentHint: !!tool.idempotent,
            openWorldHint: false,
          },
          _meta: {
            domain: tool.domain,
            version: tool.version,
            risk: tool.risk,
            permissions: tool.permissions,
            surface: tool.surface,
            logicalName: `${tool.domain}.${tool.name.replace(`${tool.domain}_`, '')}`,
          },
        },
        async (args: Record<string, unknown>) => {
          const ctx = getMcpContext();
          const result = await this.execution.execute(ctx, tool.name, args);
          if (!result.ok) {
            return {
              isError: true,
              content: [{ type: 'text' as const, text: JSON.stringify(result.error) }],
            };
          }
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result.data) }],
            structuredContent: result.data as Record<string, unknown>,
          };
        },
      );
    }

    for (const resource of this.registry.listResources()) {
      const registerResource = server.registerResource.bind(server) as unknown as (
        name: string,
        uri: string,
        config: object,
        cb: (uri: string | URL) => unknown,
      ) => void;
      registerResource(
        resource.name,
        resource.uri,
        {
          description: resource.description,
          mimeType: resource.mimeType ?? 'application/json',
        },
        async (uri) => {
          const ctx = getMcpContext();
          if (ctx.surface === 'public' && resource.surface !== 'public') {
            throw new McpPlatformError('forbidden', 'Resource not public');
          }
          const missing = resource.permissions.filter((p) => !ctx.scopes.includes(p));
          if (missing.length) {
            throw new McpPlatformError('forbidden', `Missing permissions: ${missing.join(', ')}`);
          }
          const body = await resource.read(ctx, typeof uri === 'string' ? uri : uri.href);
          return {
            contents: [
              {
                uri: typeof uri === 'string' ? uri : uri.href,
                mimeType: body.mimeType ?? resource.mimeType ?? 'application/json',
                text: body.text,
              },
            ],
          };
        },
      );
    }

    for (const prompt of this.registry.listPrompts()) {
      const argsSchema = prompt.argsSchema
        ? (Object.fromEntries(
            Object.entries(prompt.argsSchema.shape).map(([k, v]) => [k, v]),
          ) as ZodRawShape)
        : undefined;
      const registerPrompt = server.registerPrompt.bind(server) as unknown as (
        name: string,
        config: object,
        cb: (args: Record<string, string>) => unknown,
      ) => void;
      registerPrompt(
        prompt.name,
        {
          title: prompt.title,
          description: prompt.description,
          argsSchema,
        },
        async (args) => {
          const ctx = getMcpContext();
          if (ctx.surface === 'public' && prompt.surface !== 'public') {
            throw new McpPlatformError('forbidden', 'Prompt not public');
          }
          return prompt.build(ctx, (args ?? {}) as Record<string, string>);
        },
      );
    }

    return server;
  }
}

function zodObjectShape(schema: z.ZodTypeAny): ZodRawShape {
  if (schema instanceof z.ZodObject) {
    return schema.shape as ZodRawShape;
  }
  return { _payload: schema };
}
