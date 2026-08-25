import { Injectable, Logger } from '@nestjs/common';
import { McpRegistry } from './registry';
import { McpAuditService } from './audit.service';
import { McpRateLimitService } from './rate-limit.service';
import { McpApprovalService } from './approval.service';
import { McpPlatformError, mapUnknownError, publicErrorPayload } from './errors';
import type { McpPermission, McpRequestContext } from './types';

const EXPENSIVE_PREFIXES = ['analytics_', 'orders_get_order_statistics', 'commerce_search'];

export type McpExecuteResult =
  | { ok: true; data: unknown; executionId: string }
  | { ok: false; error: ReturnType<typeof publicErrorPayload>; executionId: string };

@Injectable()
export class McpExecutionService {
  private readonly log = new Logger(McpExecutionService.name);

  constructor(
    private readonly registry: McpRegistry,
    private readonly audit: McpAuditService,
    private readonly rateLimit: McpRateLimitService,
    private readonly approvals: McpApprovalService,
  ) {}

  async execute(ctx: McpRequestContext, toolName: string, rawArgs: unknown): Promise<McpExecuteResult> {
    const started = Date.now();
    const tool = this.registry.getTool(toolName);

    try {
      if (tool.deprecated) {
        this.log.warn(`Deprecated tool called: ${tool.name}`);
      }

      if (ctx.surface === 'public' && tool.surface !== 'public') {
        throw new McpPlatformError('forbidden', 'Tool not available on public MCP surface');
      }

      const enabled = await this.approvals.isToolEnabled(ctx.tenantId, tool.name, true);
      if (!enabled) {
        throw new McpPlatformError('forbidden', `Tool ${tool.name} is disabled`);
      }

      assertPermissions(ctx.scopes, tool.permissions);

      const expensive = EXPENSIVE_PREFIXES.some((p) => tool.name.startsWith(p) || tool.name.includes('statistics'));
      this.rateLimit.assertAllowed(ctx, tool.name, expensive);

      if (ctx.idempotencyKey && tool.idempotent) {
        const prior = await this.audit.findIdempotent(ctx.tenantId, ctx.idempotencyKey);
        if (prior?.outputMeta && (prior.outputMeta as { data?: unknown }).data !== undefined) {
          return {
            ok: true,
            data: (prior.outputMeta as { data: unknown }).data,
            executionId: prior.id,
          };
        }
      }

      const parsed = tool.inputSchema.safeParse(rawArgs ?? {});
      if (!parsed.success) {
        throw new McpPlatformError('validation_error', 'Invalid tool arguments', {
          issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
      }

      await this.approvals.requireOrPass(ctx, tool, parsed.data);

      const data = await withTimeout(
        () => tool.handler(ctx, parsed.data),
        tool.timeoutMs,
        tool.name,
      );

      const executionId = await this.audit.record({
        ctx,
        toolName: tool.name,
        toolVersion: tool.version,
        riskLevel: tool.risk,
        status: 'success',
        args: parsed.data,
        outputMeta: {
          data: tool.idempotent ? data : undefined,
          summary: summarizeOutput(data),
        },
        durationMs: Date.now() - started,
      });

      return { ok: true, data, executionId };
    } catch (err) {
      const mapped = mapUnknownError(err);
      const status =
        mapped.code === 'approval_required'
          ? 'approval_required'
          : mapped.code === 'rate_limited'
            ? 'rate_limited'
            : mapped.code === 'forbidden' || mapped.code === 'unauthorized' || mapped.code === 'tenant_access_denied'
              ? 'forbidden'
              : 'error';

      const executionId = await this.audit.record({
        ctx,
        toolName: tool.name,
        toolVersion: tool.version,
        riskLevel: tool.risk,
        status,
        args: rawArgs,
        errorCode: mapped.code,
        errorMessage: mapped.message,
        durationMs: Date.now() - started,
        approvalId: mapped.details?.approvalId as string | undefined,
      });

      return { ok: false, error: publicErrorPayload(mapped), executionId };
    }
  }
}

export function assertPermissions(granted: McpPermission[], required: McpPermission[]): void {
  const missing = required.filter((p) => !granted.includes(p));
  if (missing.length) {
    throw new McpPlatformError('forbidden', `Missing permissions: ${missing.join(', ')}`, { missing });
  }
}

function summarizeOutput(data: unknown): Record<string, unknown> {
  if (data == null) return { type: 'null' };
  if (Array.isArray(data)) return { type: 'array', length: data.length };
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    return {
      type: 'object',
      keys: Object.keys(obj).slice(0, 20),
      total: typeof obj.total === 'number' ? obj.total : undefined,
      items: Array.isArray(obj.items) ? obj.items.length : undefined,
    };
  }
  return { type: typeof data };
}

async function withTimeout<T>(fn: () => Promise<T>, ms: number, toolName: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new McpPlatformError('timeout', `Tool ${toolName} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
