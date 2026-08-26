import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { McpRegistry } from '../core/registry';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { DiscountsService } from '../../shop/discounts.service';
import { PrismaService } from '../../platform/prisma.service';

/**
 * Marketing: discounts + campaign drafts (full campaign SoR is Phase 5+).
 */
@Injectable()
export class MarketingToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly discounts: DiscountsService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'marketing_list_discounts',
        domain: 'marketing',
        title: 'List discounts',
        description:
          'List discount/promotion rules. Seloma has no Campaign CRM — use discounts as the promotion surface.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['marketing.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => ({
          items: await this.discounts.list(ctx.tenantId),
        }),
      },
      {
        name: 'marketing_get_discount',
        domain: 'marketing',
        title: 'Get discount',
        description: 'Fetch one discount by id.',
        version: '1.0.0',
        inputSchema: z.object({ discountId: z.string() }),
        permissions: ['marketing.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.discounts.get(ctx.tenantId, input.discountId),
      },
      {
        name: 'marketing_draft_campaign',
        domain: 'marketing',
        title: 'Draft campaign',
        description:
          'Create a campaign draft for merchant review. Does not send messages.',
        version: '1.0.0',
        inputSchema: z.object({
          name: z.string().min(1),
          message: z.string().min(1),
          channel: z
            .enum(['telegram', 'bale', 'instagram', 'website'])
            .default('telegram'),
          inactiveDays: z.number().int().min(1).max(365).optional(),
          offerPercent: z.number().min(0).max(100).optional(),
        }),
        permissions: ['marketing.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        approvalPolicy: 'approval_required',
        handler: async (ctx, input) => {
          const draft = await this.prisma.campaignDraft.create({
            data: {
              id: uuid(),
              tenantId: ctx.tenantId,
              name: input.name,
              audienceRule: {
                inactiveDays: input.inactiveDays ?? 90,
              } as Prisma.InputJsonValue,
              offer: input.offerPercent
                ? ({ percent: input.offerPercent } as Prisma.InputJsonValue)
                : undefined,
              message: input.message,
              channel: input.channel,
              status: 'draft',
            },
          });
          return {
            id: draft.id,
            status: draft.status,
            name: draft.name,
            note: 'Draft only — merchant must approve before send',
          };
        },
      },
      {
        name: 'marketing_preview_segment',
        domain: 'marketing',
        title: 'Preview inactive segment',
        description: 'Count customers with no paid order in N days.',
        version: '1.0.0',
        inputSchema: z.object({
          inactiveDays: z.number().int().min(1).max(365).default(90),
        }),
        permissions: ['marketing.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const cutoff = new Date(
            Date.now() - input.inactiveDays * 24 * 60 * 60 * 1000,
          );
          const customers = await this.prisma.customer.findMany({
            where: { tenantId: ctx.tenantId },
            include: {
              orders: {
                where: { paymentStatus: 'paid' },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
            take: 500,
          });
          const matched = customers.filter((c) => {
            const last = c.orders[0];
            return !last || last.createdAt < cutoff;
          });
          return {
            inactiveDays: input.inactiveDays,
            estimateLabel: 'estimate',
            count: matched.length,
          };
        },
      },
      {
        name: 'marketing_create_campaign',
        domain: 'marketing',
        title: 'Create campaign',
        description: 'Deprecated — use marketing_draft_campaign.',
        version: '1.0.0',
        deprecated: true,
        inputSchema: z.object({ name: z.string() }),
        permissions: ['marketing.write'],
        risk: 'HIGH',
        auditClass: 'communication',
        surface: 'internal',
        timeoutMs: 5_000,
        approvalPolicy: 'disabled',
        handler: async () => {
          throw new McpPlatformError(
            'not_available',
            'Use marketing_draft_campaign for drafts; mass send is not implemented',
          );
        },
      },
      {
        name: 'marketing_send_campaign',
        domain: 'marketing',
        title: 'Send campaign',
        description: 'Disabled — mass messaging campaigns are not implemented.',
        version: '1.0.0',
        inputSchema: z.object({ campaignId: z.string() }),
        permissions: ['marketing.send'],
        risk: 'CRITICAL',
        auditClass: 'communication',
        surface: 'internal',
        timeoutMs: 5_000,
        approvalPolicy: 'disabled',
        handler: async () => {
          throw new McpPlatformError(
            'not_available',
            'Mass campaign send is not implemented',
          );
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
