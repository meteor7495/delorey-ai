import { Injectable, Logger } from '@nestjs/common';
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
          row.maxCostPerTurnUsd != null
            ? Number(row.maxCostPerTurnUsd)
            : null,
        maxCostPerDayUsd:
          row.maxCostPerDayUsd != null ? Number(row.maxCostPerDayUsd) : null,
        latencyTargetMs: row.latencyTargetMs,
        qualityTarget: row.qualityTarget,
      };
    } catch (err) {
      this.log.warn(
        `tenant_ai_policies read failed tenant=${tenantId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
      return null;
    }
  }
}
