import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma.service';

export type TenantAiPolicyView = {
  preferredProvider: string | null;
  preferredModels: {
    cheap?: string;
    premium?: string;
    embed?: string;
  } | null;
  allowedProviders: string[];
  blockedProviders: string[];
  fallbackOrder: string[];
  maxCostPerTurnUsd: number | null;
  maxCostPerDayUsd: number | null;
  latencyTargetMs: number | null;
  qualityTarget: string;
};

export type UpsertTenantAiPolicyInput = {
  preferredProvider?: string | null;
  preferredModels?: TenantAiPolicyView['preferredModels'];
  allowedProviders?: string[];
  blockedProviders?: string[];
  fallbackOrder?: string[];
  maxCostPerTurnUsd?: number | null;
  maxCostPerDayUsd?: number | null;
  latencyTargetMs?: number | null;
  qualityTarget?: string;
};

@Injectable()
export class TenantAiPolicyService {
  private readonly log = new Logger(TenantAiPolicyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getForTenant(tenantId: string): Promise<TenantAiPolicyView | null> {
    try {
      const row = await this.prisma.tenantAiPolicy.findUnique({
        where: { tenantId },
      });
      if (!row) return null;
      return this.map(row);
    } catch (err) {
      this.log.warn(
        `tenant_ai_policies read failed tenant=${tenantId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
      return null;
    }
  }

  async upsertForTenant(
    tenantId: string,
    input: UpsertTenantAiPolicyInput,
  ): Promise<TenantAiPolicyView> {
    const row = await this.prisma.tenantAiPolicy.upsert({
      where: { tenantId },
      create: {
        tenantId,
        preferredProvider: input.preferredProvider ?? null,
        preferredModels: input.preferredModels ?? undefined,
        allowedProviders: input.allowedProviders ?? [],
        blockedProviders: input.blockedProviders ?? [],
        fallbackOrder: input.fallbackOrder ?? [],
        maxCostPerTurnUsd: dec(input.maxCostPerTurnUsd),
        maxCostPerDayUsd: dec(input.maxCostPerDayUsd),
        latencyTargetMs: input.latencyTargetMs ?? null,
        qualityTarget: input.qualityTarget ?? 'standard',
      },
      update: {
        ...(input.preferredProvider !== undefined
          ? { preferredProvider: input.preferredProvider }
          : {}),
        ...(input.preferredModels !== undefined
          ? { preferredModels: input.preferredModels ?? Prisma.JsonNull }
          : {}),
        ...(input.allowedProviders !== undefined
          ? { allowedProviders: input.allowedProviders }
          : {}),
        ...(input.blockedProviders !== undefined
          ? { blockedProviders: input.blockedProviders }
          : {}),
        ...(input.fallbackOrder !== undefined
          ? { fallbackOrder: input.fallbackOrder }
          : {}),
        ...(input.maxCostPerTurnUsd !== undefined
          ? { maxCostPerTurnUsd: dec(input.maxCostPerTurnUsd) }
          : {}),
        ...(input.maxCostPerDayUsd !== undefined
          ? { maxCostPerDayUsd: dec(input.maxCostPerDayUsd) }
          : {}),
        ...(input.latencyTargetMs !== undefined
          ? { latencyTargetMs: input.latencyTargetMs }
          : {}),
        ...(input.qualityTarget !== undefined
          ? { qualityTarget: input.qualityTarget }
          : {}),
      },
    });
    return this.map(row);
  }

  private map(row: {
    preferredProvider: string | null;
    preferredModels: Prisma.JsonValue | null;
    allowedProviders: string[];
    blockedProviders: string[];
    fallbackOrder: string[];
    maxCostPerTurnUsd: Prisma.Decimal | null;
    maxCostPerDayUsd: Prisma.Decimal | null;
    latencyTargetMs: number | null;
    qualityTarget: string;
  }): TenantAiPolicyView {
    const preferredModels =
      row.preferredModels && typeof row.preferredModels === 'object'
        ? (row.preferredModels as TenantAiPolicyView['preferredModels'])
        : null;
    return {
      preferredProvider: row.preferredProvider,
      preferredModels,
      allowedProviders: row.allowedProviders ?? [],
      blockedProviders: row.blockedProviders ?? [],
      fallbackOrder: row.fallbackOrder ?? [],
      maxCostPerTurnUsd:
        row.maxCostPerTurnUsd != null ? Number(row.maxCostPerTurnUsd) : null,
      maxCostPerDayUsd:
        row.maxCostPerDayUsd != null ? Number(row.maxCostPerDayUsd) : null,
      latencyTargetMs: row.latencyTargetMs,
      qualityTarget: row.qualityTarget,
    };
  }
}

function dec(v: number | null | undefined): Prisma.Decimal | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return new Prisma.Decimal(v);
}
