import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';

export type AiActivityInput = {
  tenantId: string;
  employeeId?: string | null;
  actorType: 'employee' | 'user' | 'system' | 'mcp' | 'policy';
  action: string;
  tool?: string | null;
  inputSanitized?: unknown;
  outputSanitized?: unknown;
  result?: 'success' | 'error' | 'pending_approval' | 'skipped' | 'info';
  approvalId?: string | null;
  correlationId?: string | null;
};

@Injectable()
export class AiActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AiActivityInput) {
    return this.prisma.aiActivityEvent.create({
      data: {
        id: uuid(),
        tenantId: input.tenantId,
        employeeId: input.employeeId ?? null,
        actorType: input.actorType,
        action: input.action,
        tool: input.tool ?? null,
        inputSanitized:
          input.inputSanitized === undefined
            ? undefined
            : (input.inputSanitized as Prisma.InputJsonValue),
        outputSanitized:
          input.outputSanitized === undefined
            ? undefined
            : (input.outputSanitized as Prisma.InputJsonValue),
        result: input.result ?? 'info',
        approvalId: input.approvalId ?? null,
        correlationId: input.correlationId ?? uuid(),
      },
    });
  }

  async listForTenant(
    tenantId: string,
    opts: { employeeId?: string; limit?: number } = {},
  ) {
    return this.prisma.aiActivityEvent.findMany({
      where: {
        tenantId,
        ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(opts.limit ?? 50, 200),
    });
  }

  async performanceForEmployee(tenantId: string, employeeId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.aiActivityEvent.findMany({
      where: { tenantId, employeeId, createdAt: { gte: since } },
      select: { result: true, action: true },
    });
    const total = events.length;
    const success = events.filter((e) => e.result === 'success').length;
    const failed = events.filter((e) => e.result === 'error').length;
    const pendingApproval = events.filter(
      (e) => e.result === 'pending_approval',
    ).length;
    return {
      windowDays: 30,
      tasksCompleted: success,
      successfulActions: success,
      failedActions: failed,
      pendingApprovals: pendingApproval,
      totalEvents: total,
      automationRate: total ? success / total : 0,
    };
  }
}
