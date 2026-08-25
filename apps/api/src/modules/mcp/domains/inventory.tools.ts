import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { paginationInput, pageMeta } from '../core/schemas';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { InventoryService } from '../../shop/inventory.service';

@Injectable()
export class InventoryToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly inventory: InventoryService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'inventory_get_summary',
        domain: 'inventory',
        title: 'Inventory summary',
        description: 'Tenant-wide stock summary (on-hand, reserved, low/out of stock counts).',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['inventory.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => this.inventory.summary(ctx.tenantId),
      },
      {
        name: 'inventory_search',
        domain: 'inventory',
        title: 'Search inventory levels',
        description: 'List inventory levels with optional product/category/q/state filters. Prefer over dumping catalog.',
        version: '1.0.0',
        inputSchema: z.object({
          q: z.string().optional(),
          productId: z.string().optional(),
          categoryId: z.string().optional(),
          state: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
          ...paginationInput,
        }),
        permissions: ['inventory.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const result = await this.inventory.list(ctx.tenantId, input);
          return { items: result.items, meta: pageMeta(result.total, result.limit, result.offset) };
        },
      },
      {
        name: 'inventory_get_low_stock',
        domain: 'inventory',
        title: 'Low stock products',
        description: 'Inventory levels in low_stock state.',
        version: '1.0.0',
        inputSchema: z.object({ ...paginationInput }),
        permissions: ['inventory.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const result = await this.inventory.list(ctx.tenantId, { state: 'low_stock', ...input });
          return { items: result.items, meta: pageMeta(result.total, result.limit, result.offset) };
        },
      },
      {
        name: 'inventory_get_out_of_stock',
        domain: 'inventory',
        title: 'Out of stock',
        description: 'Inventory levels that are out of stock.',
        version: '1.0.0',
        inputSchema: z.object({ ...paginationInput }),
        permissions: ['inventory.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const result = await this.inventory.list(ctx.tenantId, { state: 'out_of_stock', ...input });
          return { items: result.items, meta: pageMeta(result.total, result.limit, result.offset) };
        },
      },
      {
        name: 'inventory_adjust',
        domain: 'inventory',
        title: 'Adjust inventory',
        description:
          'Adjust on-hand via delta or setTo through InventoryService ledger. Do not invent stock. Prefer reason for audit.',
        version: '1.0.0',
        inputSchema: z.object({
          productId: z.string().optional(),
          variantId: z.string().nullable().optional(),
          inventoryLevelId: z.string().optional(),
          delta: z.number().int().optional(),
          setTo: z.number().int().nonnegative().optional(),
          type: z.string().optional(),
          reason: z.string().nullable().optional(),
          lowStockThreshold: z.number().int().nonnegative().optional(),
        }),
        permissions: ['inventory.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.inventory.adjust(ctx.tenantId, { ...input, actorUserId: ctx.userId }),
      },
      {
        name: 'inventory_reserve',
        domain: 'inventory',
        title: 'Reserve inventory',
        description: 'Not available — reservations happen inside order placement, not as a standalone API.',
        version: '1.0.0',
        inputSchema: z.object({ productId: z.string() }),
        permissions: ['inventory.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError(
            'not_available',
            'Standalone inventory reserve is not exposed; stock is reserved during checkout/placeOrder',
          );
        },
      },
      {
        name: 'inventory_release',
        domain: 'inventory',
        title: 'Release inventory',
        description: 'Not available as standalone — use order cancel/reject workflow which restocks via OrderWorkflowService.',
        version: '1.0.0',
        inputSchema: z.object({ productId: z.string() }),
        permissions: ['inventory.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError(
            'not_available',
            'Standalone inventory release is not exposed; use orders_cancel_order / reject which restock via workflow',
          );
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
