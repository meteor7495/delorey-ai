import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { paginationInput, pageMeta } from '../core/schemas';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { ShopService } from '../../shop/shop.service';
import { OrderWorkflowService } from '../../shop/order-workflow.service';

function compactOrder(o: Record<string, unknown>) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    channel: o.channel,
    totalAmount: o.totalAmount,
    currency: o.currency,
    customerName: o.customerName ?? o.customer_name ?? null,
    customerPhone: o.customerPhone ?? o.customer_phone ?? null,
    createdAt: o.createdAt,
    itemCount: Array.isArray(o.items) ? o.items.length : undefined,
  };
}

@Injectable()
export class OrdersToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly shop: ShopService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'orders_search_orders',
        domain: 'orders',
        title: 'Search orders',
        description: 'List native storefront orders for the authenticated tenant. Filter client-side by status/q with pagination.',
        version: '1.0.0',
        inputSchema: z.object({
          status: z.string().optional(),
          q: z.string().optional().describe('order number, phone, or name substring'),
          ...paginationInput,
        }),
        permissions: ['orders.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 20_000,
        idempotent: true,
        handler: async (ctx, input) => {
          let rows = await this.shop.listStorefrontOrders(ctx.tenantId);
          if (input.status) rows = rows.filter((r) => String((r as { status: string }).status) === input.status);
          if (input.q) {
            const q = input.q.toLowerCase();
            rows = rows.filter((r) => {
              const o = r as Record<string, unknown>;
              return JSON.stringify(o).toLowerCase().includes(q);
            });
          }
          const total = rows.length;
          const slice = rows.slice(input.offset, input.offset + input.limit);
          return {
            items: slice.map((r) => compactOrder(r as unknown as Record<string, unknown>)),
            meta: pageMeta(total, input.limit, input.offset),
          };
        },
      },
      {
        name: 'orders_get_order',
        domain: 'orders',
        title: 'Get order',
        description: 'Full native order detail including items and history.',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string() }),
        permissions: ['orders.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => this.shop.getStorefrontOrder(ctx.tenantId, input.orderId),
      },
      {
        name: 'orders_get_order_items',
        domain: 'orders',
        title: 'Get order items',
        description: 'Line items only for an order.',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string() }),
        permissions: ['orders.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const order = await this.workflow.get(ctx.tenantId, input.orderId);
          return {
            orderId: order.id,
            items: order.items.map((i) => ({
              id: i.id,
              title: i.title,
              sku: i.sku,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              lineTotal: Number(i.lineTotal),
            })),
          };
        },
      },
      {
        name: 'orders_get_order_timeline',
        domain: 'orders',
        title: 'Order timeline',
        description: 'Status history for an order.',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string() }),
        permissions: ['orders.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const order = await this.workflow.get(ctx.tenantId, input.orderId);
          return {
            orderId: order.id,
            status: order.status,
            history: order.history.map((h) => ({
              fromStatus: h.fromStatus,
              toStatus: h.toStatus,
              reason: h.reason,
              actorUserId: h.actorUserId,
              createdAt: h.createdAt.toISOString(),
            })),
          };
        },
      },
      {
        name: 'orders_update_order_status',
        domain: 'orders',
        title: 'Update order status',
        description:
          'Transition order status via OrderWorkflowService rules. Prefer approve/reject tools for pending_approval.',
        version: '1.0.0',
        inputSchema: z.object({
          orderId: z.string(),
          status: z.string(),
          reason: z.string().optional(),
        }),
        permissions: ['orders.update'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.shop.updateStorefrontOrderStatus(ctx.tenantId, input.orderId, input.status, ctx.userId),
      },
      {
        name: 'orders_approve_order',
        domain: 'orders',
        title: 'Approve order',
        description: 'Approve a pending_approval order (merchant action).',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string() }),
        permissions: ['orders.update'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.workflow.approve(ctx.tenantId, input.orderId, ctx.userId),
      },
      {
        name: 'orders_reject_order',
        domain: 'orders',
        title: 'Reject order',
        description: 'Reject a pending_approval order. Reason required (≥3 chars). May restock.',
        version: '1.0.0',
        inputSchema: z.object({
          orderId: z.string(),
          reason: z.string().min(3),
        }),
        permissions: ['orders.update'],
        risk: 'HIGH',
        auditClass: 'destructive',
        surface: 'internal',
        timeoutMs: 15_000,
        approvalPolicy: 'approval_required',
        handler: async (ctx, input) =>
          this.workflow.reject(ctx.tenantId, input.orderId, input.reason, ctx.userId),
      },
      {
        name: 'orders_cancel_order',
        domain: 'orders',
        title: 'Cancel order',
        description: 'Cancel via workflow transition to cancelled when allowed. High risk.',
        version: '1.0.0',
        inputSchema: z.object({
          orderId: z.string(),
          reason: z.string().optional(),
        }),
        permissions: ['orders.cancel'],
        risk: 'HIGH',
        auditClass: 'destructive',
        surface: 'internal',
        timeoutMs: 15_000,
        approvalPolicy: 'approval_required',
        handler: async (ctx, input) =>
          this.workflow.transition({
            tenantId: ctx.tenantId,
            orderId: input.orderId,
            to: 'cancelled',
            actorUserId: ctx.userId,
            reason: input.reason,
          }),
      },
      {
        name: 'orders_request_refund',
        domain: 'orders',
        title: 'Request refund',
        description: 'Not available as automated payment refund — Seloma hard-restricts AI refunds. Escalate to human.',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string(), reason: z.string().optional() }),
        permissions: ['orders.refund'],
        risk: 'CRITICAL',
        auditClass: 'financial',
        surface: 'internal',
        timeoutMs: 5_000,
        approvalPolicy: 'disabled',
        handler: async () => {
          throw new McpPlatformError(
            'not_available',
            'Automated refunds are not available; refund/cancel remain human-only per Employee guardrails',
          );
        },
      },
      {
        name: 'orders_get_order_statistics',
        domain: 'orders',
        title: 'Order statistics',
        description: 'Bounded aggregates over recent native orders (counts by status). Prefer analytics tools for revenue.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['orders.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 20_000,
        idempotent: true,
        handler: async (ctx) => {
          const rows = await this.shop.listStorefrontOrders(ctx.tenantId);
          const byStatus: Record<string, number> = {};
          let revenue = 0;
          for (const r of rows) {
            const o = r as { status: string; totalAmount: number; paymentStatus: string };
            byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
            if (o.paymentStatus === 'paid') revenue += Number(o.totalAmount) || 0;
          }
          return { total: rows.length, byStatus, paidRevenue: revenue };
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
