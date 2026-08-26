import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { DataStore } from '../platform/data.store';

@Injectable()
export class OpportunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DataStore,
  ) {}

  async scan(tenantId: string) {
    const sales = await this.store.employeeForTenant(tenantId, 'sales');
    const employeeId = sales?.id ?? null;
    const created: string[] = [];

    // Abandoned carts
    const abandoned = await this.prisma.cart.findMany({
      where: { tenantId, status: 'abandoned' },
      include: { items: true },
      take: 50,
    });
    for (const cart of abandoned) {
      const estimate = cart.items.reduce(
        (sum, i) => sum + Number(i.lineTotalSnapshot ?? i.unitPriceSnapshot ?? 0),
        0,
      );
      const existing = await this.prisma.revenueOpportunity.findFirst({
        where: {
          tenantId,
          type: 'abandoned_cart',
          relatedCartId: cart.id,
          status: { in: ['open', 'in_progress'] },
        },
      });
      if (existing) continue;
      const row = await this.prisma.revenueOpportunity.create({
        data: {
          id: uuid(),
          tenantId,
          employeeId,
          type: 'abandoned_cart',
          estimatedValue: new Prisma.Decimal(estimate),
          currency: 'IRT',
          confidence: 0.7,
          reason: 'سبد خرید رها شده',
          recommendedAction: 'recover_abandoned_cart',
          status: 'open',
          relatedCartId: cart.id,
          relatedCustomerId: cart.customerId,
          metadata: { estimateLabel: 'estimate' },
        },
      });
      created.push(row.id);
    }

    // Inactive high-value customers (no order in 60 days, prior AOV > 0)
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        orders: {
          where: { paymentStatus: 'paid' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
      take: 100,
    });
    for (const c of customers) {
      if (!c.orders.length) continue;
      const last = c.orders[0];
      if (!last || last.createdAt > cutoff) continue;
      const aov =
        c.orders.reduce((s, o) => s + Number(o.totalAmount), 0) / c.orders.length;
      if (aov < 1) continue;
      const existing = await this.prisma.revenueOpportunity.findFirst({
        where: {
          tenantId,
          type: 'inactive_customer',
          relatedCustomerId: c.id,
          status: { in: ['open', 'in_progress'] },
        },
      });
      if (existing) continue;
      const row = await this.prisma.revenueOpportunity.create({
        data: {
          id: uuid(),
          tenantId,
          employeeId,
          type: 'inactive_customer',
          estimatedValue: new Prisma.Decimal(aov),
          currency: 'IRT',
          confidence: 0.55,
          reason: `مشتری غیرفعال — آخرین خرید ${Math.floor((Date.now() - last.createdAt.getTime()) / 86400000)} روز پیش`,
          recommendedAction: 'reengage_inactive_customer',
          status: 'open',
          relatedCustomerId: c.id,
          metadata: { estimateLabel: 'estimate', typicalAov: aov },
        },
      });
      created.push(row.id);
    }

    // Unpaid / pending_approval orders
    const unpaid = await this.prisma.storefrontOrder.findMany({
      where: {
        tenantId,
        OR: [
          { paymentStatus: 'unpaid' },
          { status: 'pending_approval' },
          { status: 'pending_payment' },
        ],
      },
      take: 50,
    });
    for (const order of unpaid) {
      const existing = await this.prisma.revenueOpportunity.findFirst({
        where: {
          tenantId,
          type: 'unpaid_order',
          relatedOrderId: order.id,
          status: { in: ['open', 'in_progress'] },
        },
      });
      if (existing) continue;
      const row = await this.prisma.revenueOpportunity.create({
        data: {
          id: uuid(),
          tenantId,
          employeeId,
          type: 'unpaid_order',
          estimatedValue: order.totalAmount,
          currency: order.currency || 'IRT',
          confidence: 0.8,
          reason: `سفارش ${order.orderNumber} نیاز به توجه دارد`,
          recommendedAction: 'follow_unpaid_order',
          status: 'open',
          relatedOrderId: order.id,
          relatedCustomerId: order.customerId,
          metadata: { estimateLabel: 'estimate', status: order.status },
        },
      });
      created.push(row.id);
    }

    // Low stock
    const levels = await this.prisma.inventoryLevel.findMany({
      where: { tenantId },
      take: 200,
    });
    const lowStock = levels.filter(
      (l) => l.onHand - l.reserved <= l.lowStockThreshold,
    );
    for (const level of lowStock.slice(0, 30)) {
      const available = level.onHand - level.reserved;
      const existing = await this.prisma.revenueOpportunity.findFirst({
        where: {
          tenantId,
          type: 'low_stock',
          relatedProductId: level.productId,
          status: { in: ['open', 'in_progress'] },
        },
      });
      if (existing) continue;
      const row = await this.prisma.revenueOpportunity.create({
        data: {
          id: uuid(),
          tenantId,
          employeeId,
          type: 'low_stock',
          estimatedValue: new Prisma.Decimal(0),
          currency: 'IRT',
          confidence: 0.9,
          reason: `موجودی کم (≤${available})`,
          recommendedAction: 'restock_alert',
          status: 'open',
          relatedProductId: level.productId,
          metadata: {
            estimateLabel: 'estimate',
            quantityAvailable: available,
          },
        },
      });
      created.push(row.id);
    }

    return { createdCount: created.length, createdIds: created };
  }

  async list(tenantId: string, status = 'open') {
    return this.prisma.revenueOpportunity.findMany({
      where: { tenantId, status },
      orderBy: [{ estimatedValue: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  async summarize(tenantId: string) {
    const open = await this.prisma.revenueOpportunity.findMany({
      where: { tenantId, status: 'open' },
    });
    const byType: Record<string, number> = {};
    let estimatedTotal = 0;
    for (const o of open) {
      byType[o.type] = (byType[o.type] ?? 0) + 1;
      estimatedTotal += Number(o.estimatedValue);
    }
    return {
      count: open.length,
      estimatedTotal,
      currency: 'IRT',
      estimateLabel: 'estimate' as const,
      byType,
      items: open.slice(0, 20).map((o) => ({
        id: o.id,
        type: o.type,
        estimatedValue: Number(o.estimatedValue),
        currency: o.currency,
        confidence: o.confidence,
        reason: o.reason,
        recommendedAction: o.recommendedAction,
        status: o.status,
        estimateLabel: 'estimate' as const,
      })),
    };
  }

  async get(tenantId: string, id: string) {
    return this.prisma.revenueOpportunity.findFirst({
      where: { id, tenantId },
    });
  }

  async markStatus(
    tenantId: string,
    id: string,
    status: 'open' | 'in_progress' | 'done' | 'dismissed',
  ) {
    const row = await this.get(tenantId, id);
    if (!row) return null;
    return this.prisma.revenueOpportunity.update({
      where: { id: row.id },
      data: { status },
    });
  }
}
