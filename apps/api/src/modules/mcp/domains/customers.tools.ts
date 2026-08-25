import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { paginationInput, pageMeta } from '../core/schemas';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { CustomersService } from '../../shop/customers.service';

@Injectable()
export class CustomersToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly customers: CustomersService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'customers_search_customers',
        domain: 'customers',
        title: 'Search customers',
        description: 'Search customers by name/phone within the authenticated tenant only.',
        version: '1.0.0',
        inputSchema: z.object({
          q: z.string().optional(),
          ...paginationInput,
        }),
        permissions: ['customers.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const rows = await this.customers.list(ctx.tenantId, input.q);
          const total = rows.length;
          const items = rows.slice(input.offset, input.offset + input.limit).map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            orderCount: c.orderCount,
            identities: c.identities,
          }));
          return { items, meta: pageMeta(total, input.limit, input.offset) };
        },
      },
      {
        name: 'customers_get_customer',
        domain: 'customers',
        title: 'Get customer',
        description: 'Customer detail with recent orders. Tenant-scoped.',
        version: '1.0.0',
        inputSchema: z.object({ customerId: z.string() }),
        permissions: ['customers.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => this.customers.get(ctx.tenantId, input.customerId),
      },
      {
        name: 'customers_create_customer',
        domain: 'customers',
        title: 'Create customer',
        description: 'Register a customer with name, phone, address.',
        version: '1.0.0',
        inputSchema: z.object({
          name: z.string().min(1),
          phone: z.string().min(5),
          address: z.string().min(1),
        }),
        permissions: ['customers.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.customers.register({ tenantId: ctx.tenantId, ...input }),
      },
      {
        name: 'customers_get_customer_orders',
        domain: 'customers',
        title: 'Customer orders',
        description: 'Orders embedded on customer get (recent).',
        version: '1.0.0',
        inputSchema: z.object({ customerId: z.string() }),
        permissions: ['customers.read', 'orders.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const c = await this.customers.get(ctx.tenantId, input.customerId);
          return { customerId: c.id, orders: c.orders };
        },
      },
      {
        name: 'customers_update_customer',
        domain: 'customers',
        title: 'Update customer',
        description: 'Not available — no dedicated customer update service yet. Use register/upsert paths.',
        version: '1.0.0',
        inputSchema: z.object({ customerId: z.string(), name: z.string().optional() }),
        permissions: ['customers.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError('not_available', 'Customer update API is not implemented in Seloma shop services');
        },
      },
      {
        name: 'customers_add_customer_tag',
        domain: 'customers',
        title: 'Add customer tag',
        description: 'Not available — customer tags are not in Prisma schema.',
        version: '1.0.0',
        inputSchema: z.object({ customerId: z.string(), tag: z.string() }),
        permissions: ['customers.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError('not_available', 'Customer tags are not modeled in Seloma');
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
