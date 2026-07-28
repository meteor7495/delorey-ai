import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { RouteHint, TaskClass } from '../../domain/routing.types';

@Injectable()
export class ModelBindingService {
  private readonly log = new Logger(ModelBindingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve upstream model for provider + route hint from ai_model_bindings.
   * Returns null when no enabled binding — caller falls back to env presets.
   */
  async resolveUpstream(input: {
    providerId: string;
    routeHint: RouteHint;
    taskClass: TaskClass;
  }): Promise<string | null> {
    const costTier =
      input.routeHint === 'premium' ? ['premium', 'standard'] : ['cheap', 'free'];
    try {
      const rows = await this.prisma.aiModelBinding.findMany({
        where: {
          providerId: input.providerId,
          enabled: true,
          costTier: { in: costTier },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      });
      const match = rows.find(
        (r) =>
          r.taskClasses.length === 0 ||
          r.taskClasses.includes(input.taskClass),
      );
      return match?.upstreamModel ?? null;
    } catch (err) {
      this.log.warn(
        `ai_model_bindings read failed: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
      return null;
    }
  }
}
