import { describe, expect, it } from 'vitest';
import { McpRegistry } from './registry';
import { McpExecutionService } from './execution.service';
import { McpRateLimitService } from './rate-limit.service';
import { assertPermissions } from './execution.service';
import { McpPlatformError } from './errors';
import type { McpPermission, McpRequestContext, McpToolDefinition } from './types';
import { z } from 'zod';

function ctx(partial?: Partial<McpRequestContext>): McpRequestContext {
  return {
    correlationId: 'corr-1',
    tenantId: 'tenant-a',
    clientKind: 'internal',
    surface: 'internal',
    scopes: ['products.read', 'orders.read'],
    authVia: 'internal',
    ...partial,
  };
}

describe('MCP permissions', () => {
  it('allows when scopes cover required permissions', () => {
    expect(() => assertPermissions(['products.read'], ['products.read'])).not.toThrow();
  });

  it('forbids missing permissions', () => {
    expect(() => assertPermissions(['products.read'], ['products.write' as McpPermission])).toThrow(
      McpPlatformError,
    );
  });
});

describe('MCP tenant isolation in handlers', () => {
  it('never trusts client-supplied tenantId — handler receives ctx.tenantId only', async () => {
    const registry = new McpRegistry();
    const seen: string[] = [];
    const tool: McpToolDefinition = {
      name: 'commerce_search_products',
      domain: 'commerce',
      title: 'Search',
      description: 'test',
      version: '1.0.0',
      inputSchema: z.object({
        tenantId: z.string().optional(),
        q: z.string().optional(),
      }),
      permissions: ['products.read'],
      risk: 'READ',
      auditClass: 'read',
      surface: 'internal',
      timeoutMs: 5000,
      handler: async (c, input) => {
        seen.push(c.tenantId);
        // Malicious model arg must be ignored by convention — handler uses ctx
        expect(input.tenantId).toBe('evil-tenant');
        return { tenantUsed: c.tenantId };
      },
    };
    registry.registerTool(tool);

    const approvals = {
      isToolEnabled: async () => true,
      requireOrPass: async () => ({}),
    };
    const audit = {
      record: async () => 'exec-1',
      findIdempotent: async () => null,
    };
    const rate = new McpRateLimitService();
    const execution = new McpExecutionService(
      registry,
      audit as never,
      rate,
      approvals as never,
    );

    const result = await execution.execute(ctx({ tenantId: 'tenant-a' }), 'commerce_search_products', {
      tenantId: 'evil-tenant',
      q: 'x',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ tenantUsed: 'tenant-a' });
    }
    expect(seen).toEqual(['tenant-a']);
  });
});

describe('MCP public surface filtering', () => {
  it('rejects internal-only tools for public clients', async () => {
    const registry = new McpRegistry();
    registry.registerTool({
      name: 'orders_cancel_order',
      domain: 'orders',
      title: 'Cancel',
      description: 'test',
      version: '1.0.0',
      inputSchema: z.object({ orderId: z.string() }),
      permissions: ['orders.cancel'],
      risk: 'HIGH',
      auditClass: 'destructive',
      surface: 'internal',
      timeoutMs: 5000,
      handler: async () => ({ ok: true }),
    });
    const execution = new McpExecutionService(
      registry,
      { record: async () => '', findIdempotent: async () => null } as never,
      new McpRateLimitService(),
      { isToolEnabled: async () => true, requireOrPass: async () => ({}) } as never,
    );
    const result = await execution.execute(
      ctx({
        surface: 'public',
        scopes: ['orders.cancel'],
      }),
      'orders_cancel_order',
      { orderId: '1' },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('forbidden');
  });
});

describe('MCP rate limit', () => {
  it('rate limits after burst', () => {
    const rate = new McpRateLimitService();
    const c = ctx();
    // tool limit is 60 — force lower by calling assert many times with unique tool names? 
    // Use same tool key — exceed tool max 60
    expect(() => {
      for (let i = 0; i < 21; i++) rate.assertAllowed(c, 'analytics_get_summary', true);
    }).toThrow(McpPlatformError);
  });
});
