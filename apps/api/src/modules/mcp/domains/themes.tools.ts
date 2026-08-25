import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { ShopService } from '../../shop/shop.service';

@Injectable()
export class ThemesToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly shop: ShopService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'themes_list_themes',
        domain: 'themes',
        title: 'List themes',
        description: 'List available storefront theme packs (code catalog). Prefer resource seloma://themes for large metadata.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['themes.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'public',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async () => ({ items: await this.shop.listThemes() }),
      },
      {
        name: 'themes_apply_theme',
        domain: 'themes',
        title: 'Apply theme',
        description: 'Set StorefrontSettings.themeId to an existing theme pack id.',
        version: '1.0.0',
        inputSchema: z.object({ themeId: z.string() }),
        permissions: ['themes.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.shop.updateSettings(ctx.tenantId, { themeId: input.themeId }),
      },
      {
        name: 'themes_create_theme',
        domain: 'themes',
        title: 'Create theme',
        description: 'Not available — themes are a code catalog, not merchant-created DB entities.',
        version: '1.0.0',
        inputSchema: z.object({ name: z.string() }),
        permissions: ['themes.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError('not_available', 'Custom theme creation is not supported');
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
