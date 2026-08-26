import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';

export type CustomerInsights = {
  preferredCategories: string[];
  typicalAov: number;
  purchaseFrequencyDays: number | null;
  lastPurchaseAt: string | null;
  orderCount: number;
  tags: string[];
  notes: string | null;
};

@Injectable()
export class CustomerMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string, customerId: string) {
    return this.prisma.customerMemory.findFirst({
      where: { tenantId, customerId },
    });
  }

  async recompute(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        orders: {
          where: { paymentStatus: 'paid' },
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } },
        },
        conversations: { orderBy: { updatedAt: 'desc' }, take: 5 },
      },
    });
    if (!customer) return null;

    const categoryCounts = new Map<string, number>();
    for (const order of customer.orders) {
      for (const item of order.items) {
        const cat = item.product?.categoryId;
        if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
      }
    }
    const preferredCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const totals = customer.orders.map((o) => Number(o.totalAmount));
    const typicalAov = totals.length
      ? totals.reduce((a, b) => a + b, 0) / totals.length
      : 0;

    let purchaseFrequencyDays: number | null = null;
    if (customer.orders.length >= 2) {
      const newest = customer.orders[0]!.createdAt.getTime();
      const oldest =
        customer.orders[customer.orders.length - 1]!.createdAt.getTime();
      purchaseFrequencyDays =
        (newest - oldest) / customer.orders.length / 86400000;
    }

    const insights: CustomerInsights = {
      preferredCategories,
      typicalAov,
      purchaseFrequencyDays,
      lastPurchaseAt: customer.orders[0]?.createdAt.toISOString() ?? null,
      orderCount: customer.orders.length,
      tags: [],
      notes: null,
    };

    return this.prisma.customerMemory.upsert({
      where: { customerId },
      create: {
        id: uuid(),
        tenantId,
        customerId,
        insights: insights as unknown as Prisma.InputJsonValue,
      },
      update: {
        insights: insights as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
