import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma.service';
import type { RouteHint, TaskClass } from '../../domain/routing.types';

export type AiCallLedgerInput = {
  tenantId: string;
  conversationId?: string;
  feature?: string;
  taskClass: TaskClass;
  routeHint: RouteHint;
  providerId: string;
  modelId: string;
  internalModelId?: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costUsd?: number;
  retryCount?: number;
  fallbackCount?: number;
  errorCode?: string;
  cacheHit?: boolean;
  shadow?: boolean;
  idempotencyKey?: string;
};

@Injectable()
export class UsageLedgerService {
  private readonly log = new Logger(UsageLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AiCallLedgerInput): Promise<void> {
    const totalTokens = input.promptTokens + input.completionTokens;
    try {
      await this.prisma.aiCallEvent.create({
        data: {
          tenantId: input.tenantId,
          conversationId: input.conversationId,
          feature: input.feature,
          taskClass: input.taskClass,
          routeHint: input.routeHint,
          providerId: input.providerId,
          modelId: input.modelId,
          internalModelId: input.internalModelId,
          latencyMs: input.latencyMs,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          totalTokens,
          costUsd:
            input.costUsd != null
              ? new Prisma.Decimal(input.costUsd)
              : undefined,
          retryCount: input.retryCount ?? 0,
          fallbackCount: input.fallbackCount ?? 0,
          errorCode: input.errorCode,
          cacheHit: input.cacheHit ?? false,
          shadow: input.shadow ?? false,
          idempotencyKey: input.idempotencyKey,
        },
      });
    } catch (err) {
      // Metering must never break the shopper path
      this.log.warn(
        `ai_call_events write failed tenant=${input.tenantId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
    }
  }

  /** Sum of cost_usd for tenant since start of UTC day (budget guard). */
  async dayCostUsd(tenantId: string): Promise<number> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    try {
      const agg = await this.prisma.aiCallEvent.aggregate({
        where: {
          tenantId,
          createdAt: { gte: start },
          errorCode: null,
        },
        _sum: { costUsd: true },
      });
      return Number(agg._sum.costUsd ?? 0);
    } catch {
      return 0;
    }
  }

  async summarize(tenantId: string, opts?: { limit?: number }) {
    const limit = Math.min(opts?.limit ?? 50, 200);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const [dayCost, dayCount, recent] = await Promise.all([
      this.dayCostUsd(tenantId),
      this.prisma.aiCallEvent.count({
        where: { tenantId, createdAt: { gte: start } },
      }),
      this.prisma.aiCallEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          providerId: true,
          modelId: true,
          taskClass: true,
          routeHint: true,
          latencyMs: true,
          promptTokens: true,
          completionTokens: true,
          costUsd: true,
          retryCount: true,
          fallbackCount: true,
          errorCode: true,
          cacheHit: true,
          feature: true,
          conversationId: true,
          createdAt: true,
        },
      }),
    ]);
    return {
      dayCostUsd: dayCost,
      dayCallCount: dayCount,
      recent: recent.map((r) => ({
        ...r,
        costUsd: r.costUsd != null ? Number(r.costUsd) : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
