import { Injectable } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import { PrismaService } from '../platform/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly store: DataStore,
    private readonly prisma: PrismaService,
  ) {}

  summary(tenantId: string, days = 7) {
    return this.store.analyticsSummary(tenantId, days);
  }

  knowledgeGaps(tenantId: string, days = 7) {
    return this.store.analyticsKnowledgeGaps(tenantId, days);
  }

  revenue(tenantId: string, days = 7) {
    return this.store.analyticsRevenue(tenantId, days);
  }

  async channels(tenantId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - Math.max(1, Math.min(days, 90)));
    const [orders, events] = await Promise.all([
      this.prisma.storefrontOrder.groupBy({
        by: ['channel'],
        where: { tenantId, createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['channel', 'name'],
        where: { tenantId, createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);
    return {
      orders: orders.map((row) => ({
        channel: row.channel,
        orderCount: row._count._all,
        revenue: Number(row._sum.totalAmount ?? 0),
      })),
      events: events.map((row) => ({
        channel: row.channel,
        name: row.name,
        count: row._count._all,
      })),
    };
  }
}
