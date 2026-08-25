import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../platform/prisma.service';
import type { McpRequestContext, McpRiskLevel } from './types';
import { hashInput, sanitizeForAudit } from './auth.service';

@Injectable()
export class McpAuditService {
  private readonly log = new Logger(McpAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    ctx: McpRequestContext;
    toolName: string;
    toolVersion: string;
    riskLevel: McpRiskLevel;
    status: string;
    args: unknown;
    outputMeta?: Record<string, unknown>;
    errorCode?: string;
    errorMessage?: string;
    durationMs: number;
    approvalId?: string;
  }): Promise<string> {
    try {
      const row = await this.prisma.mcpExecution.create({
        data: {
          id: uuid(),
          tenantId: input.ctx.tenantId,
          clientId: input.ctx.clientId,
          userId: input.ctx.userId,
          employeeId: input.ctx.employeeId,
          correlationId: input.ctx.correlationId,
          toolName: input.toolName,
          toolVersion: input.toolVersion,
          riskLevel: input.riskLevel,
          status: input.status,
          inputHash: hashInput(input.args),
          inputSanitized: sanitizeForAudit(input.args) as object,
          outputMeta: input.outputMeta as object | undefined,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage?.slice(0, 500),
          durationMs: input.durationMs,
          approvalId: input.approvalId,
          // Only persist idempotency on success so retries after failure remain allowed
          idempotencyKey: input.status === 'success' ? input.ctx.idempotencyKey : undefined,
        },
      });
      return row.id;
    } catch (err) {
      this.log.warn(`MCP audit write failed: ${(err as Error).message}`);
      return '';
    }
  }

  async list(tenantId: string, opts?: { toolName?: string; limit?: number; offset?: number }) {
    const take = Math.min(opts?.limit ?? 50, 100);
    const skip = opts?.offset ?? 0;
    const where = {
      tenantId,
      ...(opts?.toolName ? { toolName: opts.toolName } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.mcpExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.mcpExecution.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async findIdempotent(tenantId: string, idempotencyKey: string) {
    return this.prisma.mcpExecution.findFirst({
      where: { tenantId, idempotencyKey, status: 'success' },
      orderBy: { createdAt: 'desc' },
    });
  }
}
