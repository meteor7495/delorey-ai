import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { OrderWorkflowService } from '../../shop/order-workflow.service';
import { PaymentsService } from '../../shop/payments.service';

@Injectable()
export class PaymentsToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly workflow: OrderWorkflowService,
    private readonly payments: PaymentsService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'payments_get_order_payment',
        domain: 'payments',
        title: 'Get order payment',
        description:
          'Safe payment view for an order (status, provider, amount). Never returns secrets, CVV, or credentials.',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string() }),
        permissions: ['payments.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const order = await this.workflow.get(ctx.tenantId, input.orderId);
          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            paymentRef: order.paymentRef,
            totalAmount: Number(order.totalAmount),
            currency: order.currency,
          };
        },
      },
      {
        name: 'payments_start_payment',
        domain: 'payments',
        title: 'Start payment',
        description: 'Start payment for an unpaid order via PaymentsService (mock/Zarinpal). Idempotent-friendly.',
        version: '1.0.0',
        inputSchema: z.object({
          orderId: z.string(),
          description: z.string().optional(),
        }),
        permissions: ['payments.write'],
        risk: 'MEDIUM',
        auditClass: 'financial',
        surface: 'internal',
        timeoutMs: 30_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.payments.startPayment({
            tenantId: ctx.tenantId,
            orderId: input.orderId,
            description: input.description ?? `Order ${input.orderId}`,
          }),
      },
      {
        name: 'payments_request_refund',
        domain: 'payments',
        title: 'Request payment refund',
        description: 'Disabled — automated refunds are not supported; escalate to human ops.',
        version: '1.0.0',
        inputSchema: z.object({ orderId: z.string() }),
        permissions: ['payments.refund'],
        risk: 'CRITICAL',
        auditClass: 'financial',
        surface: 'internal',
        timeoutMs: 5_000,
        approvalPolicy: 'disabled',
        handler: async () => {
          throw new McpPlatformError('not_available', 'Payment refunds are not available via MCP');
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
