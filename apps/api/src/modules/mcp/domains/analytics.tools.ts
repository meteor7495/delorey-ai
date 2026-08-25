import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import type { McpToolDefinition } from '../core/types';
import { AnalyticsService } from '../../analytics/analytics.service';

const daysSchema = z.number().int().min(1).max(90).default(7);

@Injectable()
export class AnalyticsToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly analytics: AnalyticsService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'analytics_get_summary',
        domain: 'analytics',
        title: 'Analytics summary',
        description: 'Aggregated conversation/order summary for recent days. Prefer over raw event dumps.',
        version: '1.0.0',
        inputSchema: z.object({ days: daysSchema.optional() }),
        permissions: ['analytics.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'public',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => this.analytics.summary(ctx.tenantId, input.days ?? 7),
      },
      {
        name: 'analytics_get_revenue',
        domain: 'analytics',
        title: 'Revenue report',
        description: 'Aggregated revenue for recent days.',
        version: '1.0.0',
        inputSchema: z.object({ days: daysSchema.optional() }),
        permissions: ['analytics.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => this.analytics.revenue(ctx.tenantId, input.days ?? 7),
      },
      {
        name: 'analytics_get_channel_performance',
        domain: 'analytics',
        title: 'Channel performance',
        description: 'Orders and events grouped by channel.',
        version: '1.0.0',
        inputSchema: z.object({ days: daysSchema.optional() }),
        permissions: ['analytics.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 20_000,
        idempotent: true,
        handler: async (ctx, input) => this.analytics.channels(ctx.tenantId, input.days ?? 7),
      },
      {
        name: 'analytics_get_knowledge_gaps',
        domain: 'analytics',
        title: 'Knowledge gaps',
        description: 'Topics where the Sales Employee lacked grounding.',
        version: '1.0.0',
        inputSchema: z.object({ days: daysSchema.optional() }),
        permissions: ['analytics.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => this.analytics.knowledgeGaps(ctx.tenantId, input.days ?? 7),
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
