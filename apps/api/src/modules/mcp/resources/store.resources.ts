import { Injectable, OnModuleInit } from '@nestjs/common';
import { McpRegistry } from '../core/registry';
import { ShopService } from '../../shop/shop.service';
import { KnowledgeService } from '../../knowledge/knowledge.service';

@Injectable()
export class McpResourcesRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly shop: ShopService,
    private readonly knowledge: KnowledgeService,
  ) {}

  onModuleInit() {
    this.registry.registerResource({
      uri: 'seloma://store/settings',
      name: 'store_settings',
      description: 'Current storefront settings for the authenticated tenant (no secrets).',
      mimeType: 'application/json',
      permissions: ['website.read'],
      surface: 'internal',
      read: async (ctx) => ({
        text: JSON.stringify(await this.shop.getSettings(ctx.tenantId), null, 2),
      }),
    });

    this.registry.registerResource({
      uri: 'seloma://themes',
      name: 'theme_catalog',
      description: 'Available storefront theme pack metadata. Prefer over inlining huge payloads in tools.',
      mimeType: 'application/json',
      permissions: ['themes.read'],
      surface: 'public',
      read: async () => ({
        text: JSON.stringify({ items: await this.shop.listThemes() }, null, 2),
      }),
    });

    this.registry.registerResource({
      uri: 'seloma://knowledge/policies',
      name: 'store_policies',
      description: 'Active knowledge docs (FAQ / policy) titles and ids for grounding.',
      mimeType: 'application/json',
      permissions: ['knowledge.read'],
      surface: 'internal',
      read: async (ctx) => {
        const docs = await this.knowledge.list(ctx.tenantId);
        return {
          text: JSON.stringify(
            {
              items: docs.map((d) => ({
                id: d.id,
                docType: d.docType,
                title: d.title,
                status: d.status,
              })),
            },
            null,
            2,
          ),
        };
      },
    });
  }
}
