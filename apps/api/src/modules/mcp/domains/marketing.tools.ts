import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { DiscountsService } from '../../shop/discounts.service';

/**
 * Marketing campaigns/segments do not exist in Seloma.
 * Discounts are the closest commerce-promotion capability.
 */
@Injectable()
export class MarketingToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly discounts: DiscountsService,
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
        handler: async (ctx) => ({ items: await this.discounts.list(ctx.tenantId) }),
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
        handler: async (ctx, input) => this.discounts.get(ctx.tenantId, input.discountId),
      },
      {
        name: 'marketing_create_campaign',
        domain: 'marketing',
        title: 'Create campaign',
        description: 'Not available — Campaign entity does not exist. Create discounts instead via Workspace shop APIs.',
        version: '1.0.0',
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
            'Marketing campaigns are not implemented; use DiscountsService / marketing_list_discounts',
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
          throw new McpPlatformError('not_available', 'Mass campaign send is not implemented');
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
