import {
  All,
  Controller,
  Headers,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpAuthService } from './core/auth.service';
import { runWithMcpContext } from './core/context';
import { McpServerFactory } from './core/server.factory';
import { McpPlatformError, publicErrorPayload } from './core/errors';
import { v4 as uuid } from 'uuid';

/**
 * Streamable HTTP MCP endpoint.
 * Auth: Bearer session token OR mcp_* access token.
 * Optional: Idempotency-Key, X-Correlation-Id
 */
@Controller('mcp')
export class McpController {
  private readonly log = new Logger(McpController.name);

  constructor(
    private readonly auth: McpAuthService,
    private readonly servers: McpServerFactory,
  ) {}

  @All()
  async handle(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authorization?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<void> {
    try {
      const ctx = await this.auth.authenticateBearer(authorization, {
        correlationId: correlationId || uuid(),
        idempotencyKey: idempotencyKey || undefined,
      });

      await runWithMcpContext(ctx, async () => {
        // Stateless transport per request — safe for multi-tenant Nest
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        const server = this.servers.createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
          void transport.close().catch(() => undefined);
          void server.close().catch(() => undefined);
        });
      });
    } catch (err) {
      const mapped =
        err instanceof McpPlatformError
          ? err
          : new McpPlatformError('internal_error', 'MCP request failed');
      this.log.warn(`MCP HTTP error: ${mapped.code} ${mapped.message}`);
      if (!res.headersSent) {
        res.status(mapped.httpHint === 202 ? 403 : mapped.httpHint).json({
          error: publicErrorPayload(mapped),
        });
      }
    }
  }
}
