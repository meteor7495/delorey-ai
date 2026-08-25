import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { ShopService } from '../../shop/shop.service';

@Injectable()
export class WebsiteToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly shop: ShopService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'website_get_store_settings',
        domain: 'website',
        title: 'Get store settings',
        description: 'Storefront settings (branding, slug, theme, payment mode). No secrets.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['website.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => this.shop.getSettings(ctx.tenantId),
      },
      {
        name: 'website_update_store_settings',
        domain: 'website',
        title: 'Update store settings',
        description: 'Patch storefront settings. Publishing pages is separate and not modeled.',
        version: '1.0.0',
        inputSchema: z.object({
          storeName: z.string().optional(),
          storeSlug: z.string().optional(),
          primaryColor: z.string().optional(),
          secondaryColor: z.string().optional(),
          logoUrl: z.string().nullable().optional(),
          themeId: z.string().optional(),
        }),
        permissions: ['website.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        handler: async (ctx, input) => this.shop.updateSettings(ctx.tenantId, input),
      },
      {
        name: 'website_get_pages',
        domain: 'website',
        title: 'Get pages',
        description: 'Not available — Seloma has no Page CMS model. Use articles/banners/themes instead.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['website.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError('not_available', 'Page CMS is not implemented in Seloma');
        },
      },
      {
        name: 'website_publish_page',
        domain: 'website',
        title: 'Publish page',
        description: 'Not available — no page publish workflow.',
        version: '1.0.0',
        inputSchema: z.object({ pageId: z.string() }),
        permissions: ['website.publish'],
        risk: 'HIGH',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        approvalPolicy: 'disabled',
        handler: async () => {
          throw new McpPlatformError('not_available', 'Page publish is not implemented');
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
